'use client';

import type {
  VaultEntryListFilters,
  VaultEntryListItem,
  VaultEntryListPagination,
} from '@/lib/vault/entries';

import { useState } from 'react';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  Delete02Icon,
  HugeiconsIcon,
  PencilEdit01Icon,
  PlayCircle02Icon,
} from '@bubbles/ui/lib/hugeicons';
import { toast } from '@bubbles/ui/lib/sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
 * Reduces large page counts to a compact set of numbered pagination chips.
 *
 * @param currentPage Active table page from the server model.
 * @param totalPages Total pages available for the current filters.
 * @returns Ordered page numbers plus ellipsis markers for gaps.
 */
function buildVisiblePageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis-right', totalPages] as const;
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      'ellipsis-left',
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const;
  }

  return [
    1,
    'ellipsis-left',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis-right',
    totalPages,
  ] as const;
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
  const [entryToDelete, setEntryToDelete] = useState<VaultEntryListItem | null>(
    null
  );
  const [isFirstDeleteDialogOpen, setIsFirstDeleteDialogOpen] = useState(false);
  const [isSecondDeleteDialogOpen, setIsSecondDeleteDialogOpen] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const pageItems = buildVisiblePageItems(
    pagination.page,
    pagination.totalPages
  );

  function resetDeleteFlow() {
    setIsFirstDeleteDialogOpen(false);
    setIsSecondDeleteDialogOpen(false);
    setEntryToDelete(null);
  }

  function handleDeleteRequest(entry: VaultEntryListItem) {
    setEntryToDelete(entry);
    setIsFirstDeleteDialogOpen(true);
    setIsSecondDeleteDialogOpen(false);
  }

  function handleDeleteContinue() {
    setIsFirstDeleteDialogOpen(false);
    setIsSecondDeleteDialogOpen(true);
  }

  async function handleDeleteConfirmed() {
    if (!entryToDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/vault/entries/${entryToDelete.id}`, {
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
      setIsDeleting(false);
      resetDeleteFlow();
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
      <div className="border-b border-dashed border-border/60 py-10 text-sm text-muted-foreground">
        {emptyState}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-y border-border/60 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                <th className="py-3 pr-4">Titel</th>
                <th className="w-[18%] py-3 pr-4">Kategorie</th>
                <th className="w-[12%] py-3 pr-4">Status</th>
                <th className="w-[16%] py-3 pr-4">Zuletzt bearbeitet</th>
                <th className="w-[10rem] py-3 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border/50 align-top">
                  <td className="py-4 pr-4">
                    <div className="min-w-0">
                      <Link
                        href={`/vault/entries/${entry.id}`}
                        className="text-base font-medium tracking-tight underline-offset-4 hover:underline">
                        {entry.title}
                      </Link>
                      {entry.description ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <p className="mt-1 truncate text-sm text-muted-foreground">
                                {entry.description}
                              </p>
                            }
                          />
                          <TooltipContent className="max-w-sm text-pretty">
                            {entry.description}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Keine Beschreibung.
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-sm text-muted-foreground">
                    {entry.categoryLabel}
                  </td>
                  <td className="py-4 pr-4">
                    <Badge
                      variant={
                        entry.status === 'published' ? 'default' : 'secondary'
                      }>
                      {entry.status === 'published'
                        ? 'Veröffentlicht'
                        : 'Entwurf'}
                    </Badge>
                  </td>
                  <td className="py-4 pr-4 text-sm text-muted-foreground">
                    {entry.updatedAtLabel}
                  </td>
                  <td className="py-4">
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
                              size="icon-sm"
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
                                size="icon-sm"
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
                                size="icon-sm"
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
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              type="button"
                              aria-label="Eintrag löschen"
                              onClick={() => handleDeleteRequest(entry)}
                            />
                          }>
                          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
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
          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Items pro Seite</span>
              <select
                className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
                value={String(pagination.pageSize)}
                onChange={(event) => handlePageSizeChange(event.target.value)}>
                {pagination.pageSizeOptions.map((pageSizeOption) => (
                  <option key={pageSizeOption} value={String(pageSizeOption)}>
                    {pageSizeOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <p className="text-sm text-muted-foreground">
                Seite {pagination.page} von {pagination.totalPages}
              </p>
              <div className="flex flex-wrap items-center gap-1">
                {pagination.page === 1 ? (
                  <Button type="button" variant="outline" size="sm" disabled>
                    Zurück
                  </Button>
                ) : (
                  <Button
                    render={
                      <Link
                        href={buildVaultEntriesHref(filters, {
                          page: pagination.page - 1,
                        })}
                      />
                    }
                    nativeButton={false}
                    variant="outline"
                    size="sm">
                    Zurück
                  </Button>
                )}

                {pageItems.map((pageItem) =>
                  typeof pageItem === 'number' ? (
                    pageItem === pagination.page ? (
                      <Button
                        key={pageItem}
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled>
                        {pageItem}
                      </Button>
                    ) : (
                      <Button
                        key={pageItem}
                        render={
                          <Link
                            href={buildVaultEntriesHref(filters, {
                              page: pageItem,
                            })}
                          />
                        }
                        nativeButton={false}
                        variant="ghost"
                        size="sm">
                        {pageItem}
                      </Button>
                    )
                  ) : (
                    <span
                      key={pageItem}
                      className="px-2 text-sm text-muted-foreground">
                      …
                    </span>
                  )
                )}

                {pagination.page === pagination.totalPages ? (
                  <Button type="button" variant="outline" size="sm" disabled>
                    Weiter
                  </Button>
                ) : (
                  <Button
                    render={
                      <Link
                        href={buildVaultEntriesHref(filters, {
                          page: pagination.page + 1,
                        })}
                      />
                    }
                    nativeButton={false}
                    variant="outline"
                    size="sm">
                    Weiter
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <AlertDialog
        open={isFirstDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsFirstDeleteDialogOpen(open);

          if (!open && !isSecondDeleteDialogOpen) {
            setEntryToDelete(null);
          }
        }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du{' '}
              <span className="font-medium text-foreground">
                {entryToDelete?.title ?? 'diesen Eintrag'}
              </span>{' '}
              wirklich aus dem Vault entfernen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              onClick={handleDeleteContinue}
              disabled={isDeleting}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isSecondDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsSecondDeleteDialogOpen(open);

          if (!open) {
            resetDeleteFlow();
          }
        }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Wirklich endgültig löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Eintrag{' '}
              <span className="font-medium text-foreground">
                {entryToDelete?.title ?? 'dieser Eintrag'}
              </span>{' '}
              wird dauerhaft entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zurück</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirmed}
              disabled={isDeleting}>
              {isDeleting ? 'Lösche…' : 'Ja, löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
