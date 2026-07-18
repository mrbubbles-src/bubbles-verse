// @vitest-environment node

import {
  getBubblophyMcpMetadataUrl,
  getBubblophyMcpResourceUrl,
  getBubblophyOAuthIssuerUrl,
  getBubblophyOAuthJwksUrl,
} from '@/lib/mcp/oauth-metadata';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Bubblophy MCP OAuth metadata URLs', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://bubblophy.example.com/');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://auth.example.com/');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'public-anon-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('derives stable MCP URLs from configured origins', () => {
    expect(getBubblophyMcpResourceUrl()).toBe(
      'https://bubblophy.example.com/mcp'
    );
    expect(getBubblophyMcpMetadataUrl()).toBe(
      'https://bubblophy.example.com/.well-known/oauth-protected-resource/mcp'
    );
    expect(getBubblophyOAuthIssuerUrl()).toBe(
      'https://auth.example.com/auth/v1'
    );
    expect(getBubblophyOAuthJwksUrl()).toBe(
      'https://auth.example.com/auth/v1/.well-known/jwks.json'
    );
  });
});
