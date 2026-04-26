import type { NextRequest } from 'next/server';

import { getOptimisticDashboardSession } from '@/lib/supabase/proxy';

import { NextResponse } from 'next/server';

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
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { hasSession, response } = getOptimisticDashboardSession(request);

  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!hasSession && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/account',
    '/profile',
    '/vault',
    '/vault/categories',
    '/vault/entries',
    '/vault/entries/new',
    '/vault/entries/:id',
    '/vault/preview/new',
    '/vault/preview/:id',
  ],
};
