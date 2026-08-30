import 'server-only';

import type { BubblophyDashboardPersistenceRows } from '@/lib/dashboard/data';
import type {
  BubblophyAgentRunPersistenceRow,
  BubblophyProjectPersistenceRow,
} from '@/lib/issues/repository';

import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyAgentRuns,
  bubblophyAgentTokens,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

type CountByProjectId = Record<string, number>;
type IssueCountsByProjectId = Record<
  string,
  {
    open: number;
    ready: number;
    blocked: number;
  }
>;
type RoleByProjectId = Record<
  string,
  BubblophyProjectPersistenceRow['currentUserRole']
>;
type VisibleProjectMembership = {
  projectId: string;
  projectKey: string;
  role: BubblophyProjectPersistenceRow['currentUserRole'];
};

/**
 * Selects all dashboard row groups visible to one authenticated human.
 *
 * Every query is constrained by the user's project memberships. Token hashes
 * and plaintext token material are never selected.
 *
 * @param authUserId Supabase Auth user ID from the authorized human session.
 * @returns Project aggregates plus token and run rows.
 */
export async function selectBubblophyDashboardRowsForUser(
  authUserId: string
): Promise<BubblophyDashboardPersistenceRows> {
  const candidateMemberships =
    await selectVisibleProjectMembershipsForUser(authUserId);
  const projectIds = candidateMemberships.map((row) => row.projectId);

  if (projectIds.length === 0) {
    return {
      projectRows: [],
      agentRunRows: [],
    };
  }

  const [projectRows, agentRunRows] = await Promise.all([
    selectBubblophyProjectRowsForProjectIds(authUserId, projectIds),
    selectBubblophyAgentRunRowsForProjectIds(projectIds),
  ]);

  const rows = {
    projectRows,
    agentRunRows,
  };
  const currentMemberships =
    await selectVisibleProjectMembershipsForUser(authUserId);

  return restrictDashboardRowsToCurrentMemberships(
    rows,
    candidateMemberships,
    currentMemberships
  );
}

/**
 * Applies the final membership gate immediately before dashboard DTO mapping.
 *
 * Project IDs from the first lookup only bound the parallel queries. This
 * second lookup is authoritative: a membership removed while those queries
 * ran cannot leave project, token, or run rows in the
 * returned snapshot. Missing project rows also fail closed for key-only DTOs.
 *
 * @param rows Data groups loaded through the initial project-ID bound.
 * @param candidateMemberships Memberships used to bound the initial queries.
 * @param currentMemberships Project memberships visible at the final gate.
 * @returns Rows restricted to projects still visible to the current user.
 */
function restrictDashboardRowsToCurrentMemberships(
  rows: BubblophyDashboardPersistenceRows,
  candidateMemberships: VisibleProjectMembership[],
  currentMemberships: VisibleProjectMembership[]
): BubblophyDashboardPersistenceRows {
  const projectRows = restrictProjectRowsToCurrentMemberships(
    rows.projectRows,
    currentMemberships
  );
  const currentProjectIds = new Set(projectRows.map((row) => row.id));
  const candidateProjectKeyById = new Map(
    candidateMemberships.map((row) => [row.projectId, row.projectKey])
  );
  const stableProjectKeys = new Set(
    currentMemberships
      .filter(
        (row) =>
          currentProjectIds.has(row.projectId) &&
          candidateProjectKeyById.get(row.projectId) === row.projectKey
      )
      .map((row) => row.projectKey)
  );
  return {
    projectRows,
    agentRunRows: rows.agentRunRows.filter((row) =>
      stableProjectKeys.has(row.projectKey)
    ),
  };
}

/**
 * Restricts project rows to final memberships and refreshes keys and roles.
 *
 * @param rows Candidate project rows from the initial membership bound.
 * @param currentMemberships Authoritative memberships at the final gate.
 * @returns Current rows with final project roles.
 */
function restrictProjectRowsToCurrentMemberships(
  rows: BubblophyProjectPersistenceRow[],
  currentMemberships: VisibleProjectMembership[]
): BubblophyProjectPersistenceRow[] {
  const currentMembershipByProjectId = new Map(
    currentMemberships.map((row) => [row.projectId, row])
  );

  return rows.flatMap((row) => {
    const currentMembership = currentMembershipByProjectId.get(row.id);

    if (!currentMembership) {
      return [];
    }

    return [
      {
        ...row,
        key: currentMembership.projectKey,
        currentUserRole: currentMembership.role,
      },
    ];
  });
}

/**
 * Selects project identity and role rows for the current user's memberships.
 *
 * @param authUserId Supabase Auth user ID from the authorized human session.
 * @returns Visible project IDs, keys, and current roles.
 */
async function selectVisibleProjectMembershipsForUser(
  authUserId: string
): Promise<VisibleProjectMembership[]> {
  return db
    .select({
      projectId: bubblophyProjectMembers.projectId,
      projectKey: bubblophyProjects.key,
      role: bubblophyProjectMembers.role,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .where(eq(bubblophyProjectMembers.authUserId, authUserId));
}

/**
 * Selects membership-scoped project rows for known project IDs.
 *
 * @param authUserId Supabase Auth user ID from the authorized human session.
 * @param projectIds Project IDs already constrained by membership.
 * @returns Project summaries with independent aggregate counters.
 */
async function selectBubblophyProjectRowsForProjectIds(
  authUserId: string,
  projectIds: string[]
): Promise<BubblophyProjectPersistenceRow[]> {
  const [
    projectRows,
    currentUserRoles,
    memberCounts,
    tokenCounts,
    issueCounts,
  ] = await Promise.all([
    db
      .select({
        id: bubblophyProjects.id,
        key: bubblophyProjects.key,
        name: bubblophyProjects.name,
        description: bubblophyProjects.description,
        isArchived: bubblophyProjects.isArchived,
      })
      .from(bubblophyProjects)
      .where(inArray(bubblophyProjects.id, projectIds))
      .orderBy(asc(bubblophyProjects.key)),
    db
      .select({
        projectId: bubblophyProjectMembers.projectId,
        role: bubblophyProjectMembers.role,
      })
      .from(bubblophyProjectMembers)
      .where(
        and(
          inArray(bubblophyProjectMembers.projectId, projectIds),
          eq(bubblophyProjectMembers.authUserId, authUserId)
        )
      ),
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
        projectId: bubblophyIssues.projectId,
        open: sql<number>`count(*) filter (where ${bubblophyIssues.status} <> 'done')::int`,
        ready: sql<number>`count(*) filter (where ${bubblophyIssues.status} = 'ready')::int`,
        blocked: sql<number>`count(*) filter (where ${bubblophyIssues.status} = 'blocked')::int`,
      })
      .from(bubblophyIssues)
      .where(inArray(bubblophyIssues.projectId, projectIds))
      .groupBy(bubblophyIssues.projectId),
  ]);

  const roleByProjectId = toProjectRoleMap(currentUserRoles);
  const memberCountByProjectId = toProjectCountMap(memberCounts);
  const tokenCountByProjectId = toProjectCountMap(tokenCounts);
  const issueCountByProjectId = toProjectIssueCountMap(issueCounts);

  return projectRows.flatMap((project) => {
    const currentUserRole = roleByProjectId[project.id];

    if (!currentUserRole) {
      return [];
    }

    return [
      {
        ...project,
        memberCount: memberCountByProjectId[project.id] ?? 0,
        activeAgentTokenCount: tokenCountByProjectId[project.id] ?? 0,
        openIssueCount: issueCountByProjectId[project.id]?.open ?? 0,
        readyIssueCount: issueCountByProjectId[project.id]?.ready ?? 0,
        blockedIssueCount: issueCountByProjectId[project.id]?.blocked ?? 0,
        currentUserRole,
      },
    ];
  });
}

/**
 * Selects public agent-run rows for visible projects.
 *
 * The selected shape intentionally omits token hashes and raw auth user IDs.
 *
 * @param projectIds Project IDs already constrained by membership.
 * @returns Public run rows for the dashboard.
 */
async function selectBubblophyAgentRunRowsForProjectIds(
  projectIds: string[]
): Promise<BubblophyAgentRunPersistenceRow[]> {
  return db
    .select({
      id: bubblophyAgentRuns.id,
      projectKey: bubblophyProjects.key,
      projectIsArchived: bubblophyProjects.isArchived,
      issueNumber: bubblophyIssues.issueNumber,
      agentTokenLabel: bubblophyAgentTokens.label,
      agentTokenScopes: bubblophyAgentTokens.scopes,
      agentTokenState: bubblophyAgentTokens.state,
      agentTokenExpiresAt: bubblophyAgentTokens.expiresAt,
      state: bubblophyAgentRuns.state,
      updatedAt: bubblophyAgentRuns.updatedAt,
      result: bubblophyAgentRuns.result,
    })
    .from(bubblophyAgentRuns)
    .innerJoin(
      bubblophyIssues,
      eq(bubblophyIssues.id, bubblophyAgentRuns.issueId)
    )
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyIssues.projectId)
    )
    .innerJoin(
      bubblophyAgentTokens,
      and(
        eq(bubblophyAgentTokens.id, bubblophyAgentRuns.agentTokenId),
        eq(bubblophyAgentTokens.projectId, bubblophyProjects.id)
      )
    )
    .where(inArray(bubblophyIssues.projectId, projectIds))
    .orderBy(desc(bubblophyAgentRuns.updatedAt), desc(bubblophyAgentRuns.id))
    .limit(20);
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
 * Converts grouped issue aggregates into a project-ID lookup.
 *
 * @param rows SQL aggregate rows for candidate projects.
 * @returns Open, ready, and blocked counts keyed by project ID.
 */
function toProjectIssueCountMap(
  rows: {
    projectId: string;
    open: number;
    ready: number;
    blocked: number;
  }[]
) {
  return rows.reduce<IssueCountsByProjectId>((counts, row) => {
    counts[row.projectId] = {
      open: row.open,
      ready: row.ready,
      blocked: row.blocked,
    };
    return counts;
  }, {});
}

/**
 * Converts current-user membership rows into a project role lookup.
 *
 * @param rows Rows containing project IDs and the current user's role.
 * @returns Role lookup keyed by project ID.
 */
function toProjectRoleMap(
  rows: {
    projectId: string;
    role: BubblophyProjectPersistenceRow['currentUserRole'];
  }[]
) {
  return rows.reduce<RoleByProjectId>((roles, row) => {
    roles[row.projectId] = row.role;
    return roles;
  }, {});
}
