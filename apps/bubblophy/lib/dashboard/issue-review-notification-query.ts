import { MAX_POSTGRES_INTEGER } from '@/lib/dashboard/issue-query';

export interface DashboardIssueReviewCursor {
  updatedAt: string;
  projectKey: string;
  issueNumber: number;
}

export interface DashboardIssueReviewPageRequestState {
  projectKey: string | null;
  after: DashboardIssueReviewCursor | null;
}

const projectKeyPattern = /^[A-Z0-9]{2,8}$/;

/**
 * Parses the complete public cursor for the issue-review notification page.
 *
 * @param updatedAt Raw issue update timestamp from the URL.
 * @param projectKey Raw project key from the URL.
 * @param issueNumber Raw issue number from the URL.
 * @returns Canonical cursor or null for an omitted or malformed tuple.
 */
export function parseDashboardIssueReviewCursor(
  updatedAt: string | null | undefined,
  projectKey: string | null | undefined,
  issueNumber: string | null | undefined
): DashboardIssueReviewCursor | null {
  const normalizedUpdatedAt = updatedAt?.trim() ?? '';
  const normalizedProjectKey = projectKey?.trim().toUpperCase() ?? '';
  const normalizedIssueNumber = Number(issueNumber);

  if (
    !normalizedUpdatedAt ||
    normalizedUpdatedAt.length > 64 ||
    !Number.isFinite(Date.parse(normalizedUpdatedAt)) ||
    !projectKeyPattern.test(normalizedProjectKey) ||
    !issueNumber ||
    !Number.isSafeInteger(normalizedIssueNumber) ||
    normalizedIssueNumber < 1 ||
    normalizedIssueNumber > MAX_POSTGRES_INTEGER
  ) {
    return null;
  }

  return {
    updatedAt: normalizedUpdatedAt,
    projectKey: normalizedProjectKey,
    issueNumber: normalizedIssueNumber,
  };
}

/** Checks whether a server page belongs to the exact current review URL. */
export function isDashboardIssueReviewPageRequestCurrent(
  request: DashboardIssueReviewPageRequestState | null | undefined,
  projectKey: string | null,
  after: DashboardIssueReviewCursor | null
) {
  return Boolean(
    request &&
    request.projectKey === projectKey &&
    request.after?.updatedAt === after?.updatedAt &&
    request.after?.projectKey === after?.projectKey &&
    request.after?.issueNumber === after?.issueNumber
  );
}

/** Writes or clears the complete review cursor in existing URL state. */
export function setDashboardIssueReviewPageParams(
  searchParams: URLSearchParams,
  after: DashboardIssueReviewCursor | null
) {
  const nextParams = new URLSearchParams(searchParams.toString());

  if (after) {
    nextParams.set('issueReviewAfterAt', after.updatedAt);
    nextParams.set('issueReviewAfterProject', after.projectKey);
    nextParams.set('issueReviewAfterIssue', after.issueNumber.toString());
  } else {
    clearDashboardIssueReviewCursor(nextParams);
  }

  return nextParams;
}

/** Canonicalizes the independent issue-review cursor in existing URL state. */
export function writeDashboardIssueReviewQueryParams(
  searchParams: URLSearchParams,
  after: DashboardIssueReviewCursor | null
) {
  return setDashboardIssueReviewPageParams(searchParams, after);
}

/** Removes every inseparable issue-review cursor field in place. */
export function clearDashboardIssueReviewCursor(searchParams: URLSearchParams) {
  searchParams.delete('issueReviewAfterAt');
  searchParams.delete('issueReviewAfterProject');
  searchParams.delete('issueReviewAfterIssue');
}

/** Builds a stable local key for page-bound issue-review updates. */
export function buildDashboardIssueReviewPageKey(
  projectKey: string | null,
  after: DashboardIssueReviewCursor | null
) {
  return [
    projectKey ?? 'all',
    after?.updatedAt ?? '',
    after?.projectKey ?? '',
    after?.issueNumber ?? '',
  ].join(':');
}
