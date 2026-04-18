import { getPublicDashboardEnv } from '@/lib/env';
import { createDashboardServerSupabaseClient } from '@/lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';

/**
 * Exchanges the Supabase PKCE auth code for a cookie-backed session.
 *
 * GitHub OAuth returns to this route with a short-lived auth code. The route
 * completes the server-side session exchange and only then redirects the owner
 * into the protected dashboard shell.
 *
 * @param request Incoming OAuth callback request from Supabase Auth.
 * @returns A redirect to the dashboard home or back to login on failure.
 */
export async function GET(request: NextRequest) {
  const env = getPublicDashboardEnv();
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=server_error', env.NEXT_PUBLIC_APP_URL)
    );
  }

  const supabase = await createDashboardServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=server_error', env.NEXT_PUBLIC_APP_URL)
    );
  }

  return NextResponse.redirect(new URL('/', env.NEXT_PUBLIC_APP_URL));
}
