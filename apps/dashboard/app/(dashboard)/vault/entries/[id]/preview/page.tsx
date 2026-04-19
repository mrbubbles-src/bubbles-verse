import { requireDashboardManagerSession } from '@/lib/auth/session';
import { getVaultEntryPreviewData } from '@/lib/vault/entries';
import { getVaultEntryDraftScope } from '@/lib/vault/entry-drafts';

import { notFound } from 'next/navigation';

import { VaultEntryPreview } from '@/components/vault/entries/vault-entry-preview';

type EditVaultEntryPreviewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Renders the fullscreen preview for an existing Vault entry.
 *
 * Persisted content seeds the page so direct opens still work, while the
 * client preview layer upgrades to the active local draft when one exists.
 *
 * @param props Dynamic route params with the content item identifier.
 * @returns Standalone preview page for the current Vault entry.
 */
export default async function EditVaultEntryPreviewPage({
  params,
}: EditVaultEntryPreviewPageProps) {
  await requireDashboardManagerSession();
  const { id } = await params;
  const previewData = await getVaultEntryPreviewData(id);

  if (!previewData) {
    notFound();
  }

  return (
    <VaultEntryPreview
      draftScope={getVaultEntryDraftScope({
        id,
        mode: 'edit',
      })}
      fallbackDescription={previewData.description}
      fallbackSerializedContent={previewData.serializedContent}
      fallbackTitle={previewData.title}
      mode="edit"
    />
  );
}
