import 'server-only';

import type {
  BubblophyAgentRunState,
  BubblophyProjectRole,
} from '@/drizzle/db/schema';
import type { DashboardNotificationCursor } from '@/lib/dashboard/notification-query';

import { parseDashboardNotificationCursor } from '@/lib/dashboard/notification-query';

export type DashboardNotificationRunState = Extract<
  BubblophyAgentRunState,
  'requested' | 'needs_review' | 'failed'
>;

export interface DashboardNotificationPageItem {
  runId: string;
  issueKey: string;
  projectKey: string;
  projectName: string;
  agentLabel: string;
  state: DashboardNotificationRunState;
  updatedAt: string;
  canManage: boolean;
}

export interface DashboardNotificationPage {
  project: {
    key: string;
    name: string;
    currentUserRole: BubblophyProjectRole;
  } | null;
  items: DashboardNotificationPageItem[];
  nextAfter: DashboardNotificationCursor | null;
}

export interface DashboardNotificationPageReadInput {
  authUserId: string;
  projectKey: string | null;
  after: DashboardNotificationCursor | null;
}

export type DashboardNotificationPageReader = (
  input: DashboardNotificationPageReadInput
) => Promise<DashboardNotificationPage | null>;

export interface ReadDashboardNotificationPageInput {
  projectKey?: string;
  after?: DashboardNotificationCursor;
}

export interface ReadDashboardNotificationPageOptions {
  readPage?: DashboardNotificationPageReader;
}

export type ReadDashboardNotificationPageResult =
  | ({ status: 'success' } & DashboardNotificationPage)
  | {
      status: 'invalid';
      reason: 'empty_auth_user' | 'invalid_project_key' | 'invalid_cursor';
    }
  | { status: 'not_found' }
  | { status: 'database_unavailable' };

export const DASHBOARD_NOTIFICATION_PAGE_SIZE = 20;
const projectKeyPattern = /^[A-Z0-9]{2,8}$/;

/**
 * Reads one bounded newest-first live run-notification page.
 *
 * Notifications are current projections of requested, reviewable, or failed
 * runs. They intentionally do not model persisted read/unread state.
 *
 * @param authUserId Authenticated Supabase user ID from the server session.
 * @param input Optional project scope and stable run cursor.
 * @param options Optional database reader override for tests.
 * @returns Membership-scoped page or a safe public failure state.
 */
export async function readDashboardNotificationPage(
  authUserId: string,
  input: ReadDashboardNotificationPageInput = {},
  options: ReadDashboardNotificationPageOptions = {}
): Promise<ReadDashboardNotificationPageResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedProjectKey = input.projectKey?.trim().toUpperCase() ?? null;
  const after = input.after
    ? parseDashboardNotificationCursor(input.after.updatedAt, input.after.runId)
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

  if (input.after && !after) {
    return { status: 'invalid', reason: 'invalid_cursor' };
  }

  try {
    const readPage = options.readPage ?? (await getDefaultNotificationReader());

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
async function getDefaultNotificationReader(): Promise<DashboardNotificationPageReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectDashboardNotificationPageForUser } =
    await import('@/lib/dashboard/notifications-database-read');

  return selectDashboardNotificationPageForUser;
}
