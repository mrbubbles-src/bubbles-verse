import { NextResponse } from 'next/server'

import { getPublicDashboardEnv } from '@/lib/env'
import { createDashboardServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Clears the current dashboard auth session and redirects back to login.
 *
 * Use this route for logout links or buttons that should terminate the
 * Supabase cookie session on the server before sending the user to `/login`.
 */
export async function GET() {
  const env = getPublicDashboardEnv()
  const supabase = await createDashboardServerSupabaseClient()

  await supabase.auth.signOut()

  return NextResponse.redirect(new URL('/login', env.NEXT_PUBLIC_APP_URL))
}
