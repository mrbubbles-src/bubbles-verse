import 'server-only';

import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type { JWTPayload } from 'jose';

import {
  getBubblophyMcpResourceUrl,
  getBubblophyOAuthIssuerUrl,
  getBubblophyOAuthJwksUrl,
} from '@/lib/mcp/oauth-metadata';

import { createRemoteJWKSet, jwtVerify } from 'jose';

interface BubblophyMcpJwtVerificationInput {
  issuer: string;
  audience: string;
  jwksUrl: string;
}

type BubblophyMcpJwtVerifier = (
  token: string,
  input: BubblophyMcpJwtVerificationInput
) => Promise<JWTPayload>;

interface VerifyBubblophyMcpTokenOptions {
  verifyJwt?: BubblophyMcpJwtVerifier;
}

const remoteJwkSets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
const JWKS_CACHE_MAX_AGE_MS = 10 * 60 * 1_000;
const JWKS_COOLDOWN_MS = 30 * 1_000;
const JWKS_TIMEOUT_MS = 5 * 1_000;

/** Returns one cached remote key set per configured Supabase JWKS URL. */
function getRemoteJwkSet(jwksUrl: string) {
  const cachedJwkSet = remoteJwkSets.get(jwksUrl);

  if (cachedJwkSet) {
    return cachedJwkSet;
  }

  const jwkSet = createRemoteJWKSet(new URL(jwksUrl), {
    cacheMaxAge: JWKS_CACHE_MAX_AGE_MS,
    cooldownDuration: JWKS_COOLDOWN_MS,
    timeoutDuration: JWKS_TIMEOUT_MS,
  });
  remoteJwkSets.set(jwksUrl, jwkSet);

  return jwkSet;
}

/** Verifies a Supabase OAuth JWT through its asymmetric public JWKS. */
async function verifySupabaseOAuthJwt(
  token: string,
  input: BubblophyMcpJwtVerificationInput
) {
  const { payload } = await jwtVerify(token, getRemoteJwkSet(input.jwksUrl), {
    algorithms: ['ES256', 'RS256'],
    audience: input.audience,
    issuer: input.issuer,
  });

  return payload;
}

/** Checks that a JWT targets only Bubblophy's canonical MCP resource. */
function hasExactAudience(audience: JWTPayload['aud'], resourceUrl: string) {
  if (typeof audience === 'string') {
    return audience === resourceUrl;
  }

  return audience?.length === 1 && audience[0] === resourceUrl;
}

/** Converts the OAuth scope claim into the MCP SDK's scope list. */
function readScopes(scope: JWTPayload[string]) {
  if (typeof scope !== 'string') {
    return [];
  }

  return scope.split(/\s+/).filter(Boolean);
}

/**
 * Verifies a personal Supabase OAuth token for Bubblophy's MCP resource.
 *
 * Returns only the identity fields needed by MCP tools. Invalid tokens and
 * invalid claims are treated as unauthenticated without logging token data.
 */
export async function verifyBubblophyMcpToken(
  _request: Request,
  bearerToken?: string,
  options: VerifyBubblophyMcpTokenOptions = {}
): Promise<AuthInfo | undefined> {
  if (!bearerToken) {
    return undefined;
  }

  const resourceUrl = getBubblophyMcpResourceUrl();
  const verificationInput = {
    issuer: getBubblophyOAuthIssuerUrl(),
    audience: resourceUrl,
    jwksUrl: getBubblophyOAuthJwksUrl(),
  };

  let payload: JWTPayload;

  try {
    payload = await (options.verifyJwt ?? verifySupabaseOAuthJwt)(
      bearerToken,
      verificationInput
    );
  } catch {
    return undefined;
  }

  const clientId = payload.client_id;
  const expiresAt = payload.exp;

  if (
    typeof payload.sub !== 'string' ||
    payload.sub.length === 0 ||
    typeof clientId !== 'string' ||
    clientId.length === 0 ||
    typeof expiresAt !== 'number' ||
    expiresAt <= Date.now() / 1_000 ||
    !hasExactAudience(payload.aud, resourceUrl)
  ) {
    return undefined;
  }

  return {
    token: bearerToken,
    clientId,
    scopes: readScopes(payload.scope),
    expiresAt,
    resource: new URL(resourceUrl),
    extra: { authUserId: payload.sub },
  };
}
