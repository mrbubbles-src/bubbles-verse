import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

/**
 * Checks whether a request carries any Supabase auth session cookie.
 *
 * This is intentionally optimistic and network-free. The authoritative
 * Bubblophy allowlist check still happens in server code.
 *
 * @param request Incoming Bubblophy request.
 * @returns Proxy response plus a cheap session-presence flag.
 */
export function getOptimisticBubblophySession(request: NextRequest) {
  return {
    hasSession: request.cookies
      .getAll()
      .some(
        ({ name }) => name.startsWith('sb-') && name.includes('-auth-token')
      ),
    response: NextResponse.next({
      request,
    }),
  };
}
