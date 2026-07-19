import 'server-only';

import type {
  BubblophyAgentRunState,
  BubblophyProjectRole,
} from '@/drizzle/db/schema';
import type { DashboardRunCursor } from '@/lib/dashboard/run-query';

import { parseDashboardRunCursor } from '@/lib/dashboard/run-query';

export interface DashboardRunPageItem {
  id: string;
  issueKey: string;
  agentLabel: string;
  state: BubblophyAgentRunState;
  updatedAt: string;
  resultSummary: string | null;
}

export interface DashboardRunPage {
  project: {
    key: string;
    name: string;
    isArchived: boolean;
    currentUserRole: BubblophyProjectRole;
  };
  items: DashboardRunPageItem[];
  nextAfter: DashboardRunCursor | null;
}

export interface DashboardRunPageReadInput {
  authUserId: string;
  projectKey: string;
  after: DashboardRunCursor | null;
}

export type DashboardRunPageReader = (
  input: DashboardRunPageReadInput
) => Promise<DashboardRunPage | null>;

export interface ReadDashboardRunPageInput {
  projectKey: string;
  after?: DashboardRunCursor;
}

export interface ReadDashboardRunPageOptions {
  readPage?: DashboardRunPageReader;
}

export type ReadDashboardRunPageResult =
  | ({ status: 'success' } & DashboardRunPage)
  | {
      status: 'invalid';
      reason: 'empty_auth_user' | 'invalid_project_key' | 'invalid_cursor';
    }
  | { status: 'not_found' }
  | { status: 'database_unavailable' };

export const DASHBOARD_RUN_PAGE_SIZE = 20;
const projectKeyPattern = /^[A-Z0-9]{2,8}$/;

/**
 * Reads one bounded newest-first run page for a concrete visible project.
 *
 * @param authUserId Authenticated Supabase user ID from the server session.
 * @param input Project key and optional stable `(updatedAt,id)` cursor.
 * @param options Optional reader override for tests.
 * @returns Membership-scoped page or a safe public failure state.
 */
export async function readDashboardRunPage(
  authUserId: string,
  input: ReadDashboardRunPageInput,
  options: ReadDashboardRunPageOptions = {}
): Promise<ReadDashboardRunPageResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedProjectKey = input.projectKey.trim().toUpperCase();
  const after = input.after
    ? parseDashboardRunCursor(input.after.updatedAt, input.after.id)
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

  const readPage = options.readPage ?? (await getDefaultRunPageReader());

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
async function getDefaultRunPageReader(): Promise<DashboardRunPageReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectDashboardRunPageForUser } =
    await import('@/lib/dashboard/runs-database-read');

  return selectDashboardRunPageForUser;
}
