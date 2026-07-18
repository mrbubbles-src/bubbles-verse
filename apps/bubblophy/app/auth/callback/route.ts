import {
  buildBubblophyLogoutPath,
  getBubblophyAuthRedirectOrigin,
  getSafeBubblophyRedirectPath,
} from '@/lib/auth/redirects';
import { getAllowedBubblophySessionForUser } from '@/lib/auth/session';
import { getPublicBubblophyEnv } from '@/lib/env';
import { isBubblophyProjectInvitationAcceptancePath } from '@/lib/projects/invitation-links';
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
  const redirectOrigin = getBubblophyAuthRedirectOrigin({
    requestUrl: request.url,
    configuredAppUrl: env.NEXT_PUBLIC_APP_URL,
  });

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=server_error', redirectOrigin)
    );
  }

  const supabase = await createBubblophyServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=server_error', redirectOrigin)
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAllowedBubblophySessionForUser(user);

  if (
    !user ||
    (!session && !isBubblophyProjectInvitationAcceptancePath(nextPath))
  ) {
    return NextResponse.redirect(
      new URL(
        buildBubblophyLogoutPath('/login?error=access_denied'),
        redirectOrigin
      )
    );
  }

  return NextResponse.redirect(new URL(nextPath, redirectOrigin));
}
