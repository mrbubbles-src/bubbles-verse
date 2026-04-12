import type {
  EditorBlock,
  EditorJsListItem,
  SerializeToMdxInput,
} from '../types/serializer';

import {
  escapeMdxBraces,
  normalizeAlertMessage,
  renderListItems,
  replaceLinksWithMarkdownLinks,
} from './serializer-utils';

const ALLOWED_INLINE_COMPONENTS = new Set<string>(['FormBeispiel']);

/**
 * Escape user text first, then swap inline anchors for `MarkdownLink`.
 *
 * @param text - Raw EditorJS text payload.
 * @returns Serialized MDX-safe text.
 */
function processTextForMdx(text: string): string {
  return replaceLinksWithMarkdownLinks(escapeMdxBraces(text));
}

/**
 * Parse a safe inline component shortcode from paragraph content.
 *
 * @param text - Paragraph text to inspect.
 * @returns MDX component markup when the shortcode is allowed.
 */
function tryParseInlineComponent(text: string): string | null {
  if (!text) {
    return null;
  }

  const trimmed = text.trim();
  const shortcodeMatch = trimmed.match(
    /^\[\[(?<name>[A-Za-z_][A-Za-z0-9_]*)\s*(?<json>\{[\s\S]*\})?\]\]$/,
  );

  if (shortcodeMatch?.groups?.name) {
    const { name } = shortcodeMatch.groups;

    if (!ALLOWED_INLINE_COMPONENTS.has(name)) {
      return null;
    }

    const jsonProps = shortcodeMatch.groups.json?.trim();

    if (!jsonProps) {
      return `<${name} />`;
    }

    try {
      const parsedProps = JSON.parse(jsonProps);
      return `<${name} {...${JSON.stringify(parsedProps)}} />`;
    } catch {
      return null;
    }
  }

  const jsxMatch = trimmed.match(/^<(?<name>[A-Za-z_][A-Za-z0-9_]*)\s*\/>$/);

  if (jsxMatch?.groups?.name) {
    const { name } = jsxMatch.groups;
    return ALLOWED_INLINE_COMPONENTS.has(name) ? `<${name} />` : null;
  }

  return null;
}

/**
 * Wrap serialized block output with its original EditorJS block id.
 *
 * @param blockId - EditorJS block id used for preview scroll targeting.
 * @param content - Serialized MDX content for the block.
 * @returns Wrapped block markup.
 */
function wrapWithBlockId(blockId: string, content: string): string {
  return `<div data-block-id="${blockId}">\n\n${content}\n\n</div>`;
}

/**
 * Serialize EditorJS output into MDX strings consumed by `MdxRenderer`.
 *
 * Use this standalone utility to persist editor content without importing any
 * React components or EditorJS runtime code.
 *
 * @param editorData - EditorJS output data with a `blocks` array.
 * @returns Serialized MDX string for storage or preview rendering.
 */
export function serializeToMdx(editorData: SerializeToMdxInput): string {
  if (!editorData?.blocks || !Array.isArray(editorData.blocks)) {
    return '';
  }

  if (editorData.blocks.length === 0) {
    return '';
  }

  const blocks = editorData.blocks as EditorBlock[];
  const result: string[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (!block) {
      continue;
    }

    const blockId = block.id ?? '';
    let content = '';

    switch (block.type) {
      case 'paragraph': {
        const data = block.data as { text: string };
        const inlineComponent = tryParseInlineComponent(data.text);
        content = inlineComponent ?? processTextForMdx(data.text);
        break;
      }

      case 'header': {
        const data = block.data as { level: number; text: string };
        content = `${'#'.repeat(data.level)} ${processTextForMdx(data.text)}`;
        break;
      }

      case 'list': {
        const data = block.data as {
          items: EditorJsListItem[];
          style: 'checklist' | 'ordered' | 'unordered';
        };

        if (data.style === 'checklist') {
          const checklistItems = data.items as EditorJsListItem[];
          content = `<MarkdownChecklist items={${JSON.stringify(checklistItems)}} />`;
        } else {
          content = renderListItems(data.items, data.style);
        }
        break;
      }

      case 'code':
      case 'codeBox': {
        const data = block.data as {
          code: string;
          language?: string;
        };
        const safeCode = JSON.stringify(data.code);
        content = `<MarkdownCodeBlock
      code={${safeCode}}
      language="${data.language || 'plaintext'}"
    />`;
        break;
      }

      case 'quote': {
        const data = block.data as {
          caption?: string;
          text: string;
        };
        content = `> ${processTextForMdx(data.text)}\n>\n> — ${processTextForMdx(data.caption || '')}`;
        break;
      }

      case 'alert': {
        const data = block.data as {
          message: string;
          type?: 'danger' | 'info' | 'success' | 'warning';
        };
        const normalized = normalizeAlertMessage(data.message || '');
        const message = processTextForMdx(normalized);
        const type = data.type || 'info';

        content = `<MarkdownAlerts type="${type}">

${message}

</MarkdownAlerts>`;
        break;
      }

      case 'delimiter': {
        content = '---';
        break;
      }

      case 'toggle': {
        const data = block.data as {
          items?: number;
          text?: string;
        };
        const text = escapeMdxBraces(data.text?.trim() || 'Details');
        const itemsCount = data.items ?? 0;
        const toggleBlocks = blocks.slice(index + 1, index + 1 + itemsCount);
        const inner = toggleBlocks
          .map((nestedBlock) => serializeToMdx({ blocks: [nestedBlock] }))
          .join('\n\n');

        content = `<MarkdownToggle text="${text}">

${inner}

</MarkdownToggle>`;
        index += itemsCount;
        break;
      }

      case 'table': {
        const data = block.data as {
          content: string[][];
          withHeadings?: boolean;
        };
        const tableData = {
          content: data.content,
          withHeadings: data.withHeadings === undefined ? true : data.withHeadings,
        };
        const columnWidths: number[] = [];

        tableData.content.forEach((row: string[]) => {
          row.forEach((cell: string, cellIndex: number) => {
            columnWidths[cellIndex] = Math.max(
              columnWidths[cellIndex] || 0,
              cell.trim().length,
            );
          });
        });

        const rows = tableData.content.map((row: string[]) =>
          `| ${row
            .map((cell: string, cellIndex: number) =>
              cell.trim().padEnd(columnWidths[cellIndex] ?? 0, ' '),
            )
            .join(' | ')} |`,
        );

        if (tableData.withHeadings && rows.length > 1) {
          const headerRow = rows[0] ?? '';
          const divider =
            '| ' + columnWidths.map((width) => '-'.repeat(width)).join(' | ') + ' |';

          content = [
            processTextForMdx(headerRow),
            divider,
            ...rows.slice(1).map(processTextForMdx),
          ].join('\n');
        } else {
          content = processTextForMdx(rows.join('\n'));
        }

        break;
      }

      case 'embed': {
        const data = block.data as {
          caption?: string;
          embed?: string;
        };
        content = `<MarkdownEmbed embed="${data.embed}" caption="${data.caption}" />`;
        break;
      }

      case 'image': {
        const data = block.data as {
          caption?: string;
          file?: {
            height?: number;
            original_filename?: string;
            public_id?: string;
            url?: string;
            width?: number;
          };
        };
        const file = data.file ?? {};
        content = `<MarkdownImage
            url="${file.url || ''}"
            caption="${data.caption || ''}"
            original_filename="${file.original_filename || ''}"
            public_id="${file.public_id || ''}"
            width="${file.width ?? ''}"
            height="${file.height ?? ''}"
          />`;
        break;
      }

      default: {
        break;
      }
    }

    result.push(wrapWithBlockId(blockId, content));
  }

  return result.join('\n\n').replace(/<br\b([^>]*)>/gi, '<br />');
}
