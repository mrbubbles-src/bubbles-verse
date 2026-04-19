'use client';

import type {
  VaultCategoryTreeLevelFilter,
  VaultCategoryTreeNode,
} from '@/lib/vault/category-tree';

import {
  filterVaultCategoryTree,
  getVaultCategoryTreeSummary,
} from '@/lib/vault/category-tree';

import { useState } from 'react';

import { Add01Icon, HugeiconsIcon } from '@bubbles/ui/lib/hugeicons';
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

import { createVaultCategoryAction } from '@/app/(dashboard)/vault/categories/actions';
import { CategoryDialog } from '@/components/vault/categories/category-dialog';
import { CategoryTreeList } from '@/components/vault/categories/category-tree-list';

type CategoryManagerProps = {
  categories: VaultCategoryTreeNode[];
  parentOptions: Array<{ id: string; name: string }>;
};

/**
 * Coordinates the flat categories management view with local search/filter
 * state while keeping create/edit flows inside dialogs.
 */
export function CategoryManager({
  categories,
  parentOptions,
}: CategoryManagerProps) {
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] =
    useState<VaultCategoryTreeLevelFilter>('all');
  const summary = getVaultCategoryTreeSummary(categories);
  const filteredCategories = filterVaultCategoryTree(categories, {
    query,
    level: levelFilter,
  });

  return (
    <section className="flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Kategorien
          </h1>
          <p className="text-sm text-muted-foreground">
            {summary.total} Kategorien · {summary.topLevel} Oberkategorien ·{' '}
            {summary.child} Unterkategorien
          </p>
        </div>

        <CategoryDialog
          action={createVaultCategoryAction}
          dialogId="vault-category-create"
          title="Neue Kategorie"
          description="Lege eine neue Oberkategorie oder direkte Unterkategorie an."
          submitLabel="Kategorie anlegen"
          parentOptions={parentOptions}
          trigger={
            <Button type="button" className="w-full sm:w-auto">
              <HugeiconsIcon
                icon={Add01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Neue Kategorie
            </Button>
          }
        />
      </div>

      <div className="border-y border-border/60 py-4 sm:py-5">
        <FieldGroup className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(12rem,0.7fr)] md:items-end">
          <Field>
            <FieldLabel htmlFor="vault-category-query">Suche</FieldLabel>
            <FieldContent>
              <Input
                id="vault-category-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nach Name oder Beschreibung suchen"
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="vault-category-level-filter">
              Filter
            </FieldLabel>
            <FieldContent>
              <Select
                defaultValue={levelFilter}
                name="level"
                onValueChange={(value) =>
                  setLevelFilter(value as VaultCategoryTreeLevelFilter)
                }>
                <SelectTrigger
                  id="vault-category-level-filter"
                  className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value="all">Alle Ebenen</SelectItem>
                    <SelectItem value="top-level">
                      Nur Oberkategorien
                    </SelectItem>
                    <SelectItem value="children">
                      Nur Unterkategorien
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        </FieldGroup>
      </div>

      <CategoryTreeList
        categories={filteredCategories}
        parentOptions={parentOptions}
        emptyState={
          query || levelFilter !== 'all'
            ? 'Keine Kategorien passen gerade zu dieser Suche oder diesem Filter.'
            : undefined
        }
      />
    </section>
  );
}
