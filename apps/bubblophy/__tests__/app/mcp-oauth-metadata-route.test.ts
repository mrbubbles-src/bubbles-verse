// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('GET /.well-known/oauth-protected-resource/mcp', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bubblophy.example.com');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://auth.example.com');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-anon-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('publishes the configured MCP resource and Supabase issuer', async () => {
    const { GET } =
      await import('@/app/.well-known/oauth-protected-resource/mcp/route');
    const response = GET(
      new Request(
        'https://attacker.example/.well-known/oauth-protected-resource/mcp',
        {
          headers: {
            'x-forwarded-host': 'attacker.example',
            'x-forwarded-proto': 'https',
          },
        }
      )
    );

    await expect(response.json()).resolves.toEqual({
      resource: 'https://bubblophy.example.com/mcp',
      authorization_servers: ['https://auth.example.com/auth/v1'],
    });
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('content-type')).toBe('application/json');
  });

  it('allows browser-based clients to discover the metadata', async () => {
    const { OPTIONS } =
      await import('@/app/.well-known/oauth-protected-resource/mcp/route');
    const response = OPTIONS();

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-methods')).toBe(
      'GET, OPTIONS'
    );
  });
});
