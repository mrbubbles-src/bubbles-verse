import { z } from 'zod'

const dashboardPublicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

const dashboardServerEnvSchema = dashboardPublicEnvSchema.extend({
  GITHUB_OWNER_ALLOWLIST: z.string().min(1),
})

/**
 * Returns the public dashboard environment needed in browser and server code.
 *
 * Use this for values that are intentionally exposed through `NEXT_PUBLIC_*`.
 * It validates the configured dashboard URL and Supabase public credentials.
 */
export function getPublicDashboardEnv() {
  return dashboardPublicEnvSchema.parse(process.env)
}

/**
 * Returns the server-only dashboard environment for auth gating.
 *
 * Use this in server code that needs the owner allowlist in addition to the
 * public Supabase connection values.
 */
export function getServerDashboardEnv() {
  return dashboardServerEnvSchema.parse(process.env)
}
