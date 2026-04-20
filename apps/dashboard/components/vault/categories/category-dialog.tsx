'use client';

import type { ReactElement } from 'react';

import { FormDialog } from '@bubbles/ui/components/form-dialog';
import { Button } from '@bubbles/ui/shadcn/button';
import { DialogFooter } from '@bubbles/ui/shadcn/dialog';
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
import { Textarea } from '@bubbles/ui/shadcn/textarea';

type CategoryDialogProps = {
  action: (formData: FormData) => void | Promise<void>;
  description: string;
  dialogId: string;
  parentOptions: Array<{ id: string; name: string }>;
  submitLabel: string;
  title: string;
  trigger: ReactElement;
  initialValues?: {
    description?: string;
    id?: string;
    name?: string;
    parentId?: string | null;
    slug?: string;
    sortOrder?: number;
  };
  fixedParent?: {
    id: string;
    name: string;
  } | null;
};

/**
 * Renders the shared category create/edit dialog without locking the page into
 * permanently visible form fields.
 */
export function CategoryDialog({
  action,
  description,
  dialogId,
  fixedParent = null,
  initialValues,
  parentOptions,
  submitLabel,
  title,
  trigger,
}: CategoryDialogProps) {
  const defaultParentId = fixedParent
    ? fixedParent.id
    : (initialValues?.parentId ?? 'root');

  return (
    <FormDialog
      trigger={trigger}
      title={title}
      description={description}
      size="lg"
      className="max-w-[calc(100%-2rem)]">
      <form action={action} className="flex flex-col gap-4">
        {initialValues?.id ? (
          <input type="hidden" name="id" value={initialValues.id} />
        ) : null}

        {fixedParent ? (
          <input type="hidden" name="parentId" value={fixedParent.id} />
        ) : null}

        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor={`${dialogId}-name`}>Name</FieldLabel>
            <FieldContent>
              <Input
                id={`${dialogId}-name`}
                name="name"
                defaultValue={initialValues?.name ?? ''}
                placeholder="z. B. Rendering"
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor={`${dialogId}-slug`}>Slug</FieldLabel>
            <FieldContent>
              <Input
                id={`${dialogId}-slug`}
                name="slug"
                defaultValue={initialValues?.slug ?? ''}
                placeholder="Optional"
              />
              <FieldDescription>
                Leer lassen, dann wird der Slug automatisch erzeugt.
              </FieldDescription>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor={`${dialogId}-sort-order`}>
              Sortierung
            </FieldLabel>
            <FieldContent>
              <Input
                id={`${dialogId}-sort-order`}
                type="number"
                name="sortOrder"
                defaultValue={String(initialValues?.sortOrder ?? 0)}
              />
            </FieldContent>
          </Field>

          {fixedParent ? (
            <Field className="sm:col-span-2">
              <FieldLabel>Übergeordnete Kategorie</FieldLabel>
              <FieldContent>
                <div className="rounded-md bg-muted/30 px-3 py-2 text-sm">
                  {fixedParent.name}
                </div>
              </FieldContent>
            </Field>
          ) : (
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor={`${dialogId}-parent`}>
                Übergeordnete Kategorie
              </FieldLabel>
              <FieldContent>
                <Select defaultValue={defaultParentId} name="parentId">
                  <SelectTrigger id={`${dialogId}-parent`} className="w-full">
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
                  Unterkategorien bleiben in V1 auf eine Ebene unter den
                  Oberkategorien begrenzt.
                </FieldDescription>
              </FieldContent>
            </Field>
          )}

          <Field className="sm:col-span-2">
            <FieldLabel htmlFor={`${dialogId}-description`}>
              Beschreibung
            </FieldLabel>
            <FieldContent>
              <Textarea
                id={`${dialogId}-description`}
                name="description"
                defaultValue={initialValues?.description ?? ''}
                rows={4}
                className="min-h-28"
                placeholder="Kurzer redaktioneller Kontext für diese Kategorie."
              />
            </FieldContent>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button type="submit">{submitLabel}</Button>
        </DialogFooter>
      </form>
    </FormDialog>
  );
}
