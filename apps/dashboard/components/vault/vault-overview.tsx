import type { VaultOverviewModel } from '@/lib/vault/overview';

import Link from 'next/link';

import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';
import { Separator } from '@bubbles/ui/shadcn/separator';

import { VaultEntryList } from '@/components/vault/entries/vault-entry-list';

/**
 * Renders the first real landing page for the Coding Vault section.
 *
 * The layout stays editorial and mobile-first: it gives quick entry points
 * into writing, a small set of stable numbers, and the latest touched content.
 *
 * @param props Prepared overview model from `getVaultOverviewModel`.
 * @returns Vault overview content inside the shared dashboard shell.
 */
export function VaultOverview({ model }: { model: VaultOverviewModel }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-[2rem] border border-border/50 bg-linear-to-br from-background via-background to-muted/35 px-5 py-6 shadow-sm shadow-black/5 sm:px-6 sm:py-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
              Coding Vault
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Redaktion, Taxonomie und Schreibfluss an einem Ort.
              </h1>
              <p className="text-sm text-pretty text-muted-foreground sm:text-base">
                Die Vault-Startseite bündelt deine wichtigsten Zahlen,
                Redaktionswege und zuletzt bearbeiteten Inhalte, damit du nicht
                immer erst durch Listen springen musst.
              </p>
            </div>
          </div>

          <Button
            render={<Link href="/vault/entries/new" />}
            nativeButton={false}
            className="rounded-full px-5">
            Neuer Eintrag
          </Button>
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {model.stats.map((stat) => (
            <div
              key={stat.label}
              className="flex min-h-32 flex-col justify-between gap-4 rounded-[1.5rem] border border-border/50 bg-background/80 px-4 py-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                  {stat.label}
                </p>
                <p className="text-3xl font-semibold tracking-tight">
                  {stat.value}
                </p>
              </div>
              <p className="text-sm text-pretty text-muted-foreground">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
                Zuletzt bearbeitet
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Die letzten fünf Vault-Einträge
              </h2>
            </div>
            <Button
              render={<Link href="/vault/entries" />}
              nativeButton={false}
              variant="secondary"
              className="rounded-full px-5">
              Alle Einträge
            </Button>
          </div>

          <VaultEntryList entries={model.recentEntries} />
        </div>

        <div className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-muted/25 px-5 py-6 sm:px-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
              Nächste Schritte
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Direkt in die richtige Spur springen
            </h2>
            <p className="text-sm text-pretty text-muted-foreground sm:text-base">
              {model.taxonomySummary.description}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {model.quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex flex-col gap-2 rounded-[1.5rem] border border-border/50 bg-background/80 px-4 py-4 transition-colors hover:border-foreground/20 hover:bg-background">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-semibold tracking-tight">
                    {action.label}
                  </p>
                  <Badge variant="secondary">Öffnen</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-dashed border-border/60 px-4 py-4">
            <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Taxonomie
            </p>
            <p className="mt-2 text-base font-semibold tracking-tight">
              {model.taxonomySummary.title}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Saubere Kategorien sparen dir später Editorial-Aufwand, weil
              neue Serien, Snippets und Deep Dives direkt an der richtigen
              Stelle landen.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
