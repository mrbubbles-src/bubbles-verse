/**
 * Builds the Supabase auth cookie base name for the configured project URL.
 *
 * Supabase derives browser auth storage keys from the project ref embedded in
 * the Supabase host. Dashboard proxy checks use the same key to optimistically
 * detect an existing browser session before server rendering begins.
 *
 * @param supabaseUrl Public Supabase project URL for the dashboard app.
 * @returns The base cookie name used for the auth token.
 */
export function getDashboardAuthCookieName(supabaseUrl: string) {
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

  return `sb-${projectRef}-auth-token`;
}

/**
 * Checks whether the incoming cookie set already contains a Supabase session.
 *
 * Supabase may split large auth cookies into numbered chunks, so this accepts
 * both the base auth cookie and chunked variants like `.0`, `.1`, and so on.
 *
 * @param cookieNames Cookie names present on the current request.
 * @param supabaseUrl Public Supabase project URL for the dashboard app.
 * @returns `true` when a dashboard auth cookie is present.
 */
export function hasDashboardAuthSessionCookie(
  cookieNames: Iterable<string>,
  supabaseUrl: string
) {
  const authCookieName = getDashboardAuthCookieName(supabaseUrl);

  for (const cookieName of cookieNames) {
    if (
      cookieName === authCookieName ||
      cookieName.startsWith(`${authCookieName}.`)
    ) {
      return true;
    }
  }

  return false;
}
