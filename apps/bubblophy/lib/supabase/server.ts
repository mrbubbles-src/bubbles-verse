import { getBubblophyAuthCookieOptions } from '@/lib/auth/cookie-options';
import { getPublicBubblophyEnv } from '@/lib/env';

import { cookies } from 'next/headers';

import { createServerClient } from '@supabase/ssr';

/**
 * Creates the request-scoped Supabase client used for human auth sessions.
 *
 * This helper is intentionally limited to the public anon key and cookie-backed
 * sessions. Agent API tokens and service-role credentials belong in separate
 * server-only modules with explicit scopes.
 */
export async function createBubblophyServerSupabaseClient() {
  const cookieStore = await cookies();
  const env = getPublicBubblophyEnv();
  const cookieOptions = getBubblophyAuthCookieOptions({
    appUrl: env.NEXT_PUBLIC_APP_URL,
    cookieDomain: env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN,
  });
  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof cookieStore.set>[2];
  };

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          for (const { name, value, options } of cookiesToSet) {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Server Components can read cookies but may not persist refreshes.
            }
          }
        },
      },
    }
  );
}
