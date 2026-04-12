import type { OutputData } from '@editorjs/editorjs';
import { useEffect } from 'react';

import { parseEditorContent } from '../lib/editor-content';
import { saveCreateDraft, saveEditDraft } from '../lib/draft-storage';
import type {
  MarkdownEditorContentData,
  MarkdownEditorInitialData,
  MarkdownEditorStatus,
} from '../types/editor';

type DraftFormValues = {
  title: string;
  slug: string;
  description: string;
  tags: string[];
  status: MarkdownEditorStatus;
};

type UseDraftAutosaveOptions = {
  editorContent: OutputData | null;
  formValues: DraftFormValues;
  initialData?: MarkdownEditorInitialData;
  isEditMode: boolean;
  disabled: boolean;
};

/**
 * Normalize EditorJS output into the draft payload content shape.
 *
 * @param editorContent - Latest EditorJS output payload.
 * @returns Content payload ready for localStorage persistence.
 */
function normalizeDraftContent(
  editorContent: OutputData | null
): MarkdownEditorContentData | undefined {
  if (!editorContent) {
    return undefined;
  }

  return {
    blocks: editorContent.blocks,
    time:
      typeof editorContent.time === 'number' ||
      typeof editorContent.time === 'string'
        ? editorContent.time
        : Date.now(),
    version: editorContent.version ?? '2.31.0',
  };
}

/**
 * Build the persisted draft payload from the current form and editor state.
 *
 * @param formValues - Current metadata field values.
 * @param editorContent - Latest EditorJS output payload.
 * @param initialData - Initial payload used as fallback values.
 * @returns Normalized draft payload for localStorage.
 */
function buildDraftFromFormValues(
  formValues: DraftFormValues,
  editorContent: OutputData | null,
  initialData?: MarkdownEditorInitialData
) {
  const contentFromEditor = normalizeDraftContent(editorContent);
  const fallbackContent = parseEditorContent(initialData?.content);

  return {
    content: contentFromEditor ?? fallbackContent ?? undefined,
    description: formValues.description ?? initialData?.description,
    slug: formValues.slug ?? initialData?.slug,
    status: formValues.status ?? initialData?.status,
    tags: formValues.tags.length > 0 ? formValues.tags : initialData?.tags,
    title: formValues.title ?? initialData?.title,
  };
}

/**
 * Persist editor drafts to localStorage while the author edits content.
 *
 * The hook mirrors the reference package behavior: create and edit flows use
 * separate storage keys, and persistence stops once submit disables drafts.
 *
 * @param options - Current editor/form state plus mode and disable flag.
 */
export function useDraftAutosave({
  editorContent,
  formValues,
  initialData,
  isEditMode,
  disabled,
}: UseDraftAutosaveOptions): void {
  useEffect(() => {
    if (disabled) {
      return;
    }

    const draft = buildDraftFromFormValues(
      formValues,
      editorContent,
      initialData
    );

    if (isEditMode) {
      saveEditDraft(draft);
      return;
    }

    saveCreateDraft(draft);
  }, [disabled, editorContent, formValues, initialData, isEditMode]);
}
