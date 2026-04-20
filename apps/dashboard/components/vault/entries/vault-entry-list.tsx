'use client';

import type {
  VaultEntryListFilters,
  VaultEntryListItem,
  VaultEntryListPagination,
} from '@/lib/vault/entries';

import { useState } from 'react';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Pagination } from '@bubbles/ui/components/pagination';
import { StagedConfirmDialog } from '@bubbles/ui/components/staged-confirm-dialog';
import {
  Delete02Icon,
  HugeiconsIcon,
  PencilEdit01Icon,
  PlayCircle02Icon,
} from '@bubbles/ui/lib/hugeicons';
import { toast } from '@bubbles/ui/lib/sonner';
import {
  AlertDialogCancel,
  AlertDialogFooter,
} from '@bubbles/ui/shadcn/alert-dialog';
import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@bubbles/ui/shadcn/tooltip';

type VaultEntryListProps = {
  entries: VaultEntryListItem[];
  filters: VaultEntryListFilters;
  pagination: VaultEntryListPagination;
  emptyState?: string;
};

/**
 * Builds one stable list URL while preserving active entry filters.
 *
 * @param filters Current list filter state from the page model.
 * @param overrides Partial state updates for one navigation target.
 * @returns Relative list href with compact query params.
 */
function buildVaultEntriesHref(
  filters: VaultEntryListFilters,
  overrides: Partial<VaultEntryListFilters>
) {
  const nextFilters = {
    ...filters,
    ...overrides,
  };
  const params = new URLSearchParams();

  if (nextFilters.query) {
    params.set('query', nextFilters.query);
  }

  if (nextFilters.status !== 'all') {
    params.set('status', nextFilters.status);
  }

  if (nextFilters.categoryId) {
    params.set('categoryId', nextFilters.categoryId);
  }

  if (nextFilters.page > 1) {
    params.set('page', String(nextFilters.page));
  }

  if (nextFilters.pageSize !== 20) {
    params.set('pageSize', String(nextFilters.pageSize));
  }

  const query = params.toString();

  return query ? `/vault/entries?${query}` : '/vault/entries';
}

/**
 * Renders the real Vault management table with icon actions and classic
 * pagination while keeping deletion inside the list view.
 */
export function VaultEntryList({
  entries,
  filters,
  pagination,
  emptyState = 'Noch keine Vault-Einträge. Lege deinen ersten Eintrag an und er taucht hier direkt in der Redaktionsliste auf.',
}: VaultEntryListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  async function handleDeleteConfirmed(entry: VaultEntryListItem) {
    if (deletingEntryId) {
      return;
    }

    setDeletingEntryId(entry.id);

    try {
      const response = await fetch(`/api/vault/entries/${entry.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const responseBody = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        const message =
          responseBody?.message ??
          'Der Vault-Eintrag konnte gerade nicht gelöscht werden.';

        toast.error(message);
        return;
      }

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set('entry', 'deleted');
      const nextHref = nextParams.toString()
        ? `${pathname}?${nextParams.toString()}`
        : pathname;

      router.push(nextHref);
      router.refresh();
    } finally {
      setDeletingEntryId(null);
    }
  }

  function handlePageSizeChange(pageSize: string) {
    router.push(
      buildVaultEntriesHref(filters, {
        page: 1,
        pageSize: Number(pageSize) as VaultEntryListFilters['pageSize'],
      })
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-12 text-base text-muted-foreground">{emptyState}</div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-208 border-collapse text-left text-base">
            <thead>
              <tr className="border-b border-border/60 text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">
                <th className="py-4 pr-4">Titel</th>
                <th className="w-[18%] py-4 pr-4">Kategorie</th>
                <th className="w-[12%] py-4 pr-4">Status</th>
                <th className="w-[16%] py-4 pr-4">Zuletzt bearbeitet</th>
                <th className="w-40 py-4 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border/50 align-top">
                  <td className="py-5 pr-4">
                    <div className="min-w-0">
                      <Link
                        href={`/vault/entries/${entry.id}`}
                        className="text-lg font-medium tracking-tight underline-offset-4 hover:underline sm:text-xl">
                        {entry.title}
                      </Link>
                      {entry.description ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <p className="mt-1.5 truncate text-base text-muted-foreground">
                                {entry.description}
                              </p>
                            }
                          />
                          <TooltipContent className="max-w-sm text-pretty">
                            {entry.description}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <p className="mt-1.5 text-base text-muted-foreground">
                          Keine Beschreibung.
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-5 pr-4 text-base text-muted-foreground">
                    {entry.categoryLabel}
                  </td>
                  <td className="py-5 pr-4">
                    <Badge
                      variant={
                        entry.status === 'published' ? 'default' : 'secondary'
                      }>
                      {entry.status === 'published'
                        ? 'Veröffentlicht'
                        : 'Entwurf'}
                    </Badge>
                  </td>
                  <td className="py-5 pr-4 text-base text-muted-foreground">
                    {entry.updatedAtLabel}
                  </td>
                  <td className="py-5">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              render={
                                <Link href={`/vault/entries/${entry.id}`} />
                              }
                              nativeButton={false}
                              variant="ghost"
                              size="icon-lg"
                              className="size-10 [&_svg:not([class*='size-'])]:size-5"
                              aria-label="Eintrag bearbeiten"
                            />
                          }>
                          <HugeiconsIcon
                            icon={PencilEdit01Icon}
                            strokeWidth={2}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Bearbeiten</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        {entry.previewHref ? (
                          <TooltipTrigger
                            render={
                              <Button
                                render={
                                  <a
                                    href={entry.previewHref}
                                    target="_blank"
                                    rel="noreferrer"
                                  />
                                }
                                nativeButton={false}
                                variant="ghost"
                                size="icon-lg"
                                className="size-10 [&_svg:not([class*='size-'])]:size-5"
                                aria-label="Vorschau öffnen"
                              />
                            }>
                            <HugeiconsIcon
                              icon={PlayCircle02Icon}
                              strokeWidth={2}
                            />
                          </TooltipTrigger>
                        ) : (
                          <TooltipTrigger
                            render={
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-lg"
                                className="size-10 [&_svg:not([class*='size-'])]:size-5"
                                aria-label="Vorschau öffnen"
                                disabled
                              />
                            }>
                            <HugeiconsIcon
                              icon={PlayCircle02Icon}
                              strokeWidth={2}
                            />
                          </TooltipTrigger>
                        )}
                        <TooltipContent>
                          {entry.previewHref
                            ? 'Vorschau'
                            : 'Vorschau wird separat integriert'}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger
                          render={<span className="inline-flex" />}>
                          <StagedConfirmDialog
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon-lg"
                                className="size-10 [&_svg:not([class*='size-'])]:size-5"
                                type="button"
                                aria-label="Eintrag löschen"
                                title="Löschen"
                                disabled={deletingEntryId === entry.id}>
                                <HugeiconsIcon
                                  icon={Delete02Icon}
                                  strokeWidth={2}
                                />
                              </Button>
                            }
                            firstStep={{
                              alertSize: 'sm',
                              title: 'Eintrag löschen?',
                              description: (
                                <>
                                  Möchtest du{' '}
                                  <span className="font-medium text-foreground">
                                    {entry.title}
                                  </span>{' '}
                                  wirklich aus dem Vault entfernen?
                                </>
                              ),
                              confirmLabel: 'Löschen',
                            }}
                            secondStep={{
                              alertSize: 'sm',
                              title: 'Wirklich endgültig löschen?',
                              description: (
                                <>
                                  Der Eintrag{' '}
                                  <span className="font-medium text-foreground">
                                    {entry.title}
                                  </span>{' '}
                                  wird dauerhaft entfernt.
                                </>
                              ),
                              children: (
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Zurück</AlertDialogCancel>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => handleDeleteConfirmed(entry)}
                                    disabled={deletingEntryId === entry.id}>
                                    {deletingEntryId === entry.id
                                      ? 'Lösche…'
                                      : 'Ja, löschen'}
                                  </Button>
                                </AlertDialogFooter>
                              ),
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Löschen</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.showPagination ? (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            label={`Seite ${pagination.page} von ${pagination.totalPages}`}
            getPageHref={(page) => buildVaultEntriesHref(filters, { page })}
            pageSize={pagination.pageSize}
            pageSizeLabel="Items pro Seite"
            pageSizeOptions={pagination.pageSizeOptions}
            onPageSizeChange={(pageSize) =>
              handlePageSizeChange(String(pageSize))
            }
          />
        ) : null}
      </div>
    </TooltipProvider>
  );
}
