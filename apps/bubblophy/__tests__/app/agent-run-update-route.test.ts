import type { JsonValue } from '@/drizzle/db/schema';
import type { ReadBubblophyAgentRunContextInput } from '@/lib/agent-runs/agent-context';
import type { UpdateBubblophyAgentRunFromAgentInput } from '@/lib/agent-runs/agent-update';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const readBubblophyAgentRunContextMock = vi.fn();
const updateBubblophyAgentRunFromAgentMock = vi.fn();

vi.mock('@/lib/agent-runs/agent-context', () => ({
  readBubblophyAgentRunContext: (
    input: ReadBubblophyAgentRunContextInput
  ) => readBubblophyAgentRunContextMock(input),
}));

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

function createGetRequest({ token = 'test_agent_token' }: { token?: string } = {}) {
  return new Request('http://bubblophy.test/api/agent-runs/run_bv_12', {
    method: 'GET',
    headers: token
      ? {
          authorization: `Bearer ${token}`,
        }
      : {},
  });
}

describe('GET /api/agent-runs/[runId]', () => {
  beforeEach(() => {
    readBubblophyAgentRunContextMock.mockReset();
  });

  it('passes the bearer token to the agent context service', async () => {
    readBubblophyAgentRunContextMock.mockResolvedValue({
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
          version: 1,
          summary: 'Kontext bereitstellen.',
          steps: [{ id: 'step_1', text: 'GET abrufen' }],
        },
      },
    });

    const { GET } = await import('@/app/api/agent-runs/[runId]/route');
    const response = await GET(createGetRequest(), {
      params: Promise.resolve({ runId: 'run_bv_12' }),
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
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
          version: 1,
          summary: 'Kontext bereitstellen.',
          steps: [{ id: 'step_1', text: 'GET abrufen' }],
        },
      },
    });
    expect(JSON.stringify(body)).not.toContain('token');
    expect(JSON.stringify(body)).not.toContain('authUser');
    expect(readBubblophyAgentRunContextMock).toHaveBeenCalledWith({
      runId: 'run_bv_12',
      bearerToken: 'test_agent_token',
    });
  });

  it('returns route-specific JSON errors instead of login redirects', async () => {
    const { GET } = await import('@/app/api/agent-runs/[runId]/route');

    readBubblophyAgentRunContextMock.mockResolvedValueOnce({
      status: 'invalid',
      reason: 'empty_token',
    });
    readBubblophyAgentRunContextMock.mockResolvedValueOnce({
      status: 'forbidden_scope',
    });
    readBubblophyAgentRunContextMock.mockResolvedValueOnce({
      status: 'project_mismatch',
    });
    readBubblophyAgentRunContextMock.mockResolvedValueOnce({
      status: 'not_found',
    });

    const missingTokenResponse = await GET(createGetRequest({ token: '' }), {
      params: Promise.resolve({ runId: 'run_bv_12' }),
    });
    const missingScopeResponse = await GET(createGetRequest(), {
      params: Promise.resolve({ runId: 'run_bv_12' }),
    });
    const projectMismatchResponse = await GET(createGetRequest(), {
      params: Promise.resolve({ runId: 'run_bv_12' }),
    });
    const notFoundResponse = await GET(createGetRequest(), {
      params: Promise.resolve({ runId: 'run_bv_12' }),
    });

    expect(missingTokenResponse.status).toBe(400);
    expect(missingScopeResponse.status).toBe(403);
    expect(projectMismatchResponse.status).toBe(403);
    expect(notFoundResponse.status).toBe(404);
    await expect(missingScopeResponse.json()).resolves.toEqual({
      status: 'forbidden_scope',
    });
  });

  it('returns forbidden for unavailable tokens', async () => {
    readBubblophyAgentRunContextMock.mockResolvedValue({
      status: 'token_unavailable',
      reason: 'expired',
    });

    const { GET } = await import('@/app/api/agent-runs/[runId]/route');
    const response = await GET(createGetRequest(), {
      params: Promise.resolve({ runId: 'run_bv_12' }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      status: 'token_unavailable',
      reason: 'expired',
    });
  });
});

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
