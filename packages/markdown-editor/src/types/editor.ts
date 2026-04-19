import type EditorJS from '@editorjs/editorjs';
import type { OutputData } from '@editorjs/editorjs';
import type { ReactNode } from 'react';

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
 * Publication status exposed by the package-level metadata form.
 *
 * Use the explicit string union instead of a boolean so app integrations can
 * persist a stable status field without local mapping.
 */
export type MarkdownEditorStatus = 'published' | 'unpublished';

/**
 * Normalized metadata surface used by the package form layer.
 *
 * Custom forms receive this shape regardless of whether the consumer passed raw
 * editor content or a richer edit-mode payload into `initialData`.
 */
export type MarkdownEditorInitialData = {
  content?: MarkdownEditorContentInput;
  title?: string;
  slug?: string;
  description?: string;
  tags?: string[];
  status?: MarkdownEditorStatus;
};

/**
 * Primitive values allowed inside the package-level slug strategy context.
 *
 * Apps can pass lightweight metadata that influences slug generation without
 * forcing the shared editor to understand app-specific domain models.
 */
export type MarkdownEditorSlugStrategyContextValue =
  | boolean
  | number
  | string
  | null
  | undefined;

/**
 * App-defined context bag forwarded into the default slug strategy hook.
 */
export type MarkdownEditorSlugStrategyContext = Record<
  string,
  MarkdownEditorSlugStrategyContextValue
>;

/**
 * Input shape provided to the default metadata-form slug strategy.
 *
 * The package owns the default title/slug flow, while apps can inject a
 * strategy that derives path-like slugs from the same editor metadata.
 */
export type MarkdownEditorSlugStrategyInput = {
  title: string;
  editorContent: OutputData | null;
  initialData?: MarkdownEditorInitialData;
  isEditMode: boolean;
  context?: MarkdownEditorSlugStrategyContext;
};

/**
 * Slug strategy return shape used by the default metadata form.
 *
 * Strategies may return a final path string or a list of path segments that
 * the package will normalize and join.
 */
export type MarkdownEditorSlugStrategyResult =
  | string
  | readonly (string | null | undefined)[];

/**
 * App-provided slug strategy hook for the default metadata form.
 */
export type MarkdownEditorSlugStrategy = (
  input: MarkdownEditorSlugStrategyInput
) => MarkdownEditorSlugStrategyResult;

/**
 * Input accepted by `MarkdownEditor` for create/edit bootstrapping.
 *
 * Existing callers may continue passing raw EditorJS content, while edit-mode
 * integrations can provide metadata alongside the content payload.
 */
export type MarkdownEditorInitialDataInput =
  | MarkdownEditorContentInput
  | MarkdownEditorInitialData;

/**
 * Payload emitted by the default `EditorForm` submit flow.
 *
 * Apps own persistence and navigation; the package only serializes the current
 * editor state and returns it through `onSuccess`.
 */
export type MarkdownEditorSubmitData = {
  title: string;
  slug: string;
  description: string;
  tags: string[];
  status: MarkdownEditorStatus;
  editorContent: OutputData;
  serializedContent: string;
  isEditMode: boolean;
};

/**
 * Typed state exposed to custom form render props.
 *
 * The props intentionally mirror the reference editor contract while keeping
 * the package free of app-specific persistence concerns.
 */
export type EditorRenderFormProps = {
  editorOutput: () => Promise<OutputData | undefined>;
  editorContent: OutputData | null;
  editorReady: boolean;
  initialData?: MarkdownEditorInitialData;
  isEditMode: boolean;
};

/**
 * Props for the package's default metadata form.
 *
 * Consumers can import `EditorForm` directly or rely on the automatic fallback
 * rendered by `MarkdownEditor`.
 */
export type EditorFormProps = EditorRenderFormProps & {
  draftStorageScope?: string;
  onSuccess?: (data: MarkdownEditorSubmitData) => void;
  slugStrategy?: MarkdownEditorSlugStrategy;
  slugStrategyContext?: MarkdownEditorSlugStrategyContext;
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
 * Callback fired after the default metadata form serializes editor content.
 *
 * @param data - Metadata plus EditorJS output and serialized MDX payload.
 */
export type MarkdownEditorSuccessHandler = (
  data: MarkdownEditorSubmitData
) => void;

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
  initialData?: MarkdownEditorInitialDataInput;
  isEditMode?: boolean;
  draftStorageScope?: string;
  onChange?: MarkdownEditorChangeHandler;
  onReady?: MarkdownEditorReadyHandler;
  onSuccess?: MarkdownEditorSuccessHandler;
  placeholder?: string;
  plugins?: readonly PluginKey[];
  readOnly?: boolean;
  renderForm?: (props: EditorRenderFormProps) => ReactNode;
  slugStrategy?: MarkdownEditorSlugStrategy;
  slugStrategyContext?: MarkdownEditorSlugStrategyContext;
};
