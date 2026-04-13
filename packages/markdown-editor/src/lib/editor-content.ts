import type { OutputData } from '@editorjs/editorjs';

import type {
  MarkdownEditorContentData,
  MarkdownEditorContentInput,
  MarkdownEditorInitialData,
  MarkdownEditorInitialDataInput,
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
 * Returns whether an initial editor payload already includes metadata fields.
 *
 * @param value - Candidate `initialData` value from the public API.
 * @returns True when the object carries form metadata in addition to content.
 */
function isInitialDataEnvelope(
  value: MarkdownEditorInitialDataInput | undefined
): value is MarkdownEditorInitialData {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('title' in value ||
      'slug' in value ||
      'description' in value ||
      'tags' in value ||
      'status' in value)
  );
}

/**
 * Extract the content portion from the public `initialData` union.
 *
 * @param initialData - Raw editor bootstrap input from the component props.
 * @returns Content payload suitable for EditorJS normalization.
 */
export function resolveInitialEditorContent(
  initialData?: MarkdownEditorInitialDataInput
): MarkdownEditorContentInput | undefined {
  if (!initialData) {
    return undefined;
  }

  return isInitialDataEnvelope(initialData) ? initialData.content : initialData;
}

/**
 * Normalize the public `initialData` union into the package form shape.
 *
 * @param initialData - Raw editor bootstrap input from the component props.
 * @returns Metadata envelope used by the default form and render props.
 */
export function normalizeInitialFormData(
  initialData?: MarkdownEditorInitialDataInput
): MarkdownEditorInitialData | undefined {
  if (!initialData) {
    return undefined;
  }

  if (!isInitialDataEnvelope(initialData)) {
    return {
      content: initialData,
    };
  }

  return {
    content: initialData.content,
    description: initialData.description,
    slug: initialData.slug,
    status: initialData.status,
    tags: Array.isArray(initialData.tags) ? initialData.tags : undefined,
    title: initialData.title,
  };
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
  content?: MarkdownEditorInitialDataInput | MarkdownEditorContentInput
): OutputData {
  const parsedContent = parseEditorContent(
    resolveInitialEditorContent(content)
  );

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
