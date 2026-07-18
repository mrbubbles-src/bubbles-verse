import 'server-only';

import type { AgentRunSummary } from '@/lib/dashboard/types';

export interface RequestBubblophyAgentRunInput {
  authUserId: string;
  oauthClientId?: string;
  issueId: string;
  agentTokenId: string;
  instructions?: string;
}

export interface BubblophyAgentRunRequestStoreInput {
  authUserId: string;
  oauthClientId?: string;
  issueId: string;
  agentTokenId: string;
  instructions: string;
}

export interface BubblophyAgentRunRequestStoreResult {
  id: string;
  issueId: string;
  agentTokenLabel: string;
  requestedByAuthUserId: string;
  instructions: string;
  createdAt: string;
}

export interface BubblophyAgentRunRequestStore {
  requestAgentRun(input: BubblophyAgentRunRequestStoreInput): Promise<
    | {
        status: 'requested';
        run: BubblophyAgentRunRequestStoreResult;
      }
    | {
        status: 'not_found';
      }
    | {
        status: 'forbidden';
      }
    | {
        status: 'token_unavailable';
      }
  >;
}

export type RequestBubblophyAgentRunResult =
  | {
      status: 'requested';
      run: AgentRunSummary;
      createdAt: string;
    }
  | {
      status: 'invalid';
      reason: 'empty_issue' | 'empty_agent_token' | 'instructions_too_long';
    }
  | {
      status: 'not_found';
    }
  | {
      status: 'forbidden';
    }
  | {
      status: 'token_unavailable';
    }
  | {
      status: 'database_unavailable';
    };

export interface RequestBubblophyAgentRunOptions {
  store?: BubblophyAgentRunRequestStore;
}

export const bubblophyAgentRunRequestLimits = {
  maxInstructionsLength: 500,
} as const;

/**
 * Requests a human-approved agent run without executing any agent work.
 *
 * The operation validates bounded human input, delegates membership and token
 * checks to the server-only store, and returns a dashboard run summary in the
 * waiting state. It never starts a worker, tool call, or polling loop.
 *
 * @param input Authenticated user ID, issue key, agent token ID, and note.
 * @param options Optional store override for tests.
 * @returns Structured result for the dashboard request dialog.
 */
export async function requestBubblophyAgentRun(
  input: RequestBubblophyAgentRunInput,
  options: RequestBubblophyAgentRunOptions = {}
): Promise<RequestBubblophyAgentRunResult> {
  const normalized = normalizeAgentRunRequestInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultRunRequestStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const result = await store.requestAgentRun(normalized.input);

  if (result.status !== 'requested') {
    return result;
  }

  return {
    status: 'requested',
    run: mapRequestedAgentRunToSummary(result.run),
    createdAt: result.run.createdAt,
  };
}

/**
 * Maps a persisted requested run into the dashboard summary DTO.
 *
 * @param run Store result for a newly requested run.
 * @returns Run summary for immediate local queue insertion.
 */
export function mapRequestedAgentRunToSummary(
  run: BubblophyAgentRunRequestStoreResult
): AgentRunSummary {
  return {
    id: run.id,
    issueId: run.issueId,
    agentLabel: run.agentTokenLabel,
    state: 'wartet',
    requestedBy: 'Mensch',
    lastEvent: run.instructions
      ? `Anfrage gespeichert: ${run.instructions}`
      : 'Anfrage gespeichert, keine Ausführung gestartet.',
  };
}

/**
 * Converts raw action input into store-safe values.
 *
 * @param input Raw request input from the server action.
 * @returns Valid store input or structured validation error.
 */
function normalizeAgentRunRequestInput(input: RequestBubblophyAgentRunInput):
  | {
      status: 'valid';
      input: BubblophyAgentRunRequestStoreInput;
    }
  | Extract<RequestBubblophyAgentRunResult, { status: 'invalid' }> {
  const issueId = input.issueId.trim();
  const agentTokenId = input.agentTokenId.trim();
  const instructions = input.instructions?.trim() ?? '';

  if (!issueId) {
    return { status: 'invalid', reason: 'empty_issue' };
  }

  if (!agentTokenId) {
    return { status: 'invalid', reason: 'empty_agent_token' };
  }

  if (
    instructions.length > bubblophyAgentRunRequestLimits.maxInstructionsLength
  ) {
    return { status: 'invalid', reason: 'instructions_too_long' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      oauthClientId: input.oauthClientId?.trim() || undefined,
      issueId,
      agentTokenId,
      instructions,
    },
  };
}

/**
 * Loads the Drizzle-backed run request store only with database config.
 *
 * @returns Server-only run request store, or `null` without database access.
 */
async function getDefaultRunRequestStore(): Promise<BubblophyAgentRunRequestStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyAgentRunRequestStore } =
    await import('@/lib/agent-runs/request-database-write');

  return createDrizzleBubblophyAgentRunRequestStore();
}
