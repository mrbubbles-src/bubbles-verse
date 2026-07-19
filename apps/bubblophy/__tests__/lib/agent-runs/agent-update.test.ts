import type { JsonObject, JsonValue } from '@/drizzle/db/schema';
import type {
  BubblophyAgentRunAgentUpdateStore,
  BubblophyAgentRunAgentUpdateStoreInput,
} from '@/lib/agent-runs/agent-update';

import {
  buildAgentRunUpdatePayload,
  MAX_AGENT_RUN_RESULT_BYTES,
  MAX_AGENT_RUN_RESULT_DEPTH,
  MAX_AGENT_RUN_RESULT_NODES,
  updateBubblophyAgentRunFromAgent,
} from '@/lib/agent-runs/agent-update';
import {
  buildBubblophyAgentRunAgentEventInsert,
  canAgentTransitionRun,
} from '@/lib/agent-runs/agent-update-database-write';
import { hashBubblophyAgentToken } from '@/lib/agent-tokens/create';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  handler: (
    input: BubblophyAgentRunAgentUpdateStoreInput
  ) => ReturnType<BubblophyAgentRunAgentUpdateStore['updateRunFromAgent']>
): BubblophyAgentRunAgentUpdateStore {
  return {
    updateRunFromAgent: vi.fn(handler),
  };
}

describe('updateBubblophyAgentRunFromAgent', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid route input before touching the store', async () => {
    const store = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      updateBubblophyAgentRunFromAgent(
        {
          runId: '',
          bearerToken: 'bubblophy_agent_secret',
          state: 'running',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_run' });
    await expect(
      updateBubblophyAgentRunFromAgent(
        {
          runId: 'run_bv_12',
          bearerToken: '',
          state: 'running',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_token' });
    await expect(
      updateBubblophyAgentRunFromAgent(
        {
          runId: 'run_bv_12',
          bearerToken: 'bubblophy_agent_secret',
          state: 'requested',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_state' });
    await expect(
      updateBubblophyAgentRunFromAgent(
        {
          runId: 'run_bv_12',
          bearerToken: 'bubblophy_agent_secret',
          state: 'running',
          message: 'x'.repeat(1001),
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'message_too_long' });

    expect(store.updateRunFromAgent).not.toHaveBeenCalled();
  });

  it('hashes the bearer token and passes bounded update data to the store', async () => {
    const updateRunFromAgent = vi.fn<
      (
        input: BubblophyAgentRunAgentUpdateStoreInput
      ) => ReturnType<BubblophyAgentRunAgentUpdateStore['updateRunFromAgent']>
    >(async (input) => ({
      status: 'updated',
      run: {
        id: input.runId,
        state: input.state,
      },
    }));

    await expect(
      updateBubblophyAgentRunFromAgent(
        {
          runId: ' run_bv_12 ',
          bearerToken: ' bubblophy_agent_secret ',
          state: 'running',
          message: '  Agent hat begonnen.  ',
          result: { phase: 'checkout-skipped' },
        },
        { store: { updateRunFromAgent } }
      )
    ).resolves.toEqual({
      status: 'updated',
      run: {
        id: 'run_bv_12',
        state: 'running',
      },
    });

    expect(updateRunFromAgent).toHaveBeenCalledWith({
      runId: 'run_bv_12',
      tokenHash: hashBubblophyAgentToken('bubblophy_agent_secret'),
      state: 'running',
      message: 'Agent hat begonnen.',
      result: { phase: 'checkout-skipped' },
    });
  });

  it('accepts the exact result byte, depth, and node boundaries', async () => {
    const updateRunFromAgent = vi.fn<
      (
        input: BubblophyAgentRunAgentUpdateStoreInput
      ) => ReturnType<BubblophyAgentRunAgentUpdateStore['updateRunFromAgent']>
    >(async () => ({
      status: 'updated',
      run: { id: 'run_bv_12', state: 'running' },
    }));
    let depthBoundary: JsonValue = 'leaf';

    for (let depth = 0; depth < MAX_AGENT_RUN_RESULT_DEPTH; depth += 1) {
      depthBoundary = { nested: depthBoundary };
    }

    const exactByteResult = 'x'.repeat(MAX_AGENT_RUN_RESULT_BYTES - 2);
    const exactNodeResult = Array.from(
      { length: MAX_AGENT_RUN_RESULT_NODES - 1 },
      () => null
    );

    for (const result of [exactByteResult, depthBoundary, exactNodeResult]) {
      await expect(
        updateBubblophyAgentRunFromAgent(
          {
            runId: 'run_bv_12',
            bearerToken: 'bubblophy_agent_secret',
            state: 'running',
            result,
          },
          { store: { updateRunFromAgent } }
        )
      ).resolves.toHaveProperty('status', 'updated');
    }

    expect(updateRunFromAgent).toHaveBeenCalledTimes(3);
  });

  it('rejects oversized, too deep, too broad, cyclic, and data-unsafe results', async () => {
    const store = createStore(async () => {
      throw new Error('store should not be called');
    });
    let tooDeep: JsonValue = 'leaf';

    for (let depth = 0; depth <= MAX_AGENT_RUN_RESULT_DEPTH; depth += 1) {
      tooDeep = { nested: tooDeep };
    }

    const cyclic: JsonObject = {};
    cyclic.self = cyclic;
    const sparse: JsonValue[] = [];
    sparse.length = 1;
    const accessor: JsonObject = {};
    Object.defineProperty(accessor, 'secret', {
      enumerable: true,
      get: () => 'not read',
    });
    const invalidResults: JsonValue[] = [
      '🙂'.repeat(Math.ceil(MAX_AGENT_RUN_RESULT_BYTES / 4)),
      tooDeep,
      Array.from({ length: MAX_AGENT_RUN_RESULT_NODES }, () => null),
      cyclic,
      sparse,
      accessor,
      new Date() as object as JsonValue,
    ];

    for (const result of invalidResults) {
      await expect(
        updateBubblophyAgentRunFromAgent(
          {
            runId: 'run_bv_12',
            bearerToken: 'bubblophy_agent_secret',
            state: 'running',
            result,
          },
          { store }
        )
      ).resolves.toEqual({ status: 'invalid', reason: 'invalid_result' });
    }

    expect(store.updateRunFromAgent).not.toHaveBeenCalled();
  });

  it('stores a detached plain snapshot instead of a proxy-backed result', async () => {
    const proxyResult = new Proxy<JsonObject>(
      {},
      {
        get(target, property, receiver) {
          if (property === 'toJSON') {
            return () => 'x'.repeat(MAX_AGENT_RUN_RESULT_BYTES * 2);
          }

          return Reflect.get(target, property, receiver) as JsonValue;
        },
      }
    );
    const updateRunFromAgent = vi.fn<
      (
        input: BubblophyAgentRunAgentUpdateStoreInput
      ) => ReturnType<BubblophyAgentRunAgentUpdateStore['updateRunFromAgent']>
    >(async () => ({
      status: 'updated',
      run: { id: 'run_bv_12', state: 'running' },
    }));

    await expect(
      updateBubblophyAgentRunFromAgent(
        {
          runId: 'run_bv_12',
          bearerToken: 'bubblophy_agent_secret',
          state: 'running',
          result: proxyResult,
        },
        { store: { updateRunFromAgent } }
      )
    ).resolves.toHaveProperty('status', 'updated');

    const storedResult = updateRunFromAgent.mock.calls[0]?.[0].result;

    expect(storedResult).not.toBe(proxyResult);
    expect(JSON.stringify(storedResult)).toBe('{}');
  });

  it('returns token, scope, project, and transition failures unchanged', async () => {
    const baseInput = {
      runId: 'run_bv_12',
      bearerToken: 'bubblophy_agent_secret',
      state: 'running',
    };

    await expect(
      updateBubblophyAgentRunFromAgent(baseInput, {
        store: createStore(async () => ({ status: 'invalid_token' })),
      })
    ).resolves.toEqual({ status: 'invalid_token' });
    await expect(
      updateBubblophyAgentRunFromAgent(baseInput, {
        store: createStore(async () => ({
          status: 'token_unavailable',
          reason: 'paused',
        })),
      })
    ).resolves.toEqual({ status: 'token_unavailable', reason: 'paused' });
    await expect(
      updateBubblophyAgentRunFromAgent(baseInput, {
        store: createStore(async () => ({ status: 'forbidden_scope' })),
      })
    ).resolves.toEqual({ status: 'forbidden_scope' });
    await expect(
      updateBubblophyAgentRunFromAgent(baseInput, {
        store: createStore(async () => ({ status: 'project_mismatch' })),
      })
    ).resolves.toEqual({ status: 'project_mismatch' });
    await expect(
      updateBubblophyAgentRunFromAgent(baseInput, {
        store: createStore(async () => ({ status: 'invalid_transition' })),
      })
    ).resolves.toEqual({ status: 'invalid_transition' });
  });

  it('returns database_unavailable when no store and no database URL exist', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      updateBubblophyAgentRunFromAgent({
        runId: 'run_bv_12',
        bearerToken: 'bubblophy_agent_secret',
        state: 'running',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});

describe('Bubblophy agent run update helpers', () => {
  it('allows only approved/running/review agent state transitions', () => {
    expect(canAgentTransitionRun('approved', 'running')).toBe(true);
    expect(canAgentTransitionRun('running', 'needs_review')).toBe(true);
    expect(canAgentTransitionRun('running', 'completed')).toBe(true);
    expect(canAgentTransitionRun('needs_review', 'failed')).toBe(true);
    expect(canAgentTransitionRun('requested', 'running')).toBe(false);
    expect(canAgentTransitionRun('completed', 'running')).toBe(false);
  });

  it('builds agent audit events with token actor metadata', () => {
    expect(
      buildBubblophyAgentRunAgentEventInsert({
        issueDatabaseId: 'issue_bv_12',
        issueId: 'BV-12',
        runId: 'run_bv_12',
        agentTokenId: 'token_codex',
        previousState: 'approved',
        nextState: 'running',
        message: 'Agent hat begonnen.',
        result: { phase: 'started' },
      })
    ).toEqual({
      issueId: 'issue_bv_12',
      eventType: 'agent_run_event',
      actorAuthUserId: null,
      actorAgentTokenId: 'token_codex',
      agentRunId: 'run_bv_12',
      summary: 'Agent-Run BV-12: approved → running.',
      payload: {
        source: 'agent',
        runId: 'run_bv_12',
        previousState: 'approved',
        nextState: 'running',
        message: 'Agent hat begonnen.',
        result: { phase: 'started' },
        executionStarted: true,
      },
    });
    expect(
      buildAgentRunUpdatePayload({
        source: 'agent',
        runId: 'run_bv_12',
        previousState: 'running',
        nextState: 'completed',
        message: '',
        result: null,
      })
    ).toEqual({
      source: 'agent',
      runId: 'run_bv_12',
      previousState: 'running',
      nextState: 'completed',
      message: '',
      result: null,
      executionStarted: false,
    });
  });
});
