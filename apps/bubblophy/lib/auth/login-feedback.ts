export const BUBBLOPHY_LOGIN_ATTEMPT_STORAGE_KEY =
  'bubblophy:auth:login-attempt';

const UNAUTHORIZED_LOGIN_MESSAGE =
  'Dieser User ist nicht autorisiert, Bubblophy zu betreten. Wenn du denkst, dass das ein Fehler ist, melde dich bitte beim Admin.';

/**
 * Maps Supabase OAuth hash or query errors to Bubblophy-facing login feedback.
 *
 * @param value URL fragment or query string returned by the OAuth redirect.
 * @returns A human-friendly error message or `null` when nothing should show.
 */
export function getBubblophyLoginErrorMessage(value: string) {
  const normalizedValue =
    value.startsWith('#') || value.startsWith('?') ? value.slice(1) : value;

  if (!normalizedValue) {
    return null;
  }

  const params = new URLSearchParams(normalizedValue);
  const error = params.get('error');

  if (error === 'access_denied') {
    return UNAUTHORIZED_LOGIN_MESSAGE;
  }

  if (error === 'server_error') {
    return 'Die Anmeldung konnte gerade nicht abgeschlossen werden. Bitte versuche es noch einmal.';
  }

  return null;
}
