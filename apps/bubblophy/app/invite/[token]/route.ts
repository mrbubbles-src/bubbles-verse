import { getBubblophyAuthRedirectOrigin } from '@/lib/auth/redirects';
import { getPublicBubblophyEnv } from '@/lib/env';
import {
  BUBBLOPHY_PROJECT_INVITATION_ACCEPT_PATH,
  BUBBLOPHY_PROJECT_INVITATION_COOKIE,
  BUBBLOPHY_PROJECT_INVITATION_COOKIE_MAX_AGE_SECONDS,
  BUBBLOPHY_PROJECT_INVITATION_COOKIE_PATH,
  isBubblophyProjectInvitationToken,
} from '@/lib/projects/invitation-links';

import { connection, NextRequest, NextResponse } from 'next/server';

/**
 * Stages a plaintext invitation token in a short-lived HttpOnly cookie.
 *
 * The token is removed from the URL before any GitHub/Supabase login redirect,
 * so OAuth providers receive only the fixed acceptance path.
 *
 * @param request Incoming public invitation link request.
 * @param context Dynamic route token parameter.
 * @returns Token-free redirect to the invitation acceptance page.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  await connection();

  const { token } = await context.params;
  const env = getPublicBubblophyEnv();
  const redirectOrigin = getBubblophyAuthRedirectOrigin({
    requestUrl: request.url,
    configuredAppUrl: env.NEXT_PUBLIC_APP_URL,
  });
  const isValidToken = isBubblophyProjectInvitationToken(token);
  const redirectPath = isValidToken
    ? BUBBLOPHY_PROJECT_INVITATION_ACCEPT_PATH
    : `${BUBBLOPHY_PROJECT_INVITATION_ACCEPT_PATH}?error=invalid_link`;
  const response = NextResponse.redirect(new URL(redirectPath, redirectOrigin));

  response.cookies.set(
    BUBBLOPHY_PROJECT_INVITATION_COOKIE,
    isValidToken ? token : '',
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: redirectOrigin.startsWith('https://'),
      path: BUBBLOPHY_PROJECT_INVITATION_COOKIE_PATH,
      maxAge: isValidToken
        ? BUBBLOPHY_PROJECT_INVITATION_COOKIE_MAX_AGE_SECONDS
        : 0,
    }
  );

  return response;
}
