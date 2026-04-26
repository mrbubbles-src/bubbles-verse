import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

/**
 * Checks whether the request carries a Supabase auth cookie.
 *
 * Keep Proxy auth intentionally optimistic and network-free. The secure
 * Supabase user and allowlist validation still happens in request-time server
 * code through `requireDashboardSession()`.
 *
 * @param request Incoming dashboard request.
 * @returns Proxy response plus a cheap session-presence flag.
 */
export function getOptimisticDashboardSession(request: NextRequest) {
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
