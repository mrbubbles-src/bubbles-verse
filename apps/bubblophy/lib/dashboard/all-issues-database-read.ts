import 'server-only';

import type { BubblophyProjectRole } from '@/drizzle/db/schema';
import type {
  DashboardAllIssueCursor,
  DashboardAllIssuePage,
  DashboardAllIssuePageItem,
  DashboardAllIssuePageReadInput,
} from '@/lib/dashboard/all-issues';

import { DASHBOARD_ALL_ISSUE_PAGE_SIZE } from '@/lib/dashboard/all-issues';
import { getDashboardAssigneeLabel } from '@/lib/dashboard/issues';
import { formatBubblophyIssueKey } from '@/lib/issues/repository';

import { and, asc, desc, eq, gt, inArray, lt, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '@/drizzle/db';
import {
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
  bubblophyUserProfiles,
} from '@/drizzle/db/schema';

interface CandidateRow {
  projectId: string;
  projectKey: string;
  issueId: string;
  issueNumber: number;
  issueTitle: string;
  issueStatus: DashboardAllIssuePageItem['status'];
  issuePriority: DashboardAllIssuePageItem['priority'];
  issueRequiresHumanApproval: boolean;
  issueLatestPlan: DashboardAllIssuePageItem['latestPlan'];
  issueUpdatedAt: string;
}

interface CurrentIssueAccessRow {
  projectId: string;
  projectKey: string;
  projectName: string;
  projectIsArchived: boolean;
  currentUserRole: BubblophyProjectRole;
  issueId: string;
  assignedAuthUserId: string | null;
  assigneeMemberAuthUserId: string | null;
  assigneeDisplayName: string | null;
}

const latestPlanSummary = sql<DashboardAllIssuePageItem['latestPlan']>`(
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
 * Selects one cross-project issue page and revalidates every represented project.
 *
 * @param input Normalized actor, filters, sort, and public stable cursor.
 * @returns A bounded page containing only projects with current membership.
 */
export async function selectDashboardAllIssuePageForUser(
  input: DashboardAllIssuePageReadInput
): Promise<DashboardAllIssuePage> {
  const visibleItems: DashboardAllIssuePageItem[] = [];
  let after = input.after;

  while (visibleItems.length <= DASHBOARD_ALL_ISSUE_PAGE_SIZE) {
    const candidateRows = await selectCandidateRows(input, after);

    if (candidateRows.length === 0) {
      break;
    }

    const currentAccessRows = await selectCurrentIssueAccess(
      input.authUserId,
      candidateRows.map((row) => row.issueId)
    );
    const accessByIssueId = new Map(
      currentAccessRows.map((row) => [row.issueId, row])
    );

    for (const row of candidateRows) {
      const access = accessByIssueId.get(row.issueId);

      if (
        access &&
        access.projectId === row.projectId &&
        access.projectKey === row.projectKey &&
        !access.projectIsArchived
      ) {
        visibleItems.push(mapItem(row, access));
      }

      if (visibleItems.length > DASHBOARD_ALL_ISSUE_PAGE_SIZE) {
        break;
      }
    }

    if (
      visibleItems.length > DASHBOARD_ALL_ISSUE_PAGE_SIZE ||
      candidateRows.length <= DASHBOARD_ALL_ISSUE_PAGE_SIZE
    ) {
      break;
    }

    const lastCandidate = candidateRows.at(-1);

    if (!lastCandidate) {
      break;
    }

    after = mapCandidateCursor(lastCandidate);
  }

  const items = visibleItems.slice(0, DASHBOARD_ALL_ISSUE_PAGE_SIZE);
  const lastItem = items.at(-1);

  return {
    sort: input.sort,
    filters: input.filters,
    items,
    nextAfter:
      visibleItems.length > DASHBOARD_ALL_ISSUE_PAGE_SIZE && lastItem
        ? {
            updatedAt: lastItem.updatedAt,
            projectKey: lastItem.project.key,
            issueNumber: lastItem.issueNumber,
          }
        : null,
  };
}

/** Selects one raw 25-plus-sentinel candidate chunk from current memberships. */
async function selectCandidateRows(
  input: DashboardAllIssuePageReadInput,
  after: DashboardAllIssueCursor | null
): Promise<CandidateRow[]> {
  const cursorCondition = buildCursorCondition(input.sort, after);
  const queryCondition = input.filters.query
    ? or(
        sql`position(lower(${input.filters.query}) in lower(${bubblophyIssues.title})) > 0`,
        sql`position(${input.filters.query} in ${bubblophyIssues.issueNumber}::text) > 0`,
        sql`position(lower(${input.filters.query}) in lower(${bubblophyProjects.key} || '-' || lpad(${bubblophyIssues.issueNumber}::text, 2, '0'))) > 0`
      )
    : undefined;
  const candidateRows = (await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      issueId: bubblophyIssues.id,
      issueNumber: bubblophyIssues.issueNumber,
      issueTitle: bubblophyIssues.title,
      issueStatus: bubblophyIssues.status,
      issuePriority: bubblophyIssues.priority,
      issueRequiresHumanApproval: bubblophyIssues.requiresHumanApproval,
      issueLatestPlan: latestPlanSummary,
      issueUpdatedAt: bubblophyIssues.updatedAt,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .innerJoin(
      bubblophyIssues,
      eq(bubblophyIssues.projectId, bubblophyProjects.id)
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        eq(bubblophyProjects.isArchived, false),
        cursorCondition,
        input.filters.status
          ? eq(bubblophyIssues.status, input.filters.status)
          : undefined,
        input.filters.priority
          ? eq(bubblophyIssues.priority, input.filters.priority)
          : undefined,
        queryCondition
      )
    )
    .orderBy(
      input.sort === 'newest'
        ? desc(bubblophyIssues.updatedAt)
        : asc(bubblophyIssues.updatedAt),
      input.sort === 'newest'
        ? desc(bubblophyProjects.key)
        : asc(bubblophyProjects.key),
      input.sort === 'newest'
        ? desc(bubblophyIssues.issueNumber)
        : asc(bubblophyIssues.issueNumber)
    )
    .limit(DASHBOARD_ALL_ISSUE_PAGE_SIZE + 1)) as CandidateRow[];

  return candidateRows;
}

/** Builds the direction-aware three-part keyset cursor condition. */
function buildCursorCondition(
  sort: DashboardAllIssuePageReadInput['sort'],
  after: DashboardAllIssueCursor | null
) {
  if (!after) {
    return undefined;
  }

  const compare = sort === 'newest' ? lt : gt;

  return or(
    compare(bubblophyIssues.updatedAt, after.updatedAt),
    and(
      eq(bubblophyIssues.updatedAt, after.updatedAt),
      compare(bubblophyProjects.key, after.projectKey)
    ),
    and(
      eq(bubblophyIssues.updatedAt, after.updatedAt),
      eq(bubblophyProjects.key, after.projectKey),
      compare(bubblophyIssues.issueNumber, after.issueNumber)
    )
  );
}

/** Rechecks current membership and the issue-to-project relation. */
async function selectCurrentIssueAccess(
  authUserId: string,
  issueIds: string[]
): Promise<CurrentIssueAccessRow[]> {
  if (issueIds.length === 0) {
    return [];
  }

  const assigneeMembers = alias(
    bubblophyProjectMembers,
    'bubblophy_all_issue_page_assignees'
  );

  return db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      projectName: bubblophyProjects.name,
      projectIsArchived: bubblophyProjects.isArchived,
      currentUserRole: bubblophyProjectMembers.role,
      issueId: bubblophyIssues.id,
      assignedAuthUserId: bubblophyIssues.assignedAuthUserId,
      assigneeMemberAuthUserId: assigneeMembers.authUserId,
      assigneeDisplayName: bubblophyUserProfiles.displayName,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .innerJoin(
      bubblophyIssues,
      eq(bubblophyIssues.projectId, bubblophyProjects.id)
    )
    .leftJoin(
      assigneeMembers,
      and(
        eq(assigneeMembers.projectId, bubblophyProjects.id),
        eq(assigneeMembers.authUserId, bubblophyIssues.assignedAuthUserId)
      )
    )
    .leftJoin(
      bubblophyUserProfiles,
      eq(bubblophyUserProfiles.authUserId, assigneeMembers.authUserId)
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, authUserId),
        inArray(bubblophyIssues.id, issueIds)
      )
    );
}

/** Maps one raw candidate cursor without exposing its internal issue ID. */
function mapCandidateCursor(row: CandidateRow): DashboardAllIssueCursor {
  return {
    updatedAt: row.issueUpdatedAt,
    projectKey: row.projectKey,
    issueNumber: row.issueNumber,
  };
}

/** Maps one candidate with refreshed access into the public DTO. */
function mapItem(
  row: CandidateRow,
  access: CurrentIssueAccessRow
): DashboardAllIssuePageItem {
  return {
    project: {
      key: access.projectKey,
      name: access.projectName,
      currentUserRole: access.currentUserRole,
    },
    key: formatBubblophyIssueKey(row.projectKey, row.issueNumber),
    issueNumber: row.issueNumber,
    title: row.issueTitle,
    status: row.issueStatus,
    priority: row.issuePriority,
    requiresHumanApproval: row.issueRequiresHumanApproval,
    assignedAuthUserId: access.assignedAuthUserId,
    assigneeLabel: getDashboardAssigneeLabel(
      access.assignedAuthUserId,
      access.assigneeMemberAuthUserId,
      access.assigneeDisplayName
    ),
    latestPlan: row.issueLatestPlan,
    updatedAt: row.issueUpdatedAt,
  };
}
