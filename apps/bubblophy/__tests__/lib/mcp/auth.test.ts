// @vitest-environment node

import type { JWTPayload } from 'jose';

import { verifyBubblophyMcpToken } from '@/lib/mcp/auth';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const request = new Request('https://bubblophy.example.com/mcp');

describe('verifyBubblophyMcpToken', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bubblophy.example.com');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://auth.example.com');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-anon-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects missing bearer tokens without invoking JWT verification', async () => {
    const verifyJwt = vi.fn();

    await expect(
      verifyBubblophyMcpToken(request, undefined, { verifyJwt })
    ).resolves.toBeUndefined();
    expect(verifyJwt).not.toHaveBeenCalled();
  });

  it.each([
    [
      'missing subject',
      {
        client_id: 'client-1',
        aud: 'https://bubblophy.example.com/mcp',
        exp: 2_000_000_000,
      },
    ],
    [
      'missing client ID',
      {
        sub: 'user-1',
        aud: 'https://bubblophy.example.com/mcp',
        exp: 2_000_000_000,
      },
    ],
    [
      'missing expiration',
      {
        sub: 'user-1',
        client_id: 'client-1',
        aud: 'https://bubblophy.example.com/mcp',
      },
    ],
    [
      'expired token',
      {
        sub: 'user-1',
        client_id: 'client-1',
        aud: 'https://bubblophy.example.com/mcp',
        exp: 1,
      },
    ],
    [
      'wrong audience',
      {
        sub: 'user-1',
        client_id: 'client-1',
        aud: 'https://attacker.example/mcp',
        exp: 2_000_000_000,
      },
    ],
    [
      'multiple audiences',
      {
        sub: 'user-1',
        client_id: 'client-1',
        aud: [
          'https://bubblophy.example.com/mcp',
          'https://attacker.example/mcp',
        ],
        exp: 2_000_000_000,
      },
    ],
  ] satisfies [string, JWTPayload][])('rejects %s', async (_name, payload) => {
    const verifyJwt = vi.fn().mockResolvedValue(payload);

    await expect(
      verifyBubblophyMcpToken(request, 'signed-token', { verifyJwt })
    ).resolves.toBeUndefined();
  });

  it('treats signature and lifetime verification failures as unauthenticated', async () => {
    const verifyJwt = vi.fn().mockRejectedValue(new Error('invalid JWT'));

    await expect(
      verifyBubblophyMcpToken(request, 'invalid-token', { verifyJwt })
    ).resolves.toBeUndefined();
  });

  it('returns minimal MCP auth info for a valid Supabase OAuth token', async () => {
    const verifyJwt = vi.fn().mockResolvedValue({
      sub: 'user-1',
      client_id: 'client-1',
      aud: 'https://bubblophy.example.com/mcp',
      exp: 2_000_000_000,
      scope: 'openid email',
    });

    await expect(
      verifyBubblophyMcpToken(request, 'signed-token', { verifyJwt })
    ).resolves.toEqual({
      token: 'signed-token',
      clientId: 'client-1',
      scopes: ['openid', 'email'],
      expiresAt: 2_000_000_000,
      resource: new URL('https://bubblophy.example.com/mcp'),
      extra: { authUserId: 'user-1' },
    });
    expect(verifyJwt).toHaveBeenCalledWith('signed-token', {
      issuer: 'https://auth.example.com/auth/v1',
      audience: 'https://bubblophy.example.com/mcp',
      jwksUrl: 'https://auth.example.com/auth/v1/.well-known/jwks.json',
    });
  });
});
