import type EditorJS from '@editorjs/editorjs';
import type { OutputData } from '@editorjs/editorjs';

/**
 * Supported block tool keys for the shared markdown editor.
 *
 * Use these keys with the `plugins` prop to opt into a subset of tools while
 * preserving the reference toolbar order.
 */
export type PluginKey =
  | 'paragraph'
  | 'header'
  | 'list'
  | 'code'
  | 'inlineCode'
  | 'alert'
  | 'quote'
  | 'table'
  | 'image'
  | 'delimiter'
  | 'toggle'
  | 'strikethrough'
  | 'annotation'
  | 'inlineHotkey'
  | 'embed';

/**
 * Structured EditorJS payload accepted when bootstrapping the editor.
 *
 * Use this shape for saved editor data or wrapper objects that already expose
 * an EditorJS-compatible `blocks` array.
 */
export type MarkdownEditorContentData = {
  blocks: OutputData['blocks'];
  time?: number | string;
  version?: string;
};

/**
 * Wrapper form used by some reference integrations when nesting saved content.
 *
 * Pass either raw editor data, a JSON string, or this wrapper shape.
 */
export type MarkdownEditorContentInput =
  | MarkdownEditorContentData
  | string
  | {
      content?: MarkdownEditorContentData | string;
    };

/**
 * File metadata returned by the image uploader callback.
 *
 * Match the EditorJS image tool response contract used by the reference apps.
 */
export type MarkdownEditorImageUploadFile = {
  url: string;
  height?: number;
  original_filename?: string;
  public_id?: string;
  width?: number;
};

/**
 * Successful or failed image upload response consumed by the image tool.
 */
export type MarkdownEditorImageUploadResponse = {
  file: MarkdownEditorImageUploadFile;
  success: 0 | 1;
};

/**
 * Async uploader used by the image tool.
 *
 * Return the EditorJS image-tool response shape when the upload finishes.
 *
 * @param file - Blob selected in the editor UI.
 * @returns Upload result consumed by the image tool.
 */
export type MarkdownEditorImageUploader = (
  file: Blob | File
) => Promise<MarkdownEditorImageUploadResponse>;

/**
 * Callback fired when the editor finishes saving its latest state.
 *
 * @param output - Latest EditorJS output payload.
 */
export type MarkdownEditorChangeHandler = (output: OutputData) => void;

/**
 * Callback fired after the EditorJS instance reports readiness.
 *
 * @param editor - Live EditorJS instance.
 */
export type MarkdownEditorReadyHandler = (editor: EditorJS) => void;

/**
 * Public props for the shared markdown editor wrapper.
 *
 * Render this component in client React trees and optionally subset the
 * available tools via `plugins`.
 */
export type MarkdownEditorProps = {
  autofocus?: boolean;
  className?: string;
  imageUploader?: MarkdownEditorImageUploader;
  initialData?: MarkdownEditorContentInput;
  onChange?: MarkdownEditorChangeHandler;
  onReady?: MarkdownEditorReadyHandler;
  placeholder?: string;
  plugins?: readonly PluginKey[];
  readOnly?: boolean;
};
