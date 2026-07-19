import 'server-only';

import type {
  BubblophyIssuePriority,
  BubblophyIssueStatus,
  BubblophyProjectRole,
} from '@/drizzle/db/schema';

export type DashboardIssueSort = 'newest' | 'oldest';

export interface DashboardIssuePageItem {
  key: string;
  issueNumber: number;
  title: string;
  status: BubblophyIssueStatus;
  priority: BubblophyIssuePriority;
  requiresHumanApproval: boolean;
  assignedAuthUserId: string | null;
  latestPlan: {
    version: number;
    stepCount: number;
  } | null;
}

export interface DashboardIssuePage {
  project: {
    key: string;
    name: string;
    isArchived: boolean;
    currentUserRole: BubblophyProjectRole;
  };
  sort: DashboardIssueSort;
  items: DashboardIssuePageItem[];
  nextAfterIssueNumber: number | null;
}

export interface DashboardIssuePageReadInput {
  authUserId: string;
  projectKey: string;
  sort: DashboardIssueSort;
  afterIssueNumber: number | null;
}

export type DashboardIssuePageReader = (
  input: DashboardIssuePageReadInput
) => Promise<DashboardIssuePage | null>;

export interface ReadDashboardIssuePageInput {
  projectKey: string;
  sort?: DashboardIssueSort;
  afterIssueNumber?: number;
}

export interface ReadDashboardIssuePageOptions {
  readPage?: DashboardIssuePageReader;
}

export type ReadDashboardIssuePageResult =
  | ({ status: 'success' } & DashboardIssuePage)
  | {
      status: 'invalid';
      reason:
        | 'empty_auth_user'
        | 'invalid_project_key'
        | 'invalid_sort'
        | 'invalid_cursor';
    }
  | { status: 'not_found' }
  | { status: 'database_unavailable' };

export const DASHBOARD_ISSUE_PAGE_SIZE = 25;

const projectKeyPattern = /^[A-Z0-9]{2,8}$/;
const maxPostgresInteger = 2_147_483_647;

/**
 * Reads one bounded issue-number page for a concrete visible project.
 *
 * Missing projects and missing memberships intentionally share one result.
 * Search and filters are later URL-backed slices layered onto this cursor.
 *
 * @param authUserId Authenticated Supabase user ID from the server session.
 * @param input Project key, stable sort direction, and optional cursor.
 * @param options Optional reader override for tests.
 * @returns A membership-scoped page or a safe public failure state.
 */
export async function readDashboardIssuePage(
  authUserId: string,
  input: ReadDashboardIssuePageInput,
  options: ReadDashboardIssuePageOptions = {}
): Promise<ReadDashboardIssuePageResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedProjectKey = input.projectKey.trim().toUpperCase();
  const sort = input.sort ?? 'newest';
  const afterIssueNumber = input.afterIssueNumber ?? null;

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (!projectKeyPattern.test(normalizedProjectKey)) {
    return { status: 'invalid', reason: 'invalid_project_key' };
  }

  if (sort !== 'newest' && sort !== 'oldest') {
    return { status: 'invalid', reason: 'invalid_sort' };
  }

  if (
    afterIssueNumber !== null &&
    (!Number.isSafeInteger(afterIssueNumber) ||
      afterIssueNumber < 1 ||
      afterIssueNumber > maxPostgresInteger)
  ) {
    return { status: 'invalid', reason: 'invalid_cursor' };
  }

  const readPage = options.readPage ?? (await getDefaultIssuePageReader());

  if (!readPage) {
    return { status: 'database_unavailable' };
  }

  try {
    const page = await readPage({
      authUserId: normalizedAuthUserId,
      projectKey: normalizedProjectKey,
      sort,
      afterIssueNumber,
    });

    return page ? { status: 'success', ...page } : { status: 'not_found' };
  } catch {
    return { status: 'database_unavailable' };
  }
}

/** Loads the server-only Drizzle reader when database access is configured. */
async function getDefaultIssuePageReader(): Promise<DashboardIssuePageReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectDashboardIssuePageForUser } =
    await import('@/lib/dashboard/issues-database-read');

  return selectDashboardIssuePageForUser;
}
