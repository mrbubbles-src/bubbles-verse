const VAULT_ENTRY_FEEDBACK_MESSAGES = {
  created: 'Vault-Eintrag erstellt.',
  updated: 'Vault-Eintrag aktualisiert.',
  deleted: 'Vault-Eintrag gelöscht.',
} as const;

export const VAULT_ENTRY_FEEDBACK_PARAM = 'entry';

export type VaultEntryFeedbackStatus =
  keyof typeof VAULT_ENTRY_FEEDBACK_MESSAGES;

/**
 * Reads the current Vault entry feedback message from a query string.
 *
 * Entry mutations redirect back to `/vault/entries` with a compact status code
 * so the list can stay server-first while still showing a one-time toast.
 *
 * @param search Raw query string from `window.location.search`.
 * @returns The matching feedback message or `null`.
 */
export function getVaultEntryFeedbackMessage(search: string) {
  const normalizedSearch = search.startsWith('?') ? search.slice(1) : search;

  if (!normalizedSearch) {
    return null;
  }

  const params = new URLSearchParams(normalizedSearch);
  const status = params.get(VAULT_ENTRY_FEEDBACK_PARAM);

  if (!status) {
    return null;
  }

  return (
    VAULT_ENTRY_FEEDBACK_MESSAGES[status as VaultEntryFeedbackStatus] ?? null
  );
}

/**
 * Builds the redirect target for a finished Vault entry mutation.
 *
 * @param status Short result code for the list-page feedback toast.
 * @returns The Vault entry list URL with encoded feedback.
 */
export function getVaultEntryFeedbackHref(status: VaultEntryFeedbackStatus) {
  return `/vault/entries?${VAULT_ENTRY_FEEDBACK_PARAM}=${status}`;
}
