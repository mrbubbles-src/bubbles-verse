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
export const MAX_AGENT_RUN_RESULT_BYTES = 49_152;
export const MAX_AGENT_RUN_RESULT_DEPTH = 12;
export const MAX_AGENT_RUN_RESULT_NODES = 1000;
const invalidJsonSnapshot = Symbol('invalid-json-snapshot');

interface JsonSnapshotState {
  byteLength: number;
  nodeCount: number;
  encoder: TextEncoder;
  seenContainers: WeakSet<object>;
}

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
 * Validates that a runtime value is bounded and JSON-safe for persistence.
 *
 * @param value Route body value to inspect.
 * @returns True for a bounded tree of JSON primitives and data-only containers.
 */
export function isJsonValue(value: JsonValue): value is JsonValue {
  return createBoundedJsonSnapshot(value).status === 'valid';
}

/**
 * Creates the only JSON value that may cross into the persistence store.
 *
 * Capturing descriptor values into fresh containers prevents validated input
 * from changing through proxies or later mutation before serialization.
 *
 * @param value Runtime value submitted as an agent result.
 * @returns A bounded plain snapshot or an invalid marker.
 */
function createBoundedJsonSnapshot(
  value: JsonValue
): { status: 'valid'; value: JsonValue } | { status: 'invalid' } {
  const state: JsonSnapshotState = {
    byteLength: 0,
    nodeCount: 0,
    encoder: new TextEncoder(),
    seenContainers: new WeakSet<object>(),
  };

  try {
    const snapshot = snapshotJsonValue(value, 0, state);

    if (snapshot === invalidJsonSnapshot) {
      return { status: 'invalid' };
    }

    return { status: 'valid', value: snapshot };
  } catch {
    return { status: 'invalid' };
  }
}

/**
 * Validates and copies one JSON node into fresh data-only containers.
 *
 * @param value Current runtime node captured from a data descriptor.
 * @param depth Current depth with the result root at zero.
 * @param state Shared limits and seen-container registry.
 * @returns A detached JSON node or the invalid sentinel.
 */
function snapshotJsonValue(
  value: JsonValue,
  depth: number,
  state: JsonSnapshotState
): JsonValue | typeof invalidJsonSnapshot {
  state.nodeCount += 1;

  if (
    state.nodeCount > MAX_AGENT_RUN_RESULT_NODES ||
    depth > MAX_AGENT_RUN_RESULT_DEPTH
  ) {
    return invalidJsonSnapshot;
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    state.byteLength += getJsonTokenByteLength(value, state.encoder);
    return state.byteLength <= MAX_AGENT_RUN_RESULT_BYTES
      ? value
      : invalidJsonSnapshot;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return invalidJsonSnapshot;
    }

    state.byteLength += getJsonTokenByteLength(value, state.encoder);
    return state.byteLength <= MAX_AGENT_RUN_RESULT_BYTES
      ? value
      : invalidJsonSnapshot;
  }

  if (typeof value !== 'object' || state.seenContainers.has(value)) {
    return invalidJsonSnapshot;
  }

  state.seenContainers.add(value);

  const isArray = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);

  if (
    (isArray && prototype !== Array.prototype) ||
    (!isArray && prototype !== Object.prototype && prototype !== null)
  ) {
    return invalidJsonSnapshot;
  }

  const keys = Reflect.ownKeys(value);
  const valueKeys = isArray ? keys.filter((key) => key !== 'length') : keys;

  if (
    valueKeys.some((key) => typeof key !== 'string') ||
    (isArray && valueKeys.length !== value.length)
  ) {
    return invalidJsonSnapshot;
  }

  state.byteLength +=
    2 + Math.max(0, valueKeys.length - 1) + (isArray ? 0 : valueKeys.length);

  if (state.byteLength > MAX_AGENT_RUN_RESULT_BYTES) {
    return invalidJsonSnapshot;
  }

  const snapshot: JsonValue[] | JsonObject = isArray
    ? []
    : (Object.create(null) as JsonObject);

  for (let index = 0; index < valueKeys.length; index += 1) {
    const key = isArray ? String(index) : (valueKeys[index] as string);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);

    if (
      !descriptor ||
      !descriptor.enumerable ||
      !Object.hasOwn(descriptor, 'value')
    ) {
      return invalidJsonSnapshot;
    }

    if (!isArray) {
      state.byteLength += getJsonTokenByteLength(key, state.encoder);

      if (state.byteLength > MAX_AGENT_RUN_RESULT_BYTES) {
        return invalidJsonSnapshot;
      }
    }

    const childSnapshot = snapshotJsonValue(
      descriptor.value as JsonValue,
      depth + 1,
      state
    );

    if (childSnapshot === invalidJsonSnapshot) {
      return invalidJsonSnapshot;
    }

    if (Array.isArray(snapshot)) {
      snapshot.push(childSnapshot);
    } else {
      snapshot[key] = childSnapshot;
    }
  }

  return snapshot;
}

/**
 * Measures one primitive after strict JSON serialization.
 *
 * @param value JSON primitive or object-key string to serialize.
 * @param encoder Shared UTF-8 encoder for the validation pass.
 * @returns Serialized UTF-8 byte length including required quotes/escapes.
 */
function getJsonTokenByteLength(
  value: string | number | boolean | null,
  encoder: TextEncoder
) {
  const serialized = JSON.stringify(value);

  return encoder.encode(serialized).byteLength;
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

  const resultSnapshot = createBoundedJsonSnapshot(result);

  if (resultSnapshot.status === 'invalid') {
    return { status: 'invalid', reason: 'invalid_result' };
  }

  return {
    status: 'valid',
    input: {
      runId,
      tokenHash: hashBubblophyAgentToken(bearerToken),
      state: input.state,
      message,
      result: resultSnapshot.value,
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
