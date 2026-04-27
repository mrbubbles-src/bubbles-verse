import type { OutputData } from '@editorjs/editorjs';

/**
 * Recursive primitive shape used for unknown EditorJS block payloads.
 *
 * Use for passthrough blocks we do not explicitly model yet.
 */
type SerializableValue =
  | boolean
  | null
  | number
  | string
  | undefined
  | SerializableValue[]
  | { [key: string]: SerializableValue };

/**
 * Nested item shape used by the EditorJS list tool.
 *
 * Use for ordered, unordered, and checklist block serialization.
 */
export type EditorJsListItem = {
  content: string;
  items?: EditorJsListItem[];
  meta?: {
    checked?: boolean;
  };
  text?: string;
};

type ParagraphBlock = {
  id?: string;
  type: 'paragraph';
  data: {
    text: string;
  };
};

type HeaderBlock = {
  id?: string;
  type: 'header';
  data: {
    level: number;
    text: string;
  };
};

type ListBlock = {
  id?: string;
  type: 'list';
  data: {
    items: EditorJsListItem[];
    style: 'checklist' | 'ordered' | 'unordered';
  };
};

type CodeBlock = {
  id?: string;
  type: 'code' | 'codeBox';
  data: {
    code: string;
    filename?: string;
    language?: string;
  };
};

type QuoteBlock = {
  id?: string;
  type: 'quote';
  data: {
    caption?: string;
    text: string;
  };
};

type AlertBlock = {
  id?: string;
  type: 'alert';
  data: {
    message: string;
    type?: 'danger' | 'info' | 'success' | 'warning';
  };
};

type DelimiterBlock = {
  id?: string;
  type: 'delimiter';
  data: {
    lineThickness?: number;
    lineWidth?: number;
    style?: string;
  };
};

type ToggleBlock = {
  id?: string;
  type: 'toggle';
  data: {
    items?: number;
    text?: string;
  };
};

type TableBlock = {
  id?: string;
  type: 'table';
  data: {
    content: string[][];
    withHeadings?: boolean;
  };
};

type EmbedBlock = {
  id?: string;
  type: 'embed';
  data: {
    caption?: string;
    embed?: string;
    height?: number;
    service?: string;
    source?: string;
    width?: number;
  };
};

type ImageBlock = {
  id?: string;
  type: 'image';
  data: {
    caption?: string;
    file?: {
      height?: number;
      original_filename?: string;
      public_id?: string;
      url?: string;
      width?: number;
    };
  };
};

type UnknownBlock = {
  id?: string;
  type: string;
  data: Record<string, SerializableValue>;
};

/**
 * Narrow block union used by the serializer.
 *
 * Use this instead of the looser upstream EditorJS block types while keeping
 * structural compatibility with `OutputData`.
 */
export type EditorBlock =
  | AlertBlock
  | CodeBlock
  | DelimiterBlock
  | EmbedBlock
  | HeaderBlock
  | ImageBlock
  | ListBlock
  | ParagraphBlock
  | QuoteBlock
  | TableBlock
  | ToggleBlock
  | UnknownBlock;

/**
 * Public serializer input shape.
 *
 * Accepts native EditorJS `OutputData` or a compatible `{ blocks }` object.
 */
export type SerializeToMdxInput = OutputData | { blocks: EditorBlock[] };

/**
 * Optional serializer behavior flags that preserve the reference API surface.
 *
 * Provide a `blockId -> anchorId` map when heading wrapper elements should
 * expose deterministic hash targets for table-of-contents links.
 */
export type SerializeOptions = {
  headingAnchorIdsByBlockId?: Record<string, string>;
};
