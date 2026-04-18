import {
  deleteVaultCategoryAction,
  updateVaultCategoryAction,
} from '@/app/(dashboard)/vault/categories/actions';
import type { VaultCategoryTreeNode } from '@/lib/vault/category-tree';

import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Field,
  FieldContent,
  FieldDescription,
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
import { Separator } from '@bubbles/ui/shadcn/separator';
import { Textarea } from '@bubbles/ui/shadcn/textarea';

type CategoryTreeListProps = {
  categories: VaultCategoryTreeNode[];
  parentOptions: Array<{ id: string; name: string }>;
};

/**
 * Renders the editable Vault category tree for the manager page.
 *
 * Each category keeps its own small inline form so owners and editors can
 * adjust labels, slugs, hierarchy, and ordering without leaving the list.
 */
export function CategoryTreeList({
  categories,
  parentOptions,
}: CategoryTreeListProps) {
  if (categories.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-border/60 px-4 py-8 text-sm text-muted-foreground">
        Noch keine Kategorien. Lege rechts deine erste Oberkategorie an, dann
        taucht sie hier direkt auf.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {categories.map((category) => (
        <CategoryTreeListItem
          key={category.id}
          category={category}
          parentOptions={parentOptions}
        />
      ))}
    </div>
  );
}

/**
 * Renders one category row plus its optional child list.
 *
 * @param props Category node and available top-level parents.
 * @returns The editable category block.
 */
function CategoryTreeListItem({
  category,
  parentOptions,
}: {
  category: VaultCategoryTreeNode;
  parentOptions: Array<{ id: string; name: string }>;
}) {
  const canReparent = category.depth > 0 || category.children.length === 0;

  return (
    <article className="rounded-[1.5rem] border border-border/50 bg-background/70 p-4 shadow-sm shadow-black/5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight">
                {category.name}
              </h3>
              <Badge variant={category.depth === 0 ? 'default' : 'secondary'}>
                {category.depth === 0 ? 'Oberkategorie' : 'Unterkategorie'}
              </Badge>
              {category.entryCount > 0 ? (
                <Badge variant="outline">
                  {category.entryCount} Einträge
                </Badge>
              ) : null}
              {category.children.length > 0 ? (
                <Badge variant="outline">
                  {category.children.length} Unterkategorien
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">/{category.slug}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Sortierung {category.sortOrder}
          </p>
        </div>

        <form action={updateVaultCategoryAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={category.id} />

          <FieldGroup className="grid gap-4 lg:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`name-${category.id}`}>Name</FieldLabel>
              <FieldContent>
                <Input
                  id={`name-${category.id}`}
                  name="name"
                  defaultValue={category.name}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor={`slug-${category.id}`}>Slug</FieldLabel>
              <FieldContent>
                <Input
                  id={`slug-${category.id}`}
                  name="slug"
                  defaultValue={category.slug}
                />
                <FieldDescription>
                  Leer lassen geht auch, dann wird er aus dem Namen gebaut.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor={`parent-${category.id}`}>
                Übergeordnete Kategorie
              </FieldLabel>
              <FieldContent>
                <Select
                  defaultValue={category.parentId ?? 'root'}
                  name="parentId"
                  disabled={!canReparent}>
                  <SelectTrigger id={`parent-${category.id}`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectGroup>
                      <SelectItem value="root">Keine Oberkategorie</SelectItem>
                      {parentOptions
                        .filter((option) => option.id !== category.id)
                        .map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {!canReparent ? (
                  <FieldDescription>
                    Oberkategorien mit Unterkategorien bleiben in V1 top-level,
                    damit keine dritte Ebene entsteht.
                  </FieldDescription>
                ) : null}
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor={`sort-${category.id}`}>Sortierung</FieldLabel>
              <FieldContent>
                <Input
                  id={`sort-${category.id}`}
                  type="number"
                  name="sortOrder"
                  defaultValue={String(category.sortOrder)}
                />
              </FieldContent>
            </Field>

            <Field className="lg:col-span-2">
              <FieldLabel htmlFor={`description-${category.id}`}>
                Beschreibung
              </FieldLabel>
              <FieldContent>
                <Textarea
                  id={`description-${category.id}`}
                  name="description"
                  defaultValue={category.description}
                  rows={3}
                  className="min-h-24"
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Löschen ist nur möglich, wenn keine Unterkategorien und keine
              Vault-Einträge mehr daran hängen.
            </p>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="outline">
                Speichern
              </Button>
              <Button
                type="submit"
                variant="destructive"
                formAction={deleteVaultCategoryAction}>
                Löschen
              </Button>
            </div>
          </div>
        </form>

        {category.children.length > 0 ? (
          <>
            <Separator />
            <div className="flex flex-col gap-3 pl-0 md:pl-6">
              {category.children.map((child) => (
                <CategoryTreeListItem
                  key={child.id}
                  category={child}
                  parentOptions={parentOptions}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </article>
  );
}
