'use client';

import type { VaultEntryCategoryOption } from '@/lib/vault/entries';
import type { MarkdownEditorSubmitData } from '@bubbles/markdown-editor';

import { useMemo, useState } from 'react';

import {
  createEditorImageUploader,
  MarkdownEditor,
} from '@bubbles/markdown-editor';

import '@bubbles/markdown-editor/styles/editor';
import '@bubbles/markdown-editor/styles/preview';

import { getVaultEntryFeedbackHref } from '@/lib/vault/entry-feedback';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { toast } from '@bubbles/ui/lib/sonner';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@bubbles/ui/shadcn/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bubbles/ui/shadcn/select';

type VaultEntryEditorProps = {
  categories: VaultEntryCategoryOption[];
};

/**
 * Renders the first real Vault entry authoring flow.
 *
 * The shared markdown editor still owns metadata, preview, imports, and image
 * uploads. The dashboard adds only the Vault-specific category selection and
 * persistence handoff to the local API route.
 */
export function VaultEntryEditor({ categories }: VaultEntryEditorProps) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.id ?? ''
  );
  const selectedCategory = useMemo(
    () =>
      categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );
  const imageUploader = useMemo(
    () =>
      createEditorImageUploader({
        endpoint: '/api/editor-image-upload',
        imageFolder: 'dashboard/editor',
      }),
    []
  );

  async function handleSuccess(payload: MarkdownEditorSubmitData) {
    if (!selectedCategoryId) {
      toast.error('Bitte wähle zuerst eine Vault-Kategorie.');
      throw new Error('Missing Vault category.');
    }

    const response = await fetch('/api/vault/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        primaryCategoryId: selectedCategoryId,
      }),
    });
    const responseBody = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    if (!response.ok) {
      const message =
        responseBody?.message ??
        'Der Vault-Eintrag konnte gerade nicht gespeichert werden.';

      toast.error(message);
      throw new Error(message);
    }

    router.push(getVaultEntryFeedbackHref('created'));
    router.refresh();
  }

  if (categories.length === 0) {
    return (
      <section className="flex flex-col gap-4 rounded-[2rem] border border-dashed border-border/60 bg-background/70 px-5 py-8 shadow-sm shadow-black/5 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-balance">
          Erst eine Kategorie anlegen
        </h2>
        <p className="max-w-2xl text-sm text-pretty text-muted-foreground sm:text-base">
          Für neue Vault-Einträge brauchen wir zuerst mindestens eine
          Oberkategorie oder Unterkategorie. Danach kann der Editor den Slug
          direkt aus dem Kategorienpfad ableiten.
        </p>
        <div>
          <Button
            render={<Link href="/vault/categories" />}
            nativeButton={false}
            className="rounded-full px-5">
            Zu den Kategorien
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Vault-Kontext
          </p>
          <p className="text-sm text-pretty text-muted-foreground">
            Die gewählte Kategorie steuert den Vault-Pfad für den Default-Slug
            und landet später als primäre Zuordnung in `vault_entries`.
          </p>
        </div>

        <Field className="max-w-xl">
          <FieldLabel htmlFor="vault-entry-category">
            Primäre Kategorie
          </FieldLabel>
          <FieldContent>
            <Select
              value={selectedCategoryId}
              onValueChange={(value) => setSelectedCategoryId(value ?? '')}>
              <SelectTrigger id="vault-entry-category" className="w-full">
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              Aktueller Pfad:{' '}
              {selectedCategory
                ? selectedCategory.childSlug
                  ? `/${selectedCategory.topLevelSlug}/${selectedCategory.childSlug}`
                  : `/${selectedCategory.topLevelSlug}`
                : 'noch keine Kategorie gewählt'}
            </FieldDescription>
          </FieldContent>
        </Field>
      </section>

      <MarkdownEditor
        imageUploader={imageUploader}
        onSuccess={handleSuccess}
        slugStrategy={({ title }) => [
          selectedCategory?.topLevelSlug ?? '',
          selectedCategory?.childSlug ?? '',
          title,
        ]}
      />
    </div>
  );
}
