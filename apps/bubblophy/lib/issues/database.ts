import 'server-only';

import type { BubblophyDashboardPersistenceRows } from '@/lib/dashboard/data';
import type {
  BubblophyActivityPersistenceRow,
  BubblophyAgentRunPersistenceRow,
  BubblophyAgentTokenPersistenceRow,
  BubblophyProjectMemberPersistenceRow,
  BubblophyProjectPersistenceRow,
} from '@/lib/issues/repository';

import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '@/drizzle/db';
import {
  bubblophyAgentRuns,
  bubblophyAgentTokens,
  bubblophyIssueEvents,
  bubblophyIssues,
  bubblophyProjectEvents,
  bubblophyProjectMembers,
  bubblophyProjects,
  bubblophyUserProfiles,
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
 * @returns Project aggregates plus public member, token, run, and activity rows.
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
      projectMemberRows: [],
      agentTokenRows: [],
      agentRunRows: [],
      activityRows: [],
    };
  }

  const [
    projectRows,
    projectMemberRows,
    agentTokenRows,
    agentRunRows,
    activityRows,
  ] = await Promise.all([
    selectBubblophyProjectRowsForProjectIds(authUserId, projectIds),
    selectBubblophyProjectMemberRowsForUser(authUserId, projectIds),
    selectBubblophyAgentTokenRowsForProjectIds(projectIds),
    selectBubblophyAgentRunRowsForProjectIds(projectIds),
    selectBubblophyProjectActivityRowsForProjectIds(projectIds),
  ]);

  const rows = {
    projectRows,
    projectMemberRows,
    agentTokenRows,
    agentRunRows,
    activityRows,
  };
  const currentMemberships =
    await selectVisibleProjectMembershipsForUser(authUserId);

  return restrictDashboardRowsToCurrentMemberships(
    rows,
    candidateMemberships,
    currentMemberships,
    authUserId
  );
}

/**
 * Applies the final membership gate immediately before dashboard DTO mapping.
 *
 * Project IDs from the first lookup only bound the parallel queries. This
 * second lookup is authoritative: a membership removed while those queries
 * ran cannot leave project, member, token, run, or activity rows in the
 * returned snapshot. Missing project rows also fail closed for key-only DTOs.
 *
 * @param rows Data groups loaded through the initial project-ID bound.
 * @param candidateMemberships Memberships used to bound the initial queries.
 * @param currentMemberships Project memberships visible at the final gate.
 * @param authUserId Current verified session user for self e-mail visibility.
 * @returns Rows restricted to projects still visible to the current user.
 */
function restrictDashboardRowsToCurrentMemberships(
  rows: BubblophyDashboardPersistenceRows,
  candidateMemberships: VisibleProjectMembership[],
  currentMemberships: VisibleProjectMembership[],
  authUserId: string
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
  const currentRoleByProjectKey = new Map(
    currentMemberships.map((row) => [row.projectKey, row.role])
  );

  return {
    projectRows,
    projectMemberRows: rows.projectMemberRows
      .filter((row) => stableProjectKeys.has(row.projectKey))
      .map((row) => {
        const currentRole = currentRoleByProjectKey.get(row.projectKey);
        const canReadEmail =
          currentRole === 'owner' ||
          currentRole === 'maintainer' ||
          row.authUserId === authUserId;

        return canReadEmail ? row : { ...row, normalizedEmail: null };
      }),
    agentTokenRows: rows.agentTokenRows.filter((row) =>
      stableProjectKeys.has(row.projectKey)
    ),
    agentRunRows: rows.agentRunRows.filter((row) =>
      stableProjectKeys.has(row.projectKey)
    ),
    activityRows: rows.activityRows.filter(
      (row) => row.projectKey && stableProjectKeys.has(row.projectKey)
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
 * Selects public agent token summary rows for visible projects.
 *
 * The selected shape intentionally omits `token_hash`.
 *
 * @param projectIds Project IDs already constrained by membership.
 * @returns Public token rows for the dashboard.
 */
async function selectBubblophyAgentTokenRowsForProjectIds(
  projectIds: string[]
): Promise<BubblophyAgentTokenPersistenceRow[]> {
  return db
    .select({
      id: bubblophyAgentTokens.id,
      label: bubblophyAgentTokens.label,
      projectKey: bubblophyProjects.key,
      scopes: bubblophyAgentTokens.scopes,
      state: bubblophyAgentTokens.state,
      lastUsedAt: bubblophyAgentTokens.lastUsedAt,
      expiresAt: bubblophyAgentTokens.expiresAt,
    })
    .from(bubblophyAgentTokens)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyAgentTokens.projectId)
    )
    .where(inArray(bubblophyAgentTokens.projectId, projectIds))
    .orderBy(asc(bubblophyProjects.key), asc(bubblophyAgentTokens.label));
}

/**
 * Selects public project member rows for visible projects.
 *
 * Profiles are display-only. The same statement rechecks the actor membership
 * before reading member names or manager-visible e-mail addresses, so the
 * earlier project-ID lookup cannot outlive a concurrent membership removal.
 *
 * @param authUserId Current verified session user.
 * @param projectIds Project IDs already constrained by membership.
 * @returns Public membership rows for the dashboard.
 */
async function selectBubblophyProjectMemberRowsForUser(
  authUserId: string,
  projectIds: string[]
): Promise<BubblophyProjectMemberPersistenceRow[]> {
  const actorMemberships = alias(
    bubblophyProjectMembers,
    'bubblophy_actor_memberships'
  );

  return db
    .select({
      projectKey: bubblophyProjects.key,
      authUserId: bubblophyProjectMembers.authUserId,
      displayName: bubblophyUserProfiles.displayName,
      normalizedEmail: sql<string | null>`case
        when ${actorMemberships.role} in ('owner', 'maintainer')
          or ${bubblophyProjectMembers.authUserId} = ${authUserId}
        then ${bubblophyUserProfiles.normalizedEmail}
        else null
      end`,
      role: bubblophyProjectMembers.role,
      createdAt: bubblophyProjectMembers.createdAt,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .innerJoin(
      actorMemberships,
      and(
        eq(actorMemberships.projectId, bubblophyProjectMembers.projectId),
        eq(actorMemberships.authUserId, authUserId)
      )
    )
    .leftJoin(
      bubblophyUserProfiles,
      eq(bubblophyUserProfiles.authUserId, bubblophyProjectMembers.authUserId)
    )
    .where(inArray(bubblophyProjectMembers.projectId, projectIds))
    .orderBy(
      asc(bubblophyProjects.key),
      asc(bubblophyProjectMembers.role),
      asc(bubblophyProjectMembers.authUserId)
    );
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
      issueNumber: bubblophyIssues.issueNumber,
      agentTokenLabel: bubblophyAgentTokens.label,
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
 * Selects recent project-level activity rows for visible projects.
 *
 * @param projectIds Project IDs already constrained by membership.
 * @returns Activity rows, newest first.
 */
async function selectBubblophyProjectActivityRowsForProjectIds(
  projectIds: string[]
): Promise<BubblophyActivityPersistenceRow[]> {
  const [projectEvents, issueEvents] = await Promise.all([
    selectBubblophyProjectEventActivityRowsForProjectIds(projectIds),
    selectBubblophyIssueEventActivityRowsForProjectIds(projectIds),
  ]);

  return [...projectEvents, ...issueEvents]
    .sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) ||
        right.id.localeCompare(left.id)
    )
    .slice(0, 20);
}

/**
 * Selects project-level audit rows for visible projects.
 *
 * @param projectIds Project IDs already constrained by membership.
 * @returns Project event activity rows.
 */
async function selectBubblophyProjectEventActivityRowsForProjectIds(
  projectIds: string[]
): Promise<BubblophyActivityPersistenceRow[]> {
  return db
    .select({
      id: bubblophyProjectEvents.id,
      summary: bubblophyProjectEvents.summary,
      actorAuthUserId: bubblophyProjectEvents.actorAuthUserId,
      actorAgentTokenLabel: bubblophyAgentTokens.label,
      createdAt: bubblophyProjectEvents.createdAt,
      projectKey: bubblophyProjects.key,
      issueNumber: sql<number | null>`null`,
    })
    .from(bubblophyProjectEvents)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectEvents.projectId)
    )
    .leftJoin(
      bubblophyAgentTokens,
      and(
        eq(bubblophyAgentTokens.id, bubblophyProjectEvents.actorAgentTokenId),
        eq(bubblophyAgentTokens.projectId, bubblophyProjectEvents.projectId)
      )
    )
    .where(inArray(bubblophyProjectEvents.projectId, projectIds))
    .orderBy(desc(bubblophyProjectEvents.createdAt))
    .limit(20);
}

/**
 * Selects issue-level audit rows for visible projects.
 *
 * @param projectIds Project IDs already constrained by membership.
 * @returns Issue event activity rows.
 */
async function selectBubblophyIssueEventActivityRowsForProjectIds(
  projectIds: string[]
): Promise<BubblophyActivityPersistenceRow[]> {
  return db
    .select({
      id: bubblophyIssueEvents.id,
      summary: bubblophyIssueEvents.summary,
      actorAuthUserId: bubblophyIssueEvents.actorAuthUserId,
      actorAgentTokenLabel: bubblophyAgentTokens.label,
      createdAt: bubblophyIssueEvents.createdAt,
      projectKey: bubblophyProjects.key,
      issueNumber: bubblophyIssues.issueNumber,
    })
    .from(bubblophyIssueEvents)
    .innerJoin(
      bubblophyIssues,
      eq(bubblophyIssues.id, bubblophyIssueEvents.issueId)
    )
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyIssues.projectId)
    )
    .leftJoin(
      bubblophyAgentTokens,
      and(
        eq(bubblophyAgentTokens.id, bubblophyIssueEvents.actorAgentTokenId),
        eq(bubblophyAgentTokens.projectId, bubblophyIssues.projectId)
      )
    )
    .where(inArray(bubblophyIssues.projectId, projectIds))
    .orderBy(desc(bubblophyIssueEvents.createdAt))
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
