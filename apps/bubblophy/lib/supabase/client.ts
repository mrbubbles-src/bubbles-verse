'use client';

import { getBubblophyAuthCookieOptions } from '@/lib/auth/cookie-options';
import { getPublicBubblophyEnv } from '@/lib/env';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates the browser Supabase client for human Bubblophy auth actions.
 *
 * This uses only public Supabase anon configuration. Agent tokens and
 * service-role credentials must not be used in browser clients.
 */
export function createBubblophyBrowserSupabaseClient() {
  const env = getPublicBubblophyEnv();
  const cookieOptions = getBubblophyAuthCookieOptions({
    appUrl: env.NEXT_PUBLIC_APP_URL,
    cookieDomain: env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN,
  });

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookieOptions }
  );
}
