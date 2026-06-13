import 'server-only';

import type {
  BubblophyAgentRunState,
  JsonObject,
  JsonValue,
} from '@/drizzle/db/schema';

import { hashBubblophyAgentToken } from '@/lib/agent-tokens/create';

export type BubblophyAgentRunAgentUpdateState =
  | 'running'
  | 'needs_review'
  | 'completed'
  | 'failed';

export interface UpdateBubblophyAgentRunFromAgentInput {
  runId: string;
  bearerToken: string;
  state: string;
  message?: string;
  result?: JsonValue;
}

export interface BubblophyAgentRunAgentUpdateStoreInput {
  runId: string;
  tokenHash: string;
  state: BubblophyAgentRunAgentUpdateState;
  message: string;
  result: JsonValue | null;
}

export interface BubblophyAgentRunAgentUpdateStore {
  updateRunFromAgent(input: BubblophyAgentRunAgentUpdateStoreInput): Promise<
    | {
        status: 'updated';
        run: {
          id: string;
          state: BubblophyAgentRunState;
        };
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
        status: 'invalid_transition';
      }
  >;
}

export type UpdateBubblophyAgentRunFromAgentResult =
  | {
      status: 'updated';
      run: {
        id: string;
        state: BubblophyAgentRunState;
      };
    }
  | {
      status: 'invalid';
      reason:
        | 'empty_run'
        | 'empty_token'
        | 'invalid_state'
        | 'message_too_long'
        | 'invalid_result';
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
      status: 'invalid_transition';
    }
  | {
      status: 'database_unavailable';
    };

export interface UpdateBubblophyAgentRunFromAgentOptions {
  store?: BubblophyAgentRunAgentUpdateStore;
}

const agentUpdateStates = new Set<BubblophyAgentRunAgentUpdateState>([
  'running',
  'needs_review',
  'completed',
  'failed',
]);
const maxAgentRunMessageLength = 1000;

/**
 * Records a status update submitted by a scoped agent token.
 *
 * The service authenticates only by bearer token hash, validates the requested
 * state and bounded payload, and delegates scope/project/state checks to the
 * persistence store. It never executes code or starts workers.
 *
 * @param input Run ID, bearer token, target state, message, and JSON result.
 * @param options Optional store override for tests.
 * @returns Structured result for the API route.
 */
export async function updateBubblophyAgentRunFromAgent(
  input: UpdateBubblophyAgentRunFromAgentInput,
  options: UpdateBubblophyAgentRunFromAgentOptions = {}
): Promise<UpdateBubblophyAgentRunFromAgentResult> {
  const normalized = normalizeAgentRunUpdateInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultAgentUpdateStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  return store.updateRunFromAgent(normalized.input);
}

/**
 * Checks whether a run state can be set by an agent update.
 *
 * @param state Runtime state string from the route body.
 * @returns True when the state is agent-writable.
 */
export function isBubblophyAgentRunAgentUpdateState(
  state: string
): state is BubblophyAgentRunAgentUpdateState {
  return agentUpdateStates.has(state as BubblophyAgentRunAgentUpdateState);
}

/**
 * Validates that a runtime value is JSON-safe for persistence.
 *
 * @param value Route body value to inspect.
 * @returns True for JSON primitives, arrays, and plain objects.
 */
export function isJsonValue(value: JsonValue): value is JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return Number.isFinite(value as number) || typeof value !== 'number';
  }

  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item));
  }

  return Object.values(value).every((item) => isJsonValue(item));
}

/**
 * Builds a JSON audit payload for an agent run status update.
 *
 * @param input Agent update metadata and optional result.
 * @returns JSON object safe for issue events.
 */
export function buildAgentRunUpdatePayload(input: {
  source: 'agent';
  runId: string;
  previousState: BubblophyAgentRunState;
  nextState: BubblophyAgentRunAgentUpdateState;
  message: string;
  result: JsonValue | null;
}): JsonObject {
  return {
    source: input.source,
    runId: input.runId,
    previousState: input.previousState,
    nextState: input.nextState,
    message: input.message,
    result: input.result,
    executionStarted: input.nextState === 'running',
  };
}

/**
 * Converts raw route input into store-safe values.
 *
 * @param input Raw route values.
 * @returns Valid store input or structured validation error.
 */
function normalizeAgentRunUpdateInput(
  input: UpdateBubblophyAgentRunFromAgentInput
):
  | {
      status: 'valid';
      input: BubblophyAgentRunAgentUpdateStoreInput;
    }
  | Extract<UpdateBubblophyAgentRunFromAgentResult, { status: 'invalid' }> {
  const runId = input.runId.trim();
  const bearerToken = input.bearerToken.trim();
  const message = input.message?.trim() ?? '';
  const result = input.result ?? null;

  if (!runId) {
    return { status: 'invalid', reason: 'empty_run' };
  }

  if (!bearerToken) {
    return { status: 'invalid', reason: 'empty_token' };
  }

  if (!isBubblophyAgentRunAgentUpdateState(input.state)) {
    return { status: 'invalid', reason: 'invalid_state' };
  }

  if (message.length > maxAgentRunMessageLength) {
    return { status: 'invalid', reason: 'message_too_long' };
  }

  if (!isJsonValue(result)) {
    return { status: 'invalid', reason: 'invalid_result' };
  }

  return {
    status: 'valid',
    input: {
      runId,
      tokenHash: hashBubblophyAgentToken(bearerToken),
      state: input.state,
      message,
      result,
    },
  };
}

/**
 * Loads the Drizzle store only when database access is configured.
 *
 * @returns Server-only agent update store, or `null`.
 */
async function getDefaultAgentUpdateStore(): Promise<BubblophyAgentRunAgentUpdateStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyAgentRunAgentUpdateStore } =
    await import('@/lib/agent-runs/agent-update-database-write');

  return createDrizzleBubblophyAgentRunAgentUpdateStore();
}
