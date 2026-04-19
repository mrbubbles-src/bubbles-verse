import {
  createRedirectFeedbackConfig,
  getRedirectFeedbackHref,
  getRedirectFeedbackMessage,
} from '@/lib/feedback/redirect-feedback';

const DASHBOARD_PROFILE_FEEDBACK_MESSAGES = {
  updated: 'Profil aktualisiert.',
  invalid: 'Bitte prüfe die Profilangaben und versuche es noch einmal.',
  duplicate: 'Dieser Profil-Slug ist bereits vergeben.',
  error: 'Das Profil konnte gerade nicht gespeichert werden.',
} as const;

export const DASHBOARD_PROFILE_FEEDBACK_PARAM = 'profile';

export type DashboardProfileFeedbackStatus =
  keyof typeof DASHBOARD_PROFILE_FEEDBACK_MESSAGES;

export const DASHBOARD_PROFILE_FEEDBACK_CONFIG =
  createRedirectFeedbackConfig<DashboardProfileFeedbackStatus>({
    pathname: '/profile',
    param: DASHBOARD_PROFILE_FEEDBACK_PARAM,
    messages: DASHBOARD_PROFILE_FEEDBACK_MESSAGES,
  });

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
  return getRedirectFeedbackMessage(search, DASHBOARD_PROFILE_FEEDBACK_CONFIG);
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
  return getRedirectFeedbackHref(status, DASHBOARD_PROFILE_FEEDBACK_CONFIG);
}
