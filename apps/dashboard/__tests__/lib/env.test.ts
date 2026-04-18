import { getPublicDashboardEnv, getServerDashboardEnv } from '@/lib/env';

import { afterEach, describe, expect, it, vi } from 'vitest';

describe('dashboard env helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads public env values from explicit NEXT_PUBLIC variables', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://dashboard.mrbubbles.test:3004');
    vi.stubEnv('NEXT_PUBLIC_AUTH_COOKIE_DOMAIN', '.mrbubbles.test');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');

    expect(getPublicDashboardEnv()).toEqual({
      NEXT_PUBLIC_APP_URL: 'http://dashboard.mrbubbles.test:3004',
      NEXT_PUBLIC_AUTH_COOKIE_DOMAIN: '.mrbubbles.test',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    });
  });

  it('adds the owner allowlist only for the server env helper', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://dashboard.mrbubbles.test:3004');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('GITHUB_OWNER_ALLOWLIST', 'mrbubbles');

    expect(getServerDashboardEnv()).toMatchObject({
      NEXT_PUBLIC_APP_URL: 'http://dashboard.mrbubbles.test:3004',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      GITHUB_OWNER_ALLOWLIST: 'mrbubbles',
    });
  });
});
