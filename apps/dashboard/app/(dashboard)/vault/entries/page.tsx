import { requireDashboardManagerSession } from '@/lib/auth/session';
import {
  getVaultEntryListPageModel,
  parseVaultEntryListFilters,
} from '@/lib/vault/entries';

import Link from 'next/link';

import { Button } from '@bubbles/ui/shadcn/button';

import { EntryFeedbackToast } from '@/components/vault/entries/entry-feedback-toast';
import { VaultEntryFilters } from '@/components/vault/entries/vault-entry-filters';
import { VaultEntryList } from '@/components/vault/entries/vault-entry-list';

type VaultEntriesPageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

/**
 * Renders the first real Vault entry overview for owners and editors.
 *
 * The list stays intentionally compact for V1 and focuses on recently updated
 * entries, category context, and publication state.
 */
export default async function VaultEntriesPage({
  searchParams,
}: VaultEntriesPageProps) {
  await requireDashboardManagerSession();
  const filters = parseVaultEntryListFilters(await searchParams);
  const pageModel = await getVaultEntryListPageModel(filters);
  const emptyState =
    filters.query || filters.status !== 'all' || filters.categoryId
      ? 'Keine Vault-Einträge passen gerade zu diesen Filtern.'
      : undefined;

  return (
    <>
      <EntryFeedbackToast />
      <section className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
              Coding Vault
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-balance">
              Vault-Einträge
            </h1>
            <p className="max-w-3xl text-sm text-pretty text-muted-foreground sm:text-base">
              Alle Inhalte für den Coding Vault an einem Ort, inklusive
              Kategorie, Status und letztem Änderungszeitpunkt.
            </p>
          </div>

          <Button
            render={<Link href="/vault/entries/new" />}
            nativeButton={false}
            className="rounded-full px-5">
            Neuer Eintrag
          </Button>
        </div>
      </section>

      <VaultEntryFilters
        categories={pageModel.categories}
        filters={pageModel.filters}
        resultCount={pageModel.entries.length}
      />

      <VaultEntryList entries={pageModel.entries} emptyState={emptyState} />
    </>
  );
}
