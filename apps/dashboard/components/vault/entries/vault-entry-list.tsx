import type { VaultEntryListItem } from '@/lib/vault/entries';

import Link from 'next/link';

import { Badge } from '@bubbles/ui/shadcn/badge';

type VaultEntryListProps = {
  entries: VaultEntryListItem[];
};

/**
 * Renders the first dense editorial list for Vault content.
 *
 * The list stays intentionally compact and mobile-first, surfacing only the
 * fields editors need for the next authoring decisions.
 */
export function VaultEntryList({ entries }: VaultEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-border/60 px-4 py-8 text-sm text-muted-foreground">
        Noch keine Vault-Einträge. Lege deinen ersten Eintrag an und er taucht
        hier direkt in der Redaktionsliste auf.
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-[1.5rem] border border-border/60 bg-background/70 shadow-sm shadow-black/5">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_auto] md:items-center">
          <div className="space-y-1">
            <Link
              href={`/vault/entries/${entry.id}`}
              className="font-medium tracking-tight text-balance underline-offset-4 hover:underline">
              {entry.title}
            </Link>
            <p className="text-sm text-muted-foreground">/{entry.slug}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {entry.categoryLabel}
          </div>
          <div className="flex items-center justify-between gap-3 md:justify-end">
            <Badge
              variant={entry.status === 'published' ? 'default' : 'secondary'}>
              {entry.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {entry.updatedAtLabel}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
