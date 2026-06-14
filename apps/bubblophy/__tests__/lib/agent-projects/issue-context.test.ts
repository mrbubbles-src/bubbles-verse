import type {
  BubblophyAgentProjectIssuesStore,
  BubblophyAgentProjectIssuesStoreInput,
} from '@/lib/agent-projects/issue-context';

import { readBubblophyAgentProjectIssues } from '@/lib/agent-projects/issue-context';
import { hashBubblophyAgentToken } from '@/lib/agent-tokens/create';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  handler: (
    input: BubblophyAgentProjectIssuesStoreInput
  ) => ReturnType<BubblophyAgentProjectIssuesStore['readProjectIssuesForAgent']>
): BubblophyAgentProjectIssuesStore {
  return {
    readProjectIssuesForAgent: vi.fn(handler),
  };
}

describe('readBubblophyAgentProjectIssues', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid route input before touching the store', async () => {
    const store = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      readBubblophyAgentProjectIssues(
        {
          projectId: '',
          bearerToken: 'test_agent_token',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_project' });
    await expect(
      readBubblophyAgentProjectIssues(
        {
          projectId: 'project_bv',
          bearerToken: '',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_token' });

    expect(store.readProjectIssuesForAgent).not.toHaveBeenCalled();
  });

  it('hashes the bearer token and returns minimal issue context', async () => {
    const readProjectIssuesForAgent = vi.fn<
      (
        input: BubblophyAgentProjectIssuesStoreInput
      ) => ReturnType<BubblophyAgentProjectIssuesStore['readProjectIssuesForAgent']>
    >(async (input) => ({
      status: 'found',
      context: {
        project: {
          id: input.projectId,
          key: 'BV',
          name: 'Bubblesverse',
        },
        issues: [
          {
            id: 'BV-12',
            title: 'Lokalen Agenten mit Issues versorgen',
            description: 'Nur lesen, nichts starten.',
            status: 'ready',
            priority: 'high',
            assignee: 'assigned',
            latestPlan: {
              version: 2,
              summary: 'Issue-Kontext bereitstellen.',
              steps: [{ id: 'step_1', text: 'Offene Issues abrufen' }],
            },
          },
        ],
      },
    }));

    await expect(
      readBubblophyAgentProjectIssues(
        {
          projectId: ' project_bv ',
          bearerToken: ' test_agent_token ',
        },
        { store: { readProjectIssuesForAgent } }
      )
    ).resolves.toEqual({
      status: 'found',
      context: {
        project: {
          id: 'project_bv',
          key: 'BV',
          name: 'Bubblesverse',
        },
        issues: [
          {
            id: 'BV-12',
            title: 'Lokalen Agenten mit Issues versorgen',
            description: 'Nur lesen, nichts starten.',
            status: 'ready',
            priority: 'high',
            assignee: 'assigned',
            latestPlan: {
              version: 2,
              summary: 'Issue-Kontext bereitstellen.',
              steps: [{ id: 'step_1', text: 'Offene Issues abrufen' }],
            },
          },
        ],
      },
    });

    expect(readProjectIssuesForAgent).toHaveBeenCalledWith({
      projectId: 'project_bv',
      tokenHash: hashBubblophyAgentToken('test_agent_token'),
    });
  });

  it('returns token, scope, project, and lookup failures unchanged', async () => {
    const baseInput = {
      projectId: 'project_bv',
      bearerToken: 'test_agent_token',
    };

    await expect(
      readBubblophyAgentProjectIssues(baseInput, {
        store: createStore(async () => ({ status: 'invalid_token' })),
      })
    ).resolves.toEqual({ status: 'invalid_token' });
    await expect(
      readBubblophyAgentProjectIssues(baseInput, {
        store: createStore(async () => ({
          status: 'token_unavailable',
          reason: 'paused',
        })),
      })
    ).resolves.toEqual({ status: 'token_unavailable', reason: 'paused' });
    await expect(
      readBubblophyAgentProjectIssues(baseInput, {
        store: createStore(async () => ({ status: 'forbidden_scope' })),
      })
    ).resolves.toEqual({ status: 'forbidden_scope' });
    await expect(
      readBubblophyAgentProjectIssues(baseInput, {
        store: createStore(async () => ({ status: 'project_mismatch' })),
      })
    ).resolves.toEqual({ status: 'project_mismatch' });
    await expect(
      readBubblophyAgentProjectIssues(baseInput, {
        store: createStore(async () => ({ status: 'not_found' })),
      })
    ).resolves.toEqual({ status: 'not_found' });
  });

  it('returns database_unavailable when no store and no database URL exist', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      readBubblophyAgentProjectIssues({
        projectId: 'project_bv',
        bearerToken: 'test_agent_token',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
