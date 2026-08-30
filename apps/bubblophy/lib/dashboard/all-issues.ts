import 'server-only';

import type {
  BubblophyIssuePriority,
  BubblophyIssueStatus,
  BubblophyProjectRole,
} from '@/drizzle/db/schema';
import type {
  DashboardIssueFilters,
  DashboardIssueSort,
} from '@/lib/dashboard/issues';

import {
  DASHBOARD_ISSUE_QUERY_MAX_LENGTH,
  isDashboardIssuePriority,
  isDashboardIssueStatus,
  MAX_POSTGRES_INTEGER,
} from '@/lib/dashboard/issue-query';
import { DASHBOARD_ISSUE_PAGE_SIZE } from '@/lib/dashboard/issues';

export interface DashboardAllIssueCursor {
  updatedAt: string;
  projectKey: string;
  issueNumber: number;
}

export interface DashboardAllIssuePageItem {
  project: {
    key: string;
    name: string;
    currentUserRole: BubblophyProjectRole;
  };
  key: string;
  issueNumber: number;
  title: string;
  status: BubblophyIssueStatus;
  priority: BubblophyIssuePriority;
  requiresHumanApproval: boolean;
  assignedAuthUserId: string | null;
  assigneeLabel: string;
  latestPlan: { version: number; stepCount: number } | null;
  updatedAt: string;
}

export interface DashboardAllIssuePage {
  sort: DashboardIssueSort;
  filters: DashboardIssueFilters;
  items: DashboardAllIssuePageItem[];
  nextAfter: DashboardAllIssueCursor | null;
}

export interface DashboardAllIssuePageReadInput {
  authUserId: string;
  sort: DashboardIssueSort;
  after: DashboardAllIssueCursor | null;
  filters: DashboardIssueFilters;
}

export type DashboardAllIssuePageReader = (
  input: DashboardAllIssuePageReadInput
) => Promise<DashboardAllIssuePage>;

export interface ReadDashboardAllIssuePageInput {
  sort?: DashboardIssueSort;
  after?: DashboardAllIssueCursor;
  query?: string;
  status?: BubblophyIssueStatus | 'all';
  priority?: BubblophyIssuePriority | 'all';
}

export type ReadDashboardAllIssuePageResult =
  | ({ status: 'success' } & DashboardAllIssuePage)
  | {
      status: 'invalid';
      reason:
        | 'empty_auth_user'
        | 'invalid_sort'
        | 'invalid_cursor'
        | 'query_too_long'
        | 'invalid_status'
        | 'invalid_priority';
    }
  | { status: 'database_unavailable' };

const projectKeyPattern = /^[A-Z0-9]{2,8}$/;

/**
 * Reads one bounded issue page across every currently visible project.
 *
 * @param authUserId Authenticated Supabase user ID from the server session.
 * @param input Sort, filters, and optional public stable cursor.
 * @param options Optional reader override for tests.
 * @returns A membership-scoped page or a safe public failure state.
 */
export async function readDashboardAllIssuePage(
  authUserId: string,
  input: ReadDashboardAllIssuePageInput = {},
  options: { readPage?: DashboardAllIssuePageReader } = {}
): Promise<ReadDashboardAllIssuePageResult> {
  const normalizedAuthUserId = authUserId.trim();
  const sort = input.sort ?? 'newest';
  const query = input.query?.trim() || null;
  const status = input.status ?? 'all';
  const priority = input.priority ?? 'all';
  const after = input.after ? normalizeCursor(input.after) : null;

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (sort !== 'newest' && sort !== 'oldest') {
    return { status: 'invalid', reason: 'invalid_sort' };
  }

  if (input.after && !after) {
    return { status: 'invalid', reason: 'invalid_cursor' };
  }

  if (query && query.length > DASHBOARD_ISSUE_QUERY_MAX_LENGTH) {
    return { status: 'invalid', reason: 'query_too_long' };
  }

  if (status !== 'all' && !isDashboardIssueStatus(status)) {
    return { status: 'invalid', reason: 'invalid_status' };
  }

  if (priority !== 'all' && !isDashboardIssuePriority(priority)) {
    return { status: 'invalid', reason: 'invalid_priority' };
  }

  const readPage = options.readPage ?? (await getDefaultReader());

  if (!readPage) {
    return { status: 'database_unavailable' };
  }

  try {
    const page = await readPage({
      authUserId: normalizedAuthUserId,
      sort,
      after,
      filters: {
        query,
        status: status === 'all' ? null : status,
        priority: priority === 'all' ? null : priority,
      },
    });

    return { status: 'success', ...page };
  } catch {
    return { status: 'database_unavailable' };
  }
}

/** Normalizes a complete public all-project issue cursor. */
function normalizeCursor(
  cursor: DashboardAllIssueCursor
): DashboardAllIssueCursor | null {
  const updatedAt = cursor.updatedAt.trim();
  const projectKey = cursor.projectKey.trim().toUpperCase();

  if (
    !updatedAt ||
    updatedAt.length > 64 ||
    !Number.isFinite(Date.parse(updatedAt)) ||
    !projectKeyPattern.test(projectKey) ||
    !Number.isSafeInteger(cursor.issueNumber) ||
    cursor.issueNumber < 1 ||
    cursor.issueNumber > MAX_POSTGRES_INTEGER
  ) {
    return null;
  }

  return { updatedAt, projectKey, issueNumber: cursor.issueNumber };
}

/** Loads the server-only Drizzle reader when database access is configured. */
async function getDefaultReader(): Promise<DashboardAllIssuePageReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectDashboardAllIssuePageForUser } =
    await import('@/lib/dashboard/all-issues-database-read');

  return selectDashboardAllIssuePageForUser;
}

export { DASHBOARD_ISSUE_PAGE_SIZE as DASHBOARD_ALL_ISSUE_PAGE_SIZE };
