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
  const normalizedSearch = search.startsWith('?') ? search.slice(1) : search;

  if (!normalizedSearch) {
    return null;
  }

  const params = new URLSearchParams(normalizedSearch);
  const status = params.get(VAULT_CATEGORY_FEEDBACK_PARAM);

  if (!status) {
    return null;
  }

  return (
    VAULT_CATEGORY_FEEDBACK_MESSAGES[status as VaultCategoryFeedbackStatus] ??
    null
  );
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
  return `/vault/categories?${VAULT_CATEGORY_FEEDBACK_PARAM}=${status}`;
}
