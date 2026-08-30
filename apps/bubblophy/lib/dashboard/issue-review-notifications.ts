import 'server-only';

import type { BubblophyProjectRole } from '@/drizzle/db/schema';
import type { DashboardIssueReviewCursor } from '@/lib/dashboard/issue-review-notification-query';

import { parseDashboardIssueReviewCursor } from '@/lib/dashboard/issue-review-notification-query';

export interface DashboardIssueReviewPageItem {
  issueKey: string;
  title: string;
  projectKey: string;
  projectName: string;
  updatedAt: string;
}

export interface DashboardIssueReviewPage {
  project: {
    key: string;
    name: string;
    currentUserRole: BubblophyProjectRole;
  } | null;
  items: DashboardIssueReviewPageItem[];
  nextAfter: DashboardIssueReviewCursor | null;
}

export interface DashboardIssueReviewPageReadInput {
  authUserId: string;
  projectKey: string | null;
  after: DashboardIssueReviewCursor | null;
}

export type DashboardIssueReviewPageReader = (
  input: DashboardIssueReviewPageReadInput
) => Promise<DashboardIssueReviewPage | null>;

export interface ReadDashboardIssueReviewPageInput {
  projectKey?: string;
  after?: DashboardIssueReviewCursor;
}

export interface ReadDashboardIssueReviewPageOptions {
  readPage?: DashboardIssueReviewPageReader;
}

export type ReadDashboardIssueReviewPageResult =
  | ({ status: 'success' } & DashboardIssueReviewPage)
  | {
      status: 'invalid';
      reason: 'empty_auth_user' | 'invalid_project_key' | 'invalid_cursor';
    }
  | { status: 'not_found' }
  | { status: 'database_unavailable' };

export const DASHBOARD_ISSUE_REVIEW_PAGE_SIZE = 20;
const projectKeyPattern = /^[A-Z0-9]{2,8}$/;

/**
 * Reads one bounded newest-first page of issues currently in review.
 *
 * @param authUserId Authenticated Supabase user ID from the server session.
 * @param input Optional project scope and stable public issue cursor.
 * @param options Optional database reader override for tests.
 * @returns Membership-scoped review page or a safe public failure state.
 */
export async function readDashboardIssueReviewPage(
  authUserId: string,
  input: ReadDashboardIssueReviewPageInput = {},
  options: ReadDashboardIssueReviewPageOptions = {}
): Promise<ReadDashboardIssueReviewPageResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedProjectKey = input.projectKey?.trim().toUpperCase() ?? null;
  const after = input.after
    ? parseDashboardIssueReviewCursor(
        input.after.updatedAt,
        input.after.projectKey,
        input.after.issueNumber.toString()
      )
    : null;

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (
    normalizedProjectKey !== null &&
    !projectKeyPattern.test(normalizedProjectKey)
  ) {
    return { status: 'invalid', reason: 'invalid_project_key' };
  }

  if (
    input.after &&
    (!after ||
      (normalizedProjectKey !== null &&
        after.projectKey !== normalizedProjectKey))
  ) {
    return { status: 'invalid', reason: 'invalid_cursor' };
  }

  try {
    const readPage = options.readPage ?? (await getDefaultReader());

    if (!readPage) {
      return { status: 'database_unavailable' };
    }

    const page = await readPage({
      authUserId: normalizedAuthUserId,
      projectKey: normalizedProjectKey,
      after,
    });

    return page ? { status: 'success', ...page } : { status: 'not_found' };
  } catch {
    return { status: 'database_unavailable' };
  }
}

/** Loads the Drizzle reader only when the database is configured. */
async function getDefaultReader(): Promise<DashboardIssueReviewPageReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectDashboardIssueReviewPageForUser } =
    await import('@/lib/dashboard/issue-review-notifications-database-read');

  return selectDashboardIssueReviewPageForUser;
}
