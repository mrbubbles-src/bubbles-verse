import type {
  BubblophyIssuePriority,
  BubblophyIssueStatus,
} from '@/drizzle/db/schema';
import type {
  DashboardIssueFilters,
  DashboardIssueSort,
} from '@/lib/dashboard/issues';

export interface DashboardIssueQueryState {
  filters: DashboardIssueFilters;
  sort: DashboardIssueSort;
  afterIssueNumber: number | null;
}

export interface DashboardIssuePageRequestState extends DashboardIssueQueryState {
  projectKey: string;
}

export interface DashboardIssueQueryValues {
  query?: string | null;
  status?: string | null;
  priority?: string | null;
  sort?: string | null;
  after?: string | null;
}

export interface DashboardIssueQueryPatch {
  query?: string | null;
  status?: BubblophyIssueStatus | null;
  priority?: BubblophyIssuePriority | null;
  sort?: DashboardIssueSort;
}

export const DASHBOARD_ISSUE_QUERY_MAX_LENGTH = 100;
export const MAX_POSTGRES_INTEGER = 2_147_483_647;

const issueStatuses = new Set<BubblophyIssueStatus>([
  'triage',
  'planned',
  'ready',
  'in_progress',
  'review',
  'blocked',
  'done',
]);
const issuePriorities = new Set<BubblophyIssuePriority>([
  'low',
  'medium',
  'high',
]);

/**
 * Parses issue queue query values into the canonical bounded URL contract.
 *
 * Invalid deep-link values fall back to their omitted defaults. The server
 * data boundary still validates its typed input independently.
 *
 * @param values Raw values from Next.js search params or URLSearchParams.
 * @returns Canonical filters, sort direction, and optional int4 cursor.
 */
export function parseDashboardIssueQuery(
  values: DashboardIssueQueryValues
): DashboardIssueQueryState {
  const normalizedQuery = values.query?.trim() ?? '';
  const cursor = Number(values.after);

  return {
    filters: {
      query:
        normalizedQuery.length > 0 &&
        normalizedQuery.length <= DASHBOARD_ISSUE_QUERY_MAX_LENGTH
          ? normalizedQuery
          : null,
      status: isDashboardIssueStatus(values.status) ? values.status : null,
      priority: isDashboardIssuePriority(values.priority)
        ? values.priority
        : null,
    },
    sort: values.sort === 'oldest' ? 'oldest' : 'newest',
    afterIssueNumber:
      values.after &&
      Number.isSafeInteger(cursor) &&
      cursor >= 1 &&
      cursor <= MAX_POSTGRES_INTEGER
        ? cursor
        : null,
  };
}

/** Checks whether a server page request matches the current canonical URL. */
export function isDashboardIssuePageRequestCurrent(
  request: DashboardIssuePageRequestState | null | undefined,
  projectKey: string,
  query: DashboardIssueQueryState
) {
  return Boolean(
    request &&
    request.projectKey === projectKey &&
    request.sort === query.sort &&
    request.afterIssueNumber === query.afterIssueNumber &&
    request.filters.query === query.filters.query &&
    request.filters.status === query.filters.status &&
    request.filters.priority === query.filters.priority
  );
}

/** Checks whether an untrusted value is a persisted issue status. */
export function isDashboardIssueStatus(
  value: string | null | undefined
): value is BubblophyIssueStatus {
  return Boolean(value && issueStatuses.has(value as BubblophyIssueStatus));
}

/** Checks whether an untrusted value is a persisted issue priority. */
export function isDashboardIssuePriority(
  value: string | null | undefined
): value is BubblophyIssuePriority {
  return Boolean(value && issuePriorities.has(value as BubblophyIssuePriority));
}

/** Writes canonical non-default issue query values into existing URL params. */
export function writeDashboardIssueQueryParams(
  searchParams: URLSearchParams,
  query: DashboardIssueQueryState
) {
  const nextParams = new URLSearchParams(searchParams.toString());

  setOptionalSearchParam(nextParams, 'q', query.filters.query);
  setOptionalSearchParam(nextParams, 'status', query.filters.status);
  setOptionalSearchParam(nextParams, 'priority', query.filters.priority);
  setOptionalSearchParam(
    nextParams,
    'sort',
    query.sort === 'oldest' ? 'oldest' : null
  );
  setOptionalSearchParam(
    nextParams,
    'after',
    query.afterIssueNumber?.toString() ?? null
  );

  return nextParams;
}

/** Applies a filter patch and resets page cursor plus issue selection. */
export function patchDashboardIssueQueryParams(
  searchParams: URLSearchParams,
  patch: DashboardIssueQueryPatch
) {
  const current = parseDashboardIssueQuery({
    query: searchParams.get('q'),
    status: searchParams.get('status'),
    priority: searchParams.get('priority'),
    sort: searchParams.get('sort'),
    after: searchParams.get('after'),
  });
  const next = parseDashboardIssueQuery({
    query: patch.query === undefined ? current.filters.query : patch.query,
    status: patch.status === undefined ? current.filters.status : patch.status,
    priority:
      patch.priority === undefined ? current.filters.priority : patch.priority,
    sort: patch.sort ?? current.sort,
  });
  const nextParams = writeDashboardIssueQueryParams(searchParams, next);

  nextParams.delete('issue');

  return nextParams;
}

/** Sets or clears the forward cursor and resets the selected issue. */
export function setDashboardIssuePageParams(
  searchParams: URLSearchParams,
  afterIssueNumber: number | null
) {
  const current = parseDashboardIssueQuery({
    query: searchParams.get('q'),
    status: searchParams.get('status'),
    priority: searchParams.get('priority'),
    sort: searchParams.get('sort'),
    after: afterIssueNumber?.toString() ?? null,
  });
  const nextParams = writeDashboardIssueQueryParams(searchParams, current);

  nextParams.delete('issue');

  return nextParams;
}

/** Sets one optional query value without discarding unrelated URL state. */
function setOptionalSearchParam(
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
