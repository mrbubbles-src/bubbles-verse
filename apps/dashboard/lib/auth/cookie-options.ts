/**
 * Derives the shared parent cookie domain from a subdomain hostname.
 *
 * Use this when the dashboard lives on a host like
 * `dashboard.mrbubbles.test` and the auth cookie should be visible to sibling
 * subdomains as well. Hosts without a subdomain, such as `localhost`, return
 * `undefined` so cookies stay host-scoped.
 */
export function getSharedAuthCookieDomain(hostname: string) {
  const labels = hostname.split('.').filter(Boolean);

  if (labels.length < 3) {
    return undefined;
  }

  return `.${labels.slice(1).join('.')}`;
}

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
