'use client';

import type {
  VaultEntryCategoryOption,
  VaultEntryListFilters,
} from '@/lib/vault/entries';

import { useMemo, useState } from 'react';

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
}: VaultEntryFiltersProps) {
  const [selectedStatus, setSelectedStatus] = useState(filters.status);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    filters.categoryId ?? 'all'
  );
  const selectedStatusLabel = useMemo(
    () =>
      ({
        all: 'Alle Status',
        draft: 'Nur Entwürfe',
        published: 'Nur veröffentlicht',
      })[selectedStatus],
    [selectedStatus]
  );
  const selectedCategoryLabel = useMemo(() => {
    if (selectedCategoryId === 'all') {
      return 'Alle Kategorien';
    }

    return (
      categories.find((category) => category.id === selectedCategoryId)
        ?.label ?? 'Alle Kategorien'
    );
  }, [categories, selectedCategoryId]);

  return (
    <form action="/vault/entries" className="py-4 sm:py-5">
      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="pageSize" value={String(filters.pageSize)} />

      <FieldGroup className="grid gap-3 md:grid-cols-[minmax(0,1.25fr)_minmax(12rem,0.75fr)_minmax(12rem,0.9fr)_auto] md:items-end">
        <Field>
          <FieldLabel htmlFor="vault-entry-query">Suche</FieldLabel>
          <FieldContent>
            <Input
              id="vault-entry-query"
              name="query"
              defaultValue={filters.query}
              placeholder="Nach Titel suchen"
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="vault-entry-status">Status</FieldLabel>
          <FieldContent>
            <Select
              defaultValue={filters.status}
              name="status"
              onValueChange={(value) =>
                setSelectedStatus(
                  (value as VaultEntryListFilters['status']) ?? 'all'
                )
              }>
              <SelectTrigger id="vault-entry-status" className="w-full">
                <SelectValue>{selectedStatusLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="draft">Nur Entwürfe</SelectItem>
                  <SelectItem value="published">Nur veröffentlicht</SelectItem>
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
              name="categoryId"
              onValueChange={(value) => setSelectedCategoryId(value ?? 'all')}>
              <SelectTrigger
                id="vault-entry-category-filter"
                className="w-full">
                <SelectValue>{selectedCategoryLabel}</SelectValue>
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

        <div className="flex items-center gap-2 md:justify-end">
          <Button type="submit" variant="outline">
            Anwenden
          </Button>
          <Button
            render={<Link href="/vault/entries" />}
            nativeButton={false}
            variant="ghost">
            Zurücksetzen
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
