import { getSupabaseAuthCookieOptions } from '@bubbles/supabase-access/auth';

export { getSharedAuthCookieDomain } from '@bubbles/supabase-access/auth';

/**
 * Returns the Bubblophy auth cookie options shared by browser and server
 * Supabase clients.
 *
 * The cookie domain can be forced with `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN`. When
 * omitted, the value is derived from the configured Bubblophy app URL.
 */
export function getBubblophyAuthCookieOptions({
  appUrl,
  cookieDomain,
}: {
  appUrl: string;
  cookieDomain?: string;
}) {
  return getSupabaseAuthCookieOptions({ appUrl, cookieDomain });
}
