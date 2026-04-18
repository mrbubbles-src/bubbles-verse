const DASHBOARD_PROFILE_FEEDBACK_MESSAGES = {
  updated: 'Profil aktualisiert.',
  invalid: 'Bitte prüfe die Profilangaben und versuche es noch einmal.',
  duplicate: 'Dieser Profil-Slug ist bereits vergeben.',
  error: 'Das Profil konnte gerade nicht gespeichert werden.',
} as const;

export const DASHBOARD_PROFILE_FEEDBACK_PARAM = 'profile';

export type DashboardProfileFeedbackStatus =
  keyof typeof DASHBOARD_PROFILE_FEEDBACK_MESSAGES;

/**
 * Reads the current profile feedback message from a query string.
 *
 * Profile mutations redirect back to `/profile` with a short status code so
 * the route can stay server-first while still showing one-time toast feedback.
 *
 * @param search Raw query string from `window.location.search`.
 * @returns The matching message or `null`.
 */
export function getDashboardProfileFeedbackMessage(search: string) {
  const normalizedSearch = search.startsWith('?') ? search.slice(1) : search;

  if (!normalizedSearch) {
    return null;
  }

  const params = new URLSearchParams(normalizedSearch);
  const status = params.get(DASHBOARD_PROFILE_FEEDBACK_PARAM);

  if (!status) {
    return null;
  }

  return (
    DASHBOARD_PROFILE_FEEDBACK_MESSAGES[
      status as DashboardProfileFeedbackStatus
    ] ?? null
  );
}

/**
 * Builds the `/profile` redirect target for a finished profile mutation.
 *
 * @param status Short result code produced by a profile Server Action.
 * @returns The profile pathname plus encoded feedback.
 */
export function getDashboardProfileFeedbackHref(
  status: DashboardProfileFeedbackStatus
) {
  return `/profile?${DASHBOARD_PROFILE_FEEDBACK_PARAM}=${status}`;
}
