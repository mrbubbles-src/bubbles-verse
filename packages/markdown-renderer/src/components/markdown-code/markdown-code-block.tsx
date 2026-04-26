'use client';

import { useEffect, useState } from 'react';

import { codeToHtml } from 'shiki';

import { CopyCode } from './copy-code';

export type MarkdownCodeBlockProps = {
  code: string;
  language?: string;
};

/**
 * Extract the syntax-highlighted code body from Shiki's generated wrapper.
 *
 * @param html - Complete Shiki HTML output.
 * @returns Highlighted code split into display lines.
 */
function getHighlightedLines(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;

  const highlightedCode = template.content.querySelector('code')?.innerHTML;

  return (highlightedCode ?? '').split('\n');
}

/**
 * Render syntax-highlighted code with line numbers and the shared copy action.
 *
 * @param props - Raw code plus optional language hint.
 * @returns Highlighted Shiki block aligned with the repo Catppuccin themes.
 */
export function MarkdownCodeBlock({
  code,
  language = 'plaintext',
}: MarkdownCodeBlockProps) {
  const [highlightedLines, setHighlightedLines] = useState<string[] | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const output = await codeToHtml(code, {
        lang: language,
        themes: {
          dark: 'catppuccin-mocha',
          light: 'catppuccin-latte',
        },
        defaultColor: 'light-dark()',
      });

      if (!cancelled) {
        setHighlightedLines(getHighlightedLines(output));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  return (
    <pre className="group relative my-4 overflow-x-auto rounded-md border-1 border-border/40 p-4 pr-14 text-lg leading-relaxed shadow-md">
      <CopyCode
        code={code}
        className="absolute top-2 right-2 z-10 opacity-50 hover:opacity-100"
      />
      <code className={`language-${language} font-code`}>
        {(highlightedLines ?? code.split('\n')).map((line, index) => (
          <span key={`${index}-${line}`} className="line flex">
            <span className="w-10 shrink-0 pr-4 text-right text-muted-foreground/70 select-none">
              {index + 1}
            </span>
            {highlightedLines ? (
              <span
                dangerouslySetInnerHTML={{
                  __html: line || '&nbsp;',
                }}
              />
            ) : (
              <span>{line || '\u00a0'}</span>
            )}
          </span>
        ))}
      </code>
    </pre>
  );
}
