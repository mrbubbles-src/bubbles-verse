'use client';

import type {
  VaultEntryCategoryOption,
  VaultEntryInitialData,
} from '@/lib/vault/entries';
import type {
  MarkdownEditorStatus,
  MarkdownEditorSubmitData,
} from '@bubbles/markdown-editor';

import { useMemo, useState } from 'react';

import {
  createEditorImageUploader,
  MarkdownEditor,
} from '@bubbles/markdown-editor';

import '@bubbles/markdown-editor/styles/editor';
import '@bubbles/markdown-editor/styles/preview';

import {
  getVaultEntryDraftScope,
  getVaultEntryPreviewHref,
} from '@/lib/vault/entry-drafts';
import { getVaultEntryFeedbackHref } from '@/lib/vault/entry-feedback';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { toast } from '@bubbles/ui/lib/sonner';
import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';
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
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialData?.primaryCategoryId ?? categories[0]?.id ?? ''
  );
  const draftStorageScope = getVaultEntryDraftScope({
    id: initialData?.id,
    mode,
  });
  const selectedCategory = useMemo(
    () =>
      categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );
  const previewHref = getVaultEntryPreviewHref({
    id: initialData?.id,
    mode,
  });
  const statusLabel = getVaultEntryStatusLabel(
    mode === 'edit' ? initialData?.status : 'unpublished'
  );
  const imageUploader = useMemo(
    () =>
      createEditorImageUploader({
        endpoint: '/api/editor-image-upload',
        imageFolder: 'dashboard/editor',
      }),
    []
  );

  /**
   * Returns the current category path as a short editorial label.
   *
   * @returns Flat category label for the active select value.
   */
  function getSelectedCategoryLabel() {
    return selectedCategory?.label ?? 'Kategorie wählen';
  }

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
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 border-b border-border/50 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              {mode === 'edit' ? 'Eintrag bearbeiten' : 'Eintrag'}
            </p>
            {mode === 'edit' && initialData ? (
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  {initialData.title}
                </h1>
              </div>
            ) : (
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Neuer Eintrag
              </h1>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant={
                statusLabel === 'Veröffentlicht' ? 'default' : 'secondary'
              }>
              {statusLabel}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Kategorie
              </span>
              <Select
                value={selectedCategoryId}
                onValueChange={(value) => setSelectedCategoryId(value ?? '')}>
                <SelectTrigger
                  id="vault-entry-category"
                  className="h-9 w-auto min-w-56 rounded-full border-border/60 bg-transparent px-3 text-sm shadow-none">
                  <SelectValue placeholder="Kategorie wählen">
                    {getSelectedCategoryLabel()}
                  </SelectValue>
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
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            render={
              <Link href={previewHref} target="_blank" rel="noreferrer" />
            }
            nativeButton={false}
            type="button"
            variant="outline">
            Vorschau
          </Button>
        </div>
      </header>

      <MarkdownEditor
        key={mode === 'edit' && initialData ? initialData.id : 'create'}
        draftStorageScope={draftStorageScope}
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

/**
 * Maps package-level publish state to the compact editorial label.
 *
 * @param status Current markdown-editor status value.
 * @returns Human-readable status label for the page header.
 */
function getVaultEntryStatusLabel(
  status?: MarkdownEditorStatus
): 'Entwurf' | 'Veröffentlicht' {
  return status === 'published' ? 'Veröffentlicht' : 'Entwurf';
}
