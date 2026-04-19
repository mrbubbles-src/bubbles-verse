import type { EditorJsListItem } from '../types/serializer';
import { escapeMdxBraces } from '../serializer/security';

export { escapeMdxBraces } from '../serializer/security';

/**
 * Replace serialized anchor tags with the shared markdown link component.
 *
 * @param text - HTML-like content emitted by EditorJS inline tools.
 * @returns MDX-safe string using `MarkdownLink`.
 */
export function replaceLinksWithMarkdownLinks(text: string): string {
  return text.replace(
    /<a\s+href=["']([^"']+)["']>(.*?)<\/a>/g,
    (_, href, content) =>
      `<MarkdownLink href="${href}">${content}</MarkdownLink>`
  );
}

/**
 * Render nested EditorJS list items as Markdown/GFM list text.
 *
 * @param items - List items from the EditorJS list tool.
 * @param style - Ordered, unordered, or checklist list mode.
 * @param depth - Current nesting depth.
 * @returns Markdown list string preserving nesting.
 */
export function renderListItems(
  items: EditorJsListItem[],
  style: 'checklist' | 'ordered' | 'unordered',
  depth = 0
): string {
  return items
    .map((item, index) => {
      let bullet = '-';

      if (style === 'ordered') {
        bullet = `${index + 1}.`;
      } else if (style === 'checklist') {
        bullet = item.meta?.checked ? '- [x]' : '- [ ]';
      }

      const content = replaceLinksWithMarkdownLinks(
        escapeMdxBraces(item.content)
      );
      const prefix = ' '.repeat(depth * 4);
      const line = `${prefix}${bullet} ${content}`;
      const children =
        item.items && item.items.length > 0
          ? `\n${renderListItems(item.items, style, depth + 1)}`
          : '';

      return `${line}${children}`;
    })
    .join('\n');
}

/**
 * Normalize EditorJS alert HTML into plain MDX-safe text.
 *
 * @param raw - Raw alert message from the plugin payload.
 * @returns Cleaned alert content ready for MDX output.
 */
export function normalizeAlertMessage(raw: string): string {
  let sanitized = raw ?? '';

  sanitized = sanitized.replace(/&nbsp;/g, ' ');
  sanitized = sanitized.replace(/\sstyle=["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/<\/?span[^>]*>/gi, '');
  sanitized = sanitized.replace(
    /<div[^>]*data-empty=["']true["'][^>]*><br\s*\/?><\/div>/gi,
    '\n\n'
  );
  sanitized = sanitized.replace(/<br\b[^>]*\/?>/gi, '\n');
  sanitized = sanitized.replace(/<\/div>\s*<div[^>]*>/gi, '\n');
  sanitized = sanitized.replace(/<div[^>]*>/gi, '');
  sanitized = sanitized.replace(/<\/div>/gi, '');
  sanitized = sanitized.replace(/\r\n/g, '\n');
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  return sanitized.trim();
}
