import type {
  VaultEntryCategoryOption,
  VaultEntryListFilters,
} from '@/lib/vault/entries';

import Link from 'next/link';

import { Button } from '@bubbles/ui/shadcn/button';
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from '@bubbles/ui/shadcn/field';
import { Input } from '@bubbles/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bubbles/ui/shadcn/select';

type VaultEntryFiltersProps = {
  categories: VaultEntryCategoryOption[];
  filters: VaultEntryListFilters;
  resultCount: number;
};

/**
 * Renders the compact filter bar for the Vault entry list.
 *
 * Filters stay URL-based so editors can reload, bookmark, or share a specific
 * list state without recreating it manually.
 */
export function VaultEntryFilters({
  categories,
  filters,
  resultCount,
}: VaultEntryFiltersProps) {
  return (
    <section className="rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
      <form action="/vault/entries" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Filter
            </p>
            <p className="text-sm text-muted-foreground">
              {resultCount} {resultCount === 1 ? 'Treffer' : 'Treffer'} in der
              aktuellen Ansicht.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="outline">
              Anwenden
            </Button>
            <Button
              render={<Link href="/vault/entries" />}
              nativeButton={false}
              variant="secondary">
              Zurücksetzen
            </Button>
          </div>
        </div>

        <FieldGroup className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
          <Field>
            <FieldLabel htmlFor="vault-entry-query">Suche</FieldLabel>
            <FieldContent>
              <Input
                id="vault-entry-query"
                name="query"
                defaultValue={filters.query}
                placeholder="Titel enthält..."
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="vault-entry-status">Status</FieldLabel>
            <FieldContent>
              <Select defaultValue={filters.status} name="status">
                <SelectTrigger id="vault-entry-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="draft">Nur Entwürfe</SelectItem>
                    <SelectItem value="published">
                      Nur veröffentlicht
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="vault-entry-category-filter">
              Kategorie
            </FieldLabel>
            <FieldContent>
              <Select
                defaultValue={filters.categoryId ?? 'all'}
                name="categoryId">
                <SelectTrigger
                  id="vault-entry-category-filter"
                  className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        </FieldGroup>
      </form>
    </section>
  );
}
