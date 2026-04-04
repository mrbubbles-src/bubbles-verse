import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { logoutUser } from './auth';
import { redirect } from 'next/navigation';
import { TEditorJsListItem } from '@/types/types';
import React, { ReactNode } from 'react';
import VaultLink from '@/components/layout/vault/vault-components/vault-link';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const handleLogout = async () => {
  try {
    const res = await logoutUser();
    const data = await res?.json();
    if (data?.message === 'Logout erfolgreich') {
      redirect('/');
    }
  } catch (error) {
    console.error(error);
  }
};

export const transformAvatar = (src: string) => {
  return src.replace(
    '/upload/',
    '/upload/c_fill,g_face,w_160,h_160,q_auto,f_auto/',
  );
};

const escapeHtmlAttr = (value: string): string => {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
};

export const replaceLinksWithVaultLinks = (text: string): string => {
  return text.replace(
    /<a\s+href=["']([^"']+)["']>(.*?)<\/a>/g,
    (_, href, content) =>
      `<VaultLink href="${escapeHtmlAttr(href)}">${content}</VaultLink>`,
  );
};

export const replaceChecklistLinksWithVaultLinks = (
  text: string,
): ReactNode[] => {
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

    parts.push(React.createElement(VaultLink, { key: index, href }, content));
    lastIndex = index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

export const renderListItems = (
  items: TEditorJsListItem[],
  style: 'ordered' | 'unordered' | 'checklist',
  depth = 0,
): string => {
  return items
    .map((item, idx) => {
      let bullet: string;
      if (style === 'ordered') {
        bullet = `${idx + 1}.`;
      } else if (style === 'unordered') {
        bullet = '-';
      } else {
        const checked = item.meta?.checked ?? false;
        bullet = checked ? '- [x]' : '- [ ]';
      }
      const content = replaceLinksWithVaultLinks(item.content);

      const indentPerLevel = 4;
      const prefix = ' '.repeat(indentPerLevel * depth);
      const line = `${prefix}${bullet} ${content}`;

      const children =
        item.items && item.items.length
          ? `\n${renderListItems(item.items, style, depth + 1)}`
          : '';

      return `${line}${children}`;
    })
    .join('\n');
};
