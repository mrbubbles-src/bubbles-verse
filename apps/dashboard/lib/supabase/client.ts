'use client';

import { getDashboardAuthCookieOptions } from '@/lib/auth/cookie-options';
import { getPublicDashboardEnv } from '@/lib/env';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates the browser Supabase client for dashboard auth actions.
 *
 * Use this from Client Components that need to start GitHub OAuth or interact
 * with the authenticated browser session.
 */
export function createDashboardBrowserSupabaseClient() {
  const env = getPublicDashboardEnv();
  const cookieOptions = getDashboardAuthCookieOptions({
    appUrl: env.NEXT_PUBLIC_APP_URL,
    cookieDomain: env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN,
  });

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookieOptions }
  );
}
