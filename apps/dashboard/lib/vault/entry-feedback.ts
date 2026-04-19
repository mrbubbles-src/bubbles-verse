import {
  createRedirectFeedbackConfig,
  getRedirectFeedbackHref,
  getRedirectFeedbackMessage,
} from '@/lib/feedback/redirect-feedback';

const VAULT_ENTRY_FEEDBACK_MESSAGES = {
  created: 'Vault-Eintrag erstellt.',
  updated: 'Vault-Eintrag aktualisiert.',
  deleted: 'Vault-Eintrag gelöscht.',
} as const;

export const VAULT_ENTRY_FEEDBACK_PARAM = 'entry';

export type VaultEntryFeedbackStatus =
  keyof typeof VAULT_ENTRY_FEEDBACK_MESSAGES;

export const VAULT_ENTRY_FEEDBACK_CONFIG =
  createRedirectFeedbackConfig<VaultEntryFeedbackStatus>({
    pathname: '/vault/entries',
    param: VAULT_ENTRY_FEEDBACK_PARAM,
    messages: VAULT_ENTRY_FEEDBACK_MESSAGES,
  });

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
  return getRedirectFeedbackMessage(search, VAULT_ENTRY_FEEDBACK_CONFIG);
}

/**
 * Builds the redirect target for a finished Vault entry mutation.
 *
 * @param status Short result code for the list-page feedback toast.
 * @returns The Vault entry list URL with encoded feedback.
 */
export function getVaultEntryFeedbackHref(status: VaultEntryFeedbackStatus) {
  return getRedirectFeedbackHref(status, VAULT_ENTRY_FEEDBACK_CONFIG);
}
