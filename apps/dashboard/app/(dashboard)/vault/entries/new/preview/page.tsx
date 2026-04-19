import { requireDashboardManagerSession } from '@/lib/auth/session';
import { getVaultEntryDraftScope } from '@/lib/vault/entry-drafts';

import { VaultEntryPreview } from '@/components/vault/entries/vault-entry-preview';

/**
 * Renders the fullscreen preview for a new unsaved Vault draft.
 *
 * The preview resolves the current draft from browser storage, so no server
 * payload is required beyond the authenticated dashboard shell.
 */
export default async function NewVaultEntryPreviewPage() {
  await requireDashboardManagerSession();

  return (
    <VaultEntryPreview
      draftScope={getVaultEntryDraftScope({
        mode: 'create',
      })}
      mode="create"
    />
  );
}
