import * as z from 'zod';

const dashboardPublicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_AUTH_COOKIE_DOMAIN: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const dashboardServerEnvSchema = dashboardPublicEnvSchema.extend({
  GITHUB_OWNER_ALLOWLIST: z.string().min(1),
});

function getDashboardPublicEnvSource() {
  return {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_AUTH_COOKIE_DOMAIN: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/**
 * Returns the public dashboard environment needed in browser and server code.
 *
 * Use this for values that are intentionally exposed through `NEXT_PUBLIC_*`.
 * It validates the configured dashboard URL, optional shared cookie domain,
 * and Supabase public credentials.
 */
export function getPublicDashboardEnv() {
  return dashboardPublicEnvSchema.parse(getDashboardPublicEnvSource());
}

/**
 * Returns the server-only dashboard environment for auth gating.
 *
 * Use this in server code that needs the owner allowlist in addition to the
 * public Supabase connection values.
 */
export function getServerDashboardEnv() {
  return dashboardServerEnvSchema.parse({
    ...getDashboardPublicEnvSource(),
    GITHUB_OWNER_ALLOWLIST: process.env.GITHUB_OWNER_ALLOWLIST,
  });
}
