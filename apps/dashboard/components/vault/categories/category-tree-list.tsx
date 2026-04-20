'use client';

import type { VaultCategoryTreeNode } from '@/lib/vault/category-tree';

import { useState } from 'react';

import { StagedConfirmDialog } from '@bubbles/ui/components/staged-confirm-dialog';
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  HugeiconsIcon,
  PencilEdit01Icon,
} from '@bubbles/ui/lib/hugeicons';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from '@bubbles/ui/shadcn/alert-dialog';
import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@bubbles/ui/shadcn/collapsible';

import {
  createVaultCategoryAction,
  deleteVaultCategoryAction,
  updateVaultCategoryAction,
} from '@/app/(dashboard)/vault/categories/actions';
import { CategoryDialog } from '@/components/vault/categories/category-dialog';

type CategoryTreeListProps = {
  categories: VaultCategoryTreeNode[];
  parentOptions: Array<{ id: string; name: string }>;
  emptyState?: string;
};

/**
 * Renders the flat hierarchical categories list with optional collapse state.
 */
export function CategoryTreeList({
  categories,
  parentOptions,
  emptyState = 'Noch keine Kategorien. Lege deine erste Kategorie an, dann taucht sie hier direkt in der Verwaltung auf.',
}: CategoryTreeListProps) {
  if (categories.length === 0) {
    return (
      <div className="py-12 text-base text-muted-foreground">{emptyState}</div>
    );
  }

  return (
    <div>
      {categories.map((category) => (
        <CategoryTreeListItem
          key={category.id}
          category={category}
          parentOptions={parentOptions}
          parentName={null}
        />
      ))}
    </div>
  );
}

/**
 * Renders one visible category row plus its optional child list.
 *
 * The row stays deliberately flat: hierarchy through indentation and labels,
 * actions through small icon tools, and all editing through dialogs.
 */
function CategoryTreeListItem({
  category,
  parentName,
  parentOptions,
}: {
  category: VaultCategoryTreeNode;
  parentName: string | null;
  parentOptions: Array<{ id: string; name: string }>;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = category.children.length > 0;
  const levelLabel =
    category.depth === 0
      ? 'Oberkategorie'
      : `Unterkategorie${parentName ? ` in ${parentName}` : ''}`;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div>
          <div
            className="flex items-start gap-3 py-5"
            style={{ paddingLeft: `${category.depth * 1.25}rem` }}>
            <div className="flex items-center pt-0.5">
              {hasChildren ? (
                <CollapsibleTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-lg"
                      className="size-10 [&_svg:not([class*='size-'])]:size-5"
                    />
                  }
                  aria-label={
                    isOpen
                      ? `${category.name} einklappen`
                      : `${category.name} ausklappen`
                  }>
                  <HugeiconsIcon
                    icon={isOpen ? ArrowDown01Icon : ArrowRight01Icon}
                    strokeWidth={2}
                  />
                </CollapsibleTrigger>
              ) : (
                <span className="block size-10" aria-hidden="true" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-medium tracking-tight sm:text-xl">
                  {category.name}
                </h2>
                <Badge variant={category.depth === 0 ? 'default' : 'secondary'}>
                  {levelLabel}
                </Badge>
              </div>

              <p className="text-base text-muted-foreground">
                {category.description || 'Keine Beschreibung hinterlegt.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{category.entryCount} Einträge</span>
                {hasChildren ? (
                  <span>{category.children.length} Unterkategorien</span>
                ) : null}
                <span>Sortierung {category.sortOrder}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <CategoryDialog
                action={updateVaultCategoryAction}
                dialogId={`vault-category-edit-${category.id}`}
                title="Kategorie bearbeiten"
                description="Passe Name, Beschreibung, Hierarchie und Sortierung gezielt an."
                submitLabel="Speichern"
                parentOptions={parentOptions.filter(
                  (option) => option.id !== category.id
                )}
                initialValues={{
                  id: category.id,
                  name: category.name,
                  slug: category.slug,
                  description: category.description,
                  parentId: category.parentId,
                  sortOrder: category.sortOrder,
                }}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="size-10 [&_svg:not([class*='size-'])]:size-5"
                    aria-label="Kategorie bearbeiten"
                    title="Bearbeiten">
                    <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2} />
                  </Button>
                }
              />

              <CategoryDialog
                action={createVaultCategoryAction}
                dialogId={`vault-category-child-${category.id}`}
                title="Unterkategorie anlegen"
                description={`Lege direkt unter ${category.name} eine neue Unterkategorie an.`}
                submitLabel="Unterkategorie anlegen"
                parentOptions={parentOptions}
                fixedParent={{
                  id: category.id,
                  name: category.name,
                }}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="size-10 [&_svg:not([class*='size-'])]:size-5"
                    aria-label="Unterkategorie anlegen"
                    title="Unterkategorie anlegen">
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                  </Button>
                }
              />

              <StagedConfirmDialog
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="size-10 [&_svg:not([class*='size-'])]:size-5"
                    aria-label="Kategorie löschen"
                    title="Löschen">
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  </Button>
                }
                firstStep={{
                  title: 'Kategorie löschen?',
                  description: (
                    <>
                      Möchtest du{' '}
                      <span className="font-medium text-foreground">
                        {category.name}
                      </span>{' '}
                      wirklich aus der Kategorienverwaltung entfernen?
                    </>
                  ),
                  confirmLabel: 'Löschen',
                }}
                secondStep={{
                  alertSize: 'sm',
                  title: 'Wirklich endgültig löschen?',
                  description:
                    'Kategorien mit Unterkategorien oder verknüpften Einträgen lassen sich weiterhin nicht entfernen.',
                  children: (
                    <form
                      action={deleteVaultCategoryAction}
                      className="flex flex-col gap-4">
                      <input type="hidden" name="id" value={category.id} />
                      <AlertDialogFooter>
                        <AlertDialogCancel>Zurück</AlertDialogCancel>
                        <AlertDialogAction type="submit" variant="destructive">
                          Ja, löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </form>
                  ),
                }}
              />
            </div>
          </div>

          {hasChildren ? (
            <CollapsibleContent>
              <div className="pb-2">
                {category.children.map((child) => (
                  <CategoryTreeListItem
                    key={child.id}
                    category={child}
                    parentOptions={parentOptions}
                    parentName={category.name}
                  />
                ))}
              </div>
            </CollapsibleContent>
          ) : null}
        </div>
      </Collapsible>
    </>
  );
}
