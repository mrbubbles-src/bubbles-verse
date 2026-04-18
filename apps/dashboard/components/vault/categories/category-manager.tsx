import { createVaultCategoryAction } from '@/app/(dashboard)/vault/categories/actions';
import { CategoryTreeList } from '@/components/vault/categories/category-tree-list';
import type { VaultCategoryTreeNode } from '@/lib/vault/category-tree';

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

type CategoryManagerProps = {
  categories: VaultCategoryTreeNode[];
  parentOptions: Array<{ id: string; name: string }>;
};

/**
 * Renders the full Vault category management workspace.
 *
 * The left side keeps the editable tree in view, while the right side holds
 * the lightweight creation form for new top-level categories or subcategories.
 */
export function CategoryManager({
  categories,
  parentOptions,
}: CategoryManagerProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Kategorienbaum
          </p>
          <p className="text-sm text-pretty text-muted-foreground">
            V1 bleibt bewusst bei zwei Ebenen: Oberkategorien und genau eine
            Unterkategorie-Ebene darunter.
          </p>
        </div>
        <CategoryTreeList categories={categories} parentOptions={parentOptions} />
      </section>

      <aside className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Neue Kategorie
          </p>
          <p className="text-sm text-pretty text-muted-foreground">
            Lege neue Oberkategorien oder direkte Unterkategorien an.
          </p>
        </div>

        <Separator />

        <form action={createVaultCategoryAction} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="vault-category-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="vault-category-name"
                  name="name"
                  placeholder="z. B. Rendering"
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="vault-category-slug">Slug</FieldLabel>
              <FieldContent>
                <Input
                  id="vault-category-slug"
                  name="slug"
                  placeholder="optional, wird sonst automatisch gebaut"
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="vault-category-parent">
                Übergeordnete Kategorie
              </FieldLabel>
              <FieldContent>
                <Select defaultValue="root" name="parentId">
                  <SelectTrigger id="vault-category-parent" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectGroup>
                      <SelectItem value="root">Keine Oberkategorie</SelectItem>
                      {parentOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Unterkategorien dürfen nur unter top-level Kategorien liegen.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="vault-category-sort-order">
                Sortierung
              </FieldLabel>
              <FieldContent>
                <Input
                  id="vault-category-sort-order"
                  type="number"
                  name="sortOrder"
                  defaultValue="0"
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="vault-category-description">
                Beschreibung
              </FieldLabel>
              <FieldContent>
                <Textarea
                  id="vault-category-description"
                  name="description"
                  rows={3}
                  className="min-h-24"
                  placeholder="Kurzer Kontext für die Redaktion oder spätere Filter."
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <Button type="submit">Kategorie anlegen</Button>
        </form>
      </aside>
    </div>
  );
}
