'use client';

import type {
  VaultEntryCategoryOption,
  VaultEntryInitialData,
} from '@/lib/vault/entries';
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
  initialData?: VaultEntryInitialData;
  mode?: 'create' | 'edit';
};

/**
 * Renders the first real Vault entry authoring flow.
 *
 * The shared markdown editor still owns metadata, preview, imports, and image
 * uploads. The dashboard adds only the Vault-specific category selection and
 * persistence handoff to the local API route.
 */
export function VaultEntryEditor({
  categories,
  initialData,
  mode = 'create',
}: VaultEntryEditorProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialData?.primaryCategoryId ?? categories[0]?.id ?? ''
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

    const response = await fetch(
      mode === 'edit' && initialData
        ? `/api/vault/entries/${initialData.id}`
        : '/api/vault/entries',
      {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          primaryCategoryId: selectedCategoryId,
        }),
      }
    );
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

    router.push(
      getVaultEntryFeedbackHref(mode === 'edit' ? 'updated' : 'created')
    );
    router.refresh();
  }

  /**
   * Deletes the current Vault entry after one explicit browser confirmation.
   *
   * The destructive action stays local to edit mode so the regular list page
   * can remain focused on browsing instead of inline danger actions.
   */
  async function handleDelete() {
    if (mode !== 'edit' || !initialData || isDeleting || isDuplicating) {
      return;
    }

    const shouldDelete = window.confirm(
      'Willst du diesen Vault-Eintrag wirklich löschen? Dieser Schritt lässt sich nicht rückgängig machen.'
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/vault/entries/${initialData.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const responseBody = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        const message =
          responseBody?.message ??
          'Der Vault-Eintrag konnte gerade nicht gelöscht werden.';

        toast.error(message);
        return;
      }

      router.push(getVaultEntryFeedbackHref('deleted'));
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  /**
   * Creates a draft copy of the current entry and opens it directly in edit
   * mode so the next revision can start without rebuilding metadata by hand.
   */
  async function handleDuplicate() {
    if (mode !== 'edit' || !initialData || isDeleting || isDuplicating) {
      return;
    }

    setIsDuplicating(true);

    try {
      const response = await fetch(
        `/api/vault/entries/${initialData.id}/duplicate`,
        {
          method: 'POST',
        }
      );
      const responseBody = (await response.json().catch(() => null)) as {
        id?: string;
        message?: string;
      } | null;

      if (!response.ok || !responseBody?.id) {
        const message =
          responseBody?.message ??
          'Der Vault-Eintrag konnte gerade nicht dupliziert werden.';

        toast.error(message);
        return;
      }

      toast.success('Vault-Eintrag dupliziert.');
      router.push(`/vault/entries/${responseBody.id}`);
      router.refresh();
    } finally {
      setIsDuplicating(false);
    }
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

        {mode === 'edit' && initialData ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-[1.5rem] border border-border/50 px-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold tracking-tight text-foreground">
                  Als Entwurf duplizieren
                </p>
                <p className="text-sm text-muted-foreground">
                  Erstellt eine neue Fassung mit demselben Inhalt, derselben
                  Kategorie und denselben Tags.
                </p>
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleDuplicate()}
                  disabled={isDeleting || isDuplicating}>
                  {isDuplicating ? 'Dupliziere...' : 'Eintrag duplizieren'}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-[1.5rem] border border-dashed border-destructive/35 px-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold tracking-tight text-foreground">
                  Eintrag endgültig entfernen
                </p>
                <p className="text-sm text-muted-foreground">
                  Löscht Inhalt, Kategorie-Verknüpfung und Tags dauerhaft aus dem
                  Vault.
                </p>
              </div>
              <div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting || isDuplicating}>
                  {isDeleting ? 'Lösche...' : 'Eintrag löschen'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <MarkdownEditor
        imageUploader={imageUploader}
        initialData={
          initialData
            ? {
                content: initialData.editorContent,
                title: initialData.title,
                slug: initialData.slug,
                description: initialData.description,
                tags: initialData.tags,
                status: initialData.status,
              }
            : undefined
        }
        isEditMode={mode === 'edit'}
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
