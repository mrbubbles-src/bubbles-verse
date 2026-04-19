import {
  createRedirectFeedbackConfig,
  getRedirectFeedbackHref,
  getRedirectFeedbackMessage,
} from '@/lib/feedback/redirect-feedback';

const VAULT_CATEGORY_FEEDBACK_MESSAGES = {
  created: 'Kategorie erstellt.',
  updated: 'Kategorie aktualisiert.',
  deleted: 'Kategorie entfernt.',
  duplicate: 'Dieser Slug ist schon belegt. Bitte wähle einen anderen.',
  invalid: 'Bitte prüfe die Kategorie-Daten und versuche es noch einmal.',
  protected:
    'Diese Kategorie kann gerade nicht geändert oder gelöscht werden, weil die Baumregel oder bestehende Inhalte das verhindern.',
  error: 'Die Kategorie konnte gerade nicht gespeichert werden.',
} as const;

export const VAULT_CATEGORY_FEEDBACK_PARAM = 'category';

export type VaultCategoryFeedbackStatus =
  keyof typeof VAULT_CATEGORY_FEEDBACK_MESSAGES;

export const VAULT_CATEGORY_FEEDBACK_CONFIG =
  createRedirectFeedbackConfig<VaultCategoryFeedbackStatus>({
    pathname: '/vault/categories',
    param: VAULT_CATEGORY_FEEDBACK_PARAM,
    messages: VAULT_CATEGORY_FEEDBACK_MESSAGES,
  });

/**
 * Reads the current Vault category feedback message from a query string.
 *
 * Category actions redirect back to `/vault/categories` with a short status
 * code so the page can stay server-first while still showing toast feedback.
 *
 * @param search Raw query string from `window.location.search`.
 * @returns The matching user-facing message or `null`.
 */
export function getVaultCategoryFeedbackMessage(search: string) {
  return getRedirectFeedbackMessage(search, VAULT_CATEGORY_FEEDBACK_CONFIG);
}

/**
 * Builds the redirect target for finished Vault category mutations.
 *
 * @param status Short category result code for the feedback toast.
 * @returns The categories pathname with the encoded status query.
 */
export function getVaultCategoryFeedbackHref(
  status: VaultCategoryFeedbackStatus
) {
  return getRedirectFeedbackHref(status, VAULT_CATEGORY_FEEDBACK_CONFIG);
}
