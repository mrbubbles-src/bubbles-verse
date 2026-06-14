import 'server-only';

import type { BubblophyDashboardPersistenceRows } from '@/lib/dashboard/data';
import type { IssueNoteSummary } from '@/lib/dashboard/types';
import type {
  BubblophyActivityPersistenceRow,
  BubblophyAgentRunPersistenceRow,
  BubblophyAgentTokenPersistenceRow,
  BubblophyProjectIssueMembershipRow,
  BubblophyProjectIssuePersistenceRow,
  BubblophyProjectIssueRepositorySnapshot,
  BubblophyProjectMemberPersistenceRow,
} from '@/lib/issues/repository';

import { buildBubblophyProjectIssueSnapshotForUser } from '@/lib/issues/repository';

import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyAgentRuns,
  bubblophyAgentTokens,
  bubblophyIssueEvents,
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjectEvents,
  bubblophyProjectMembers,
  bubblophyProjects,
  type JsonValue,
} from '@/drizzle/db/schema';

type CountByProjectId = Record<string, number>;
type LatestPlanByIssueId = Record<
  string,
  {
    version: number;
    summary: string;
    steps: BubblophyProjectIssueMembershipRow['issuePlanSteps'];
  }
>;
type IssueNotesByIssueId = Record<string, IssueNoteSummary[]>;
type RoleByProjectId = Record<
  string,
  BubblophyProjectIssueMembershipRow['projectCurrentUserRole']
>;

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
 * Selects all dashboard row groups visible to one authenticated human.
 *
 * Every query is constrained by the user's project memberships. Token hashes
 * and plaintext token material are never selected.
 *
 * @param authUserId Supabase Auth user ID from the authorized human session.
 * @returns Project/issue rows plus public token and activity rows.
 */
export async function selectBubblophyDashboardRowsForUser(
  authUserId: string
): Promise<BubblophyDashboardPersistenceRows> {
  const projectIds = await selectVisibleProjectIdsForUser(authUserId);

  if (projectIds.length === 0) {
    return {
      projectIssueRows: [],
      projectMemberRows: [],
      agentTokenRows: [],
      agentRunRows: [],
      activityRows: [],
    };
  }

  const [
    projectIssueRows,
    projectMemberRows,
    agentTokenRows,
    agentRunRows,
    activityRows,
  ] = await Promise.all([
    selectBubblophyProjectIssueRowsForProjectIds(authUserId, projectIds),
    selectBubblophyProjectMemberRowsForProjectIds(projectIds),
    selectBubblophyAgentTokenRowsForProjectIds(projectIds),
    selectBubblophyAgentRunRowsForProjectIds(projectIds),
    selectBubblophyProjectActivityRowsForProjectIds(projectIds),
  ]);

  return {
    projectIssueRows,
    projectMemberRows,
    agentTokenRows,
    agentRunRows,
    activityRows,
  };
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
  const projectIds = await selectVisibleProjectIdsForUser(authUserId);

  if (projectIds.length === 0) {
    return [];
  }

  return selectBubblophyProjectIssueRowsForProjectIds(authUserId, projectIds);
}

/**
 * Selects project IDs where the user has a project membership.
 *
 * @param authUserId Supabase Auth user ID from the authorized human session.
 * @returns Visible project IDs for subsequent read queries.
 */
async function selectVisibleProjectIdsForUser(authUserId: string) {
  const membershipRows = await db
    .select({
      projectId: bubblophyProjectMembers.projectId,
    })
    .from(bubblophyProjectMembers)
    .where(eq(bubblophyProjectMembers.authUserId, authUserId));

  return membershipRows.map((row) => row.projectId);
}

/**
 * Selects membership-scoped project and issue rows for known project IDs.
 *
 * @param authUserId Supabase Auth user ID from the authorized human session.
 * @param projectIds Project IDs already constrained by membership.
 * @returns Project/issue mapper rows visible to that user.
 */
async function selectBubblophyProjectIssueRowsForProjectIds(
  authUserId: string,
  projectIds: string[]
): Promise<BubblophyProjectIssuePersistenceRow[]> {
  const [projectRows, currentUserRoles, memberCounts, tokenCounts, issueRows] =
    await Promise.all([
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
          id: bubblophyIssues.id,
          projectId: bubblophyIssues.projectId,
          issueNumber: bubblophyIssues.issueNumber,
          title: bubblophyIssues.title,
          description: bubblophyIssues.description,
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
    ]);

  const visibleProjectIds = projectRows
    .filter((project) => !project.isArchived)
    .map((project) => project.id);
  const visibleIssueIds = issueRows
    .filter((issue) => visibleProjectIds.includes(issue.projectId))
    .map((issue) => issue.id);

  const latestPlans =
    visibleIssueIds.length === 0
      ? {}
      : toLatestPlanByIssueId(
          await db
            .select({
              issueId: bubblophyIssuePlans.issueId,
              version: bubblophyIssuePlans.version,
              summary: bubblophyIssuePlans.summary,
              steps: bubblophyIssuePlans.steps,
            })
            .from(bubblophyIssuePlans)
            .where(inArray(bubblophyIssuePlans.issueId, visibleIssueIds))
            .orderBy(
              asc(bubblophyIssuePlans.issueId),
              desc(bubblophyIssuePlans.version),
              desc(bubblophyIssuePlans.createdAt)
            )
        );
  const issueNotes =
    visibleIssueIds.length === 0
      ? {}
      : toIssueNotesByIssueId(
          await db
            .select({
              id: bubblophyIssueEvents.id,
              issueId: bubblophyIssueEvents.issueId,
              summary: bubblophyIssueEvents.summary,
              payload: bubblophyIssueEvents.payload,
              actorAuthUserId: bubblophyIssueEvents.actorAuthUserId,
              actorAgentTokenLabel: bubblophyAgentTokens.label,
              createdAt: bubblophyIssueEvents.createdAt,
            })
            .from(bubblophyIssueEvents)
            .leftJoin(
              bubblophyAgentTokens,
              and(
                eq(
                  bubblophyAgentTokens.id,
                  bubblophyIssueEvents.actorAgentTokenId
                ),
                inArray(bubblophyAgentTokens.projectId, visibleProjectIds)
              )
            )
            .where(
              and(
                inArray(bubblophyIssueEvents.issueId, visibleIssueIds),
                eq(bubblophyIssueEvents.eventType, 'commented')
              )
            )
            .orderBy(
              asc(bubblophyIssueEvents.issueId),
              desc(bubblophyIssueEvents.createdAt),
              desc(bubblophyIssueEvents.id)
            )
        );

  const rows = buildMembershipRows({
    authUserId,
    projects: projectRows,
    issues: issueRows,
    currentUserRoles: toProjectRoleMap(currentUserRoles),
    memberCounts: toProjectCountMap(memberCounts),
    tokenCounts: toProjectCountMap(tokenCounts),
    latestPlans,
    issueNotes,
  });

  return rows;
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
 * The row has no profile lookup in this schema, so only the technical Auth
 * user ID, role, and membership timestamp cross the read boundary.
 *
 * @param projectIds Project IDs already constrained by membership.
 * @returns Public membership rows for the dashboard.
 */
async function selectBubblophyProjectMemberRowsForProjectIds(
  projectIds: string[]
): Promise<BubblophyProjectMemberPersistenceRow[]> {
  return db
    .select({
      projectKey: bubblophyProjects.key,
      authUserId: bubblophyProjectMembers.authUserId,
      role: bubblophyProjectMembers.role,
      createdAt: bubblophyProjectMembers.createdAt,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
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
    description: string;
    isArchived: boolean;
  }[];
  issues: {
    id: string;
    projectId: string;
    issueNumber: number;
    title: string;
    description: string;
    status: BubblophyProjectIssueMembershipRow['issueStatus'];
    priority: BubblophyProjectIssueMembershipRow['issuePriority'];
    assignedAuthUserId: string | null;
    requiresHumanApproval: boolean;
  }[];
  currentUserRoles: RoleByProjectId;
  memberCounts: CountByProjectId;
  tokenCounts: CountByProjectId;
  latestPlans: LatestPlanByIssueId;
  issueNotes: IssueNotesByIssueId;
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
          currentUserRole: input.currentUserRoles[project.id],
          memberCount: input.memberCounts[project.id] ?? 0,
          tokenCount: input.tokenCounts[project.id] ?? 0,
          issue: null,
          latestPlan: null,
          issueNotes: [],
        }),
      ];
    }

    return projectIssues.map((issue) =>
      createProjectIssueMembershipRow({
        authUserId: input.authUserId,
        project,
        currentUserRole: input.currentUserRoles[project.id],
        memberCount: input.memberCounts[project.id] ?? 0,
        tokenCount: input.tokenCounts[project.id] ?? 0,
        issue,
        latestPlan: input.latestPlans[issue.id] ?? null,
        issueNotes: input.issueNotes[issue.id] ?? [],
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
    description: string;
    isArchived: boolean;
  };
  currentUserRole: BubblophyProjectIssueMembershipRow['projectCurrentUserRole'];
  memberCount: number;
  tokenCount: number;
  issue: {
    id: string;
    issueNumber: number;
    title: string;
    description: string;
    status: BubblophyProjectIssueMembershipRow['issueStatus'];
    priority: BubblophyProjectIssueMembershipRow['issuePriority'];
    assignedAuthUserId: string | null;
    requiresHumanApproval: boolean;
  } | null;
  latestPlan: LatestPlanByIssueId[string] | null;
  issueNotes: IssueNoteSummary[];
}): BubblophyProjectIssueMembershipRow {
  return {
    projectMemberAuthUserId: input.authUserId,
    projectId: input.project.id,
    projectName: input.project.name,
    projectKey: input.project.key,
    projectDescription: input.project.description,
    projectIsArchived: input.project.isArchived,
    projectMemberCount: input.memberCount,
    activeAgentTokenCount: input.tokenCount,
    projectCurrentUserRole: input.currentUserRole,
    issueDatabaseId: input.issue?.id ?? null,
    issueNumber: input.issue?.issueNumber ?? null,
    issueTitle: input.issue?.title ?? null,
    issueDescription: input.issue?.description ?? null,
    issueStatus: input.issue?.status ?? null,
    issuePriority: input.issue?.priority ?? null,
    issueAssignedAuthUserId: input.issue?.assignedAuthUserId ?? null,
    issueRequiresHumanApproval: input.issue?.requiresHumanApproval ?? null,
    issuePlanStepCount: Array.isArray(input.latestPlan?.steps)
      ? input.latestPlan.steps.length
      : 0,
    issuePlanVersion: input.latestPlan?.version ?? null,
    issuePlanSummary: input.latestPlan?.summary ?? null,
    issuePlanSteps: input.latestPlan?.steps ?? null,
    issueNotes: input.issueNotes,
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
 * Converts current-user membership rows into a project role lookup.
 *
 * @param rows Rows containing project IDs and the current user's role.
 * @returns Role lookup keyed by project ID.
 */
function toProjectRoleMap(
  rows: {
    projectId: string;
    role: BubblophyProjectIssueMembershipRow['projectCurrentUserRole'];
  }[]
) {
  return rows.reduce<RoleByProjectId>((roles, row) => {
    roles[row.projectId] = row.role;
    return roles;
  }, {});
}

/**
 * Converts issue count rows into a lookup table.
 *
 * @param rows Rows containing issue IDs and totals.
 * @returns Count lookup keyed by issue ID.
 */
function toLatestPlanByIssueId(
  rows: {
    issueId: string;
    version: number;
    summary: string;
    steps: BubblophyProjectIssueMembershipRow['issuePlanSteps'];
  }[]
) {
  return rows.reduce<LatestPlanByIssueId>((latestPlans, row) => {
    if (!latestPlans[row.issueId]) {
      latestPlans[row.issueId] = {
        version: row.version,
        summary: row.summary,
        steps: row.steps,
      };
    }

    return latestPlans;
  }, {});
}

/**
 * Converts issue event rows into issue-local human notes.
 *
 * Only events carrying the explicit `issue_note` payload marker are exposed as
 * notes, so unrelated audit events with the same event type stay in Activity.
 *
 * @param rows Issue event rows selected for visible issue IDs.
 * @returns Notes grouped by issue database ID.
 */
function toIssueNotesByIssueId(
  rows: {
    id: string;
    issueId: string;
    summary: string;
    payload: JsonValue;
    actorAuthUserId: string | null;
    actorAgentTokenLabel: string | null;
    createdAt: string;
  }[]
) {
  return rows.reduce<IssueNotesByIssueId>((notesByIssueId, row) => {
    if (!isIssueNotePayload(row.payload)) {
      return notesByIssueId;
    }

    const notes = notesByIssueId[row.issueId] ?? [];

    notesByIssueId[row.issueId] = [
      ...notes,
      {
        id: row.id,
        note: row.summary,
        actor: formatIssueNoteActor(row),
        createdAt: row.createdAt,
      },
    ];

    return notesByIssueId;
  }, {});
}

/**
 * Detects the intentionally narrow issue-note event payload marker.
 *
 * @param payload JSON payload from an issue event row.
 * @returns True when the event is a human-readable issue note.
 */
function isIssueNotePayload(payload: JsonValue) {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'entity' in payload &&
    'action' in payload &&
    payload.entity === 'issue_note' &&
    payload.action === 'created'
  );
}

/**
 * Formats a low-PII actor label for note rows.
 *
 * @param row Issue event row with optional human or agent actor.
 * @returns Human-readable actor label.
 */
function formatIssueNoteActor(row: {
  actorAuthUserId: string | null;
  actorAgentTokenLabel: string | null;
}) {
  if (row.actorAuthUserId) {
    return 'Mensch';
  }

  if (row.actorAgentTokenLabel) {
    return `Agent-Token ${row.actorAgentTokenLabel}`;
  }

  return 'System';
}
