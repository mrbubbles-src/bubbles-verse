import 'server-only';

import type {
  BubblophyAgentRunState,
  BubblophyIssuePriority,
  BubblophyIssueStatus,
} from '@/drizzle/db/schema';
import type { IssuePlanStepSummary } from '@/lib/dashboard/types';

import { hashBubblophyAgentToken } from '@/lib/agent-tokens/create';

export interface ReadBubblophyAgentRunContextInput {
  runId: string;
  bearerToken: string;
}

export interface BubblophyAgentRunContext {
  run: {
    id: string;
    state: BubblophyAgentRunState;
    updatedAt: string;
  };
  project: {
    id: string;
    key: string;
    name: string;
  };
  issue: {
    id: string;
    title: string;
    status: BubblophyIssueStatus;
    priority: BubblophyIssuePriority;
  };
  latestPlan: {
    version: number;
    summary: string;
    steps: IssuePlanStepSummary[];
  } | null;
}

export interface BubblophyAgentRunContextStoreInput {
  runId: string;
  tokenHash: string;
}

export interface BubblophyAgentRunContextStore {
  readRunContextForAgent(input: BubblophyAgentRunContextStoreInput): Promise<
    | {
        status: 'found';
        context: BubblophyAgentRunContext;
      }
    | {
        status: 'invalid_token';
      }
    | {
        status: 'token_unavailable';
        reason: 'paused' | 'revoked' | 'expired';
      }
    | {
        status: 'forbidden_scope';
      }
    | {
        status: 'not_found';
      }
    | {
        status: 'project_mismatch';
      }
  >;
}

export type ReadBubblophyAgentRunContextResult =
  | {
      status: 'found';
      context: BubblophyAgentRunContext;
    }
  | {
      status: 'invalid';
      reason: 'empty_run' | 'empty_token';
    }
  | {
      status: 'invalid_token';
    }
  | {
      status: 'token_unavailable';
      reason: 'paused' | 'revoked' | 'expired';
    }
  | {
      status: 'forbidden_scope';
    }
  | {
      status: 'not_found';
    }
  | {
      status: 'project_mismatch';
    }
  | {
      status: 'database_unavailable';
    };

export interface ReadBubblophyAgentRunContextOptions {
  store?: BubblophyAgentRunContextStore;
}

/**
 * Reads the minimal run context a local agent needs before reporting status.
 *
 * The service authenticates by bearer token hash and delegates scope,
 * availability, and project binding checks to the persistence store. It does
 * not expose token metadata, users, members, or audit events.
 *
 * @param input Run ID and bearer token from the agent request.
 * @param options Optional store override for tests.
 * @returns Minimal context or a structured auth/read failure.
 */
export async function readBubblophyAgentRunContext(
  input: ReadBubblophyAgentRunContextInput,
  options: ReadBubblophyAgentRunContextOptions = {}
): Promise<ReadBubblophyAgentRunContextResult> {
  const normalized = normalizeAgentRunContextInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultAgentContextStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  return store.readRunContextForAgent(normalized.input);
}

/**
 * Converts raw route input into store-safe context read values.
 *
 * @param input Raw route values.
 * @returns Valid store input or structured validation error.
 */
function normalizeAgentRunContextInput(
  input: ReadBubblophyAgentRunContextInput
):
  | {
      status: 'valid';
      input: BubblophyAgentRunContextStoreInput;
    }
  | Extract<ReadBubblophyAgentRunContextResult, { status: 'invalid' }> {
  const runId = input.runId.trim();
  const bearerToken = input.bearerToken.trim();

  if (!runId) {
    return { status: 'invalid', reason: 'empty_run' };
  }

  if (!bearerToken) {
    return { status: 'invalid', reason: 'empty_token' };
  }

  return {
    status: 'valid',
    input: {
      runId,
      tokenHash: hashBubblophyAgentToken(bearerToken),
    },
  };
}

/**
 * Loads the Drizzle store only when database access is configured.
 *
 * @returns Server-only agent context store, or `null`.
 */
async function getDefaultAgentContextStore(): Promise<BubblophyAgentRunContextStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyAgentRunContextStore } = await import(
    '@/lib/agent-runs/agent-context-database-read'
  );

  return createDrizzleBubblophyAgentRunContextStore();
}
