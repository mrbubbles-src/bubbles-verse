import type { NextRequest } from 'next/server';

import { getDashboardAuthCookieOptions } from '@/lib/auth/cookie-options';
import { getPublicDashboardEnv } from '@/lib/env';

import { NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

/**
 * Refreshes the dashboard auth session and persists updated cookies in proxy.
 *
 * Supabase SSR expects proxy-level cookie refresh so server-rendered routes can
 * trust a fresh access token on direct visits and reloads. This helper keeps
 * the incoming request cookies and outgoing response cookies in sync.
 *
 * @param request Incoming dashboard request.
 * @returns The proxy response plus a verified session flag.
 */
export async function refreshDashboardSession(request: NextRequest) {
  const env = getPublicDashboardEnv();
  const cookieOptions = getDashboardAuthCookieOptions({
    appUrl: env.NEXT_PUBLIC_APP_URL,
    cookieDomain: env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN,
  });
  let response = NextResponse.next({
    request,
  });
  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof response.cookies.set>[2];
  };

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getClaims();

  return {
    response,
    hasSession: Boolean(data?.claims) && !error,
  };
}
