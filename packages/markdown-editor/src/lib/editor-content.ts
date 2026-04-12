import type { OutputData } from '@editorjs/editorjs';

import type {
  MarkdownEditorContentData,
  MarkdownEditorContentInput,
} from '../types/editor';

const EDITOR_JS_VERSION = '2.31.0';

/**
 * Check whether a value already looks like EditorJS output data.
 *
 * @param value - Candidate content input.
 * @returns True when the value exposes an EditorJS-compatible `blocks` array.
 */
function isEditorContentData(
  value: MarkdownEditorContentInput | MarkdownEditorContentData | undefined
): value is MarkdownEditorContentData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'blocks' in value &&
    Array.isArray(value.blocks)
  );
}

/**
 * Parse saved editor content from strings, direct payloads, or wrapper objects.
 *
 * Use when hydrating the shared editor with persisted content from apps.
 *
 * @param content - Saved content in any supported bootstrap format.
 * @returns Parsed EditorJS-like content or `null` when invalid.
 */
export function parseEditorContent(
  content?: MarkdownEditorContentInput
): MarkdownEditorContentData | null {
  if (!content) {
    return null;
  }

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content) as MarkdownEditorContentData;

      return isEditorContentData(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  if (isEditorContentData(content)) {
    return content;
  }

  if (typeof content.content === 'string') {
    try {
      const parsed = JSON.parse(content.content) as MarkdownEditorContentData;

      return isEditorContentData(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return isEditorContentData(content.content) ? content.content : null;
}

/**
 * Normalize parsed content into the exact `OutputData` shape expected by
 * EditorJS during initialization.
 *
 * @param content - Saved content in any supported bootstrap format.
 * @returns Normalized EditorJS output payload.
 */
export function normalizeInitialEditorData(
  content?: MarkdownEditorContentInput
): OutputData {
  const parsedContent = parseEditorContent(content);

  if (!parsedContent) {
    return {
      blocks: [],
      time: Date.now(),
      version: EDITOR_JS_VERSION,
    };
  }

  return {
    ...parsedContent,
    time:
      typeof parsedContent.time === 'number'
        ? parsedContent.time
        : Number(parsedContent.time) || Date.now(),
    version: parsedContent.version ?? EDITOR_JS_VERSION,
  };
}

/**
 * Mirror the reference StrictMode cleanup guard.
 *
 * The first cleanup is skipped so React development double-mounts do not tear
 * down the still-needed EditorJS instance.
 *
 * @param cleanupHasRunOnce - Whether a cleanup already happened in this mount cycle.
 * @returns True when cleanup should be skipped.
 */
export function shouldSkipInitialCleanup(
  cleanupHasRunOnce: boolean
): boolean {
  return !cleanupHasRunOnce;
}
