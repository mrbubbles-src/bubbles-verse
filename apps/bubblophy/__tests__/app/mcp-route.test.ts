// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const verifyBubblophyMcpTokenMock = vi.fn();
const listBubblophyMcpProjectsMock = vi.fn();
const listBubblophyMcpIssuesMock = vi.fn();
const getBubblophyMcpIssueMock = vi.fn();
const getBubblophyMcpIssuePlanMock = vi.fn();
const getBubblophyMcpRunMock = vi.fn();
const proposeBubblophyMcpPlanMock = vi.fn();
const addBubblophyMcpNoteMock = vi.fn();

vi.mock('@/lib/mcp/auth', () => ({
  verifyBubblophyMcpToken: (request: Request, bearerToken?: string) =>
    verifyBubblophyMcpTokenMock(request, bearerToken),
}));

vi.mock('@/lib/mcp/projects', () => ({
  listBubblophyMcpProjects: (authUserId: string) =>
    listBubblophyMcpProjectsMock(authUserId),
}));

vi.mock('@/lib/mcp/issues', () => ({
  listBubblophyMcpIssues: (
    authUserId: string,
    input: {
      projectId: string;
      limit?: number;
      afterIssueNumber?: number;
    }
  ) => listBubblophyMcpIssuesMock(authUserId, input),
}));

vi.mock('@/lib/mcp/issue-detail', () => ({
  getBubblophyMcpIssue: (
    authUserId: string,
    input: { projectId: string; issueNumber: number }
  ) => getBubblophyMcpIssueMock(authUserId, input),
}));

vi.mock('@/lib/mcp/issue-plan', () => ({
  getBubblophyMcpIssuePlan: (
    authUserId: string,
    input: { projectId: string; issueNumber: number }
  ) => getBubblophyMcpIssuePlanMock(authUserId, input),
}));

vi.mock('@/lib/mcp/run-detail', () => ({
  getBubblophyMcpRun: (
    authUserId: string,
    input: { projectId: string; runId: string }
  ) => getBubblophyMcpRunMock(authUserId, input),
}));

vi.mock('@/lib/mcp/propose-plan', () => ({
  proposeBubblophyMcpPlan: (
    authUserId: string,
    clientId: string,
    input: {
      projectId: string;
      issueNumber: number;
      summary?: string;
      steps: string[];
    }
  ) => proposeBubblophyMcpPlanMock(authUserId, clientId, input),
}));

vi.mock('@/lib/mcp/add-note', () => ({
  addBubblophyMcpNote: (
    authUserId: string,
    clientId: string,
    input: { projectId: string; issueNumber: number; note: string }
  ) => addBubblophyMcpNoteMock(authUserId, clientId, input),
}));

function createInitializeRequest(token?: string) {
  return new Request('https://attacker.example/mcp', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      'x-forwarded-host': 'attacker.example',
      'x-forwarded-proto': 'https',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'Bubblophy route test', version: '1.0.0' },
      },
    }),
  });
}

function createListProjectsRequest() {
  return new Request('https://bubblophy.example.com/mcp', {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      authorization: 'Bearer signed-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'list_projects',
        arguments: {},
      },
    }),
  });
}

function createListIssuesRequest() {
  return new Request('https://bubblophy.example.com/mcp', {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      authorization: 'Bearer signed-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'list_issues',
        arguments: {
          projectId: 'project_bv',
          limit: 25,
          afterIssueNumber: 10,
        },
      },
    }),
  });
}

function createGetIssueRequest() {
  return new Request('https://bubblophy.example.com/mcp', {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      authorization: 'Bearer signed-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'get_issue',
        arguments: { projectId: 'project_bv', issueNumber: 12 },
      },
    }),
  });
}

function createGetIssuePlanRequest() {
  return new Request('https://bubblophy.example.com/mcp', {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      authorization: 'Bearer signed-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'get_issue_plan',
        arguments: { projectId: 'project_bv', issueNumber: 12 },
      },
    }),
  });
}

function createGetRunRequest() {
  return new Request('https://bubblophy.example.com/mcp', {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      authorization: 'Bearer signed-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: {
        name: 'get_run',
        arguments: { projectId: 'project_bv', runId: 'run_bv_12' },
      },
    }),
  });
}

function createProposePlanRequest() {
  return new Request('https://bubblophy.example.com/mcp', {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      authorization: 'Bearer signed-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: {
        name: 'propose_plan',
        arguments: {
          projectId: 'project_bv',
          issueNumber: 12,
          summary: 'Sicherer Entwurf',
          steps: ['Vertrag prüfen'],
        },
      },
    }),
  });
}

function createAddNoteRequest() {
  return new Request('https://bubblophy.example.com/mcp', {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      authorization: 'Bearer signed-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 9,
      method: 'tools/call',
      params: {
        name: 'add_note',
        arguments: {
          projectId: 'project_bv',
          issueNumber: 12,
          note: 'Review abgeschlossen.',
        },
      },
    }),
  });
}

function createListToolsRequest() {
  return new Request('https://bubblophy.example.com/mcp', {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      authorization: 'Bearer signed-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/list',
      params: {},
    }),
  });
}

describe('/mcp', () => {
  beforeEach(() => {
    verifyBubblophyMcpTokenMock.mockReset();
    verifyBubblophyMcpTokenMock.mockResolvedValue(undefined);
    listBubblophyMcpProjectsMock.mockReset();
    listBubblophyMcpProjectsMock.mockResolvedValue({
      status: 'success',
      projects: [],
    });
    listBubblophyMcpIssuesMock.mockReset();
    listBubblophyMcpIssuesMock.mockResolvedValue({
      status: 'success',
      project: { id: 'project_bv', key: 'BV', isArchived: false },
      issues: [],
      nextAfterIssueNumber: null,
    });
    getBubblophyMcpIssueMock.mockReset();
    getBubblophyMcpIssueMock.mockResolvedValue({ status: 'not_found' });
    getBubblophyMcpIssuePlanMock.mockReset();
    getBubblophyMcpIssuePlanMock.mockResolvedValue({ status: 'not_found' });
    getBubblophyMcpRunMock.mockReset();
    getBubblophyMcpRunMock.mockResolvedValue({ status: 'not_found' });
    proposeBubblophyMcpPlanMock.mockReset();
    proposeBubblophyMcpPlanMock.mockResolvedValue({ status: 'not_found' });
    addBubblophyMcpNoteMock.mockReset();
    addBubblophyMcpNoteMock.mockResolvedValue({ status: 'not_found' });
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bubblophy.example.com');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://auth.example.com');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-anon-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps the transport closed until a bearer token is verified', async () => {
    const { POST } = await import('@/app/mcp/route');
    const response = await POST(createInitializeRequest());

    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toContain('Bearer');
    expect(response.headers.get('www-authenticate')).toContain(
      'resource_metadata="https://bubblophy.example.com/.well-known/oauth-protected-resource/mcp"'
    );
  });

  it('rejects arbitrary bearer tokens on multiple transport methods', async () => {
    const { DELETE, POST } = await import('@/app/mcp/route');
    const postResponse = await POST(createInitializeRequest('attacker-token'));
    const deleteResponse = await DELETE(
      new Request('https://bubblophy.example.com/mcp', {
        method: 'DELETE',
        headers: { authorization: 'Bearer attacker-token' },
      })
    );

    expect(postResponse.status).toBe(401);
    expect(deleteResponse.status).toBe(401);
  });

  it('passes verified OAuth identities into the MCP transport', async () => {
    verifyBubblophyMcpTokenMock.mockResolvedValue({
      token: 'signed-token',
      clientId: 'client-1',
      scopes: ['openid'],
      expiresAt: 2_000_000_000,
      resource: new URL('https://bubblophy.example.com/mcp'),
      extra: { authUserId: 'user-1' },
    });
    const { POST } = await import('@/app/mcp/route');
    const response = await POST(createInitializeRequest('signed-token'));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"serverInfo":{"name":"bubblophy"');
    expect(body).toContain('"version":"0.1.0"');
    expect(verifyBubblophyMcpTokenMock).toHaveBeenCalledWith(
      expect.any(Request),
      'signed-token'
    );
  });

  it('lists only projects for the verified OAuth identity', async () => {
    verifyBubblophyMcpTokenMock.mockResolvedValue({
      token: 'signed-token',
      clientId: 'client-1',
      scopes: ['openid'],
      expiresAt: 2_000_000_000,
      resource: new URL('https://bubblophy.example.com/mcp'),
      extra: { authUserId: 'user-1' },
    });
    listBubblophyMcpProjectsMock.mockResolvedValue({
      status: 'success',
      projects: [
        {
          id: 'project_bv',
          key: 'BV',
          name: 'Bubblesverse',
          description: 'Aktives Projekt',
          role: 'owner',
          isArchived: false,
        },
      ],
    });
    const { POST } = await import('@/app/mcp/route');
    const response = await POST(createListProjectsRequest());
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"id":"project_bv"');
    expect(body).toContain('"role":"owner"');
    expect(body).not.toContain('signed-token');
    expect(body).not.toContain('user-1');
    expect(listBubblophyMcpProjectsMock).toHaveBeenCalledWith('user-1');
  });

  it('advertises list_projects as a read-only closed-world tool', async () => {
    verifyBubblophyMcpTokenMock.mockResolvedValue({
      token: 'signed-token',
      clientId: 'client-1',
      scopes: ['openid'],
      expiresAt: 2_000_000_000,
      resource: new URL('https://bubblophy.example.com/mcp'),
      extra: { authUserId: 'user-1' },
    });
    const { POST } = await import('@/app/mcp/route');
    const response = await POST(createListToolsRequest());
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"name":"list_projects"');
    expect(body).toContain('"readOnlyHint":true');
    expect(body).toContain('"destructiveHint":false');
    expect(body).toContain('"openWorldHint":false');
    expect(body).toContain('"name":"list_issues"');
    expect(body).toContain('"name":"get_issue"');
    expect(body).toContain('"name":"get_issue_plan"');
    expect(body).toContain('"name":"get_run"');
    expect(body).toContain('"name":"propose_plan"');
    expect(body).toContain('"name":"add_note"');
  });

  it('lists bounded public issue summaries for the verified OAuth identity', async () => {
    verifyBubblophyMcpTokenMock.mockResolvedValue({
      token: 'signed-token',
      clientId: 'client-1',
      scopes: ['openid'],
      expiresAt: 2_000_000_000,
      resource: new URL('https://bubblophy.example.com/mcp'),
      extra: { authUserId: 'user-1' },
    });
    listBubblophyMcpIssuesMock.mockResolvedValue({
      status: 'success',
      project: { id: 'project_bv', key: 'BV', isArchived: false },
      issues: [
        {
          key: 'BV-12',
          issueNumber: 12,
          title: 'MCP-Zugriff ergänzen',
          status: 'ready',
          priority: 'high',
          requiresHumanApproval: true,
          updatedAt: '2026-07-18T12:00:00.000Z',
        },
      ],
      nextAfterIssueNumber: null,
    });
    const { POST } = await import('@/app/mcp/route');
    const response = await POST(createListIssuesRequest());
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"key":"BV-12"');
    expect(body).toContain('"requiresHumanApproval":true');
    expect(body).not.toContain('description');
    expect(body).not.toContain('assignedAuthUserId');
    expect(body).not.toContain('signed-token');
    expect(body).not.toContain('user-1');
    expect(listBubblophyMcpIssuesMock).toHaveBeenCalledWith('user-1', {
      projectId: 'project_bv',
      limit: 25,
      afterIssueNumber: 10,
    });
  });

  it('gets one public issue detail for the verified OAuth identity', async () => {
    verifyBubblophyMcpTokenMock.mockResolvedValue({
      token: 'signed-token',
      clientId: 'client-1',
      scopes: ['openid'],
      expiresAt: 2_000_000_000,
      resource: new URL('https://bubblophy.example.com/mcp'),
      extra: { authUserId: 'user-1' },
    });
    getBubblophyMcpIssueMock.mockResolvedValue({
      status: 'success',
      project: { id: 'project_bv', key: 'BV', isArchived: false },
      issue: {
        key: 'BV-12',
        issueNumber: 12,
        title: 'MCP-Zugriff ergänzen',
        description: 'Sicherer Detailvertrag',
        status: 'ready',
        priority: 'high',
        requiresHumanApproval: true,
        createdAt: '2026-07-17T12:00:00.000Z',
        updatedAt: '2026-07-18T12:00:00.000Z',
      },
    });
    const { POST } = await import('@/app/mcp/route');
    const response = await POST(createGetIssueRequest());
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"description":"Sicherer Detailvertrag"');
    expect(body).not.toContain('assignedAuthUserId');
    expect(body).not.toContain('createdByAuthUserId');
    expect(body).not.toContain('signed-token');
    expect(body).not.toContain('user-1');
    expect(getBubblophyMcpIssueMock).toHaveBeenCalledWith('user-1', {
      projectId: 'project_bv',
      issueNumber: 12,
    });
  });

  it('gets the latest issue plan without exposing actor or internal IDs', async () => {
    verifyBubblophyMcpTokenMock.mockResolvedValue({
      token: 'signed-token',
      clientId: 'client-1',
      scopes: ['openid'],
      expiresAt: 2_000_000_000,
      resource: new URL('https://bubblophy.example.com/mcp'),
      extra: { authUserId: 'user-1' },
    });
    getBubblophyMcpIssuePlanMock.mockResolvedValue({
      status: 'success',
      project: { id: 'project_bv', key: 'BV', isArchived: false },
      issue: { key: 'BV-12', issueNumber: 12, title: 'MCP planen' },
      plan: {
        version: 3,
        summary: 'Sicherer Plan',
        steps: [{ id: 'step_1', text: 'Vertrag prüfen' }],
        approvalStatus: 'draft',
        approvedAt: null,
        createdAt: '2026-07-18T12:00:00.000Z',
      },
    });
    const { POST } = await import('@/app/mcp/route');
    const response = await POST(createGetIssuePlanRequest());
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"summary":"Sicherer Plan"');
    expect(body).toContain('"approvalStatus":"draft"');
    expect(body).not.toContain('createdByAuthUserId');
    expect(body).not.toContain('approvedByAuthUserId');
    expect(body).not.toContain('signed-token');
    expect(body).not.toContain('user-1');
    expect(getBubblophyMcpIssuePlanMock).toHaveBeenCalledWith('user-1', {
      projectId: 'project_bv',
      issueNumber: 12,
    });
  });

  it('gets one sanitized run detail for the verified OAuth identity', async () => {
    verifyBubblophyMcpTokenMock.mockResolvedValue({
      token: 'signed-token',
      clientId: 'client-1',
      scopes: ['openid'],
      expiresAt: 2_000_000_000,
      resource: new URL('https://bubblophy.example.com/mcp'),
      extra: { authUserId: 'user-1' },
    });
    getBubblophyMcpRunMock.mockResolvedValue({
      status: 'success',
      project: { id: 'project_bv', key: 'BV', isArchived: false },
      issue: { key: 'BV-12', issueNumber: 12, title: 'MCP planen' },
      run: {
        id: 'run_bv_12',
        state: 'needs_review',
        agentLabel: 'Codex',
        approvedAt: '2026-07-18T11:00:00.000Z',
        startedAt: '2026-07-18T11:05:00.000Z',
        finishedAt: null,
        createdAt: '2026-07-18T10:55:00.000Z',
        updatedAt: '2026-07-18T12:00:00.000Z',
        resultSummary: 'Bereit für Review',
      },
    });
    const { POST } = await import('@/app/mcp/route');
    const response = await POST(createGetRunRequest());
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"id":"run_bv_12"');
    expect(body).toContain('"resultSummary":"Bereit für Review"');
    expect(body).not.toContain('requestedByAuthUserId');
    expect(body).not.toContain('approvedByAuthUserId');
    expect(body).not.toContain('agentTokenId');
    expect(body).not.toContain('signed-token');
    expect(body).not.toContain('user-1');
    expect(getBubblophyMcpRunMock).toHaveBeenCalledWith('user-1', {
      projectId: 'project_bv',
      runId: 'run_bv_12',
    });
  });

  it('proposes an unapproved OAuth-attributed plan without exposing actors', async () => {
    verifyBubblophyMcpTokenMock.mockResolvedValue({
      token: 'signed-token',
      clientId: 'client-1',
      scopes: ['openid'],
      expiresAt: 2_000_000_000,
      resource: new URL('https://bubblophy.example.com/mcp'),
      extra: { authUserId: 'user-1' },
    });
    proposeBubblophyMcpPlanMock.mockResolvedValue({
      status: 'created',
      project: { id: 'project_bv', key: 'BV', isArchived: false },
      issue: { key: 'BV-12', issueNumber: 12, title: 'MCP planen' },
      plan: {
        version: 4,
        summary: 'Sicherer Entwurf',
        steps: [{ id: 'step_1', text: 'Vertrag prüfen' }],
        approvalStatus: 'draft',
      },
    });
    const { POST } = await import('@/app/mcp/route');
    const response = await POST(createProposePlanRequest());
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"version":4');
    expect(body).toContain('"approvalStatus":"draft"');
    expect(body).not.toContain('approvedAt');
    expect(body).not.toContain('actorAuthUserId');
    expect(body).not.toContain('oauthClientId');
    expect(body).not.toContain('signed-token');
    expect(body).not.toContain('user-1');
    expect(body).not.toContain('client-1');
    expect(proposeBubblophyMcpPlanMock).toHaveBeenCalledWith(
      'user-1',
      'client-1',
      {
        projectId: 'project_bv',
        issueNumber: 12,
        summary: 'Sicherer Entwurf',
        steps: ['Vertrag prüfen'],
      }
    );
  });

  it('adds an OAuth-attributed note without exposing actors or event IDs', async () => {
    verifyBubblophyMcpTokenMock.mockResolvedValue({
      token: 'signed-token',
      clientId: 'client-1',
      scopes: ['openid'],
      expiresAt: 2_000_000_000,
      resource: new URL('https://bubblophy.example.com/mcp'),
      extra: { authUserId: 'user-1' },
    });
    addBubblophyMcpNoteMock.mockResolvedValue({
      status: 'created',
      project: { id: 'project_bv', key: 'BV', isArchived: false },
      issue: { key: 'BV-12', issueNumber: 12, title: 'MCP dokumentieren' },
      note: {
        text: 'Review abgeschlossen.',
        createdAt: '2026-07-18T12:30:00.000Z',
      },
    });
    const { POST } = await import('@/app/mcp/route');
    const response = await POST(createAddNoteRequest());
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"text":"Review abgeschlossen."');
    expect(body).toContain('"createdAt":"2026-07-18T12:30:00.000Z"');
    expect(body).not.toContain('event_note_1');
    expect(body).not.toContain('actorAuthUserId');
    expect(body).not.toContain('oauthClientId');
    expect(body).not.toContain('signed-token');
    expect(body).not.toContain('user-1');
    expect(body).not.toContain('client-1');
    expect(addBubblophyMcpNoteMock).toHaveBeenCalledWith('user-1', 'client-1', {
      projectId: 'project_bv',
      issueNumber: 12,
      note: 'Review abgeschlossen.',
    });
  });

  it('does not call project reads without an authenticated user identity', async () => {
    verifyBubblophyMcpTokenMock.mockResolvedValue({
      token: 'signed-token',
      clientId: 'client-1',
      scopes: ['openid'],
      expiresAt: 2_000_000_000,
      resource: new URL('https://bubblophy.example.com/mcp'),
      extra: {},
    });
    const { POST } = await import('@/app/mcp/route');
    const response = await POST(createListProjectsRequest());
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"isError":true');
    expect(listBubblophyMcpProjectsMock).not.toHaveBeenCalled();
  });

  it('exports the complete Streamable HTTP method contract', async () => {
    const route = await import('@/app/mcp/route');

    expect(route.GET).toBeTypeOf('function');
    expect(route.POST).toBeTypeOf('function');
    expect(route.DELETE).toBeTypeOf('function');
  });
});
