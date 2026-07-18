import 'server-only';

import type {
  BubblophyAgentTokenScope,
  BubblophyAgentTokenState,
} from '@/drizzle/db/schema';
import type { BubblophyMcpProjectRole } from '@/lib/mcp/projects';

import { isExecutableBubblophyAgentToken } from '@/lib/agent-tokens/execution';
import { canContributeToBubblophyProject } from '@/lib/projects/permissions';

export interface BubblophyMcpRunTargetCandidate {
  id: string;
  label: string;
  state: BubblophyAgentTokenState;
  scopes: BubblophyAgentTokenScope[];
  expiresAt: string | null;
}

export interface BubblophyMcpRunTargetReadResult {
  project: {
    id: string;
    key: string;
    isArchived: boolean;
    role: BubblophyMcpProjectRole;
  };
  candidates: BubblophyMcpRunTargetCandidate[];
}

export interface BubblophyMcpRunTargetReadInput {
  authUserId: string;
  projectId: string;
}

export type BubblophyMcpRunTargetReader = (
  input: BubblophyMcpRunTargetReadInput
) => Promise<BubblophyMcpRunTargetReadResult | null>;

export interface ListBubblophyMcpRunTargetsInput {
  projectId: string;
}

interface ListBubblophyMcpRunTargetsOptions {
  readTargets?: BubblophyMcpRunTargetReader;
  now?: string;
}

export type ListBubblophyMcpRunTargetsResult =
  | {
      status: 'success';
      project: { id: string; key: string; isArchived: false };
      targets: { id: string; label: string }[];
    }
  | {
      status: 'invalid';
      reason: 'empty_auth_user' | 'empty_project';
    }
  | { status: 'not_found' }
  | { status: 'forbidden' }
  | { status: 'database_unavailable' };

/**
 * Lists public executable run targets for one active contributor project.
 *
 * Lifecycle, scopes, expiry, hashes, and actor data remain internal. The MCP
 * boundary returns only the token ID needed for later selection and its label.
 *
 * @param authUserId Verified OAuth subject mapped to the Bubblophy user.
 * @param input Visible project ID selected by the MCP client.
 * @param options Optional reader and clock dependencies for tests.
 * @returns Public run targets or a safe structured failure.
 */
export async function listBubblophyMcpRunTargets(
  authUserId: string,
  input: ListBubblophyMcpRunTargetsInput,
  options: ListBubblophyMcpRunTargetsOptions = {}
): Promise<ListBubblophyMcpRunTargetsResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedProjectId = input.projectId.trim();

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (!normalizedProjectId) {
    return { status: 'invalid', reason: 'empty_project' };
  }

  const readTargets =
    options.readTargets ?? (await getDefaultBubblophyMcpRunTargetReader());

  if (!readTargets) {
    return { status: 'database_unavailable' };
  }

  try {
    const result = await readTargets({
      authUserId: normalizedAuthUserId,
      projectId: normalizedProjectId,
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

    const now = options.now ?? new Date().toISOString();
    const targets = result.candidates
      .filter((candidate) => isExecutableBubblophyAgentToken(candidate, now))
      .map(({ id, label }) => ({ id, label }))
      .sort((left, right) => left.label.localeCompare(right.label));

    return {
      status: 'success',
      project: {
        id: result.project.id,
        key: result.project.key,
        isArchived: false,
      },
      targets,
    };
  } catch {
    return { status: 'database_unavailable' };
  }
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
