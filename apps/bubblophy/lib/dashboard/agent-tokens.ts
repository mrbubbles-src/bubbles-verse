import 'server-only';

import type { BubblophyProjectRole } from '@/drizzle/db/schema';
import type { DashboardAgentTokenCursor } from '@/lib/dashboard/agent-token-query';
import type { AgentTokenSummary } from '@/lib/dashboard/types';

import {
  DASHBOARD_AGENT_TOKEN_QUERY_MAX_LENGTH,
  normalizeDashboardAgentTokenQuery,
  parseDashboardAgentTokenCursor,
} from '@/lib/dashboard/agent-token-query';

export interface DashboardAgentTokenPageItem extends AgentTokenSummary {
  projectIsArchived: boolean;
  currentUserRole: BubblophyProjectRole;
}

export interface DashboardAgentTokenPage {
  project: {
    key: string;
    name: string;
    isArchived: boolean;
    currentUserRole: BubblophyProjectRole;
  } | null;
  query: string | null;
  items: DashboardAgentTokenPageItem[];
  nextAfter: DashboardAgentTokenCursor | null;
}

export interface DashboardAgentTokenPageReadInput {
  authUserId: string;
  projectKey: string | null;
  query: string | null;
  after: DashboardAgentTokenCursor | null;
  now: string;
}

export type DashboardAgentTokenPageReader = (
  input: DashboardAgentTokenPageReadInput
) => Promise<DashboardAgentTokenPage | null>;

export interface ReadDashboardAgentTokenPageInput {
  projectKey?: string;
  query?: string;
  after?: DashboardAgentTokenCursor;
}

export interface ReadDashboardAgentTokenPageOptions {
  readPage?: DashboardAgentTokenPageReader;
  clock?: () => Date;
}

export type ReadDashboardAgentTokenPageResult =
  | ({ status: 'success' } & DashboardAgentTokenPage)
  | {
      status: 'invalid';
      reason:
        | 'empty_auth_user'
        | 'invalid_project_key'
        | 'query_too_short'
        | 'query_too_long'
        | 'invalid_cursor';
    }
  | { status: 'not_found' }
  | { status: 'database_unavailable' };

export const DASHBOARD_AGENT_TOKEN_PAGE_SIZE = 20;
const projectKeyPattern = /^[A-Z0-9]{2,8}$/;

/**
 * Reads one bounded agent-token management page for a project or all projects.
 *
 * @param authUserId Authenticated human Supabase user ID.
 * @param input Optional concrete project and stable token cursor.
 * @param options Reader and clock overrides for contract tests.
 * @returns Membership-scoped public token page or a safe failure state.
 */
export async function readDashboardAgentTokenPage(
  authUserId: string,
  input: ReadDashboardAgentTokenPageInput = {},
  options: ReadDashboardAgentTokenPageOptions = {}
): Promise<ReadDashboardAgentTokenPageResult> {
  const normalizedAuthUserId = authUserId.trim();
  const projectKey = input.projectKey?.trim().toUpperCase() || null;
  const query = normalizeDashboardAgentTokenQuery(input.query);
  const after = input.after
    ? parseDashboardAgentTokenCursor(
        input.after.projectKey,
        input.after.normalizedLabel,
        input.after.tokenId
      )
    : null;

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (projectKey && !projectKeyPattern.test(projectKey)) {
    return { status: 'invalid', reason: 'invalid_project_key' };
  }

  if (query && query.length < 2) {
    return { status: 'invalid', reason: 'query_too_short' };
  }

  if (query && query.length > DASHBOARD_AGENT_TOKEN_QUERY_MAX_LENGTH) {
    return { status: 'invalid', reason: 'query_too_long' };
  }

  if (
    input.after &&
    (!after || (projectKey !== null && after.projectKey !== projectKey))
  ) {
    return { status: 'invalid', reason: 'invalid_cursor' };
  }

  try {
    const readPage =
      options.readPage ?? (await getDefaultAgentTokenPageReader());

    if (!readPage) {
      return { status: 'database_unavailable' };
    }

    const page = await readPage({
      authUserId: normalizedAuthUserId,
      projectKey,
      query,
      after,
      now: (options.clock ?? (() => new Date()))().toISOString(),
    });

    return page ? { status: 'success', ...page } : { status: 'not_found' };
  } catch {
    return { status: 'database_unavailable' };
  }
}

/** Loads the Drizzle token-page reader only when the database is configured. */
async function getDefaultAgentTokenPageReader(): Promise<DashboardAgentTokenPageReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectDashboardAgentTokenPageForUser } =
    await import('@/lib/dashboard/agent-tokens-database-read');

  return selectDashboardAgentTokenPageForUser;
}
