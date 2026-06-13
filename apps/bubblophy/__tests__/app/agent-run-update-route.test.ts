import type { JsonValue } from '@/drizzle/db/schema';
import type { UpdateBubblophyAgentRunFromAgentInput } from '@/lib/agent-runs/agent-update';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const updateBubblophyAgentRunFromAgentMock = vi.fn();

vi.mock('@/lib/agent-runs/agent-update', () => ({
  updateBubblophyAgentRunFromAgent: (
    input: UpdateBubblophyAgentRunFromAgentInput
  ) => updateBubblophyAgentRunFromAgentMock(input),
}));

function createPatchRequest({
  token = 'bubblophy_agent_secret',
  body = { state: 'running', message: 'Agent hat begonnen.' },
}: {
  token?: string;
  body?: Record<string, JsonValue>;
} = {}) {
  return new Request('http://bubblophy.test/api/agent-runs/run_bv_12', {
    method: 'PATCH',
    headers: token
      ? {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        }
      : {
          'content-type': 'application/json',
        },
    body: JSON.stringify(body),
  });
}

describe('PATCH /api/agent-runs/[runId]', () => {
  beforeEach(() => {
    updateBubblophyAgentRunFromAgentMock.mockReset();
  });

  it('passes the bearer token and JSON body to the agent update service', async () => {
    updateBubblophyAgentRunFromAgentMock.mockResolvedValue({
      status: 'updated',
      run: {
        id: 'run_bv_12',
        state: 'running',
      },
    });

    const { PATCH } = await import('@/app/api/agent-runs/[runId]/route');
    const response = await PATCH(createPatchRequest(), {
      params: Promise.resolve({ runId: 'run_bv_12' }),
    });

    await expect(response.json()).resolves.toEqual({
      status: 'updated',
      run: {
        id: 'run_bv_12',
        state: 'running',
      },
    });
    expect(response.status).toBe(200);
    expect(updateBubblophyAgentRunFromAgentMock).toHaveBeenCalledWith({
      runId: 'run_bv_12',
      bearerToken: 'bubblophy_agent_secret',
      state: 'running',
      message: 'Agent hat begonnen.',
      result: undefined,
    });
  });

  it('returns unauthorized for wrong bearer tokens', async () => {
    updateBubblophyAgentRunFromAgentMock.mockResolvedValue({
      status: 'invalid_token',
    });

    const { PATCH } = await import('@/app/api/agent-runs/[runId]/route');
    const response = await PATCH(createPatchRequest(), {
      params: Promise.resolve({ runId: 'run_bv_12' }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      status: 'invalid_token',
    });
  });

  it('returns forbidden for missing scope, paused tokens, or project mismatch', async () => {
    const { PATCH } = await import('@/app/api/agent-runs/[runId]/route');

    updateBubblophyAgentRunFromAgentMock.mockResolvedValueOnce({
      status: 'forbidden_scope',
    });
    updateBubblophyAgentRunFromAgentMock.mockResolvedValueOnce({
      status: 'token_unavailable',
      reason: 'paused',
    });
    updateBubblophyAgentRunFromAgentMock.mockResolvedValueOnce({
      status: 'project_mismatch',
    });

    await expect(
      PATCH(createPatchRequest(), {
        params: Promise.resolve({ runId: 'run_bv_12' }),
      })
    ).resolves.toHaveProperty('status', 403);
    await expect(
      PATCH(createPatchRequest(), {
        params: Promise.resolve({ runId: 'run_bv_12' }),
      })
    ).resolves.toHaveProperty('status', 403);
    await expect(
      PATCH(createPatchRequest(), {
        params: Promise.resolve({ runId: 'run_bv_12' }),
      })
    ).resolves.toHaveProperty('status', 403);
  });

  it('passes an empty token when the Authorization header is missing', async () => {
    updateBubblophyAgentRunFromAgentMock.mockResolvedValue({
      status: 'invalid',
      reason: 'empty_token',
    });

    const { PATCH } = await import('@/app/api/agent-runs/[runId]/route');
    const response = await PATCH(createPatchRequest({ token: '' }), {
      params: Promise.resolve({ runId: 'run_bv_12' }),
    });

    expect(response.status).toBe(400);
    expect(updateBubblophyAgentRunFromAgentMock).toHaveBeenCalledWith({
      runId: 'run_bv_12',
      bearerToken: '',
      state: 'running',
      message: 'Agent hat begonnen.',
      result: undefined,
    });
  });

  it('returns bad request for malformed JSON without calling the service', async () => {
    const { PATCH } = await import('@/app/api/agent-runs/[runId]/route');
    const response = await PATCH(
      new Request('http://bubblophy.test/api/agent-runs/run_bv_12', {
        method: 'PATCH',
        headers: {
          authorization: 'Bearer bubblophy_agent_secret',
          'content-type': 'application/json',
        },
        body: '{',
      }),
      {
        params: Promise.resolve({ runId: 'run_bv_12' }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      status: 'invalid',
      reason: 'invalid_result',
    });
    expect(updateBubblophyAgentRunFromAgentMock).not.toHaveBeenCalled();
  });

  it('does not pass non-string message values to the service', async () => {
    updateBubblophyAgentRunFromAgentMock.mockResolvedValue({
      status: 'invalid',
      reason: 'invalid_state',
    });

    const { PATCH } = await import('@/app/api/agent-runs/[runId]/route');
    const response = await PATCH(
      createPatchRequest({
        body: {
          state: 12,
          message: 24,
        },
      }),
      {
        params: Promise.resolve({ runId: 'run_bv_12' }),
      }
    );

    expect(response.status).toBe(400);
    expect(updateBubblophyAgentRunFromAgentMock).toHaveBeenCalledWith({
      runId: 'run_bv_12',
      bearerToken: 'bubblophy_agent_secret',
      state: '',
      message: undefined,
      result: undefined,
    });
  });
});
