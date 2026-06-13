import { getSafeBubblophyRedirectPath } from '@/lib/auth/redirects';
import { getPublicBubblophyEnv } from '@/lib/env';
import { createBubblophyServerSupabaseClient } from '@/lib/supabase/server';

import { connection, NextRequest, NextResponse } from 'next/server';

/**
 * Normalizes the post-logout target to a safe same-origin Bubblophy path.
 *
 * @param request Incoming logout request with optional `next` query.
 * @returns Safe relative redirect path.
 */
function getLogoutRedirectPath(request: NextRequest): string {
  return getSafeBubblophyRedirectPath(
    request.nextUrl.searchParams.get('next'),
    '/login'
  );
}

/**
 * Clears the current Bubblophy human auth session and redirects back to login.
 *
 * This route does not affect scoped agent tokens.
 */
export async function GET(request: NextRequest) {
  await connection();

  const env = getPublicBubblophyEnv();
  const supabase = await createBubblophyServerSupabaseClient();
  const redirectPath = getLogoutRedirectPath(request);

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(redirectPath, env.NEXT_PUBLIC_APP_URL));
}
