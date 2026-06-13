import type { NextRequest } from 'next/server';

import {
  buildBubblophyLoginPath,
  getSafeBubblophyRedirectPath,
} from '@/lib/auth/redirects';
import { getOptimisticBubblophySession } from '@/lib/supabase/proxy';

import { NextResponse } from 'next/server';

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

  if (pathname === '/login' && hasSession) {
    const nextPath = getSafeBubblophyRedirectPath(
      request.nextUrl.searchParams.get('next')
    );
    const loginRedirectPath =
      nextPath === '/login' || nextPath.startsWith('/login?') ? '/' : nextPath;

    return NextResponse.redirect(new URL(loginRedirectPath, request.url));
  }

  if (pathname === '/' && !hasSession) {
    return NextResponse.redirect(
      new URL(buildBubblophyLoginPath('/'), request.url)
    );
  }

  return response;
}

export const config = {
  matcher: ['/', '/login'],
};
