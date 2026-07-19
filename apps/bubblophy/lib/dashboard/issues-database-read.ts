import 'server-only';

import type {
  BubblophyIssuePriority,
  BubblophyIssueStatus,
  BubblophyProjectRole,
} from '@/drizzle/db/schema';
import type {
  DashboardIssuePage,
  DashboardIssuePageItem,
  DashboardIssuePageReadInput,
} from '@/lib/dashboard/issues';

import { DASHBOARD_ISSUE_PAGE_SIZE } from '@/lib/dashboard/issues';
import { formatBubblophyIssueKey } from '@/lib/issues/repository';

import { and, asc, desc, eq, gt, lt, sql } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

interface LatestPlanSummary {
  version: number;
  stepCount: number;
}

interface DashboardIssueCandidateRow {
  projectId: string;
  projectKey: string;
  issueNumber: number | null;
  issueTitle: string | null;
  issueStatus: BubblophyIssueStatus | null;
  issuePriority: BubblophyIssuePriority | null;
  issueAssignedAuthUserId: string | null;
  issueRequiresHumanApproval: boolean | null;
  issueLatestPlan: LatestPlanSummary | null;
}

interface DashboardIssueFinalMembershipRow {
  projectId: string;
  projectKey: string;
  projectName: string;
  projectIsArchived: boolean;
  currentUserRole: BubblophyProjectRole;
}

const latestPlanSummary = sql<LatestPlanSummary | null>`(
  select jsonb_build_object(
    'version', ${bubblophyIssuePlans.version},
    'stepCount', case
      when jsonb_typeof(${bubblophyIssuePlans.steps}) = 'array'
        then jsonb_array_length(${bubblophyIssuePlans.steps})
      else 0
    end
  )
  from ${bubblophyIssuePlans}
  where ${bubblophyIssuePlans.issueId} = ${bubblophyIssues.id}
  order by ${bubblophyIssuePlans.version} desc, ${bubblophyIssuePlans.createdAt} desc
  limit 1
)`;

/**
 * Selects one lightweight issue page and revalidates membership before return.
 *
 * The candidate query binds membership, project, cursor, issue, and latest plan
 * in one statement. A final membership read closes the removal/key-change race
 * and supplies the project metadata returned to the browser.
 *
 * @param input Normalized membership, project, cursor, and sort contract.
 * @returns The visible project and one 25-item issue page.
 */
export async function selectDashboardIssuePageForUser(
  input: DashboardIssuePageReadInput
): Promise<DashboardIssuePage | null> {
  const cursorCondition =
    input.afterIssueNumber === null
      ? undefined
      : input.sort === 'newest'
        ? lt(bubblophyIssues.issueNumber, input.afterIssueNumber)
        : gt(bubblophyIssues.issueNumber, input.afterIssueNumber);
  const issueJoinCondition = cursorCondition
    ? and(eq(bubblophyIssues.projectId, bubblophyProjects.id), cursorCondition)
    : eq(bubblophyIssues.projectId, bubblophyProjects.id);
  const candidateRows = (await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      issueNumber: bubblophyIssues.issueNumber,
      issueTitle: bubblophyIssues.title,
      issueStatus: bubblophyIssues.status,
      issuePriority: bubblophyIssues.priority,
      issueAssignedAuthUserId: bubblophyIssues.assignedAuthUserId,
      issueRequiresHumanApproval: bubblophyIssues.requiresHumanApproval,
      issueLatestPlan: latestPlanSummary,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .leftJoin(bubblophyIssues, issueJoinCondition)
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        eq(bubblophyProjects.key, input.projectKey)
      )
    )
    .orderBy(
      input.sort === 'newest'
        ? desc(bubblophyIssues.issueNumber)
        : asc(bubblophyIssues.issueNumber)
    )
    .limit(DASHBOARD_ISSUE_PAGE_SIZE + 1)) as DashboardIssueCandidateRow[];
  const firstCandidate = candidateRows[0];

  if (!firstCandidate) {
    return null;
  }

  const finalMembership = await selectFinalMembership(
    firstCandidate.projectId,
    input.authUserId
  );

  if (
    !finalMembership ||
    finalMembership.projectKey !== firstCandidate.projectKey ||
    finalMembership.projectKey !== input.projectKey
  ) {
    return null;
  }

  const items = candidateRows
    .slice(0, DASHBOARD_ISSUE_PAGE_SIZE)
    .flatMap(mapDashboardIssueCandidateRow);
  const lastItem = items.at(-1);

  return {
    project: {
      key: finalMembership.projectKey,
      name: finalMembership.projectName,
      isArchived: finalMembership.projectIsArchived,
      currentUserRole: finalMembership.currentUserRole,
    },
    sort: input.sort,
    items,
    nextAfterIssueNumber:
      candidateRows.length > DASHBOARD_ISSUE_PAGE_SIZE && lastItem
        ? lastItem.issueNumber
        : null,
  };
}

/** Re-reads current membership and all returned project metadata. */
async function selectFinalMembership(
  projectId: string,
  authUserId: string
): Promise<DashboardIssueFinalMembershipRow | null> {
  const [row] = (await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      projectName: bubblophyProjects.name,
      projectIsArchived: bubblophyProjects.isArchived,
      currentUserRole: bubblophyProjectMembers.role,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .where(
      and(
        eq(bubblophyProjectMembers.projectId, projectId),
        eq(bubblophyProjectMembers.authUserId, authUserId)
      )
    )
    .limit(1)) as DashboardIssueFinalMembershipRow[];

  return row ?? null;
}

/** Maps one nullable issue join row into the raw dashboard read DTO. */
function mapDashboardIssueCandidateRow(
  row: DashboardIssueCandidateRow
): DashboardIssuePageItem[] {
  if (row.issueNumber === null) {
    return [];
  }

  if (
    row.issueTitle === null ||
    row.issueStatus === null ||
    row.issuePriority === null ||
    row.issueRequiresHumanApproval === null
  ) {
    throw new Error('Incomplete Bubblophy dashboard issue row.');
  }

  return [
    {
      key: formatBubblophyIssueKey(row.projectKey, row.issueNumber),
      issueNumber: row.issueNumber,
      title: row.issueTitle,
      status: row.issueStatus,
      priority: row.issuePriority,
      requiresHumanApproval: row.issueRequiresHumanApproval,
      assignedAuthUserId: row.issueAssignedAuthUserId,
      latestPlan: row.issueLatestPlan,
    },
  ];
}
