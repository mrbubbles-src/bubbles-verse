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
    <main className="mx-auto flex min-h-dvh w-full max-w-screen-2xl flex-col gap-10 px-5 py-7 sm:px-7 sm:py-9 lg:px-10">
      <header className="flex flex-col gap-5 border-b border-border/50 pb-7">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">Vorschau</Badge>
          <Badge variant="secondary">
            {mode === 'edit' ? 'Bearbeiten' : 'Neuer Eintrag'}
          </Badge>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-4xl text-base leading-7 text-pretty text-muted-foreground sm:text-lg">
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
        <section className="flex min-h-[40dvh] items-center justify-center rounded-3xl border border-dashed border-border/60 px-8 py-12 text-center">
          <div className="max-w-lg space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              Noch nichts zum Anzeigen
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              Sobald Inhalt im Editor liegt, erscheint hier die Vollseiten-
              Vorschau des aktuellen Drafts.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
