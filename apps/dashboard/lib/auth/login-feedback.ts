export const DASHBOARD_LOGIN_ATTEMPT_STORAGE_KEY =
  'dashboard:auth:login-attempt';

const UNAUTHORIZED_LOGIN_MESSAGE =
  'Dieser User ist nicht autorisiert, das Dashboard zu betreten. Wenn du denkst, das ist ein Fehler, melde dich bitte beim Admin.';

/**
 * Maps Supabase OAuth hash or query errors to dashboard-facing login feedback.
 *
 * Supabase returns auth errors in the URL fragment after redirecting back to
 * the login page. This helper keeps the UI copy stable and avoids exposing the
 * internal allowlist implementation to visitors.
 *
 * @param hash URL fragment or query string returned by the OAuth redirect.
 * @returns A human-friendly error message or `null` when nothing should show.
 */
export function getDashboardLoginErrorMessage(hash: string) {
  const normalizedHash =
    hash.startsWith('#') || hash.startsWith('?') ? hash.slice(1) : hash;

  if (!normalizedHash) {
    return null;
  }

  const params = new URLSearchParams(normalizedHash);
  const error = params.get('error');

  if (error === 'access_denied') {
    return UNAUTHORIZED_LOGIN_MESSAGE;
  }

  if (error === 'server_error') {
    return 'Die Anmeldung konnte gerade nicht abgeschlossen werden. Bitte versuche es noch einmal.';
  }

  return null;
}
