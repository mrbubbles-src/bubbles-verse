import type {
  EditorBlock,
  EditorJsListItem,
} from '../../../src/types/serializer';

/**
 * Shared paragraph text fixture that mirrors the reference inline tool markup.
 *
 * Use when verifying inline EditorJS HTML survives serializer output.
 */
export const inlineToolsParagraphText =
  'Paragraph with <span class="inline-code">npm init</span>, <s>done</s>, <span class="cdx-annotation" data-title="Note" data-text="Extra">annotation</span>, and <kbd class="editorjs-inline-hotkey">CMD+K</kbd>.';

/**
 * Ordered list fixture with one nested child entry.
 *
 * Use when asserting recursive markdown list rendering.
 */
export const orderedListItems: EditorJsListItem[] = [
  { content: 'First item' },
  { content: 'Second item', items: [{ content: 'Nested item' }] },
];

/**
 * Unordered list fixture for plain bullet list coverage.
 *
 * Use when asserting `-` list output.
 */
export const unorderedListItems: EditorJsListItem[] = [
  { content: 'Alpha' },
  { content: 'Beta' },
];

/**
 * Checklist fixture that preserves the reference `meta.checked` shape.
 *
 * Use when asserting `MarkdownChecklist` component serialization.
 */
export const checklistItems: EditorJsListItem[] = [
  { content: 'Checked', meta: { checked: true } },
  { content: 'Unchecked', meta: { checked: false } },
];

/**
 * Create a paragraph block fixture.
 *
 * @param overrides - Optional id/text overrides for the default fixture.
 * @returns Typed paragraph block for serializer tests.
 */
export function createParagraphBlock(
  overrides: {
    id?: string;
    text?: string;
  } = {}
): EditorBlock {
  return {
    id: overrides.id ?? 'paragraph-1',
    type: 'paragraph',
    data: {
      text: overrides.text ?? 'Plain paragraph',
    },
  };
}

/**
 * Create a header block fixture.
 *
 * @param overrides - Optional id/level/text overrides for the default fixture.
 * @returns Typed header block for serializer tests.
 */
export function createHeaderBlock(
  overrides: {
    id?: string;
    level?: number;
    text?: string;
  } = {}
): EditorBlock {
  return {
    id: overrides.id ?? 'header-1',
    type: 'header',
    data: {
      level: overrides.level ?? 2,
      text: overrides.text ?? 'Heading',
    },
  };
}

/**
 * Create a list block fixture.
 *
 * @param overrides - Optional id/style/items overrides for the default fixture.
 * @returns Typed list block for serializer tests.
 */
export function createListBlock(
  overrides: {
    id?: string;
    items?: EditorJsListItem[];
    style?: 'checklist' | 'ordered' | 'unordered';
  } = {}
): EditorBlock {
  return {
    id: overrides.id ?? 'list-1',
    type: 'list',
    data: {
      items: overrides.items ?? orderedListItems,
      style: overrides.style ?? 'ordered',
    },
  };
}

/**
 * Create a code or codeBox block fixture.
 *
 * @param overrides - Optional id/code/language/type overrides.
 * @returns Typed code-family block for serializer tests.
 */
export function createCodeBlock(
  overrides: {
    code?: string;
    id?: string;
    language?: string;
    type?: 'code' | 'codeBox';
  } = {}
): EditorBlock {
  return {
    id: overrides.id ?? 'code-1',
    type: overrides.type ?? 'code',
    data: {
      code: overrides.code ?? 'const answer = 42;',
      language: overrides.language,
    },
  };
}

/**
 * Create a quote block fixture.
 *
 * @param overrides - Optional id/text/caption overrides.
 * @returns Typed quote block for serializer tests.
 */
export function createQuoteBlock(
  overrides: {
    caption?: string;
    id?: string;
    text?: string;
  } = {}
): EditorBlock {
  return {
    id: overrides.id ?? 'quote-1',
    type: 'quote',
    data: {
      caption: overrides.caption ?? 'Author',
      text: overrides.text ?? 'Quoted text',
    },
  };
}

/**
 * Create an alert block fixture.
 *
 * @param overrides - Optional id/message/type overrides.
 * @returns Typed alert block for serializer tests.
 */
export function createAlertBlock(
  overrides: {
    id?: string;
    message?: string;
    type?: 'danger' | 'info' | 'success' | 'warning';
  } = {}
): EditorBlock {
  return {
    id: overrides.id ?? 'alert-1',
    type: 'alert',
    data: {
      message: overrides.message ?? '<div>Be careful<br>now</div>',
      type: overrides.type ?? 'warning',
    },
  };
}

/**
 * Create a delimiter block fixture.
 *
 * @param id - Optional block id override.
 * @returns Typed delimiter block for serializer tests.
 */
export function createDelimiterBlock(id = 'delimiter-1'): EditorBlock {
  return {
    id,
    type: 'delimiter',
    data: {},
  };
}

/**
 * Create a toggle block fixture.
 *
 * @param overrides - Optional id/text/items overrides.
 * @returns Typed toggle block for serializer tests.
 */
export function createToggleBlock(
  overrides: {
    id?: string;
    items?: number;
    text?: string;
  } = {}
): EditorBlock {
  return {
    id: overrides.id ?? 'toggle-1',
    type: 'toggle',
    data: {
      items: overrides.items ?? 2,
      text: overrides.text ?? 'More details',
    },
  };
}

/**
 * Create a table block fixture.
 *
 * @param overrides - Optional id/content/withHeadings overrides.
 * @returns Typed table block for serializer tests.
 */
export function createTableBlock(
  overrides: {
    content?: string[][];
    id?: string;
    withHeadings?: boolean;
  } = {}
): EditorBlock {
  return {
    id: overrides.id ?? 'table-1',
    type: 'table',
    data: {
      content: overrides.content ?? [
        ['Name', 'Value'],
        ['Alpha', '1'],
      ],
      withHeadings: overrides.withHeadings,
    },
  };
}

/**
 * Create an embed block fixture.
 *
 * @param overrides - Optional id/embed/caption overrides.
 * @returns Typed embed block for serializer tests.
 */
export function createEmbedBlock(
  overrides: {
    caption?: string;
    embed?: string;
    id?: string;
  } = {}
): EditorBlock {
  return {
    id: overrides.id ?? 'embed-1',
    type: 'embed',
    data: {
      caption: overrides.caption ?? 'Embed caption',
      embed: overrides.embed ?? 'https://example.com/embed',
    },
  };
}

/**
 * Create an image block fixture.
 *
 * @param overrides - Optional id/file/caption overrides.
 * @returns Typed image block for serializer tests.
 */
export function createImageBlock(
  overrides: {
    caption?: string;
    file?: {
      height?: number;
      original_filename?: string;
      public_id?: string;
      url?: string;
      width?: number;
    };
    id?: string;
  } = {}
): EditorBlock {
  return {
    id: overrides.id ?? 'image-1',
    type: 'image',
    data: {
      caption: overrides.caption ?? 'Image caption',
      file: overrides.file ?? {
        height: 600,
        original_filename: 'image.png',
        public_id: 'vault/image',
        url: 'https://example.com/image.png',
        width: 800,
      },
    },
  };
}
