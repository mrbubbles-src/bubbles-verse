'use client'

import { createBrowserClient } from '@supabase/ssr'

import { getPublicDashboardEnv } from '@/lib/env'

/**
 * Creates the browser Supabase client for dashboard auth actions.
 *
 * Use this from Client Components that need to start GitHub OAuth or interact
 * with the authenticated browser session.
 */
export function createDashboardBrowserSupabaseClient() {
  const env = getPublicDashboardEnv()

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
