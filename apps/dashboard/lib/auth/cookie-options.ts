import { getSupabaseAuthCookieOptions } from '@bubbles/supabase-access/auth';

export { getSharedAuthCookieDomain } from '@bubbles/supabase-access/auth';

/**
 * Returns the dashboard auth cookie options shared by browser and server
 * Supabase clients.
 *
 * The cookie domain can be forced with `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN`. When
 * that is omitted, the value is derived from the configured dashboard app URL.
 */
export function getDashboardAuthCookieOptions({
  appUrl,
  cookieDomain,
}: {
  appUrl: string;
  cookieDomain?: string;
}) {
  return getSupabaseAuthCookieOptions({ appUrl, cookieDomain });
}
