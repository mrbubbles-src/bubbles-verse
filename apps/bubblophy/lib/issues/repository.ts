import 'server-only';

import type {
  BubblophyIssuePriority,
  BubblophyIssueStatus,
} from '@/drizzle/db/schema';
import type {
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
