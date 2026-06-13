import type {
  BubblophyAgentRunHumanTransitionStore,
  BubblophyAgentRunHumanTransitionStoreInput,
} from '@/lib/agent-runs/human-transition';

import {
  mapTransitionedRunToSummary,
  transitionBubblophyAgentRun,
} from '@/lib/agent-runs/human-transition';
import { buildBubblophyAgentRunHumanEventInsert } from '@/lib/agent-runs/human-transition-database-write';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  handler: (
    input: BubblophyAgentRunHumanTransitionStoreInput
  ) => ReturnType<BubblophyAgentRunHumanTransitionStore['transitionRun']>
): BubblophyAgentRunHumanTransitionStore {
  return {
    transitionRun: vi.fn(handler),
  };
}

describe('transitionBubblophyAgentRun', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid input before touching the store', async () => {
    const store = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      transitionBubblophyAgentRun(
        {
          authUserId: 'user_owner',
          runId: '   ',
          decision: 'approve',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_run' });
    await expect(
      transitionBubblophyAgentRun(
        {
          authUserId: 'user_owner',
          runId: 'run_bv_12',
          decision: 'start' as 'approve',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_decision' });

    expect(store.transitionRun).not.toHaveBeenCalled();
  });

  it('passes normalized human decisions to the store', async () => {
    const transitionRun = vi.fn<
      (
        input: BubblophyAgentRunHumanTransitionStoreInput
      ) => ReturnType<BubblophyAgentRunHumanTransitionStore['transitionRun']>
    >(async (input) => ({
      status: 'updated',
      run: {
        id: input.runId,
        issueId: 'BV-12',
        agentTokenLabel: 'codex-local-lio',
        state: 'approved',
        message: 'Run BV-12 wurde menschlich freigegeben.',
      },
    }));

    await expect(
      transitionBubblophyAgentRun(
        {
          authUserId: 'user_owner',
          runId: ' run_bv_12 ',
          decision: 'approve',
        },
        { store: { transitionRun } }
      )
    ).resolves.toEqual({
      status: 'updated',
      run: {
        id: 'run_bv_12',
        issueId: 'BV-12',
        agentLabel: 'codex-local-lio',
        state: 'freigegeben',
        requestedBy: 'Mensch',
        lastEvent: 'Run BV-12 wurde menschlich freigegeben.',
      },
    });

    expect(transitionRun).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      runId: 'run_bv_12',
      decision: 'approve',
    });
  });

  it('returns membership and transition failures unchanged', async () => {
    await expect(
      transitionBubblophyAgentRun(
        {
          authUserId: 'user_viewer',
          runId: 'run_bv_12',
          decision: 'approve',
        },
        { store: createStore(async () => ({ status: 'forbidden' })) }
      )
    ).resolves.toEqual({ status: 'forbidden' });
    await expect(
      transitionBubblophyAgentRun(
        {
          authUserId: 'user_owner',
          runId: 'run_bv_12',
          decision: 'cancel',
        },
        { store: createStore(async () => ({ status: 'invalid_transition' })) }
      )
    ).resolves.toEqual({ status: 'invalid_transition' });
  });

  it('returns database_unavailable when no store and no database URL exist', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      transitionBubblophyAgentRun({
        authUserId: 'user_owner',
        runId: 'run_bv_12',
        decision: 'approve',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});

describe('Bubblophy human run transition helpers', () => {
  it('maps cancelled runs into explicit dashboard summaries', () => {
    expect(
      mapTransitionedRunToSummary({
        id: 'run_bv_12',
        issueId: 'BV-12',
        agentTokenLabel: 'codex-local-lio',
        state: 'cancelled',
        message: 'Run BV-12 wurde menschlich abgebrochen.',
      })
    ).toEqual({
      id: 'run_bv_12',
      issueId: 'BV-12',
      agentLabel: 'codex-local-lio',
      state: 'abgebrochen',
      requestedBy: 'Mensch',
      lastEvent: 'Run BV-12 wurde menschlich abgebrochen.',
    });
  });

  it('builds human run audit events without implying execution', () => {
    expect(
      buildBubblophyAgentRunHumanEventInsert({
        issueDatabaseId: 'issue_bv_12',
        issueId: 'BV-12',
        runId: 'run_bv_12',
        authUserId: 'user_owner',
        previousState: 'requested',
        nextState: 'approved',
        decision: 'approve',
      })
    ).toEqual({
      issueId: 'issue_bv_12',
      eventType: 'agent_run_event',
      actorAuthUserId: 'user_owner',
      actorAgentTokenId: null,
      agentRunId: 'run_bv_12',
      summary: 'Run BV-12 menschlich freigegeben.',
      payload: {
        source: 'human',
        issueId: 'BV-12',
        runId: 'run_bv_12',
        previousState: 'requested',
        nextState: 'approved',
        decision: 'approve',
        executionStarted: false,
      },
    });
  });
});
