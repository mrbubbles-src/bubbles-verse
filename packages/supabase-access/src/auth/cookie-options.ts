export type SupabaseAuthCookieOptionsInput = {
  appUrl: string;
  cookieDomain?: string;
};

/**
 * Derives the shared parent cookie domain from a subdomain hostname.
 *
 * @param hostname Hostname from the app URL, for example `app.mrbubbles.test`.
 * @returns Parent cookie domain for sibling subdomains, or `undefined`.
 */
export function getSharedAuthCookieDomain(hostname: string) {
  const labels = hostname.split('.').filter(Boolean);

  if (labels.length < 3) {
    return undefined;
  }

  return `.${labels.slice(1).join('.')}`;
}

/**
 * Builds shared Supabase auth cookie options for browser and server clients.
 *
 * @param input App URL plus optional explicit cookie-domain override.
 * @returns Cookie options compatible with `@supabase/ssr` client factories.
 */
export function getSupabaseAuthCookieOptions({
  appUrl,
  cookieDomain,
}: SupabaseAuthCookieOptionsInput) {
  const parsedAppUrl = new URL(appUrl);
  const sharedCookieDomain =
    cookieDomain ?? getSharedAuthCookieDomain(parsedAppUrl.hostname);

  return {
    ...(sharedCookieDomain ? { domain: sharedCookieDomain } : {}),
    path: '/',
    sameSite: 'lax' as const,
    secure: parsedAppUrl.protocol === 'https:',
  };
}
