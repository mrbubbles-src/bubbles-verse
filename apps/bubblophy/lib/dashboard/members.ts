import 'server-only';

import type { BubblophyProjectRole } from '@/drizzle/db/schema';
import type { DashboardMemberCursor } from '@/lib/dashboard/member-query';
import type { ProjectMemberSummary } from '@/lib/dashboard/types';

import { parseDashboardMemberCursor } from '@/lib/dashboard/member-query';

export interface DashboardMemberPage {
  project: {
    key: string;
    name: string;
    isArchived: boolean;
    currentUserRole: BubblophyProjectRole;
  };
  items: ProjectMemberSummary[];
  nextAfter: DashboardMemberCursor | null;
}

export interface DashboardMemberPageReadInput {
  authUserId: string;
  projectKey: string;
  after: DashboardMemberCursor | null;
}

export type DashboardMemberPageReader = (
  input: DashboardMemberPageReadInput
) => Promise<DashboardMemberPage | null>;

export interface ReadDashboardMemberPageInput {
  projectKey: string;
  after?: DashboardMemberCursor;
}

export interface ReadDashboardMemberPageOptions {
  readPage?: DashboardMemberPageReader;
}

export type ReadDashboardMemberPageResult =
  | ({ status: 'success' } & DashboardMemberPage)
  | {
      status: 'invalid';
      reason: 'empty_auth_user' | 'invalid_project_key' | 'invalid_cursor';
    }
  | { status: 'not_found' }
  | { status: 'database_unavailable' };

export const DASHBOARD_MEMBER_PAGE_SIZE = 20;
const projectKeyPattern = /^[A-Z0-9]{2,8}$/;

/**
 * Reads one bounded oldest-first member page for a concrete visible project.
 *
 * @param authUserId Authenticated Supabase user ID from the server session.
 * @param input Project key and optional stable membership cursor.
 * @param options Optional reader override for contract tests.
 * @returns Membership-scoped page or a safe public failure state.
 */
export async function readDashboardMemberPage(
  authUserId: string,
  input: ReadDashboardMemberPageInput,
  options: ReadDashboardMemberPageOptions = {}
): Promise<ReadDashboardMemberPageResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedProjectKey = input.projectKey.trim().toUpperCase();
  const after = input.after
    ? parseDashboardMemberCursor(input.after.createdAt, input.after.authUserId)
    : null;

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (!projectKeyPattern.test(normalizedProjectKey)) {
    return { status: 'invalid', reason: 'invalid_project_key' };
  }

  if (input.after && !after) {
    return { status: 'invalid', reason: 'invalid_cursor' };
  }

  const readPage = options.readPage ?? (await getDefaultMemberPageReader());

  if (!readPage) {
    return { status: 'database_unavailable' };
  }

  try {
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
async function getDefaultMemberPageReader(): Promise<DashboardMemberPageReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectDashboardMemberPageForUser } =
    await import('@/lib/dashboard/members-database-read');

  return selectDashboardMemberPageForUser;
}
