import { requireDashboardManagerSession } from '@/lib/auth/session';
import { getVaultEntryCreationModel } from '@/lib/vault/entries';

import { VaultEntryEditor } from '@/components/vault/entries/vault-entry-editor';

/**
 * Renders the first real create-entry screen for the Coding Vault.
 *
 * Owners and editors can author new Markdown-based entries directly in the
 * shared editor while the dashboard supplies the Vault-specific category
 * context and persistence endpoint.
 */
export default async function NewVaultEntryPage() {
  await requireDashboardManagerSession();
  const creationModel = await getVaultEntryCreationModel();

  return (
    <>
      <section className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
        <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
          Coding Vault
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Neuer Vault-Eintrag
          </h1>
          <p className="max-w-3xl text-sm text-pretty text-muted-foreground sm:text-base">
            Schreibe den Inhalt direkt im gemeinsamen Markdown-Editor, inkl.
            Bild-Uploads und automatischer Slug-Ableitung aus dem
            Kategorienpfad.
          </p>
        </div>
      </section>

      <VaultEntryEditor categories={creationModel.categories} />
    </>
  );
}
