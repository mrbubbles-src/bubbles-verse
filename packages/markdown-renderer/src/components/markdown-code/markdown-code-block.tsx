'use client';

import { useEffect, useState } from 'react';

import { codeToHtml } from 'shiki';

import { CopyCode } from './copy-code';

export type MarkdownCodeBlockProps = {
  code: string;
  language?: string;
};

/**
 * Render syntax-highlighted code plus the shared copy action.
 *
 * @param props - Raw code plus optional language hint.
 * @returns Highlighted Shiki block aligned with the repo Catppuccin themes.
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

  return (
    <div className="bg-code-bg group relative overflow-x-auto rounded-md">
      <CopyCode
        code={code}
        className="absolute top-2 right-2 z-10 opacity-50 hover:opacity-100"
      />
      {html ? (
        <div
          className="[&>pre]:bg-code-bg [&_code]:font-code [&>pre]:m-0 [&>pre]:overflow-x-auto [&>pre]:rounded-md [&>pre]:p-4 [&>pre]:pr-14 [&>pre]:text-lg [&>pre]:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto rounded-md p-4 pr-14 text-lg leading-relaxed">
          <code className="font-code">{code}</code>
        </pre>
      )}
    </div>
  );
}
