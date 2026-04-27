'use client';

import { useEffect, useState } from 'react';

import { Separator } from '@bubbles/ui/components/shadcn/separator';
import { Badge } from '@bubbles/ui/shadcn/badge';
import { codeToHtml } from 'shiki';

import { CopyCode } from './copy-code';

export type MarkdownCodeBlockProps = {
  code: string;
  filename?: string;
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
 * Normalize the language label shown in the code block header.
 *
 * @param language - Optional language id from EditorJS or MDX.
 * @returns Human-readable label for the header badge.
 */
function formatLanguageLabel(language: string) {
  if (language === 'plaintext') {
    return 'Plain text';
  }

  return language.toUpperCase();
}

/**
 * Render syntax-highlighted code with line numbers and the shared copy action.
 *
 * @param props - Raw code plus optional language hint and file name.
 * @returns Highlighted Shiki block aligned with the repo Catppuccin themes.
 */
export function MarkdownCodeBlock({
  code,
  filename,
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

  const languageLabel = formatLanguageLabel(language);

  return (
    <figure className="group corner-tb-squircle my-4 overflow-hidden rounded-t-[30px] rounded-b-md border border-border/30 bg-ctp-latte-crust shadow-bubbles inset-shadow-bubbles dark:bg-ctp-mocha-crust">
      <figcaption className="flex min-h-13 items-center justify-between gap-3 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Badge
            variant="default"
            className="bg-primary/7 font-code text-primary uppercase">
            {languageLabel}
          </Badge>
          {filename ? (
            <>
              <Separator orientation="vertical" />
              <span className="truncate font-code text-sm text-primary">
                {filename}
              </span>
            </>
          ) : null}
        </div>
        <CopyCode code={code} className="opacity-70 hover:opacity-100" />
      </figcaption>
      <div className="px-1.5 pb-1.5">
        <pre className="overflow-x-auto rounded-t-none rounded-b-md border border-border/30 bg-ctp-latte-base text-lg leading-relaxed shadow-bubbles inset-shadow-bubbles dark:bg-ctp-mocha-base">
          <code className={`language-${language} block py-4 pr-4 font-code`}>
            {(highlightedLines ?? code.split('\n')).map((line, index) => (
              <span key={`${index}-${line}`} className="line flex">
                <span className="mr-4 w-12 shrink-0 border-r border-border/30 pr-4 text-right text-primary/80 select-none">
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
      </div>
    </figure>
  );
}
