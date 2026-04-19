import { requireDashboardManagerSession } from '@/lib/auth/session';
import {
  getVaultEntryListPageModel,
  parseVaultEntryListFilters,
} from '@/lib/vault/entries';

import Link from 'next/link';

import { Button } from '@bubbles/ui/shadcn/button';

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
      <section className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Einträge
            </h1>
            <p className="text-sm text-muted-foreground">
              {pageModel.summary.totalEntries} Einträge ·{' '}
              {pageModel.summary.draftEntries} Entwürfe ·{' '}
              {pageModel.summary.publishedEntries} veröffentlicht
            </p>
          </div>

          <Button
            render={<Link href="/vault/entries/new" />}
            nativeButton={false}
            className="w-full sm:w-auto">
            Neuer Eintrag
          </Button>
        </div>

        <VaultEntryFilters
          categories={pageModel.categories}
          filters={pageModel.filters}
        />

        <VaultEntryList
          entries={pageModel.entries}
          emptyState={emptyState}
          filters={pageModel.filters}
          pagination={pageModel.pagination}
        />
      </section>
    </>
  );
}
