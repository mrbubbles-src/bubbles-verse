import type { ReadBubblophyAgentProjectIssuesInput } from '@/lib/agent-projects/issue-context';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const readBubblophyAgentProjectIssuesMock = vi.fn();

vi.mock('@/lib/agent-projects/issue-context', () => ({
  readBubblophyAgentProjectIssues: (
    input: ReadBubblophyAgentProjectIssuesInput
  ) => readBubblophyAgentProjectIssuesMock(input),
}));

function createGetRequest({ token = 'test_agent_token' }: { token?: string } = {}) {
  return new Request(
    'http://bubblophy.test/api/agent-projects/project_bv/issues',
    {
      method: 'GET',
      headers: token
        ? {
            authorization: `Bearer ${token}`,
          }
        : {},
    }
  );
}

describe('GET /api/agent-projects/[projectId]/issues', () => {
  beforeEach(() => {
    readBubblophyAgentProjectIssuesMock.mockReset();
  });

  it('passes the bearer token to the agent project issue service', async () => {
    readBubblophyAgentProjectIssuesMock.mockResolvedValue({
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
              version: 1,
              summary: 'Kontext bereitstellen.',
              steps: [{ id: 'step_1', text: 'GET abrufen' }],
            },
          },
        ],
      },
    });

    const { GET } = await import(
      '@/app/api/agent-projects/[projectId]/issues/route'
    );
    const response = await GET(createGetRequest(), {
      params: Promise.resolve({ projectId: 'project_bv' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
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
              version: 1,
              summary: 'Kontext bereitstellen.',
              steps: [{ id: 'step_1', text: 'GET abrufen' }],
            },
          },
        ],
      },
    });
    expect(JSON.stringify(body)).not.toContain('token');
    expect(JSON.stringify(body)).not.toContain('authUser');
    expect(readBubblophyAgentProjectIssuesMock).toHaveBeenCalledWith({
      projectId: 'project_bv',
      bearerToken: 'test_agent_token',
    });
  });

  it('returns route-specific JSON errors instead of login redirects', async () => {
    const { GET } = await import(
      '@/app/api/agent-projects/[projectId]/issues/route'
    );

    readBubblophyAgentProjectIssuesMock.mockResolvedValueOnce({
      status: 'invalid',
      reason: 'empty_token',
    });
    readBubblophyAgentProjectIssuesMock.mockResolvedValueOnce({
      status: 'invalid_token',
    });
    readBubblophyAgentProjectIssuesMock.mockResolvedValueOnce({
      status: 'forbidden_scope',
    });
    readBubblophyAgentProjectIssuesMock.mockResolvedValueOnce({
      status: 'project_mismatch',
    });
    readBubblophyAgentProjectIssuesMock.mockResolvedValueOnce({
      status: 'not_found',
    });

    const missingTokenResponse = await GET(createGetRequest({ token: '' }), {
      params: Promise.resolve({ projectId: 'project_bv' }),
    });
    const invalidTokenResponse = await GET(createGetRequest(), {
      params: Promise.resolve({ projectId: 'project_bv' }),
    });
    const missingScopeResponse = await GET(createGetRequest(), {
      params: Promise.resolve({ projectId: 'project_bv' }),
    });
    const projectMismatchResponse = await GET(createGetRequest(), {
      params: Promise.resolve({ projectId: 'project_bv' }),
    });
    const notFoundResponse = await GET(createGetRequest(), {
      params: Promise.resolve({ projectId: 'project_bv' }),
    });

    expect(missingTokenResponse.status).toBe(401);
    expect(invalidTokenResponse.status).toBe(401);
    expect(missingScopeResponse.status).toBe(403);
    expect(projectMismatchResponse.status).toBe(403);
    expect(notFoundResponse.status).toBe(404);
    await expect(invalidTokenResponse.json()).resolves.toEqual({
      status: 'invalid_token',
    });
  });

  it('returns forbidden for unavailable tokens and unavailable database responses', async () => {
    const { GET } = await import(
      '@/app/api/agent-projects/[projectId]/issues/route'
    );

    readBubblophyAgentProjectIssuesMock.mockResolvedValueOnce({
      status: 'token_unavailable',
      reason: 'revoked',
    });
    readBubblophyAgentProjectIssuesMock.mockResolvedValueOnce({
      status: 'token_unavailable',
      reason: 'paused',
    });
    readBubblophyAgentProjectIssuesMock.mockResolvedValueOnce({
      status: 'token_unavailable',
      reason: 'expired',
    });
    readBubblophyAgentProjectIssuesMock.mockResolvedValueOnce({
      status: 'database_unavailable',
    });

    await expect(
      GET(createGetRequest(), {
        params: Promise.resolve({ projectId: 'project_bv' }),
      })
    ).resolves.toHaveProperty('status', 403);
    await expect(
      GET(createGetRequest(), {
        params: Promise.resolve({ projectId: 'project_bv' }),
      })
    ).resolves.toHaveProperty('status', 403);
    await expect(
      GET(createGetRequest(), {
        params: Promise.resolve({ projectId: 'project_bv' }),
      })
    ).resolves.toHaveProperty('status', 403);
    await expect(
      GET(createGetRequest(), {
        params: Promise.resolve({ projectId: 'project_bv' }),
      })
    ).resolves.toHaveProperty('status', 503);
  });
});
