import type { DashboardAllIssueCursor } from '@/lib/dashboard/all-issues';
import type {
  DashboardIssueQueryPatch,
  DashboardIssueQueryState,
} from '@/lib/dashboard/issue-query';

import {
  MAX_POSTGRES_INTEGER,
  parseDashboardIssueQuery,
  writeDashboardIssueQueryParams,
} from '@/lib/dashboard/issue-query';

export interface DashboardAllIssueQueryState {
  filters: DashboardIssueQueryState['filters'];
  sort: DashboardIssueQueryState['sort'];
  after: DashboardAllIssueCursor | null;
}

export type DashboardAllIssuePageRequestState = DashboardAllIssueQueryState;

export interface DashboardAllIssueQueryValues {
  query?: string | null;
  status?: string | null;
  priority?: string | null;
  sort?: string | null;
  afterAt?: string | null;
  afterProject?: string | null;
  afterIssue?: string | null;
}

const projectKeyPattern = /^[A-Z0-9]{2,8}$/;

/**
 * Parses shared issue filters and the three-part all-project URL cursor.
 *
 * @param values Raw URL values from the server page or client navigation.
 * @returns Canonical all-project queue state with an all-or-nothing cursor.
 */
export function parseDashboardAllIssueQuery(
  values: DashboardAllIssueQueryValues
): DashboardAllIssueQueryState {
  const sharedQuery = parseDashboardIssueQuery({
    query: values.query,
    status: values.status,
    priority: values.priority,
    sort: values.sort,
  });

  return {
    filters: sharedQuery.filters,
    sort: sharedQuery.sort,
    after: parseAllIssueCursor(values),
  };
}

/** Checks whether an all-project result belongs to the exact current URL. */
export function isDashboardAllIssuePageRequestCurrent(
  request: DashboardAllIssuePageRequestState | null | undefined,
  query: DashboardAllIssueQueryState
) {
  return Boolean(
    request &&
    request.sort === query.sort &&
    request.after?.updatedAt === query.after?.updatedAt &&
    request.after?.projectKey === query.after?.projectKey &&
    request.after?.issueNumber === query.after?.issueNumber &&
    request.filters.query === query.filters.query &&
    request.filters.status === query.filters.status &&
    request.filters.priority === query.filters.priority
  );
}

/** Writes canonical shared filters and the optional all-project cursor. */
export function writeDashboardAllIssueQueryParams(
  searchParams: URLSearchParams,
  query: DashboardAllIssueQueryState
) {
  const nextParams = writeDashboardIssueQueryParams(searchParams, {
    filters: query.filters,
    sort: query.sort,
    afterIssueNumber: null,
  });

  setOptionalParam(nextParams, 'allAfterAt', query.after?.updatedAt ?? null);
  setOptionalParam(
    nextParams,
    'allAfterProject',
    query.after?.projectKey ?? null
  );
  setOptionalParam(
    nextParams,
    'allAfterIssue',
    query.after?.issueNumber.toString() ?? null
  );

  return nextParams;
}

/** Applies shared issue filters and resets all page and detail selection. */
export function patchDashboardAllIssueQueryParams(
  searchParams: URLSearchParams,
  patch: DashboardIssueQueryPatch
) {
  const current = parseDashboardAllIssueQuery({
    query: searchParams.get('q'),
    status: searchParams.get('status'),
    priority: searchParams.get('priority'),
    sort: searchParams.get('sort'),
    afterAt: searchParams.get('allAfterAt'),
    afterProject: searchParams.get('allAfterProject'),
    afterIssue: searchParams.get('allAfterIssue'),
  });
  const nextSharedQuery = parseDashboardIssueQuery({
    query: patch.query === undefined ? current.filters.query : patch.query,
    status: patch.status === undefined ? current.filters.status : patch.status,
    priority:
      patch.priority === undefined ? current.filters.priority : patch.priority,
    sort: patch.sort ?? current.sort,
  });
  const nextParams = writeDashboardAllIssueQueryParams(searchParams, {
    filters: nextSharedQuery.filters,
    sort: nextSharedQuery.sort,
    after: null,
  });

  nextParams.delete('issue');

  return nextParams;
}

/** Sets or clears the all-project forward cursor and selected detail. */
export function setDashboardAllIssuePageParams(
  searchParams: URLSearchParams,
  after: DashboardAllIssueCursor | null
) {
  const current = parseDashboardAllIssueQuery({
    query: searchParams.get('q'),
    status: searchParams.get('status'),
    priority: searchParams.get('priority'),
    sort: searchParams.get('sort'),
  });
  const nextParams = writeDashboardAllIssueQueryParams(searchParams, {
    ...current,
    after,
  });

  nextParams.delete('issue');

  return nextParams;
}

/** Parses a complete valid cursor or discards every partial/invalid field. */
function parseAllIssueCursor(
  values: DashboardAllIssueQueryValues
): DashboardAllIssueCursor | null {
  const updatedAt = values.afterAt?.trim() ?? '';
  const projectKey = values.afterProject?.trim().toUpperCase() ?? '';
  const issueNumber = Number(values.afterIssue);

  if (
    !updatedAt ||
    updatedAt.length > 64 ||
    !Number.isFinite(Date.parse(updatedAt)) ||
    !projectKeyPattern.test(projectKey) ||
    !values.afterIssue ||
    !Number.isSafeInteger(issueNumber) ||
    issueNumber < 1 ||
    issueNumber > MAX_POSTGRES_INTEGER
  ) {
    return null;
  }

  return { updatedAt, projectKey, issueNumber };
}

/** Sets one optional URL value while preserving unrelated state. */
function setOptionalParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | null
) {
  if (value) {
    searchParams.set(key, value);
  } else {
    searchParams.delete(key);
  }
}
