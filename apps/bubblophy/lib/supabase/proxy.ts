import type { NextRequest } from 'next/server';

import { getOptimisticSupabaseSession } from '@bubbles/supabase-access/auth';

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
  return getOptimisticSupabaseSession(request);
}
