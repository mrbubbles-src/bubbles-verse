import 'server-only';

import type {
  BubblophyAgentRunState,
  BubblophyAgentTokenScope,
  BubblophyAgentTokenState,
  BubblophyIssuePriority,
  BubblophyIssueStatus,
  JsonObject,
  JsonValue,
} from '@/drizzle/db/schema';
import type {
  AgentRunState,
  AgentRunSummary,
  AgentTokenState,
  AgentTokenSummary,
  IssuePlanStepSummary,
  IssuePriority,
  IssueStatus,
  ProjectHealth,
  ProjectMemberRole,
  ProjectMemberSummary,
  ProjectSummary,
} from '@/lib/dashboard/types';

import { canBubblophyAgentTokenReportRunStatus } from '@/lib/agent-tokens/execution';

export interface BubblophyProjectPersistenceRow {
  id: string;
  name: string;
  key: string;
  description: string;
  isArchived: boolean;
  memberCount: number;
  activeAgentTokenCount: number;
  openIssueCount: number;
  readyIssueCount: number;
  blockedIssueCount: number;
  currentUserRole: ProjectMemberRole;
}

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
  projectIsArchived: boolean;
  issueNumber: number;
  agentTokenLabel: string;
  agentTokenScopes: BubblophyAgentTokenScope[];
  agentTokenState: BubblophyAgentTokenState;
  agentTokenExpiresAt: string | null;
  state: BubblophyAgentRunState;
  updatedAt: string;
  result: JsonValue | null;
}

export interface BubblophyProjectMemberPersistenceRow {
  projectKey: string;
  authUserId: string;
  displayName?: string | null;
  normalizedEmail?: string | null;
  role: ProjectMemberRole;
  createdAt: string;
}

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
  row: Pick<BubblophyAgentTokenPersistenceRow, 'state' | 'expiresAt'>,
  now = Date.now()
): AgentTokenState {
  if (row.state === 'revoked') {
    return 'widerrufen';
  }

  if (isExpiredTimestamp(row.expiresAt, now)) {
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
 * Maps one membership-scoped row per project into dashboard summaries.
 *
 * @param rows Project metadata and independently aggregated counters.
 * @returns Stable project summaries without hydrating any issue records.
 */
export function buildBubblophyProjectSummaries(
  rows: BubblophyProjectPersistenceRow[]
): ProjectSummary[] {
  return rows
    .map((row) => {
      const project = {
        id: row.id,
        name: row.name,
        key: row.key,
        description: row.description,
        isArchived: row.isArchived,
        openIssues: row.isArchived ? 0 : Math.max(0, row.openIssueCount),
        readyIssues: row.isArchived ? 0 : Math.max(0, row.readyIssueCount),
        blockedIssues: row.isArchived ? 0 : Math.max(0, row.blockedIssueCount),
        memberCount: Math.max(0, row.memberCount),
        agentTokenCount: Math.max(0, row.activeAgentTokenCount),
        currentUserRole: row.currentUserRole,
      };

      return {
        ...project,
        health: deriveBubblophyProjectHealth(project),
      };
    })
    .sort((left, right) => left.key.localeCompare(right.key));
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
 * Converts membership rows into public project member summaries.
 *
 * A profile name wins over the verified e-mail. The Auth user ID remains an
 * explicit fallback for legacy memberships whose user has not returned since
 * profile synchronization was introduced.
 *
 * @param rows Membership rows already constrained to visible projects.
 * @returns Public project member summaries for the dashboard.
 */
export function buildBubblophyProjectMemberSummaries(
  rows: BubblophyProjectMemberPersistenceRow[]
): ProjectMemberSummary[] {
  return rows
    .map((row) => ({
      id: formatBubblophyProjectMemberId(row.projectKey, row.authUserId),
      projectKey: row.projectKey,
      authUserId: row.authUserId,
      label: row.displayName ?? row.normalizedEmail ?? row.authUserId,
      email: row.normalizedEmail ?? null,
      role: row.role,
      createdAt: row.createdAt,
    }))
    .sort(
      (left, right) =>
        left.projectKey.localeCompare(right.projectKey) ||
        projectMemberRoleSortOrder[left.role] -
          projectMemberRoleSortOrder[right.role] ||
        left.authUserId.localeCompare(right.authUserId)
    );
}

/**
 * Builds the stable dashboard key for one project membership row.
 *
 * @param projectKey Short project key.
 * @param authUserId Supabase Auth user ID from the membership row.
 * @returns Stable client-side membership ID.
 */
export function formatBubblophyProjectMemberId(
  projectKey: string,
  authUserId: string
) {
  return `${projectKey}:${authUserId}`;
}

const projectMemberRoleSortOrder = {
  owner: 0,
  maintainer: 1,
  member: 2,
  viewer: 3,
} satisfies Record<ProjectMemberRole, number>;

/**
 * Detects ISO timestamp expiry using the current server clock.
 *
 * @param expiresAt Nullable persisted expiry timestamp.
 * @returns True when the timestamp is valid and no longer in the future.
 */
function isExpiredTimestamp(expiresAt: string | null, now = Date.now()) {
  if (!expiresAt) {
    return false;
  }

  const time = Date.parse(expiresAt);

  return Number.isFinite(time) && time <= now;
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
    canAgentReportStatus:
      !row.projectIsArchived &&
      canBubblophyAgentTokenReportRunStatus({
        state: row.agentTokenState,
        expiresAt: row.agentTokenExpiresAt,
        scopes: row.agentTokenScopes,
      }),
    resultSummary: buildSafeAgentRunResultSummary(row.result),
  }));
}

const agentRunResultTextFields = [
  'summary',
  'message',
  'status',
  'phase',
  'error',
  'details',
] as const;
const fallbackAgentRunResultTextFields = new Set(['details']);
const sensitiveAgentRunResultPattern =
  /token|secret|password|authorization|bearer|hash|supabase|api[_-]?key|\bkey\b|auth/i;
const maxAgentRunResultSummaryLength = 240;

export function buildSafeAgentRunResultSummary(
  result: JsonValue | null
): string | undefined {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    return undefined;
  }

  const resultObject = result as Record<string, JsonValue>;

  for (const field of agentRunResultTextFields) {
    if (field in resultObject && isSensitiveAgentRunResultKey(field)) {
      continue;
    }

    const value = resultObject[field];

    if (typeof value !== 'string') {
      continue;
    }

    const summary = sanitizeAgentRunResultText(value, {
      allowFallback: fallbackAgentRunResultTextFields.has(field),
    });

    if (summary) {
      return summary;
    }
  }

  return Object.entries(resultObject).some(
    ([key, value]) =>
      !isSensitiveAgentRunResultKey(key) && hasSafeStructuredResultHint(value)
  )
    ? 'Weitere strukturierte Details vorhanden.'
    : undefined;
}

function sanitizeAgentRunResultText(
  value: string,
  options: { allowFallback: boolean }
) {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  if (isSensitiveAgentRunResultValue(trimmed)) {
    return undefined;
  }

  if (options.allowFallback && trimmed.length > 120) {
    return undefined;
  }

  return trimmed.length > maxAgentRunResultSummaryLength
    ? `${trimmed.slice(0, maxAgentRunResultSummaryLength - 1)}…`
    : trimmed;
}

function isSensitiveAgentRunResultKey(key: string) {
  return sensitiveAgentRunResultPattern.test(key);
}

function isSensitiveAgentRunResultValue(value: string) {
  return (
    sensitiveAgentRunResultPattern.test(value) ||
    /https?:\/\/[^\s]+supabase[^\s]*/i.test(value)
  );
}

function hasSafeStructuredResultHint(value: JsonValue): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => {
      if (!item || typeof item !== 'object') {
        return typeof item === 'string'
          ? !isSensitiveAgentRunResultValue(item)
          : item !== null;
      }

      return hasSafeStructuredResultHint(item);
    });
  }

  return Object.entries(value as Record<string, JsonValue>).some(
    ([key, nestedValue]) => {
      if (isSensitiveAgentRunResultKey(key)) {
        return false;
      }

      if (typeof nestedValue === 'string') {
        return !isSensitiveAgentRunResultValue(nestedValue);
      }

      if (nestedValue && typeof nestedValue === 'object') {
        return hasSafeStructuredResultHint(nestedValue);
      }

      return nestedValue !== null;
    }
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
