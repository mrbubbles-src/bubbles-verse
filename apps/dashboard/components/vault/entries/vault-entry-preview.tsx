'use client';

import type { MarkdownEditorDraft } from '@bubbles/markdown-editor';

import { useEffect, useMemo, useState } from 'react';

import {
  CREATE_DRAFT_KEY,
  EDIT_DRAFT_KEY,
  loadCreateDraft,
  loadEditDraft,
  serializeToMdx,
} from '@bubbles/markdown-editor';
import { MdxRenderer } from '@bubbles/markdown-renderer';
import { Badge } from '@bubbles/ui/shadcn/badge';

type VaultEntryPreviewProps = {
  draftScope: string;
  fallbackDescription?: string;
  fallbackSerializedContent?: string;
  fallbackTitle?: string;
  mode: 'create' | 'edit';
};

/**
 * Renders the standalone fullscreen preview for Vault drafts and entries.
 *
 * The page prefers the current local draft so editors can inspect unsaved work
 * in a separate tab, but falls back to the persisted content when no browser
 * draft exists yet.
 *
 * @param props Preview mode, draft scope, and optional persisted fallback.
 * @returns Full-page markdown preview that mirrors the current draft state.
 */
export function VaultEntryPreview({
  draftScope,
  fallbackDescription,
  fallbackSerializedContent,
  fallbackTitle,
  mode,
}: VaultEntryPreviewProps) {
  const [draft, setDraft] = useState<MarkdownEditorDraft | null>(null);
  const storageKey = useMemo(
    () =>
      `${mode === 'edit' ? EDIT_DRAFT_KEY : CREATE_DRAFT_KEY}:${draftScope}`,
    [draftScope, mode]
  );

  useEffect(() => {
    const loadDraft = () => {
      setDraft(
        mode === 'edit'
          ? loadEditDraft(draftScope)
          : loadCreateDraft(draftScope)
      );
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== storageKey) {
        return;
      }

      loadDraft();
    };

    loadDraft();
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [draftScope, mode, storageKey]);

  const serializedContent = draft?.content
    ? serializeToMdx(draft.content)
    : (fallbackSerializedContent?.trim() ?? '');
  const title =
    draft?.title?.trim() || fallbackTitle?.trim() || 'Neuer Eintrag';
  const description = draft?.description?.trim() || fallbackDescription?.trim();
  const hasContent = serializedContent.length > 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-border/50 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">Vorschau</Badge>
          <Badge variant="secondary">
            {mode === 'edit' ? 'Bearbeiten' : 'Neuer Eintrag'}
          </Badge>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-pretty text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </header>

      {hasContent ? (
        <section className="min-h-[50dvh]">
          <MdxRenderer content={serializedContent} />
        </section>
      ) : (
        <section className="flex min-h-[40dvh] items-center justify-center rounded-3xl border border-dashed border-border/60 px-6 py-10 text-center">
          <div className="max-w-md space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">
              Noch nichts zum Anzeigen
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Sobald Inhalt im Editor liegt, erscheint hier die Vollseiten-
              Vorschau des aktuellen Drafts.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
