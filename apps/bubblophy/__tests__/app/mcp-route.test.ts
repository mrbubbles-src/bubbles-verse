// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createInitializeRequest(token?: string) {
  return new Request('https://attacker.example/mcp', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
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

describe('/mcp', () => {
  beforeEach(() => {
    vi.resetModules();
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

  it('exports the complete Streamable HTTP method contract', async () => {
    const route = await import('@/app/mcp/route');

    expect(route.GET).toBeTypeOf('function');
    expect(route.POST).toBeTypeOf('function');
    expect(route.DELETE).toBeTypeOf('function');
  });
});
