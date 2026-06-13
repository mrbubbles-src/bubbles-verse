import 'server-only';

import type {
  BubblophyAgentRunState,
  BubblophyIssuePriority,
  BubblophyIssueStatus,
} from '@/drizzle/db/schema';
import type {
  ActivityEvent,
  AgentRunState,
  AgentRunSummary,
  AgentTokenState,
  AgentTokenSummary,
  IssuePriority,
  IssueStatus,
  IssueSummary,
  ProjectHealth,
  ProjectSummary,
} from '@/lib/dashboard/types';

export interface BubblophyProjectIssuePersistenceRow {
  projectId: string;
  projectName: string;
  projectKey: string;
  projectIsArchived: boolean;
  projectMemberCount: number;
  activeAgentTokenCount: number;
  issueDatabaseId: string | null;
  issueNumber: number | null;
  issueTitle: string | null;
  issueDescription: string | null;
  issueStatus: BubblophyIssueStatus | null;
  issuePriority: BubblophyIssuePriority | null;
  issueAssignedAuthUserId: string | null;
  issueRequiresHumanApproval: boolean | null;
  issuePlanStepCount: number | null;
}

export type BubblophyProjectIssueMembershipRow =
  BubblophyProjectIssuePersistenceRow & {
    projectMemberAuthUserId: string;
  };

export interface BubblophyAgentTokenPersistenceRow {
  id: string;
  label: string;
  projectKey: string;
  scopes: string[];
  state: 'active' | 'paused' | 'revoked';
  lastUsedAt: string | null;
}

export interface BubblophyAgentRunPersistenceRow {
  id: string;
  projectKey: string;
  issueNumber: number;
  agentTokenLabel: string;
  state: BubblophyAgentRunState;
  updatedAt: string;
}

export interface BubblophyActivityPersistenceRow {
  id: string;
  summary: string;
  actorAuthUserId: string | null;
  actorAgentTokenLabel: string | null;
  createdAt: string;
}

export interface BubblophyProjectIssueRepositorySnapshot {
  projects: ProjectSummary[];
  issues: IssueSummary[];
}

const openIssueStatuses = new Set<BubblophyIssueStatus>([
  'triage',
  'planned',
  'ready',
  'in_progress',
  'review',
  'blocked',
]);

const issueStatusLabels = {
  triage: 'triage',
  planned: 'geplant',
  ready: 'bereit',
  in_progress: 'in_arbeit',
  review: 'review',
  blocked: 'blockiert',
} satisfies Record<Exclude<BubblophyIssueStatus, 'done'>, IssueStatus>;

const issuePriorityLabels = {
  low: 'niedrig',
  medium: 'mittel',
  high: 'hoch',
} satisfies Record<BubblophyIssuePriority, IssuePriority>;

const agentTokenStateLabels = {
  active: 'aktiv',
  paused: 'pausiert',
  revoked: 'pausiert',
} satisfies Record<BubblophyAgentTokenPersistenceRow['state'], AgentTokenState>;

const agentRunStateLabels = {
  requested: 'wartet',
  approved: 'freigegeben',
  running: 'läuft',
  needs_review: 'review',
  completed: 'review',
  cancelled: 'review',
  failed: 'review',
} satisfies Record<BubblophyAgentRunPersistenceRow['state'], AgentRunState>;

interface MutableProjectSummary {
  id: string;
  name: string;
  key: string;
  openIssues: number;
  readyIssues: number;
  blockedIssues: number;
  memberCount: number;
  agentTokenCount: number;
}

/**
 * Maps the database issue status into the dashboard status vocabulary.
 *
 * Closed issues are intentionally not represented in the current dashboard
 * issue list because the MVP only surfaces work that may still need action.
 *
 * @param status Status value from the Bubblophy Drizzle enum.
 * @returns Dashboard status label, or `null` for closed work.
 */
export function mapBubblophyIssueStatus(
  status: BubblophyIssueStatus
): IssueStatus | null {
  if (status === 'done') {
    return null;
  }

  return issueStatusLabels[status];
}

/**
 * Maps the database priority enum into the dashboard priority vocabulary.
 *
 * @param priority Priority value from the Bubblophy Drizzle enum.
 * @returns Dashboard priority label.
 */
export function mapBubblophyIssuePriority(
  priority: BubblophyIssuePriority
): IssuePriority {
  return issuePriorityLabels[priority];
}

/**
 * Builds the stable human-facing issue key used by the dashboard.
 *
 * @param projectKey Short project key from the project row.
 * @param issueNumber Per-project issue number.
 * @returns A compact issue identifier such as `BV-14`.
 */
export function formatBubblophyIssueKey(
  projectKey: string,
  issueNumber: number
) {
  return `${projectKey}-${issueNumber.toString().padStart(2, '0')}`;
}

/**
 * Maps persisted agent token state into the current dashboard vocabulary.
 *
 * Revoked tokens are intentionally shown as paused until the UI grows a
 * dedicated revoked state.
 *
 * @param state Database token state.
 * @returns Dashboard token state.
 */
export function mapBubblophyAgentTokenState(
  state: BubblophyAgentTokenPersistenceRow['state']
): AgentTokenState {
  return agentTokenStateLabels[state];
}

/**
 * Maps persisted agent run state into the current dashboard vocabulary.
 *
 * Terminal states are grouped into review until the UI grows dedicated
 * completion/cancellation lanes.
 *
 * @param state Database run state.
 * @returns Dashboard run state.
 */
export function mapBubblophyAgentRunState(
  state: BubblophyAgentRunPersistenceRow['state']
): AgentRunState {
  return agentRunStateLabels[state];
}

/**
 * Derives the project health marker from the mapped issue counters.
 *
 * @param project Project counters collected from persistence rows.
 * @returns Dashboard health marker.
 */
export function deriveBubblophyProjectHealth(
  project: Pick<ProjectSummary, 'openIssues' | 'readyIssues' | 'blockedIssues'>
): ProjectHealth {
  if (project.blockedIssues > 0) {
    return 'blockiert';
  }

  if (project.readyIssues > 0 || project.openIssues >= 10) {
    return 'aufmerksam';
  }

  return 'stabil';
}

/**
 * Converts flat project/issue persistence rows into dashboard DTOs.
 *
 * The function is deliberately pure so repository tests can validate mapping
 * behavior without opening a database connection or touching Supabase data.
 *
 * @param rows Joined or pre-aggregated rows from a server-only data source.
 * @returns Project and issue summaries ready for the dashboard DTO boundary.
 */
export function buildBubblophyProjectIssueSnapshot(
  rows: BubblophyProjectIssuePersistenceRow[]
): BubblophyProjectIssueRepositorySnapshot {
  const projectMap = new Map<string, MutableProjectSummary>();
  const issues: IssueSummary[] = [];

  for (const row of rows) {
    if (row.projectIsArchived) {
      continue;
    }

    const project =
      projectMap.get(row.projectId) ?? createMutableProjectSummary(row);

    projectMap.set(row.projectId, project);

    if (
      row.issueDatabaseId === null ||
      row.issueNumber === null ||
      row.issueTitle === null ||
      row.issueStatus === null ||
      row.issuePriority === null
    ) {
      continue;
    }

    const status = mapBubblophyIssueStatus(row.issueStatus);

    if (status === null) {
      continue;
    }

    project.openIssues += openIssueStatuses.has(row.issueStatus) ? 1 : 0;
    project.readyIssues += row.issueStatus === 'ready' ? 1 : 0;
    project.blockedIssues += row.issueStatus === 'blocked' ? 1 : 0;

    issues.push({
      id: formatBubblophyIssueKey(row.projectKey, row.issueNumber),
      title: row.issueTitle,
      description: row.issueDescription ?? undefined,
      projectKey: row.projectKey,
      status,
      priority: mapBubblophyIssuePriority(row.issuePriority),
      owner: row.issueAssignedAuthUserId ?? 'Nicht zugewiesen',
      planSteps: Math.max(0, row.issuePlanStepCount ?? 0),
      approvalRequired: row.issueRequiresHumanApproval ?? true,
    });
  }

  return {
    projects: [...projectMap.values()]
      .map((project) => ({
        ...project,
        health: deriveBubblophyProjectHealth(project),
      }))
      .sort((left, right) => left.key.localeCompare(right.key)),
    issues: issues.sort((left, right) => left.id.localeCompare(right.id)),
  };
}

/**
 * Converts membership-aware persistence rows into dashboard DTOs for one user.
 *
 * This keeps the object-level authorization contract close to the read model:
 * callers must provide the authenticated Supabase user ID, and rows for other
 * project members are ignored before the UI DTO is built.
 *
 * @param authUserId Supabase Auth user ID from the human session.
 * @param rows Membership-aware project and issue rows.
 * @returns Project and issue summaries visible to that user.
 */
export function buildBubblophyProjectIssueSnapshotForUser(
  authUserId: string,
  rows: BubblophyProjectIssueMembershipRow[]
): BubblophyProjectIssueRepositorySnapshot {
  return buildBubblophyProjectIssueSnapshot(
    rows.filter((row) => row.projectMemberAuthUserId === authUserId)
  );
}

/**
 * Converts membership-scoped token rows into public dashboard summaries.
 *
 * The row type deliberately excludes `tokenHash` and plaintext token material.
 *
 * @param rows Token rows already constrained to visible projects.
 * @returns Public token summaries for the dashboard.
 */
export function buildBubblophyAgentTokenSummaries(
  rows: BubblophyAgentTokenPersistenceRow[]
): AgentTokenSummary[] {
  return rows
    .map((row) => ({
      id: row.id,
      label: row.label,
      projectKey: row.projectKey,
      scopes: [...row.scopes],
      state: mapBubblophyAgentTokenState(row.state),
      lastUsedAt: row.lastUsedAt ?? 'noch nie verwendet',
    }))
    .sort(
      (left, right) =>
        left.projectKey.localeCompare(right.projectKey) ||
        left.label.localeCompare(right.label) ||
        left.id.localeCompare(right.id)
    );
}

/**
 * Converts membership-scoped run rows into public dashboard summaries.
 *
 * The row type deliberately excludes token hashes, plaintext tokens, and raw
 * auth user IDs.
 *
 * @param rows Run rows already constrained to visible projects.
 * @returns Public run summaries for the dashboard queue.
 */
export function buildBubblophyAgentRunSummaries(
  rows: BubblophyAgentRunPersistenceRow[]
): AgentRunSummary[] {
  return rows.map((row) => ({
    id: row.id,
    issueId: formatBubblophyIssueKey(row.projectKey, row.issueNumber),
    agentLabel: row.agentTokenLabel,
    state: mapBubblophyAgentRunState(row.state),
    requestedBy: 'Mensch',
    lastEvent: `Status ${mapBubblophyAgentRunState(row.state)} · zuletzt ${row.updatedAt}`,
  }));
}

/**
 * Converts project-event rows into the dashboard activity feed.
 *
 * @param rows Project activity rows already constrained to visible projects.
 * @returns Activity events ordered by the caller's row order.
 */
export function buildBubblophyActivityEvents(
  rows: BubblophyActivityPersistenceRow[]
): ActivityEvent[] {
  return rows.map((row) => ({
    id: row.id,
    label: row.summary,
    actor: formatActivityActor(row),
    occurredAt: row.createdAt,
  }));
}

/**
 * Creates a mutable project accumulator from the project portion of a row.
 *
 * @param row Persistence row containing project fields.
 * @returns Project counter object used while mapping rows.
 */
function createMutableProjectSummary(
  row: BubblophyProjectIssuePersistenceRow
): MutableProjectSummary {
  return {
    id: row.projectId,
    name: row.projectName,
    key: row.projectKey,
    openIssues: 0,
    readyIssues: 0,
    blockedIssues: 0,
    memberCount: Math.max(0, row.projectMemberCount),
    agentTokenCount: Math.max(0, row.activeAgentTokenCount),
  };
}

/**
 * Formats a quiet activity actor label for the dashboard.
 *
 * @param row Activity row with optional human or agent actor.
 * @returns Human-readable actor label.
 */
function formatActivityActor(row: BubblophyActivityPersistenceRow) {
  if (row.actorAuthUserId) {
    return 'Mensch';
  }

  if (row.actorAgentTokenLabel) {
    return `Agent-Token ${row.actorAgentTokenLabel}`;
  }

  return 'System';
}
