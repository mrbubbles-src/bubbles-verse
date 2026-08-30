import 'server-only';

import type {
  BubblophyIssuePriority,
  BubblophyIssueStatus,
  BubblophyProjectRole,
  JsonValue,
} from '@/drizzle/db/schema';
import type {
  DashboardIssueDetail,
  DashboardIssueDetailReadInput,
  DashboardIssuePage,
  DashboardIssuePageItem,
  DashboardIssuePageReadInput,
} from '@/lib/dashboard/issues';
import type { IssueNoteSummary } from '@/lib/dashboard/types';

import {
  DASHBOARD_ISSUE_PAGE_SIZE,
  getDashboardAssigneeLabel,
} from '@/lib/dashboard/issues';
import { DASHBOARD_ISSUE_NOTE_LIMIT } from '@/lib/dashboard/types';
import {
  formatBubblophyIssueKey,
  mapBubblophyIssuePlanSteps,
} from '@/lib/issues/repository';

import { and, asc, desc, eq, gt, inArray, lt, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '@/drizzle/db';
import {
  bubblophyAgentTokens,
  bubblophyIssueEvents,
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
  bubblophyUserProfiles,
} from '@/drizzle/db/schema';

interface LatestPlanSummary {
  version: number;
  stepCount: number;
}

interface DashboardIssueCandidateRow {
  projectId: string;
  projectKey: string;
  issueId: string | null;
  issueNumber: number | null;
  issueTitle: string | null;
  issueStatus: BubblophyIssueStatus | null;
  issuePriority: BubblophyIssuePriority | null;
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

interface DashboardIssueFinalAssignmentRow {
  issueId: string;
  assignedAuthUserId: string | null;
  assigneeMemberAuthUserId: string | null;
  assigneeDisplayName: string | null;
}

interface DashboardIssuePageFinalRow
  extends DashboardIssueFinalMembershipRow, DashboardIssueFinalAssignmentRow {}

interface DashboardIssueFinalDetailRow
  extends DashboardIssueFinalMembershipRow, DashboardIssueFinalAssignmentRow {}

interface LatestPlanDetailRow {
  version: number;
  summary: string;
  steps: JsonValue;
}

interface DashboardIssueDetailCandidateRow {
  projectId: string;
  projectKey: string;
  issueId: string;
  issueNumber: number;
  issueTitle: string;
  issueDescription: string;
  issueStatus: BubblophyIssueStatus;
  issuePriority: BubblophyIssuePriority;
  issueRequiresHumanApproval: boolean;
  issueCreatedAt: string;
  issueUpdatedAt: string;
  issueLatestPlan: LatestPlanDetailRow | null;
}

interface DashboardIssueNoteRow {
  id: string;
  note: string;
  actorAuthUserId: string | null;
  actorAgentTokenLabel: string | null;
  createdAt: string;
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

const latestPlanDetail = sql<LatestPlanDetailRow | null>`(
  select jsonb_build_object(
    'version', ${bubblophyIssuePlans.version},
    'summary', ${bubblophyIssuePlans.summary},
    'steps', ${bubblophyIssuePlans.steps}
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
 * in one statement. A final membership/assignment read closes the removal,
 * key-change, issue, and assignee races and supplies the project metadata.
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
  const queryCondition = input.filters.query
    ? or(
        sql`position(lower(${input.filters.query}) in lower(${bubblophyIssues.title})) > 0`,
        sql`position(${input.filters.query} in ${bubblophyIssues.issueNumber}::text) > 0`,
        sql`position(lower(${input.filters.query}) in lower(${bubblophyProjects.key} || '-' || lpad(${bubblophyIssues.issueNumber}::text, 2, '0'))) > 0`
      )
    : undefined;
  const issueJoinCondition = and(
    eq(bubblophyIssues.projectId, bubblophyProjects.id),
    cursorCondition,
    input.filters.status
      ? eq(bubblophyIssues.status, input.filters.status)
      : undefined,
    input.filters.priority
      ? eq(bubblophyIssues.priority, input.filters.priority)
      : undefined,
    queryCondition
  );
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

  const issueIds = candidateRows.flatMap((row) =>
    row.issueId ? [row.issueId] : []
  );
  let finalAssignments: DashboardIssueFinalAssignmentRow[];
  let finalMembership: DashboardIssueFinalMembershipRow | null;

  if (issueIds.length === 0) {
    finalAssignments = [];
    finalMembership = await selectFinalMembership(
      firstCandidate.projectId,
      input.projectKey,
      input.authUserId
    );
  } else {
    const finalRows = await selectFinalIssuePage(
      firstCandidate.projectId,
      input.projectKey,
      input.authUserId,
      issueIds
    );

    const finalIssueIds = new Set(finalRows.map((row) => row.issueId));
    if (
      finalRows.length !== issueIds.length ||
      finalIssueIds.size !== issueIds.length ||
      issueIds.some((issueId) => !finalIssueIds.has(issueId))
    ) {
      return null;
    }

    finalMembership = finalRows[0] ?? null;
    finalAssignments = finalRows;
  }

  if (
    !finalMembership ||
    finalMembership.projectId !== firstCandidate.projectId ||
    finalMembership.projectKey !== firstCandidate.projectKey ||
    finalMembership.projectKey !== input.projectKey
  ) {
    return null;
  }

  const finalAssignmentByIssueId = new Map(
    finalAssignments.map((row) => [row.issueId, row])
  );

  const items = candidateRows
    .slice(0, DASHBOARD_ISSUE_PAGE_SIZE)
    .flatMap((row) =>
      mapDashboardIssueCandidateRow(
        row,
        row.issueId ? finalAssignmentByIssueId.get(row.issueId) : undefined
      )
    );
  const lastCandidate = candidateRows
    .slice(0, DASHBOARD_ISSUE_PAGE_SIZE)
    .at(-1);

  return {
    project: {
      key: finalMembership.projectKey,
      name: finalMembership.projectName,
      isArchived: finalMembership.projectIsArchived,
      currentUserRole: finalMembership.currentUserRole,
    },
    sort: input.sort,
    filters: input.filters,
    items,
    nextAfterIssueNumber:
      candidateRows.length > DASHBOARD_ISSUE_PAGE_SIZE &&
      lastCandidate?.issueNumber
        ? lastCandidate.issueNumber
        : null,
  };
}

/**
 * Selects one direct issue detail and revalidates membership before return.
 *
 * The issue and latest plan are read through the actor's membership in one
 * statement. The final gate closes membership-removal and project-key races.
 *
 * @param input Normalized actor, project key, and issue number.
 * @returns The visible issue detail without internal project or issue IDs.
 */
export async function selectDashboardIssueDetailForUser(
  input: DashboardIssueDetailReadInput
): Promise<DashboardIssueDetail | null> {
  const [candidate] = (await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      issueId: bubblophyIssues.id,
      issueNumber: bubblophyIssues.issueNumber,
      issueTitle: bubblophyIssues.title,
      issueDescription: bubblophyIssues.description,
      issueStatus: bubblophyIssues.status,
      issuePriority: bubblophyIssues.priority,
      issueRequiresHumanApproval: bubblophyIssues.requiresHumanApproval,
      issueCreatedAt: bubblophyIssues.createdAt,
      issueUpdatedAt: bubblophyIssues.updatedAt,
      issueLatestPlan: latestPlanDetail,
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
        eq(bubblophyProjects.key, input.projectKey),
        eq(bubblophyIssues.issueNumber, input.issueNumber)
      )
    )
    .limit(1)) as DashboardIssueDetailCandidateRow[];

  if (!candidate) {
    return null;
  }

  const noteRows = (await db
    .select({
      id: bubblophyIssueEvents.id,
      note: bubblophyIssueEvents.summary,
      actorAuthUserId: bubblophyIssueEvents.actorAuthUserId,
      actorAgentTokenLabel: bubblophyAgentTokens.label,
      createdAt: bubblophyIssueEvents.createdAt,
    })
    .from(bubblophyIssueEvents)
    .leftJoin(
      bubblophyAgentTokens,
      and(
        eq(bubblophyAgentTokens.id, bubblophyIssueEvents.actorAgentTokenId),
        eq(bubblophyAgentTokens.projectId, candidate.projectId)
      )
    )
    .where(
      and(
        eq(bubblophyIssueEvents.issueId, candidate.issueId),
        eq(bubblophyIssueEvents.eventType, 'commented'),
        sql`${bubblophyIssueEvents.payload} @> ${JSON.stringify({ entity: 'issue_note', action: 'created' })}::jsonb`
      )
    )
    .orderBy(
      desc(bubblophyIssueEvents.createdAt),
      desc(bubblophyIssueEvents.id)
    )
    .limit(DASHBOARD_ISSUE_NOTE_LIMIT + 1)) as DashboardIssueNoteRow[];

  const finalIssue = await selectFinalIssueMembership(
    candidate.projectId,
    candidate.issueId,
    input.authUserId
  );

  if (
    !finalIssue ||
    finalIssue.projectKey !== candidate.projectKey ||
    finalIssue.projectKey !== input.projectKey
  ) {
    return null;
  }

  return {
    project: {
      key: finalIssue.projectKey,
      name: finalIssue.projectName,
      isArchived: finalIssue.projectIsArchived,
      currentUserRole: finalIssue.currentUserRole,
    },
    issue: {
      key: formatBubblophyIssueKey(candidate.projectKey, candidate.issueNumber),
      issueNumber: candidate.issueNumber,
      title: candidate.issueTitle,
      description: candidate.issueDescription,
      status: candidate.issueStatus,
      priority: candidate.issuePriority,
      requiresHumanApproval: candidate.issueRequiresHumanApproval,
      assignedAuthUserId: finalIssue.assignedAuthUserId,
      assigneeLabel: getDashboardAssigneeLabel(
        finalIssue.assignedAuthUserId,
        finalIssue.assigneeMemberAuthUserId,
        finalIssue.assigneeDisplayName
      ),
      createdAt: candidate.issueCreatedAt,
      updatedAt: candidate.issueUpdatedAt,
      latestPlan: candidate.issueLatestPlan
        ? {
            version: candidate.issueLatestPlan.version,
            summary: candidate.issueLatestPlan.summary,
            steps: mapBubblophyIssuePlanSteps(candidate.issueLatestPlan.steps),
          }
        : null,
      notes: noteRows
        .slice(0, DASHBOARD_ISSUE_NOTE_LIMIT)
        .map(mapDashboardIssueNoteRow),
      hasMoreNotes: noteRows.length > DASHBOARD_ISSUE_NOTE_LIMIT,
    },
  };
}

/**
 * Re-reads membership while requiring the same issue-to-project relation.
 *
 * @param projectId Internal project ID from the initial candidate read.
 * @param issueId Internal issue ID from the initial candidate read.
 * @param authUserId Authenticated user whose membership must still exist.
 * @returns Current project metadata, or null after access/deletion/move races.
 */
async function selectFinalIssueMembership(
  projectId: string,
  issueId: string,
  authUserId: string
): Promise<DashboardIssueFinalDetailRow | null> {
  const assigneeMembers = alias(
    bubblophyProjectMembers,
    'bubblophy_issue_detail_assignees'
  );
  const [row] = (await db
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
        eq(bubblophyProjectMembers.projectId, projectId),
        eq(bubblophyProjectMembers.authUserId, authUserId),
        eq(bubblophyIssues.id, issueId)
      )
    )
    .limit(1)) as DashboardIssueFinalDetailRow[];

  return row ?? null;
}

/** Maps one bounded issue-note event without exposing raw actor IDs. */
function mapDashboardIssueNoteRow(
  row: DashboardIssueNoteRow
): IssueNoteSummary {
  return {
    id: row.id,
    note: row.note,
    actor: row.actorAuthUserId
      ? 'Mensch'
      : row.actorAgentTokenLabel
        ? `Agent-Token ${row.actorAgentTokenLabel}`
        : 'System',
    createdAt: row.createdAt,
  };
}

/** Re-reads current membership and all returned project metadata. */
async function selectFinalMembership(
  projectId: string,
  projectKey: string,
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
        eq(bubblophyProjectMembers.authUserId, authUserId),
        eq(bubblophyProjects.key, projectKey)
      )
    )
    .limit(1)) as DashboardIssueFinalMembershipRow[];

  return row ?? null;
}

/** Re-reads actor membership, project binding, issues, and target memberships together. */
async function selectFinalIssuePage(
  projectId: string,
  projectKey: string,
  authUserId: string,
  issueIds: string[]
): Promise<DashboardIssuePageFinalRow[]> {
  const assigneeMembers = alias(
    bubblophyProjectMembers,
    'bubblophy_issue_page_assignees'
  );

  return (await db
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
        eq(bubblophyProjectMembers.projectId, projectId),
        eq(bubblophyProjectMembers.authUserId, authUserId),
        eq(bubblophyProjects.key, projectKey),
        inArray(bubblophyIssues.id, issueIds)
      )
    )
    .limit(issueIds.length)) as DashboardIssuePageFinalRow[];
}

/** Maps one nullable issue join row into the raw dashboard read DTO. */
function mapDashboardIssueCandidateRow(
  row: DashboardIssueCandidateRow,
  finalAssignment: DashboardIssueFinalAssignmentRow | undefined
): DashboardIssuePageItem[] {
  if (row.issueId === null || row.issueNumber === null || !finalAssignment) {
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
      assignedAuthUserId: finalAssignment.assignedAuthUserId,
      assigneeLabel: getDashboardAssigneeLabel(
        finalAssignment.assignedAuthUserId,
        finalAssignment.assigneeMemberAuthUserId,
        finalAssignment.assigneeDisplayName
      ),
      latestPlan: row.issueLatestPlan,
    },
  ];
}
