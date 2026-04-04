import { TEditorJsListItem } from '@/types/types';
import { renderListItems, replaceLinksWithVaultLinks } from '@/lib/utils';
import { TEditorBlock } from '@/types/types';

const ConvertEditorJsToMDX = (editorData: {
  blocks: TEditorBlock[];
}): string => {
  if (!editorData?.blocks || !Array.isArray(editorData.blocks)) {
    return '';
  }
  const resultArray: string[] = [];
  for (let i = 0; i < editorData.blocks.length; i++) {
    const block = editorData.blocks[i];
    if (!block) {
      continue;
    }

    switch (block.type) {
      case 'paragraph': {
        const data = block.data as { text: string };
        resultArray.push(replaceLinksWithVaultLinks(data.text));
        break;
      }
      case 'header': {
        const data = block.data as { text: string; level: number };
        resultArray.push(
          `${'#'.repeat(data.level)} ${replaceLinksWithVaultLinks(data.text)}`,
        );
        break;
      }
      case 'list': {
        const data = block.data as {
          style: 'ordered' | 'unordered' | 'checklist';
          items: TEditorJsListItem[];
        };

        if (data.style === 'checklist') {
          resultArray.push(
            `<VaultChecklist items={${JSON.stringify(data.items)}} />`,
          );
        } else {
          resultArray.push(renderListItems(data.items, data.style));
        }
        break;
      }
      case 'code': {
        const data = block.data as {
          code: string;
          language?: string;
        };

        resultArray.push(
          `<VaultCodeBlock
            code={\`${data.code}\`}
            language="${data.language || 'plaintext'}"
          />`,
        );
        break;
      }
      case 'quote': {
        const data = block.data as { text: string; caption?: string };
        resultArray.push(
          `> ${replaceLinksWithVaultLinks(data.text)}\n>\n> — ${replaceLinksWithVaultLinks(data.caption || '')}`,
        );
        break;
      }
      case 'alert': {
        const data = block.data as {
          type?: 'info' | 'success' | 'warning' | 'danger';
          message: string;
        };
        const type = data.type || 'info';

        resultArray.push(
          `<VaultAlerts type="${type}">${replaceLinksWithVaultLinks(data.message)}</VaultAlerts>`,
        );
        break;
      }
      case 'delimiter': {
        resultArray.push(`---`);
        break;
      }
      case 'toggle': {
        const data = block.data as { text?: string; items?: number };
        const text = data.text?.trim() || 'Details';
        const itemsCount = data.items ?? 0;
        const toggleBlocks = editorData.blocks.slice(i + 1, i + 1 + itemsCount);
        const inner = toggleBlocks
          .map((b) => ConvertEditorJsToMDX({ blocks: [b] }))
          .join('\n\n');
        resultArray.push(
          `<VaultDetailsToggle text="${text}">\n\n${replaceLinksWithVaultLinks(inner)}\n\n</VaultDetailsToggle>`,
        );
        i += itemsCount;
        break;
      }
      case 'table': {
        const data = block.data as {
          withHeadings?: boolean;
          content: string[][];
        };
        const colWidths: number[] = [];
        data.content.forEach((row) => {
          row.forEach((cell, colIdx) => {
            const len = cell.trim().length;
            colWidths[colIdx] = Math.max(colWidths[colIdx] || 0, len);
          });
        });
        const padCell = (cell: string, idx: number) =>
          cell.trim().padEnd(colWidths[idx] ?? 0, ' ');
        const rows = data.content.map(
          (row) => `| ${row.map(padCell).join(' | ')} |`,
        );
        if (data.withHeadings && rows.length > 1) {
          const header = rows[0] ?? '';
          const divider =
            '| ' + colWidths.map((w) => '-'.repeat(w)).join(' | ') + ' |';
          const bodyRows = rows.slice(1);
          resultArray.push(
            [
              replaceLinksWithVaultLinks(header),
              divider,
              ...bodyRows.map(replaceLinksWithVaultLinks),
            ].join('\n'),
          );
        } else {
          resultArray.push(replaceLinksWithVaultLinks(rows.join('\n')));
        }
        break;
      }
      case 'embed': {
        const data = block.data as {
          embed?: string;
          caption?: string;
        };
        resultArray.push(
          `<VaultEmbed embed="${data.embed ?? ''}" caption="${data.caption ?? ''}"  />`,
        );
        break;
      }
      case 'image': {
        const data = block.data as {
          file?: {
            url?: string;
            original_filename?: string;
            public_id?: string;
            width?: number;
            height?: number;
          };
          caption?: string;
        };
        resultArray.push(
          `<VaultImage
            url="${data.file?.url ?? ''}"
            caption="${data.caption || ''}"
            original_filename="${data.file?.original_filename || ''}"
            public_id="${data.file?.public_id ?? ''}"
            width="${data.file?.width || 0}"
            height="${data.file?.height || 0}"
          />`,
        );
        break;
      }
    }
  }
  const result = resultArray.join('\n\n');
  return result;
};
export default ConvertEditorJsToMDX;
