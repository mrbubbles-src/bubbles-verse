import {
  getBubblophyMcpResourceUrl,
  getBubblophyOAuthIssuerUrl,
} from '@/lib/mcp/oauth-metadata';

import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from 'mcp-handler';

/** Publishes the configured Bubblophy resource and Supabase OAuth issuer. */
export function GET(request: Request) {
  return protectedResourceHandler({
    authServerUrls: [getBubblophyOAuthIssuerUrl()],
    resourceUrl: getBubblophyMcpResourceUrl(),
  })(request);
}

/** Allows browser-based MCP clients to fetch protected-resource metadata. */
export const OPTIONS = metadataCorsOptionsRequestHandler();
