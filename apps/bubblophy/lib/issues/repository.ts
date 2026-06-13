import 'server-only';

import type {
  BubblophyAgentRunState,
  BubblophyIssuePriority,
  BubblophyIssueStatus,
  JsonObject,
  JsonValue,
} from '@/drizzle/db/schema';
import type {
  ActivityEvent,
  AgentRunState,
  AgentRunSummary,
  AgentTokenState,
  AgentTokenSummary,
  IssuePlanStepSummary,
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
  projectDescription: string;
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
  issuePlanVersion: number | null;
  issuePlanSummary: string | null;
  issuePlanSteps: JsonValue | null;
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
  expiresAt: string | null;
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
  projectKey: string | null;
  issueNumber: number | null;
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
  done: 'erledigt',
} satisfies Record<BubblophyIssueStatus, IssueStatus>;

const issuePriorityLabels = {
  low: 'niedrig',
  medium: 'mittel',
  high: 'hoch',
} satisfies Record<BubblophyIssuePriority, IssuePriority>;

const agentTokenStateLabels = {
  active: 'aktiv',
  paused: 'pausiert',
  revoked: 'widerrufen',
} satisfies Record<BubblophyAgentTokenPersistenceRow['state'], AgentTokenState>;

const agentRunStateLabels = {
  requested: 'wartet',
  approved: 'freigegeben',
  running: 'läuft',
  needs_review: 'review',
  completed: 'abgeschlossen',
  cancelled: 'abgebrochen',
  failed: 'fehlgeschlagen',
} satisfies Record<BubblophyAgentRunPersistenceRow['state'], AgentRunState>;

interface MutableProjectSummary {
  id: string;
  name: string;
  key: string;
  description: string;
  isArchived: boolean;
  openIssues: number;
  readyIssues: number;
  blockedIssues: number;
  memberCount: number;
  agentTokenCount: number;
}

/**
 * Maps the database issue status into the dashboard status vocabulary.
 *
 * @param status Status value from the Bubblophy Drizzle enum.
 * @returns Dashboard status label.
 */
export function mapBubblophyIssueStatus(
  status: BubblophyIssueStatus
): IssueStatus {
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
 * Maps persisted token state and expiry into the public dashboard vocabulary.
 *
 * Expiry is derived from `expiresAt` without mutating the database row. Revoked
 * tokens stay revoked even when their expiry timestamp is also in the past.
 *
 * @param row Public token row without token hash or plaintext.
 * @returns Dashboard token state.
 */
export function deriveBubblophyAgentTokenState(
  row: Pick<BubblophyAgentTokenPersistenceRow, 'state' | 'expiresAt'>
): AgentTokenState {
  if (row.state === 'revoked') {
    return 'widerrufen';
  }

  if (isExpiredTimestamp(row.expiresAt)) {
    return 'abgelaufen';
  }

  return mapBubblophyAgentTokenState(row.state);
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
    const project =
      projectMap.get(row.projectId) ?? createMutableProjectSummary(row);

    projectMap.set(row.projectId, project);

    if (
      row.projectIsArchived ||
      row.issueDatabaseId === null ||
      row.issueNumber === null ||
      row.issueTitle === null ||
      row.issueStatus === null ||
      row.issuePriority === null
    ) {
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
      status: mapBubblophyIssueStatus(row.issueStatus),
      priority: mapBubblophyIssuePriority(row.issuePriority),
      owner: formatIssueOwner(row.issueAssignedAuthUserId),
      planSteps: getIssuePlanStepCount(row),
      latestPlan: mapBubblophyIssueLatestPlan(row),
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
 * Maps a latest persisted plan row into the dashboard plan DTO.
 *
 * Invalid or legacy step entries are ignored instead of rendered as hardcoded
 * demo content. The issue still keeps its explicit empty plan state when no
 * plan version exists.
 *
 * @param row Issue persistence row with optional latest plan fields.
 * @returns Latest plan DTO, or `undefined` when no plan exists.
 */
export function mapBubblophyIssueLatestPlan(
  row: Pick<
    BubblophyProjectIssuePersistenceRow,
    'issuePlanVersion' | 'issuePlanSummary' | 'issuePlanSteps'
  >
): IssueSummary['latestPlan'] {
  if (row.issuePlanVersion === null) {
    return undefined;
  }

  return {
    version: row.issuePlanVersion,
    summary: row.issuePlanSummary ?? '',
    steps: mapBubblophyIssuePlanSteps(row.issuePlanSteps),
  };
}

/**
 * Converts stored JSONB plan steps into stable dashboard step DTOs.
 *
 * @param steps JSONB value from the latest issue plan row.
 * @returns Renderable plan steps with trimmed text.
 */
export function mapBubblophyIssuePlanSteps(
  steps: JsonValue | null
): IssuePlanStepSummary[] {
  if (!Array.isArray(steps)) {
    return [];
  }

  return steps.flatMap((step, index) => {
    if (!isJsonObject(step)) {
      return [];
    }

    const text = typeof step.text === 'string' ? step.text.trim() : '';

    if (!text) {
      return [];
    }

    return [
      {
        id:
          typeof step.id === 'string' && step.id.trim()
            ? step.id.trim()
            : `step_${index + 1}`,
        text,
      },
    ];
  });
}

/**
 * Derives the visible plan step count from latest plan content when present.
 *
 * @param row Issue persistence row with legacy count and latest plan fields.
 * @returns Non-negative visible step count.
 */
function getIssuePlanStepCount(row: BubblophyProjectIssuePersistenceRow) {
  if (row.issuePlanVersion !== null) {
    return mapBubblophyIssuePlanSteps(row.issuePlanSteps).length;
  }

  return Math.max(0, row.issuePlanStepCount ?? 0);
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
      state: deriveBubblophyAgentTokenState(row),
      lastUsedAt: row.lastUsedAt ?? 'noch nie verwendet',
      expiresAt: row.expiresAt ?? 'läuft nicht automatisch ab',
    }))
    .sort(
      (left, right) =>
        left.projectKey.localeCompare(right.projectKey) ||
        left.label.localeCompare(right.label) ||
        left.id.localeCompare(right.id)
    );
}

/**
 * Detects ISO timestamp expiry using the current server clock.
 *
 * @param expiresAt Nullable persisted expiry timestamp.
 * @returns True when the timestamp is valid and no longer in the future.
 */
function isExpiredTimestamp(expiresAt: string | null) {
  if (!expiresAt) {
    return false;
  }

  const time = Date.parse(expiresAt);

  return Number.isFinite(time) && time <= Date.now();
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
    projectKey: row.projectKey ?? undefined,
    issueId:
      row.projectKey && row.issueNumber
        ? formatBubblophyIssueKey(row.projectKey, row.issueNumber)
        : undefined,
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
    description: row.projectDescription,
    isArchived: row.projectIsArchived,
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

/**
 * Formats the assignee for UI DTOs without exposing raw Auth identifiers.
 *
 * @param assignedAuthUserId Optional stored assignee identifier or display key.
 * @returns A quiet public owner label for the dashboard.
 */
function formatIssueOwner(assignedAuthUserId: string | null) {
  if (!assignedAuthUserId) {
    return 'Nicht zugewiesen';
  }

  if (isRawAuthIdentifier(assignedAuthUserId)) {
    return 'Mensch';
  }

  return assignedAuthUserId;
}

/**
 * Detects common raw Supabase/Auth ID shapes before data reaches UI DTOs.
 *
 * @param value Stored assignee value.
 * @returns Whether the value looks like an internal auth identifier.
 */
function isRawAuthIdentifier(value: string) {
  return (
    value.startsWith('user_') ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

/**
 * Narrows a JSON value to an object with string keys.
 *
 * @param value JSON value from persistence.
 * @returns True when the value can be inspected as an object.
 */
function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
