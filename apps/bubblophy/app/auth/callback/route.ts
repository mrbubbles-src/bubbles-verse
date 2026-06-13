import {
  buildBubblophyLogoutPath,
  getSafeBubblophyRedirectPath,
} from '@/lib/auth/redirects';
import { getAllowedBubblophySessionForUser } from '@/lib/auth/session';
import { getPublicBubblophyEnv } from '@/lib/env';
import { createBubblophyServerSupabaseClient } from '@/lib/supabase/server';

import { connection, NextRequest, NextResponse } from 'next/server';

/**
 * Exchanges the Supabase PKCE auth code for a cookie-backed human session.
 *
 * @param request Incoming OAuth callback request from Supabase Auth.
 * @returns A redirect to the Bubblophy home or back to login on failure.
 */
export async function GET(request: NextRequest) {
  await connection();

  const env = getPublicBubblophyEnv();
  const code = request.nextUrl.searchParams.get('code');
  const nextPath = getSafeBubblophyRedirectPath(
    request.nextUrl.searchParams.get('next')
  );

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=server_error', env.NEXT_PUBLIC_APP_URL)
    );
  }

  const supabase = await createBubblophyServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=server_error', env.NEXT_PUBLIC_APP_URL)
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = getAllowedBubblophySessionForUser(user);

  if (!session) {
    return NextResponse.redirect(
      new URL(
        buildBubblophyLogoutPath('/login?error=access_denied'),
        env.NEXT_PUBLIC_APP_URL
      )
    );
  }

  return NextResponse.redirect(new URL(nextPath, env.NEXT_PUBLIC_APP_URL));
}
