import { requireDashboardManagerSession } from '@/lib/auth/session';
import { getVaultEntryDraftScope } from '@/lib/vault/entry-drafts';

import { VaultEntryPreview } from '@/components/vault/entries/vault-entry-preview';

/**
 * Renders the standalone fullscreen preview for a new unsaved Vault draft.
 *
 * The preview lives outside the `/vault/entries/*` route tree so opening it
 * does not create another temporary entry item in the sidebar.
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
