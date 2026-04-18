import { getPublicDashboardEnv } from '@/lib/env';
import { createDashboardServerSupabaseClient } from '@/lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';

/**
 * Normalizes the post-logout target to a safe same-origin dashboard path.
 *
 * Only relative paths inside the dashboard are allowed. Invalid values fall
 * back to the default login screen.
 */
function getLogoutRedirectPath(request: NextRequest): string {
  const next = request.nextUrl.searchParams.get('next');

  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/login';
  }

  return next;
}

/**
 * Clears the current dashboard auth session and redirects back to login.
 *
 * Use this route for logout links or buttons that should terminate the
 * Supabase cookie session on the server before sending the user to `/login`.
 */
export async function GET(request: NextRequest) {
  const env = getPublicDashboardEnv();
  const supabase = await createDashboardServerSupabaseClient();
  const redirectPath = getLogoutRedirectPath(request);

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(redirectPath, env.NEXT_PUBLIC_APP_URL));
}
