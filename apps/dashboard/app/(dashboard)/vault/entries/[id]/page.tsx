import { requireDashboardManagerSession } from '@/lib/auth/session';
import { getVaultEntryEditModel } from '@/lib/vault/entries';

import { notFound } from 'next/navigation';

import { VaultEntryEditor } from '@/components/vault/entries/vault-entry-editor';

type EditVaultEntryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Renders the edit workspace for one existing Vault entry.
 *
 * The page keeps only the route-level data loading and lets the shared Vault
 * editor wrapper own the actual authoring chrome and persistence flow.
 */
export default async function EditVaultEntryPage({
  params,
}: EditVaultEntryPageProps) {
  await requireDashboardManagerSession();
  const { id } = await params;
  const editModel = await getVaultEntryEditModel(id);

  if (!editModel) {
    notFound();
  }

  return (
    <VaultEntryEditor
      categories={editModel.categories}
      initialData={editModel.initialData}
      mode="edit"
    />
  );
}
