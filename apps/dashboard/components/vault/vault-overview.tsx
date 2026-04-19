import type {
  VaultOverviewModel,
  VaultOverviewRecentEntry,
} from '@/lib/vault/overview';

import Link from 'next/link';

import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';
import { Separator } from '@bubbles/ui/shadcn/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@bubbles/ui/shadcn/tabs';

type VaultOverviewEntryListProps = {
  entries: VaultOverviewRecentEntry[];
  emptyState: string;
  showStatus?: boolean;
};

/**
 * Renders the flat work queue for the Vault overview tabs.
 *
 * Each row links straight into the editor so the overview behaves like a work
 * surface instead of a summary page.
 *
 * @param props Entries for one queue plus empty-state handling.
 * @returns Compact editorial list for the Vault overview.
 */
function VaultOverviewEntryList({
  entries,
  emptyState,
  showStatus = false,
}: VaultOverviewEntryListProps) {
  if (entries.length === 0) {
    return (
      <p className="py-12 text-base text-muted-foreground">{emptyState}</p>
    );
  }

  return (
    <div className="flex flex-col">
      {entries.map((entry, index) => (
        <div key={entry.id}>
          {index > 0 ? <Separator /> : null}
          <Link
            href={`/vault/entries/${entry.id}`}
            className="group flex flex-col gap-4 rounded-[1.5rem] px-2 py-5 transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1.5">
                <p className="text-lg font-semibold tracking-tight text-balance text-foreground sm:text-xl">
                  {entry.title}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-muted-foreground">
                  <Badge variant="secondary">{entry.categoryLabel}</Badge>
                  {showStatus ? (
                    <>
                      <span aria-hidden="true">•</span>
                      <Badge
                        variant={
                          entry.status === 'published' ? 'default' : 'secondary'
                        }>
                        {entry.status === 'draft'
                          ? 'Entwurf'
                          : 'Veröffentlicht'}
                      </Badge>
                    </>
                  ) : null}
                </div>
              </div>

              <p className="text-base text-muted-foreground sm:text-right">
                {entry.updatedAtLabel}
              </p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

/**
 * Renders the Coding Vault landing page as a focused work overview.
 *
 * The page intentionally skips intro copy and large cards. Instead it uses one
 * tabbed queue, two small actions, and a single status line.
 *
 * @param props Prepared overview model from `getVaultOverviewModel`.
 * @returns Flat Vault work overview inside the shared dashboard shell.
 */
export function VaultOverview({ model }: { model: VaultOverviewModel }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-muted-foreground">
          {model.statusItems.map((item, index) => (
            <span key={item.label} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">•</span> : null}
              <span>{item.value}</span>
              <span>{item.label.toLowerCase()}</span>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {model.quickActions.map((action) => (
            <Button
              key={action.href}
              render={<Link href={action.href} />}
              nativeButton={false}
              variant={
                action.href === '/vault/entries/new' ? 'default' : 'secondary'
              }
              className="rounded-full px-4">
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <section className="flex flex-col gap-5 rounded-[2rem] border border-border/60 bg-background/80 px-5 py-5 shadow-sm shadow-black/5 sm:px-7 sm:py-6">
        <Tabs defaultValue="drafts" className="gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Weiterschreiben
            </h1>

            <TabsList
              variant="line"
              aria-label="Vault Arbeitslisten"
              className="h-auto w-full justify-start gap-5 p-0 sm:w-auto">
              <TabsTrigger value="drafts" className="px-0 py-2 text-base">
                Offene Entwürfe
              </TabsTrigger>
              <TabsTrigger value="updates" className="px-0 py-2 text-base">
                Zuletzt bearbeitet
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="drafts" className="mt-0">
            <VaultOverviewEntryList
              entries={model.recentDrafts}
              emptyState="Gerade liegen keine offenen Entwürfe im Coding Vault."
            />
          </TabsContent>

          <TabsContent value="updates" className="mt-0">
            <VaultOverviewEntryList
              entries={model.recentUpdates}
              emptyState="Sobald du Einträge bearbeitest, tauchen sie hier auf."
              showStatus
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
