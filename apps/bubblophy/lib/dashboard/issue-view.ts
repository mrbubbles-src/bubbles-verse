import type { DashboardAllIssuePage } from '@/lib/dashboard/all-issues';
import type { DashboardIssueQueryState } from '@/lib/dashboard/issue-query';
import type {
  DashboardIssueDetail,
  DashboardIssuePage,
} from '@/lib/dashboard/issues';
import type {
  IssuePriority,
  IssueStatus,
  IssueSummary,
} from '@/lib/dashboard/types';

const issueStatusMap = {
  triage: 'triage',
  planned: 'geplant',
  ready: 'bereit',
  in_progress: 'in_arbeit',
  review: 'review',
  blocked: 'blockiert',
  done: 'erledigt',
} satisfies Record<DashboardIssuePage['items'][number]['status'], IssueStatus>;

const issuePriorityMap = {
  low: 'niedrig',
  medium: 'mittel',
  high: 'hoch',
} satisfies Record<
  DashboardIssuePage['items'][number]['priority'],
  IssuePriority
>;

/**
 * Maps a raw server issue page into the existing dashboard presentation model.
 *
 * @param page Membership-scoped raw issue page.
 * @returns Lightweight issue summaries without descriptions or plan contents.
 */
export function mapDashboardIssuePageToSummaries(
  page: DashboardIssuePage
): IssueSummary[] {
  return page.items.map((item) => ({
    id: item.key,
    title: item.title,
    projectKey: page.project.key,
    status: issueStatusMap[item.status],
    priority: issuePriorityMap[item.priority],
    assigneeAuthUserId: item.assignedAuthUserId,
    assigneeLabel: item.assignedAuthUserId ? 'Mensch' : 'Nicht zugewiesen',
    planSteps: item.latestPlan?.stepCount ?? 0,
    approvalRequired: item.requiresHumanApproval,
  }));
}

/**
 * Maps a cross-project issue page into the existing presentation model.
 *
 * @param page Membership-scoped all-project issue page.
 * @returns Lightweight summaries carrying each item's own public project key.
 */
export function mapDashboardAllIssuePageToSummaries(
  page: DashboardAllIssuePage
): IssueSummary[] {
  return page.items.map((item) => ({
    id: item.key,
    title: item.title,
    projectKey: item.project.key,
    status: issueStatusMap[item.status],
    priority: issuePriorityMap[item.priority],
    assigneeAuthUserId: item.assignedAuthUserId,
    assigneeLabel: item.assignedAuthUserId ? 'Mensch' : 'Nicht zugewiesen',
    planSteps: item.latestPlan?.stepCount ?? 0,
    approvalRequired: item.requiresHumanApproval,
  }));
}

/**
 * Maps one direct raw issue detail into the dashboard presentation model.
 *
 * @param detail Membership-scoped raw issue detail.
 * @returns Full selected-issue summary with the normalized latest plan.
 */
export function mapDashboardIssueDetailToSummary(
  detail: DashboardIssueDetail,
  baseIssue?: IssueSummary
): IssueSummary {
  return {
    ...baseIssue,
    id: detail.issue.key,
    title: detail.issue.title,
    description: detail.issue.description,
    projectKey: detail.project.key,
    status: issueStatusMap[detail.issue.status],
    priority: issuePriorityMap[detail.issue.priority],
    assigneeAuthUserId: detail.issue.assignedAuthUserId,
    assigneeLabel: detail.issue.assignedAuthUserId
      ? 'Mensch'
      : 'Nicht zugewiesen',
    planSteps: detail.issue.latestPlan?.steps.length ?? 0,
    latestPlan: detail.issue.latestPlan ?? undefined,
    notes: detail.issue.notes,
    hasMoreNotes: detail.issue.hasMoreNotes,
    approvalRequired: detail.issue.requiresHumanApproval,
  };
}

export type DashboardProjectAccess = DashboardIssuePage['project'];

const projectRoleRank: Record<
  DashboardProjectAccess['currentUserRole'],
  number
> = {
  viewer: 0,
  member: 1,
  maintainer: 2,
  owner: 3,
};

/**
 * Combines independent project-access proofs using the safest shared result.
 *
 * @param accessValues Current page/detail project metadata for one project.
 * @returns Archived if either read says archived and the least privileged role.
 */
export function combineDashboardProjectAccess(
  ...accessValues: Array<DashboardProjectAccess | null>
): DashboardProjectAccess | null {
  const currentValues = accessValues.filter(
    (value): value is DashboardProjectAccess => value !== null
  );
  const firstValue = currentValues[0];

  if (
    !firstValue ||
    currentValues.some((value) => value.key !== firstValue.key)
  ) {
    return null;
  }

  return {
    ...firstValue,
    isArchived: currentValues.some((value) => value.isArchived),
    currentUserRole: currentValues.reduce(
      (leastPrivilegedRole, value) =>
        projectRoleRank[value.currentUserRole] <
        projectRoleRank[leastPrivilegedRole]
          ? value.currentUserRole
          : leastPrivilegedRole,
      firstValue.currentUserRole
    ),
  };
}

/**
 * Checks a locally overlaid issue against the active persisted queue filters.
 *
 * @param issue Existing German dashboard presentation model.
 * @param query Canonical raw database filter state.
 * @returns Whether the issue belongs in the current concrete-project queue.
 */
export function matchesDashboardIssueQuery(
  issue: IssueSummary,
  query: DashboardIssueQueryState
) {
  const normalizedQuery = query.filters.query?.toLocaleLowerCase('de') ?? '';
  const rawStatus = query.filters.status;
  const rawPriority = query.filters.priority;

  return (
    (!normalizedQuery ||
      issue.id.toLocaleLowerCase('de').includes(normalizedQuery) ||
      issue.title.toLocaleLowerCase('de').includes(normalizedQuery)) &&
    (!rawStatus || issue.status === issueStatusMap[rawStatus]) &&
    (!rawPriority || issue.priority === issuePriorityMap[rawPriority])
  );
}
