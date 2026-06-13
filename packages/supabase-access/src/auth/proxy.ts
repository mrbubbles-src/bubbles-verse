import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

type SupabaseCookieLike = {
  name: string;
};

/**
 * Checks whether cookie names include a Supabase SSR auth session cookie.
 *
 * @param cookies Request cookies or lightweight test doubles with a `name`.
 * @returns `true` when an auth-token cookie is present.
 */
export function hasSupabaseAuthSessionCookie(
  cookies: readonly SupabaseCookieLike[]
) {
  return cookies.some(
    ({ name }) => name.startsWith('sb-') && name.includes('-auth-token')
  );
}

/**
 * Performs the shared optimistic session check used by app proxies.
 *
 * This is intentionally network-free and checks only cookie presence. Apps
 * still need their own authoritative session and authorization validation.
 *
 * @param request Incoming Next.js proxy request.
 * @returns The unchanged Next response plus a session-cookie presence flag.
 */
export function getOptimisticSupabaseSession(request: NextRequest) {
  return {
    hasSession: hasSupabaseAuthSessionCookie(request.cookies.getAll()),
    response: NextResponse.next({
      request,
    }),
  };
}
