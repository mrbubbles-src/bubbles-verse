import 'server-only';

import type {
  BubblophyProjectIssueMembershipRow,
  BubblophyProjectIssuePersistenceRow,
  BubblophyProjectIssueRepositorySnapshot,
} from '@/lib/issues/repository';

import { buildBubblophyProjectIssueSnapshotForUser } from '@/lib/issues/repository';

import { and, asc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyAgentTokens,
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

type CountByProjectId = Record<string, number>;
type CountByIssueId = Record<string, number>;

/**
 * Loads the read-only Bubblophy project and issue dashboard for one user.
 *
 * The query boundary starts from project membership so a human user only sees
 * projects where their Supabase Auth user ID is present. This does not replace
 * future RLS policies; it is the application-level read contract for the MVP.
 *
 * @param authUserId Supabase Auth user ID from the authorized human session.
 * @returns Project and issue summaries visible to that user.
 */
export async function loadBubblophyProjectIssueSnapshotFromDatabase(
  authUserId: string
): Promise<BubblophyProjectIssueRepositorySnapshot> {
  const rows = await selectBubblophyProjectIssueRowsForUser(authUserId);

  return buildBubblophyProjectIssueSnapshotForUser(
    authUserId,
    rows.map((row) => ({
      ...row,
      projectMemberAuthUserId: authUserId,
    }))
  );
}

/**
 * Selects membership-scoped Bubblophy project and issue rows for one user.
 *
 * The selector returns flat mapper rows only. Snapshot construction, fallback
 * behavior, and UI metadata live in `lib/dashboard/data.ts`.
 *
 * @param authUserId Supabase Auth user ID from the authorized human session.
 * @returns Persistence rows visible to that user.
 */
export async function selectBubblophyProjectIssueRowsForUser(
  authUserId: string
): Promise<BubblophyProjectIssuePersistenceRow[]> {
  const membershipRows = await db
    .select({
      projectId: bubblophyProjectMembers.projectId,
      authUserId: bubblophyProjectMembers.authUserId,
    })
    .from(bubblophyProjectMembers)
    .where(eq(bubblophyProjectMembers.authUserId, authUserId));

  const projectIds = membershipRows.map((row) => row.projectId);

  if (projectIds.length === 0) {
    return [];
  }

  const [projectRows, memberCounts, tokenCounts, issueRows] = await Promise.all(
    [
      db
        .select({
          id: bubblophyProjects.id,
          key: bubblophyProjects.key,
          name: bubblophyProjects.name,
          isArchived: bubblophyProjects.isArchived,
        })
        .from(bubblophyProjects)
        .where(
          and(
            inArray(bubblophyProjects.id, projectIds),
            eq(bubblophyProjects.isArchived, false)
          )
        )
        .orderBy(asc(bubblophyProjects.key)),
      db
        .select({
          projectId: bubblophyProjectMembers.projectId,
          total: sql<number>`count(*)::int`,
        })
        .from(bubblophyProjectMembers)
        .where(inArray(bubblophyProjectMembers.projectId, projectIds))
        .groupBy(bubblophyProjectMembers.projectId),
      db
        .select({
          projectId: bubblophyAgentTokens.projectId,
          total: sql<number>`count(*)::int`,
        })
        .from(bubblophyAgentTokens)
        .where(
          and(
            inArray(bubblophyAgentTokens.projectId, projectIds),
            eq(bubblophyAgentTokens.state, 'active')
          )
        )
        .groupBy(bubblophyAgentTokens.projectId),
      db
        .select({
          id: bubblophyIssues.id,
          projectId: bubblophyIssues.projectId,
          issueNumber: bubblophyIssues.issueNumber,
          title: bubblophyIssues.title,
          status: bubblophyIssues.status,
          priority: bubblophyIssues.priority,
          assignedAuthUserId: bubblophyIssues.assignedAuthUserId,
          requiresHumanApproval: bubblophyIssues.requiresHumanApproval,
        })
        .from(bubblophyIssues)
        .where(inArray(bubblophyIssues.projectId, projectIds))
        .orderBy(
          asc(bubblophyIssues.projectId),
          asc(bubblophyIssues.issueNumber)
        ),
    ]
  );

  const visibleProjectIds = projectRows.map((project) => project.id);
  const visibleIssueIds = issueRows
    .filter((issue) => visibleProjectIds.includes(issue.projectId))
    .map((issue) => issue.id);

  const planCounts =
    visibleIssueIds.length === 0
      ? []
      : await db
          .select({
            issueId: bubblophyIssuePlans.issueId,
            total: sql<number>`coalesce(sum(case when jsonb_typeof(${bubblophyIssuePlans.steps}) = 'array' then jsonb_array_length(${bubblophyIssuePlans.steps}) else 0 end), 0)::int`,
          })
          .from(bubblophyIssuePlans)
          .where(inArray(bubblophyIssuePlans.issueId, visibleIssueIds))
          .groupBy(bubblophyIssuePlans.issueId);

  const rows = buildMembershipRows({
    authUserId,
    projects: projectRows,
    issues: issueRows,
    memberCounts: toProjectCountMap(memberCounts),
    tokenCounts: toProjectCountMap(tokenCounts),
    planCounts: toIssueCountMap(planCounts),
  });

  return rows;
}

/**
 * Builds mapper rows from normalized Drizzle query result sets.
 *
 * @param input Project, issue, and count rows collected by the DB loader.
 * @returns Membership-aware rows for the pure repository mapper.
 */
function buildMembershipRows(input: {
  authUserId: string;
  projects: {
    id: string;
    key: string;
    name: string;
    isArchived: boolean;
  }[];
  issues: {
    id: string;
    projectId: string;
    issueNumber: number;
    title: string;
    status: BubblophyProjectIssueMembershipRow['issueStatus'];
    priority: BubblophyProjectIssueMembershipRow['issuePriority'];
    assignedAuthUserId: string | null;
    requiresHumanApproval: boolean;
  }[];
  memberCounts: CountByProjectId;
  tokenCounts: CountByProjectId;
  planCounts: CountByIssueId;
}): BubblophyProjectIssueMembershipRow[] {
  return input.projects.flatMap((project) => {
    const projectIssues = input.issues.filter(
      (issue) => issue.projectId === project.id
    );

    if (projectIssues.length === 0) {
      return [
        createProjectIssueMembershipRow({
          authUserId: input.authUserId,
          project,
          memberCount: input.memberCounts[project.id] ?? 0,
          tokenCount: input.tokenCounts[project.id] ?? 0,
          issue: null,
          planStepCount: null,
        }),
      ];
    }

    return projectIssues.map((issue) =>
      createProjectIssueMembershipRow({
        authUserId: input.authUserId,
        project,
        memberCount: input.memberCounts[project.id] ?? 0,
        tokenCount: input.tokenCounts[project.id] ?? 0,
        issue,
        planStepCount: input.planCounts[issue.id] ?? 0,
      })
    );
  });
}

/**
 * Creates one membership-aware mapper row from project and optional issue data.
 *
 * @param input Project, counts, optional issue, and auth user ID.
 * @returns A row accepted by the pure project/issue mapper.
 */
function createProjectIssueMembershipRow(input: {
  authUserId: string;
  project: {
    id: string;
    key: string;
    name: string;
    isArchived: boolean;
  };
  memberCount: number;
  tokenCount: number;
  issue: {
    id: string;
    issueNumber: number;
    title: string;
    status: BubblophyProjectIssueMembershipRow['issueStatus'];
    priority: BubblophyProjectIssueMembershipRow['issuePriority'];
    assignedAuthUserId: string | null;
    requiresHumanApproval: boolean;
  } | null;
  planStepCount: number | null;
}): BubblophyProjectIssueMembershipRow {
  return {
    projectMemberAuthUserId: input.authUserId,
    projectId: input.project.id,
    projectName: input.project.name,
    projectKey: input.project.key,
    projectIsArchived: input.project.isArchived,
    projectMemberCount: input.memberCount,
    activeAgentTokenCount: input.tokenCount,
    issueDatabaseId: input.issue?.id ?? null,
    issueNumber: input.issue?.issueNumber ?? null,
    issueTitle: input.issue?.title ?? null,
    issueStatus: input.issue?.status ?? null,
    issuePriority: input.issue?.priority ?? null,
    issueAssignedAuthUserId: input.issue?.assignedAuthUserId ?? null,
    issueRequiresHumanApproval: input.issue?.requiresHumanApproval ?? null,
    issuePlanStepCount: input.planStepCount,
  };
}

/**
 * Converts project count rows into a lookup table.
 *
 * @param rows Rows containing project IDs and totals.
 * @returns Count lookup keyed by project ID.
 */
function toProjectCountMap(rows: { projectId: string; total: number }[]) {
  return rows.reduce<CountByProjectId>((counts, row) => {
    counts[row.projectId] = row.total;
    return counts;
  }, {});
}

/**
 * Converts issue count rows into a lookup table.
 *
 * @param rows Rows containing issue IDs and totals.
 * @returns Count lookup keyed by issue ID.
 */
function toIssueCountMap(rows: { issueId: string; total: number }[]) {
  return rows.reduce<CountByIssueId>((counts, row) => {
    counts[row.issueId] = row.total;
    return counts;
  }, {});
}
