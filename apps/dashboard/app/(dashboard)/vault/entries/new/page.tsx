import { requireDashboardManagerSession } from '@/lib/auth/session';
import { getVaultEntryCreationModel } from '@/lib/vault/entries';

import { VaultEntryEditor } from '@/components/vault/entries/vault-entry-editor';

/**
 * Renders the create-entry workspace for the Coding Vault.
 *
 * The page keeps the dashboard shell minimal and delegates the actual authoring
 * flow to the shared Vault editor wrapper.
 */
export default async function NewVaultEntryPage() {
  await requireDashboardManagerSession();
  const creationModel = await getVaultEntryCreationModel();

  return <VaultEntryEditor categories={creationModel.categories} />;
}
