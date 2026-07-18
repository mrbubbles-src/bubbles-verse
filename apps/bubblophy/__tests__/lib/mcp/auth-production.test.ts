// @vitest-environment node

import type { JWK } from 'jose';

import { verifyBubblophyMcpToken } from '@/lib/mcp/auth';

import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const APP_URL = 'https://bubblophy.example.com';
const AUTH_URL = 'https://auth.example.com';
const ISSUER = `${AUTH_URL}/auth/v1`;
const RESOURCE = `${APP_URL}/mcp`;
const KEY_ID = 'bubblophy-test-key';

let signingKey: CryptoKey;
let otherSigningKey: CryptoKey;
let publicJwk: JWK;

const fetchJwksMock = vi.fn();

interface CreateTokenOptions {
  algorithm?: 'ES256' | 'HS256';
  audience?: string;
  expiresAt?: number;
  issuer?: string;
  notBefore?: number;
  useOtherKey?: boolean;
}

/** Creates a locally signed OAuth-shaped JWT for production-path tests. */
async function createToken(options: CreateTokenOptions = {}) {
  const now = Math.floor(Date.now() / 1_000);
  const algorithm = options.algorithm ?? 'ES256';
  let token = new SignJWT({ client_id: 'client-1', scope: 'openid email' })
    .setProtectedHeader({ alg: algorithm, kid: KEY_ID, typ: 'JWT' })
    .setIssuer(options.issuer ?? ISSUER)
    .setSubject('user-1')
    .setAudience(options.audience ?? RESOURCE)
    .setIssuedAt(now)
    .setExpirationTime(options.expiresAt ?? now + 300);

  if (options.notBefore !== undefined) {
    token = token.setNotBefore(options.notBefore);
  }

  if (algorithm === 'HS256') {
    return token.sign(new TextEncoder().encode('test-shared-secret-32-bytes!'));
  }

  return token.sign(options.useOtherKey ? otherSigningKey : signingKey);
}

describe('Bubblophy MCP production JWT verification', () => {
  beforeAll(async () => {
    const primaryKeyPair = await generateKeyPair('ES256');
    const otherKeyPair = await generateKeyPair('ES256');
    signingKey = primaryKeyPair.privateKey;
    otherSigningKey = otherKeyPair.privateKey;
    publicJwk = {
      ...(await exportJWK(primaryKeyPair.publicKey)),
      alg: 'ES256',
      kid: KEY_ID,
      use: 'sig',
    };

    fetchJwksMock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ keys: [publicJwk] }), {
          headers: { 'content-type': 'application/json' },
        })
    );
    vi.stubGlobal('fetch', fetchJwksMock);
  });

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', APP_URL);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', AUTH_URL);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-anon-key');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('verifies ES256 tokens through the configured remote JWKS and reuses its cache', async () => {
    const token = await createToken();

    await expect(
      verifyBubblophyMcpToken(new Request(RESOURCE), token)
    ).resolves.toMatchObject({
      clientId: 'client-1',
      extra: { authUserId: 'user-1' },
    });
    await expect(
      verifyBubblophyMcpToken(new Request(RESOURCE), token)
    ).resolves.toBeDefined();

    expect(fetchJwksMock).toHaveBeenCalledTimes(1);
    expect(fetchJwksMock).toHaveBeenCalledWith(
      `${ISSUER}/.well-known/jwks.json`,
      expect.objectContaining({ method: 'GET' })
    );
  });

  it.each([
    ['a different signing key', { useOtherKey: true }],
    ['HS256', { algorithm: 'HS256' }],
    ['a wrong issuer', { issuer: 'https://attacker.example/auth/v1' }],
    ['a wrong audience', { audience: 'https://attacker.example/mcp' }],
    [
      'a future not-before time',
      { notBefore: Math.floor(Date.now() / 1_000) + 300 },
    ],
    ['an expired timestamp', { expiresAt: 1 }],
  ] satisfies [string, CreateTokenOptions][])(
    'rejects tokens using %s',
    async (_name, options) => {
      const token = await createToken(options);

      await expect(
        verifyBubblophyMcpToken(new Request(RESOURCE), token)
      ).resolves.toBeUndefined();
    }
  );
});
