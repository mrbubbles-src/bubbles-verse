const DASHBOARD_ACCESS_FEEDBACK_MESSAGES = {
  created: 'Zugang freigegeben.',
  updated: 'Zugang aktualisiert.',
  deleted: 'Zugang entfernt.',
  duplicate:
    'Diese GitHub-Identität ist bereits freigegeben. Passe sie unten direkt an.',
  invalid: 'Bitte prüfe die Eingaben und versuche es noch einmal.',
  protected:
    'Den letzten aktiven Owner-Zugang kannst du hier nicht sperren oder entfernen.',
  forbidden: 'Nur Owner dürfen Zugänge verwalten.',
  error: 'Die Änderung konnte gerade nicht gespeichert werden.',
} as const;

export const DASHBOARD_ACCESS_FEEDBACK_PARAM = 'access';

export type DashboardAccessFeedbackStatus =
  keyof typeof DASHBOARD_ACCESS_FEEDBACK_MESSAGES;

/**
 * Reads the current account-management feedback message from a query string.
 *
 * Server Actions redirect back to `/account` with a short status code. This
 * helper keeps the UI copy centralized and strips out unsupported values.
 *
 * @param search Raw query string from `window.location.search`.
 * @returns The matching human-friendly message or `null`.
 */
export function getDashboardAccessFeedbackMessage(search: string) {
  const normalizedSearch = search.startsWith('?') ? search.slice(1) : search;

  if (!normalizedSearch) {
    return null;
  }

  const params = new URLSearchParams(normalizedSearch);
  const status = params.get(DASHBOARD_ACCESS_FEEDBACK_PARAM);

  if (!status) {
    return null;
  }

  return (
    DASHBOARD_ACCESS_FEEDBACK_MESSAGES[
      status as DashboardAccessFeedbackStatus
    ] ?? null
  );
}

/**
 * Builds the `/account` redirect target for a finished access-management step.
 *
 * Keep all success and error redirects consistent so the feedback toast can
 * decode them without duplicating route string logic in every action.
 *
 * @param status Short status code produced by an account Server Action.
 * @returns The account pathname plus the encoded feedback query parameter.
 */
export function getDashboardAccessFeedbackHref(
  status: DashboardAccessFeedbackStatus
) {
  return `/account?${DASHBOARD_ACCESS_FEEDBACK_PARAM}=${status}`;
}
