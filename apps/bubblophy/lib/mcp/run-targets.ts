import 'server-only';

import type { BubblophyMcpProjectRole } from '@/lib/mcp/projects';

import { canContributeToBubblophyProject } from '@/lib/projects/permissions';

export interface BubblophyMcpRunTargetCursor {
  normalizedLabel: string;
  id: string;
}

export interface BubblophyMcpRunTarget {
  id: string;
  label: string;
}

export interface BubblophyMcpRunTargetReadResult {
  project: {
    id: string;
    key: string;
    isArchived: boolean;
    role: BubblophyMcpProjectRole;
  };
  targets: BubblophyMcpRunTarget[];
  nextAfter: BubblophyMcpRunTargetCursor | null;
}

export interface BubblophyMcpRunTargetReadInput {
  authUserId: string;
  projectId: string;
  query: string | null;
  after: BubblophyMcpRunTargetCursor | null;
  now: string;
}

export type BubblophyMcpRunTargetReader = (
  input: BubblophyMcpRunTargetReadInput
) => Promise<BubblophyMcpRunTargetReadResult | null>;

export interface ListBubblophyMcpRunTargetsInput {
  projectId: string;
  query?: string;
  after?: BubblophyMcpRunTargetCursor;
}

interface ListBubblophyMcpRunTargetsOptions {
  readTargets?: BubblophyMcpRunTargetReader;
  now?: string;
}

export type ListBubblophyMcpRunTargetsResult =
  | {
      status: 'success';
      project: { id: string; key: string; isArchived: false };
      query: string | null;
      targets: BubblophyMcpRunTarget[];
      nextAfter: BubblophyMcpRunTargetCursor | null;
    }
  | {
      status: 'invalid';
      reason:
        | 'empty_auth_user'
        | 'empty_project'
        | 'invalid_project'
        | 'query_too_short'
        | 'query_too_long'
        | 'invalid_cursor';
    }
  | { status: 'not_found' }
  | { status: 'forbidden' }
  | { status: 'database_unavailable' };

export const BUBBLOPHY_MCP_RUN_TARGET_PAGE_SIZE = 20;
export const BUBBLOPHY_MCP_RUN_TARGET_QUERY_MAX_LENGTH = 80;

const projectIdMaxLength = 200;
const cursorLabelMaxLength = 256;
const cursorIdMaxLength = 128;

/**
 * Lists one bounded page of public executable targets for a contributor.
 *
 * Lifecycle, scopes, expiry, hashes, and actor data remain inside the database
 * predicate. The MCP boundary returns only target IDs, labels, and a cursor.
 *
 * @param authUserId Verified OAuth subject mapped to the Bubblophy user.
 * @param input Project ID, optional literal label prefix, and stable cursor.
 * @param options Optional reader and clock dependencies for tests.
 * @returns One public target page or a safe structured failure.
 */
export async function listBubblophyMcpRunTargets(
  authUserId: string,
  input: ListBubblophyMcpRunTargetsInput,
  options: ListBubblophyMcpRunTargetsOptions = {}
): Promise<ListBubblophyMcpRunTargetsResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedProjectId = input.projectId.trim();
  const query = input.query?.trim() || null;
  const after = input.after ? normalizeCursor(input.after) : null;

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (!normalizedProjectId) {
    return { status: 'invalid', reason: 'empty_project' };
  }

  if (normalizedProjectId.length > projectIdMaxLength) {
    return { status: 'invalid', reason: 'invalid_project' };
  }

  if (query && query.length < 2) {
    return { status: 'invalid', reason: 'query_too_short' };
  }

  if (query && query.length > BUBBLOPHY_MCP_RUN_TARGET_QUERY_MAX_LENGTH) {
    return { status: 'invalid', reason: 'query_too_long' };
  }

  if (input.after && !after) {
    return { status: 'invalid', reason: 'invalid_cursor' };
  }

  try {
    const readTargets =
      options.readTargets ?? (await getDefaultBubblophyMcpRunTargetReader());

    if (!readTargets) {
      return { status: 'database_unavailable' };
    }

    const result = await readTargets({
      authUserId: normalizedAuthUserId,
      projectId: normalizedProjectId,
      query,
      after,
      now: normalizeNow(options.now),
    });

    if (!result) {
      return { status: 'not_found' };
    }

    if (
      result.project.isArchived ||
      !canContributeToBubblophyProject(result.project.role)
    ) {
      return { status: 'forbidden' };
    }

    return {
      status: 'success',
      project: {
        id: result.project.id,
        key: result.project.key,
        isArchived: false,
      },
      query,
      targets: result.targets,
      nextAfter: result.nextAfter,
    };
  } catch {
    return { status: 'database_unavailable' };
  }
}

/** Normalizes the all-or-nothing stable `(lower(label), id)` cursor. */
function normalizeCursor(
  cursor: BubblophyMcpRunTargetCursor
): BubblophyMcpRunTargetCursor | null {
  const normalizedLabel = cursor.normalizedLabel.trim().toLowerCase();
  const id = cursor.id.trim();

  if (
    !normalizedLabel ||
    normalizedLabel.length > cursorLabelMaxLength ||
    !id ||
    id.length > cursorIdMaxLength
  ) {
    return null;
  }

  return { normalizedLabel, id };
}

/** Uses one deterministic ISO timestamp for expiry comparisons. */
function normalizeNow(now?: string) {
  if (!now) {
    return new Date().toISOString();
  }

  const parsed = new Date(now);

  return Number.isFinite(parsed.getTime())
    ? parsed.toISOString()
    : new Date().toISOString();
}

/** Loads the membership-bound Drizzle reader when database access exists. */
async function getDefaultBubblophyMcpRunTargetReader(): Promise<BubblophyMcpRunTargetReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectBubblophyMcpRunTargetsForUser } =
    await import('@/lib/mcp/run-targets-database-read');

  return selectBubblophyMcpRunTargetsForUser;
}
