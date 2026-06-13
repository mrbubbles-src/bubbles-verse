import { getPublicBubblophyEnv } from '@/lib/env';

import { afterEach, describe, expect, it, vi } from 'vitest';

describe('bubblophy env helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads public env values from explicit NEXT_PUBLIC variables', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://bubblophy.mrbubbles.test:3005');
    vi.stubEnv('NEXT_PUBLIC_AUTH_COOKIE_DOMAIN', '.mrbubbles.test');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');

    expect(getPublicBubblophyEnv()).toEqual({
      NEXT_PUBLIC_APP_URL: 'http://bubblophy.mrbubbles.test:3005',
      NEXT_PUBLIC_AUTH_COOKIE_DOMAIN: '.mrbubbles.test',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    });
  });

  it('allows the optional shared auth cookie domain to be omitted', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://bubblophy.mrbubbles.test:3005');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    delete process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN;

    expect(getPublicBubblophyEnv()).toEqual({
      NEXT_PUBLIC_APP_URL: 'http://bubblophy.mrbubbles.test:3005',
      NEXT_PUBLIC_AUTH_COOKIE_DOMAIN: undefined,
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    });
  });
});
