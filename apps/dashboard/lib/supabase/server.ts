import { getDashboardAuthCookieOptions } from '@/lib/auth/cookie-options';
import { getPublicDashboardEnv } from '@/lib/env';

import { cookies } from 'next/headers';

import { createServerClient } from '@supabase/ssr';

/**
 * Creates the request-scoped Supabase client used in server code.
 *
 * Use this in Server Components and Route Handlers that need the current
 * dashboard session. Cookie writes are ignored when the current runtime does
 * not allow them, which keeps Server Component reads safe without proxy code.
 */
export async function createDashboardServerSupabaseClient() {
  const cookieStore = await cookies();
  const env = getPublicDashboardEnv();
  const cookieOptions = getDashboardAuthCookieOptions({
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
