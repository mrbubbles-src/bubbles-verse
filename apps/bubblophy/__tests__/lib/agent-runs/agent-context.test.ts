import type {
  BubblophyAgentRunContextStore,
  BubblophyAgentRunContextStoreInput,
} from '@/lib/agent-runs/agent-context';

import { readBubblophyAgentRunContext } from '@/lib/agent-runs/agent-context';
import { hashBubblophyAgentToken } from '@/lib/agent-tokens/create';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  handler: (
    input: BubblophyAgentRunContextStoreInput
  ) => ReturnType<BubblophyAgentRunContextStore['readRunContextForAgent']>
): BubblophyAgentRunContextStore {
  return {
    readRunContextForAgent: vi.fn(handler),
  };
}

describe('readBubblophyAgentRunContext', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid route input before touching the store', async () => {
    const store = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      readBubblophyAgentRunContext(
        {
          runId: '',
          bearerToken: 'test_agent_token',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_run' });
    await expect(
      readBubblophyAgentRunContext(
        {
          runId: 'run_bv_12',
          bearerToken: '',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_token' });

    expect(store.readRunContextForAgent).not.toHaveBeenCalled();
  });

  it('hashes the bearer token and returns minimal run context', async () => {
    const readRunContextForAgent = vi.fn<
      (
        input: BubblophyAgentRunContextStoreInput
      ) => ReturnType<BubblophyAgentRunContextStore['readRunContextForAgent']>
    >(async (input) => ({
      status: 'found',
      context: {
        run: {
          id: input.runId,
          state: 'approved',
          updatedAt: '2026-06-14T10:00:00.000Z',
        },
        project: {
          id: 'project_bv',
          key: 'BV',
          name: 'Bubblesverse',
        },
        issue: {
          id: 'BV-12',
          title: 'Agent-Kontext lesen',
          status: 'ready',
          priority: 'high',
        },
        latestPlan: {
          version: 3,
          summary: 'Lokalen Agenten mit Kontext versorgen.',
          steps: [{ id: 'step_1', text: 'Run-Kontext abrufen' }],
        },
      },
    }));

    await expect(
      readBubblophyAgentRunContext(
        {
          runId: ' run_bv_12 ',
          bearerToken: ' test_agent_token ',
        },
        { store: { readRunContextForAgent } }
      )
    ).resolves.toEqual({
      status: 'found',
      context: {
        run: {
          id: 'run_bv_12',
          state: 'approved',
          updatedAt: '2026-06-14T10:00:00.000Z',
        },
        project: {
          id: 'project_bv',
          key: 'BV',
          name: 'Bubblesverse',
        },
        issue: {
          id: 'BV-12',
          title: 'Agent-Kontext lesen',
          status: 'ready',
          priority: 'high',
        },
        latestPlan: {
          version: 3,
          summary: 'Lokalen Agenten mit Kontext versorgen.',
          steps: [{ id: 'step_1', text: 'Run-Kontext abrufen' }],
        },
      },
    });

    expect(readRunContextForAgent).toHaveBeenCalledWith({
      runId: 'run_bv_12',
      tokenHash: hashBubblophyAgentToken('test_agent_token'),
    });
  });

  it('returns token, scope, project, and lookup failures unchanged', async () => {
    const baseInput = {
      runId: 'run_bv_12',
      bearerToken: 'test_agent_token',
    };

    await expect(
      readBubblophyAgentRunContext(baseInput, {
        store: createStore(async () => ({ status: 'invalid_token' })),
      })
    ).resolves.toEqual({ status: 'invalid_token' });
    await expect(
      readBubblophyAgentRunContext(baseInput, {
        store: createStore(async () => ({
          status: 'token_unavailable',
          reason: 'revoked',
        })),
      })
    ).resolves.toEqual({ status: 'token_unavailable', reason: 'revoked' });
    await expect(
      readBubblophyAgentRunContext(baseInput, {
        store: createStore(async () => ({ status: 'forbidden_scope' })),
      })
    ).resolves.toEqual({ status: 'forbidden_scope' });
    await expect(
      readBubblophyAgentRunContext(baseInput, {
        store: createStore(async () => ({ status: 'project_mismatch' })),
      })
    ).resolves.toEqual({ status: 'project_mismatch' });
    await expect(
      readBubblophyAgentRunContext(baseInput, {
        store: createStore(async () => ({ status: 'not_found' })),
      })
    ).resolves.toEqual({ status: 'not_found' });
  });

  it('returns database_unavailable when no store and no database URL exist', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      readBubblophyAgentRunContext({
        runId: 'run_bv_12',
        bearerToken: 'test_agent_token',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
