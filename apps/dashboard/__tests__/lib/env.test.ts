import { getPublicDashboardEnv } from '@/lib/env';

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

  it('allows the optional shared auth cookie domain to be omitted', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://dashboard.mrbubbles.test:3004');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    delete process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN;

    expect(getPublicDashboardEnv()).toEqual({
      NEXT_PUBLIC_APP_URL: 'http://dashboard.mrbubbles.test:3004',
      NEXT_PUBLIC_AUTH_COOKIE_DOMAIN: undefined,
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    });
  });
});
