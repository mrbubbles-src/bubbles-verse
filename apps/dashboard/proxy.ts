import type { NextRequest } from 'next/server';

import { refreshDashboardSession } from '@/lib/supabase/proxy';

import { NextResponse } from 'next/server';

const PUBLIC_DASHBOARD_PATHS = new Set([
  '/login',
  '/auth/callback',
  '/auth/logout',
]);

/**
 * Returns whether the current pathname can be visited without a session.
 *
 * Keep this list tight so protected dashboard routes stay behind the owner
 * gate, while auth entry and logout endpoints remain reachable for everyone.
 *
 * @param pathname Request pathname from the current dashboard request.
 * @returns `true` when the route should bypass the optimistic auth redirect.
 */
function isPublicDashboardPath(pathname: string) {
  return PUBLIC_DASHBOARD_PATHS.has(pathname);
}

/**
 * Applies optimistic auth redirects before dashboard routes render.
 *
 * This proxy only checks for the presence of a Supabase session cookie. The
 * authoritative owner validation still happens in server code through
 * `requireOwnerSession()`, which handles stale or unauthorized sessions.
 *
 * @param request Incoming dashboard request.
 * @returns A redirect response when the route/session combination is invalid.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { hasSession, response } = await refreshDashboardSession(request);

  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!hasSession && !isPublicDashboardPath(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
