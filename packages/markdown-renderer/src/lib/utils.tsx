import type { ReactNode } from 'react';

import { createElement } from 'react';

import { MarkdownLink } from '../components/markdown-link';

/**
 * Replace serialized anchor tags inside checklist text with `MarkdownLink`
 * elements so checklist content keeps the reference link behavior.
 *
 * @param text - Checklist HTML text containing zero or more anchor tags.
 * @returns Mixed text and React nodes ready for checklist rendering.
 */
export function replaceChecklistLinksWithMarkdownLinks(
  text: string,
): ReactNode[] {
  const parts: ReactNode[] = [];
  const linkRegex = /<a\s+href=["']([^"']+)["']>(.*?)<\/a>/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, href, content] = match;
    const index = match.index;

    if (lastIndex < index) {
      parts.push(text.slice(lastIndex, index));
    }

    parts.push(createElement(MarkdownLink, { key: index, href }, content));
    lastIndex = index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
