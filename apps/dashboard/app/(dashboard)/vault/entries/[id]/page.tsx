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
 * Renders the edit screen for an existing Vault entry.
 *
 * The page reuses the shared editor wrapper from create mode, but preloads the
 * current content, metadata, and primary category before persisting updates.
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
    <>
      <section className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
        <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
          Coding Vault
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Vault-Eintrag bearbeiten
          </h1>
          <p className="max-w-3xl text-sm text-pretty text-muted-foreground sm:text-base">
            Passe Inhalt, Kategorienpfad und Metadaten im selben gemeinsamen
            Markdown-Editor an, den du auch für neue Vault-Einträge nutzt.
          </p>
        </div>
      </section>

      <VaultEntryEditor
        categories={editModel.categories}
        initialData={editModel.initialData}
        mode="edit"
      />
    </>
  );
}
