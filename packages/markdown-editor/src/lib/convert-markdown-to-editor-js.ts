import type { OutputData } from '@editorjs/editorjs';

import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

import type { EditorBlock, EditorJsListItem } from '../types/serializer';

type MarkdownTextNode = {
  type: 'text';
  value: string;
};

type MarkdownBreakNode = {
  type: 'break';
};

type MarkdownInlineCodeNode = {
  type: 'inlineCode';
  value: string;
};

type MarkdownParentPhrasingNode = {
  type: 'delete' | 'emphasis' | 'strong';
  children: MarkdownPhrasingNode[];
};

type MarkdownLinkNode = {
  type: 'link';
  url: string;
  children: MarkdownPhrasingNode[];
};

type MarkdownPhrasingNode =
  | MarkdownBreakNode
  | MarkdownInlineCodeNode
  | MarkdownLinkNode
  | MarkdownParentPhrasingNode
  | MarkdownTextNode;

type MarkdownParagraphNode = {
  type: 'paragraph';
  children: Array<MarkdownImageNode | MarkdownPhrasingNode>;
};

type MarkdownHeadingNode = {
  type: 'heading';
  depth: number;
  children: MarkdownPhrasingNode[];
};

type MarkdownListItemNode = {
  type: 'listItem';
  checked?: boolean | null;
  children: Array<MarkdownListNode | MarkdownParagraphNode>;
};

type MarkdownListNode = {
  type: 'list';
  ordered?: boolean | null;
  children: MarkdownListItemNode[];
};

type MarkdownCodeNode = {
  type: 'code';
  lang?: string | null;
  value: string;
};

type MarkdownBlockquoteNode = {
  type: 'blockquote';
  children: MarkdownParagraphNode[];
};

type MarkdownTableCellNode = {
  type: 'tableCell';
  children: MarkdownPhrasingNode[];
};

type MarkdownTableRowNode = {
  type: 'tableRow';
  children: MarkdownTableCellNode[];
};

type MarkdownTableNode = {
  type: 'table';
  children: MarkdownTableRowNode[];
};

type MarkdownImageNode = {
  type: 'image';
  alt?: string | null;
  url: string;
};

type MarkdownHtmlNode = {
  type: 'html';
  value: string;
};

type MarkdownUnsupportedNode = {
  type: 'definition' | 'footnoteDefinition' | 'thematicBreak' | string;
};

type MarkdownBlockNode =
  | MarkdownBlockquoteNode
  | MarkdownCodeNode
  | MarkdownHeadingNode
  | MarkdownHtmlNode
  | MarkdownImageNode
  | MarkdownListNode
  | MarkdownParagraphNode
  | MarkdownTableNode
  | MarkdownUnsupportedNode;

type MarkdownRootNode = {
  children: MarkdownBlockNode[];
};

/**
 * Conversion details returned after parsing Markdown into EditorJS blocks.
 *
 * The modal uses this to show authors how much content was imported and which
 * elements still need manual follow-up, such as image uploads.
 */
export type ConversionResult = {
  data: OutputData;
  warnings: string[];
  stats: {
    totalBlocks: number;
    imagePlaceholders: number;
    unsupportedElements: string[];
  };
};

/**
 * Generate a short block id compatible with the reference import flow.
 *
 * The imported payload must include stable block ids so the shared preview and
 * scroll-sync code can keep working immediately after replacement.
 *
 * @returns Ten-character block id.
 */
function generateBlockId(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';

  for (let index = 0; index < 10; index += 1) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return id;
}

/**
 * Escape HTML-sensitive code content before handing it to EditorJS.
 *
 * Curly braces are intentionally left alone because the downstream MDX
 * serializer already handles them at the package security boundary.
 *
 * @param text - Raw inline code text from mdast.
 * @returns HTML-safe string.
 */
function escapeHtmlForCode(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Convert inline mdast nodes to the HTML-like strings expected by EditorJS.
 *
 * @param nodes - Inline mdast nodes from headings, paragraphs, and tables.
 * @returns Inline HTML string preserved for the existing serializer pipeline.
 */
function phrasingToHtml(nodes: MarkdownPhrasingNode[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
          return node.value;
        case 'strong':
          return `<b>${phrasingToHtml(node.children)}</b>`;
        case 'emphasis':
          return `<i>${phrasingToHtml(node.children)}</i>`;
        case 'inlineCode':
          return `<code>${escapeHtmlForCode(node.value)}</code>`;
        case 'link':
          return `<a href="${node.url}">${phrasingToHtml(node.children)}</a>`;
        case 'break':
          return '<br />';
        case 'delete':
          return `<s>${phrasingToHtml(node.children)}</s>`;
        default:
          return '';
      }
    })
    .join('');
}

/**
 * Drop standalone image nodes from paragraph children before inline rendering.
 *
 * Paragraph-only image imports are handled as dedicated image blocks earlier in
 * the conversion flow, so mixed-content paragraphs only keep phrasing nodes.
 *
 * @param paragraph - Paragraph node from the markdown tree.
 * @returns Inline phrasing children safe for HTML conversion.
 */
function getParagraphInlineChildren(
  paragraph: MarkdownParagraphNode
): MarkdownPhrasingNode[] {
  return paragraph.children.filter((child): child is MarkdownPhrasingNode => {
    return child.type !== 'image';
  });
}

/**
 * Convert a single mdast list item into the nested EditorJS list structure.
 *
 * @param item - mdast list item.
 * @param isChecklist - Whether the parent list is a task list.
 * @returns EditorJS list item shape expected by `@editorjs/list`.
 */
function convertListItem(
  item: MarkdownListItemNode,
  isChecklist: boolean
): EditorJsListItem {
  let content = '';
  const nestedItems: EditorJsListItem[] = [];

  for (const child of item.children) {
    if (child.type === 'paragraph') {
      content += phrasingToHtml(getParagraphInlineChildren(child));
      continue;
    }

    if (child.type === 'list') {
      for (const nestedItem of child.children) {
        nestedItems.push(convertListItem(nestedItem, isChecklist));
      }
    }
  }

  if (!content.trim()) {
    content = '\u200B';
  }

  return {
    content,
    items: nestedItems,
    meta: isChecklist ? { checked: item.checked === true } : {},
  };
}

/**
 * Convert a Markdown string into EditorJS output matching the portal reference.
 *
 * The converter intentionally mirrors the reference implementation so imported
 * content flows through the existing serializer and preview stack unchanged.
 *
 * @param markdown - Raw Markdown or MDX-like text selected by the author.
 * @returns Converted EditorJS payload plus preview stats and warnings.
 */
export function convertMarkdownToEditorJs(
  markdown: string
): ConversionResult {
  const warnings: string[] = [];
  const unsupportedElements: string[] = [];
  let imagePlaceholders = 0;

  const processor = unified().use(remarkParse).use(remarkGfm);
  const tree = processor.parse(markdown) as MarkdownRootNode;
  const blocks: EditorBlock[] = [];

  for (const node of tree.children) {
    switch (node.type) {
      case 'heading': {
        const heading = node as MarkdownHeadingNode;
        blocks.push({
          id: generateBlockId(),
          type: 'header',
          data: {
            text: phrasingToHtml(heading.children),
            level: Math.min(heading.depth, 3),
          },
        });
        break;
      }

      case 'paragraph': {
        const paragraph = node as MarkdownParagraphNode;
        const significantChildren = paragraph.children.filter(
          (child: MarkdownImageNode | MarkdownPhrasingNode) => {
            return !(child.type === 'text' && !child.value.trim());
          }
        );

        if (
          significantChildren.length === 1 &&
          significantChildren[0]?.type === 'image'
        ) {
          const image = significantChildren[0] as MarkdownImageNode;
          imagePlaceholders += 1;
          warnings.push(
            `Image "${image.alt || image.url}" will be a placeholder. Please upload the actual image.`
          );
          blocks.push({
            id: generateBlockId(),
            type: 'image',
            data: {
              file: {
                url: '',
              },
              caption: image.alt || '',
            },
          });
          break;
        }

        const text = phrasingToHtml(getParagraphInlineChildren(paragraph));
        if (!text.trim()) {
          break;
        }

        blocks.push({
          id: generateBlockId(),
          type: 'paragraph',
          data: {
            text,
          },
        });
        break;
      }

      case 'list': {
        const list = node as MarkdownListNode;
        const isChecklist = list.children.some((item: MarkdownListItemNode) => {
          return item.checked !== null && item.checked !== undefined;
        });
        const style: 'ordered' | 'unordered' | 'checklist' = isChecklist
          ? 'checklist'
          : list.ordered
            ? 'ordered'
            : 'unordered';

        blocks.push({
          id: generateBlockId(),
          type: 'list',
          data: {
            style,
            items: list.children.map((item) =>
              convertListItem(item, isChecklist)
            ),
          },
        });
        break;
      }

      case 'code': {
        const code = node as MarkdownCodeNode;
        blocks.push({
          id: generateBlockId(),
          type: 'code',
          data: {
            code: code.value,
            language: code.lang || 'plaintext',
          },
        });
        break;
      }

      case 'blockquote': {
        const blockquote = node as MarkdownBlockquoteNode;
        const textParts: string[] = [];

        for (const child of blockquote.children) {
          if (child.type === 'paragraph') {
            textParts.push(phrasingToHtml(getParagraphInlineChildren(child)));
          }
        }

        blocks.push({
          id: generateBlockId(),
          type: 'quote',
          data: {
            text: textParts.join('\n'),
            caption: '',
          },
        });
        break;
      }

      case 'thematicBreak':
        blocks.push({
          id: generateBlockId(),
          type: 'delimiter',
          data: {
            style: 'line',
            lineWidth: 100,
            lineThickness: 2,
          },
        });
        break;

      case 'table': {
        const table = node as MarkdownTableNode;
        blocks.push({
          id: generateBlockId(),
          type: 'table',
          data: {
            withHeadings: true,
            content: table.children.map((row: MarkdownTableRowNode) =>
              row.children.map((cell: MarkdownTableCellNode) =>
                cell.type === 'tableCell'
                  ? phrasingToHtml(cell.children)
                  : ''
              )
            ),
          },
        });
        break;
      }

      case 'image': {
        const image = node as MarkdownImageNode;
        imagePlaceholders += 1;
        warnings.push(
          `Image "${image.alt || image.url}" will be a placeholder. Please upload the actual image.`
        );
        blocks.push({
          id: generateBlockId(),
          type: 'image',
          data: {
            file: {
              url: '',
            },
            caption: image.alt || '',
          },
        });
        break;
      }

      case 'html': {
        const htmlNode = node as MarkdownHtmlNode;
        if (!htmlNode.value.trim()) {
          break;
        }

        blocks.push({
          id: generateBlockId(),
          type: 'code',
          data: {
            code: htmlNode.value.trim(),
            language: 'html',
          },
        });

        if (!warnings.includes('HTML blocks have been converted to code blocks.')) {
          warnings.push('HTML blocks have been converted to code blocks.');
        }
        break;
      }

      case 'definition':
      case 'footnoteDefinition':
        unsupportedElements.push(node.type);
        break;

      default:
        unsupportedElements.push(node.type);
        if (
          !warnings.includes(
            `Unsupported element type "${node.type}" was skipped.`
          )
        ) {
          warnings.push(
            `Unsupported element type "${node.type}" was skipped.`
          );
        }
    }
  }

  return {
    data: {
      time: Date.now(),
      blocks: blocks as OutputData['blocks'],
      version: '2.31.0',
    },
    warnings,
    stats: {
      totalBlocks: blocks.length,
      imagePlaceholders,
      unsupportedElements: [...new Set(unsupportedElements)],
    },
  };
}
