const DEFAULT_BUBBLOPHY_REDIRECT_PATH = '/';

/**
 * Normalizes a Bubblophy redirect target to a safe same-origin path.
 *
 * @param value Untrusted `next` value from query params or links.
 * @param fallback Path used when the value is missing or unsafe.
 * @returns A relative path safe to pass to `new URL(path, appUrl)`.
 */
export function getSafeBubblophyRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_BUBBLOPHY_REDIRECT_PATH
) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  return value;
}

/**
 * Builds the login path for an unauthenticated protected Bubblophy request.
 *
 * @param nextPath Protected path the user should return to after login.
 * @returns Login path with an encoded, relative `next` parameter.
 */
export function buildBubblophyLoginPath(
  nextPath = DEFAULT_BUBBLOPHY_REDIRECT_PATH
) {
  const safeNextPath = getSafeBubblophyRedirectPath(nextPath);

  return `/login?next=${encodeURIComponent(safeNextPath)}`;
}

/**
 * Builds the logout path for a denied or stale Bubblophy session.
 *
 * @param nextPath Relative path the logout route should redirect to.
 * @returns Logout route path with an encoded, relative `next` parameter.
 */
export function buildBubblophyLogoutPath(nextPath = '/login') {
  const safeNextPath = getSafeBubblophyRedirectPath(nextPath, '/login');

  return `/auth/logout?next=${encodeURIComponent(safeNextPath)}`;
}
