import type {
  BubblophyAgentRunAgentUpdateStore,
  BubblophyAgentRunAgentUpdateStoreInput,
} from '@/lib/agent-runs/agent-update';

import {
  buildAgentRunUpdatePayload,
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
