import { clearCreateDraft, clearEditDraft } from '@bubbles/markdown-editor';

export type VaultEntryDraftMode = 'create' | 'edit';

type VaultEntryDraftIdentity = {
  mode: VaultEntryDraftMode;
  id?: string | null;
};

/**
 * Returns the stable markdown-editor draft scope for one Vault entry session.
 *
 * Create mode intentionally uses one shared draft slot, while edit mode stays
 * isolated per content item so switching between entries does not overwrite
 * local work in progress.
 *
 * @param input Draft identity for create or edit mode.
 * @returns Stable draft scope consumed by the shared markdown editor.
 */
export function getVaultEntryDraftScope({
  id,
  mode,
}: VaultEntryDraftIdentity): string {
  if (mode === 'edit' && id) {
    return `vault-entry:${id}`;
  }

  return 'vault-entry:create';
}

/**
 * Builds the dashboard-local preview pathname for one authoring session.
 *
 * @param input Draft identity for create or edit mode.
 * @returns Preview pathname opened in a separate browser tab.
 */
export function getVaultEntryPreviewHref({
  id,
  mode,
}: VaultEntryDraftIdentity): string {
  if (mode === 'edit' && id) {
    return `/vault/preview/${id}`;
  }

  return '/vault/preview/new';
}

/**
 * Removes the local draft payload for one authoring session.
 *
 * Use this for temporary draft navigation entries where closing the draft
 * should discard only the unsaved browser state, never the persisted entry.
 *
 * @param input Draft identity for create or edit mode.
 */
export function clearVaultEntryDraft({
  id,
  mode,
}: VaultEntryDraftIdentity): void {
  const scope = getVaultEntryDraftScope({
    id,
    mode,
  });

  if (mode === 'edit' && id) {
    clearEditDraft(scope);
    return;
  }

  clearCreateDraft(scope);
}

/**
 * Asks whether one local Vault draft should really be discarded.
 *
 * @returns `true` when the user confirmed the destructive action.
 */
export function confirmDiscardVaultEntryDraft(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.confirm(
    'Entwurf wirklich verwerfen? Nicht gespeicherte Änderungen gehen verloren.'
  );
}

/**
 * Returns the temporary sidebar label for one open Vault draft session.
 *
 * @param mode Draft mode for the current editor session.
 * @returns Human-readable label for the temporary sidebar child item.
 */
export function getVaultEntryDraftLabel(mode: VaultEntryDraftMode): string {
  return mode === 'edit'
    ? 'Eintrag bearbeiten (Draft)'
    : 'Neuer Eintrag (Draft)';
}
