import type { NextRequest } from 'next/server';

import {
  buildBubblophyLoginPath,
  getSafeBubblophyRedirectPath,
} from '@/lib/auth/redirects';
import { getOptimisticBubblophySession } from '@/lib/supabase/proxy';

import { NextResponse } from 'next/server';

/**
 * Returns the path that should survive an auth redirect.
 *
 * @param request Incoming Bubblophy page request.
 * @returns Relative path including the query string.
 */
function getBubblophyRequestPath(request: NextRequest) {
  return `${request.nextUrl.pathname}${request.nextUrl.search}`;
}

/**
 * Keeps route-specific auth contracts out of the browser login proxy.
 *
 * @param pathname Incoming request pathname.
 * @returns `true` when the proxy must not issue human-login redirects.
 */
function isBubblophyProxyBypassPath(pathname: string) {
  return (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/icon.svg' ||
    pathname === '/favicon.ico'
  );
}

/**
 * Applies optimistic Bubblophy auth redirects before page routes render.
 *
 * This proxy only checks for a Supabase auth-cookie presence. The secure
 * Supabase user and temporary email allowlist validation remains in
 * `requireBubblophySession()`.
 *
 * @param request Incoming Bubblophy page request.
 * @returns Redirect response when the optimistic route/session state is known.
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { hasSession, response } = getOptimisticBubblophySession(request);

  if (isBubblophyProxyBypassPath(pathname)) {
    return response;
  }

  if (pathname === '/login' && hasSession) {
    const nextPath = getSafeBubblophyRedirectPath(
      request.nextUrl.searchParams.get('next')
    );
    const loginRedirectPath =
      nextPath === '/login' || nextPath.startsWith('/login?') ? '/' : nextPath;

    return NextResponse.redirect(new URL(loginRedirectPath, request.url));
  }

  if (pathname !== '/login' && !hasSession) {
    return NextResponse.redirect(
      new URL(buildBubblophyLoginPath(getBubblophyRequestPath(request)), request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/projects/:path*',
    '/issues/:path*',
    '/runs/:path*',
    '/agent-tokens/:path*',
  ],
};
