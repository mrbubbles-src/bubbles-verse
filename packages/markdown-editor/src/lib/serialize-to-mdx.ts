import type {
  EditorBlock,
  EditorJsListItem,
  SerializeOptions,
  SerializeToMdxInput,
} from '../types/serializer';
import {
  escapeMdxBraces,
  sanitizeSerializedMdx,
  tryParseInlineComponent,
} from '../serializer/security';
import {
  normalizeAlertMessage,
  renderListItems,
  replaceLinksWithMarkdownLinks,
} from './serializer-utils';

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
 * Serialize a string prop as an MDX expression so embedded quotes stay valid.
 *
 * @param name - Prop name written into the MDX tag.
 * @param value - Raw string value.
 * @returns MDX prop fragment.
 */
function serializeMdxStringProp(name: string, value: string): string {
  return `${name}={${JSON.stringify(value)}}`;
}

/**
 * Serialize a numeric prop when the value is finite.
 *
 * @param name - Prop name written into the MDX tag.
 * @param value - Candidate numeric value.
 * @returns MDX prop fragment or `null` when the value is invalid.
 */
function serializeMdxNumberProp(
  name: string,
  value: number | undefined
): string | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${name}={${String(value)}}`
    : null;
}

/**
 * Normalize a table cell so GFM row construction cannot be broken by content.
 *
 * @param cell - Raw table cell text.
 * @returns Normalized cell text safe for row concatenation.
 */
function normalizeTableCell(cell: string): string {
  return cell.trim().replace(/\r?\n/g, '<br />').replace(/\|/g, '\\|');
}

/**
 * Wrap serialized block output with its original EditorJS block id.
 *
 * @param blockId - EditorJS block id used for preview scroll targeting.
 * @param content - Serialized MDX content for the block.
 * @param headingAnchorId - Optional hash target id taken from the caller map.
 * @returns Wrapped block markup.
 */
function wrapWithBlockId(
  blockId: string,
  content: string,
  headingAnchorId?: string
): string {
  const anchorIdAttribute = headingAnchorId
    ? ` id="${headingAnchorId}" className="topic-anchor-target"`
    : '';

  return `<div data-block-id="${blockId}"${anchorIdAttribute}>\n\n${content}\n\n</div>`;
}

/**
 * Serialize EditorJS output into MDX strings consumed by `MdxRenderer`.
 *
 * Use this standalone utility to persist editor content without importing any
 * React components or EditorJS runtime code.
 *
 * @param editorData - EditorJS output data with a `blocks` array.
 * @param options - Optional serializer behavior such as heading anchor IDs.
 * @returns Serialized MDX string for storage or preview rendering.
 */
export function serializeToMdx(
  editorData: SerializeToMdxInput,
  options?: SerializeOptions
): string {
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
      ${serializeMdxStringProp('language', data.language || 'plaintext')}
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

        content = `<MarkdownAlerts ${serializeMdxStringProp('type', type)}>

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
        const text = data.text?.trim() || 'Details';
        const itemsCount = data.items ?? 0;
        const toggleBlocks = blocks.slice(index + 1, index + 1 + itemsCount);
        const inner = toggleBlocks
          .map((nestedBlock) =>
            serializeToMdx({ blocks: [nestedBlock] }, options)
          )
          .join('\n\n');

        content = `<MarkdownToggle ${serializeMdxStringProp('text', text)}>

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
          withHeadings:
            data.withHeadings === undefined ? true : data.withHeadings,
        };
        const columnWidths: number[] = [];

        tableData.content.forEach((row: string[]) => {
          row.forEach((cell: string, cellIndex: number) => {
            const normalizedCell = normalizeTableCell(cell);
            columnWidths[cellIndex] = Math.max(
              columnWidths[cellIndex] || 0,
              normalizedCell.length
            );
          });
        });

        const rows = tableData.content.map(
          (row: string[]) =>
            `| ${row
              .map((cell: string, cellIndex: number) =>
                normalizeTableCell(cell).padEnd(
                  columnWidths[cellIndex] ?? 0,
                  ' '
                )
              )
              .join(' | ')} |`
        );

        if (tableData.withHeadings && rows.length > 1) {
          const headerRow = rows[0] ?? '';
          const divider =
            '| ' +
            columnWidths.map((width) => '-'.repeat(width)).join(' | ') +
            ' |';

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
        content = `<MarkdownEmbed ${serializeMdxStringProp('embed', data.embed || '')} ${serializeMdxStringProp('caption', data.caption || '')} />`;
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
        const imageProps = [
          serializeMdxStringProp('url', file.url || ''),
          serializeMdxStringProp('caption', data.caption || ''),
          serializeMdxStringProp(
            'original_filename',
            file.original_filename || ''
          ),
          serializeMdxStringProp('public_id', file.public_id || ''),
          serializeMdxNumberProp('width', file.width),
          serializeMdxNumberProp('height', file.height),
        ]
          .filter((value): value is string => value !== null)
          .join('\n            ');
        content = `<MarkdownImage
            ${imageProps}
          />`;
        break;
      }

      default: {
        break;
      }
    }

    const headingAnchorId = options?.headingAnchorIdsByBlockId?.[blockId];

    result.push(wrapWithBlockId(blockId, content, headingAnchorId));
  }

  return sanitizeSerializedMdx(result.join('\n\n'));
}
