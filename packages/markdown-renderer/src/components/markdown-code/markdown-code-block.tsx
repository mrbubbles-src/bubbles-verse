'use client';

import { useEffect, useState } from 'react';

import { codeToHtml } from 'shiki';

import { CopyCode } from './copy-code';

export type MarkdownCodeBlockProps = {
  code: string;
  language?: string;
};

/**
 * Render syntax-highlighted code with line numbers and the reference copy
 * action.
 *
 * @param props - Raw code plus optional language hint.
 * @returns Highlighted code block aligned with the repo Catppuccin themes.
 */
export function MarkdownCodeBlock({
  code,
  language = 'plaintext',
}: MarkdownCodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const output = await codeToHtml(code, {
        lang: language,
        themes: {
          dark: 'catppuccin-mocha',
          light: 'catppuccin-latte',
        },
      });

      if (!cancelled) {
        setHtml(output);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const match = html?.match(/<code[^>]*>([\s\S]*?)<\/code>/);
  const raw = match?.[1] ?? null;
  const lines = (raw ?? code).split('\n');

  return (
    <pre className="bg-code-bg group relative overflow-x-auto rounded-md p-4 text-lg leading-relaxed">
      <CopyCode
        code={code}
        className="absolute top-2 right-2 z-10 opacity-50 hover:opacity-100"
      />
      <code className="language-js font-code">
        {lines.map((line, index) => (
          <span key={`${index}-${line.length}`} className="line flex">
            <span className="pr-4 text-gray-500 select-none">
              {index + 1}
            </span>
            {raw ? (
              <span dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
            ) : (
              <span>{line || '\u00A0'}</span>
            )}
          </span>
        ))}
      </code>
    </pre>
  );
}
