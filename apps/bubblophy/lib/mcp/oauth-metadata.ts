import { getPublicBubblophyEnv } from '@/lib/env';

const MCP_RESOURCE_PATH = '/mcp';
const MCP_METADATA_PATH = '/.well-known/oauth-protected-resource/mcp';
const SUPABASE_OAUTH_ISSUER_PATH = '/auth/v1';

/** Joins a configured public base URL with one canonical absolute path. */
function joinPublicUrl(baseUrl: string, pathname: string) {
  const url = new URL(baseUrl);
  url.pathname = pathname;
  url.search = '';
  url.hash = '';

  return url.toString().replace(/\/$/, '');
}

/** Returns Bubblophy's stable RFC 8707 MCP resource identifier. */
export function getBubblophyMcpResourceUrl() {
  return joinPublicUrl(
    getPublicBubblophyEnv().NEXT_PUBLIC_APP_URL,
    MCP_RESOURCE_PATH
  );
}

/** Returns Bubblophy's configured RFC 9728 metadata endpoint. */
export function getBubblophyMcpMetadataUrl() {
  return joinPublicUrl(
    getPublicBubblophyEnv().NEXT_PUBLIC_APP_URL,
    MCP_METADATA_PATH
  );
}

/** Returns the Supabase Auth issuer used for Bubblophy OAuth access tokens. */
export function getBubblophyOAuthIssuerUrl() {
  return joinPublicUrl(
    getPublicBubblophyEnv().NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_OAUTH_ISSUER_PATH
  );
}
