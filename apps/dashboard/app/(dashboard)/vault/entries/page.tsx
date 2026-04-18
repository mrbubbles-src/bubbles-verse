import Link from 'next/link';

import { Button } from '@bubbles/ui/shadcn/button';

/**
 * Renders the initial placeholder for the Vault entry overview.
 *
 * Keep the route live so the shared navigation is immediately coherent while
 * the real entry listing arrives in the next implementation step.
 */
export default function VaultEntriesPage() {
  return (
    <section className="flex max-w-4xl flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
        Coding Vault
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        Eintragsliste folgt im nächsten Slice.
      </h1>
      <p className="text-sm text-pretty text-muted-foreground sm:text-base">
        Die Navigation ist bereits vorhanden. Als Nächstes hängen wir hier die
        echte Übersicht mit Filtern, Status und Bearbeitungswegen an.
      </p>
      <div className="pt-2">
        <Button
          render={<Link href="/vault/entries/new" />}
          nativeButton={false}
          className="rounded-full px-5">
          Neuer Eintrag
        </Button>
      </div>
    </section>
  );
}
