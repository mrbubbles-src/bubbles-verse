/**
 * Derives the shared parent cookie domain from a subdomain hostname.
 *
 * Hosts without a subdomain, such as `localhost`, return `undefined` so auth
 * cookies stay host-scoped.
 */
export function getSharedAuthCookieDomain(hostname: string) {
  const labels = hostname.split('.').filter(Boolean);

  if (labels.length < 3) {
    return undefined;
  }

  return `.${labels.slice(1).join('.')}`;
}

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
