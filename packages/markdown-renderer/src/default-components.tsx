import type { ComponentPropsWithoutRef } from 'react';

import { Suspense } from 'react';

import type { MarkdownImageProps } from './components/markdown-image/markdown-image';
import type { MarkdownLinkProps } from './components/markdown-link';
import { MarkdownAlerts } from './components/markdown-alerts';
import { MarkdownChecklist } from './components/markdown-checklist';
import { MarkdownCodeBlock } from './components/markdown-code/markdown-code-block';
import { MarkdownEmbed } from './components/markdown-embed';
import { MarkdownImage } from './components/markdown-image/markdown-image';
import { MarkdownPreviewImage } from './components/markdown-image/markdown-preview-image';
import { MarkdownLink } from './components/markdown-link';
import { MarkdownToggle } from './components/markdown-toggle';

type HeadingProps = ComponentPropsWithoutRef<'h1'>;
type ParagraphProps = ComponentPropsWithoutRef<'p'>;
type ListProps = ComponentPropsWithoutRef<'ul'>;
type ListItemProps = ComponentPropsWithoutRef<'li'>;
type BlockquoteProps = ComponentPropsWithoutRef<'blockquote'>;
type DividerProps = ComponentPropsWithoutRef<'hr'>;

/**
 * Route native MDX anchors through `MarkdownLink` while keeping the safe
 * no-href fallback from the reference implementation.
 *
 * @param props - Native anchor props from the MDX runtime.
 * @returns Styled markdown link or plain children without an href.
 */
function MdxAnchor({ href, children, ...props }: MarkdownLinkProps) {
  if (!href) {
    return <>{children}</>;
  }

  return (
    <MarkdownLink href={href} {...props}>
      {children}
    </MarkdownLink>
  );
}

/**
 * Export the reference MDX component registry for app-level
 * `mdx-components.tsx` integration.
 */
export const defaultComponents = {
  h1: (props: HeadingProps) => (
    <h1 className="mb-4 text-4xl leading-tight text-pretty" {...props} />
  ),
  h2: (props: HeadingProps) => (
    <h2 className="my-4 text-2xl leading-tight text-pretty" {...props} />
  ),
  h3: (props: HeadingProps) => (
    <h3 className="my-4 text-xl leading-tight text-pretty" {...props} />
  ),
  p: (props: ParagraphProps) => (
    <p className="my-4 text-lg leading-relaxed text-pretty" {...props} />
  ),
  ol: (props: ListProps) => (
    <ol
      className="ml-2 list-decimal space-y-1 pl-5 [&_ol]:mt-1.5 [&_ol]:list-[lower-alpha] [&_ol_ol]:list-[lower-roman] [&_ol_ol_ol]:list-[lower-greek] [&_ul]:mt-1.5 [&_ul]:list-[circle] [&_ul_ul]:list-disc [&_ul_ul_ul]:list-[square]"
      {...props}
    />
  ),
  ul: (props: ListProps) => (
    <ul
      className="ml-2 list-disc space-y-1 pl-5 [&_ol]:mt-1.5 [&_ol]:list-[lower-alpha] [&_ol_ol]:list-[lower-roman] [&_ol_ol_ol]:list-[lower-greek] [&_ul]:mt-1.5 [&_ul]:list-[circle] [&_ul_ul]:list-disc [&_ul_ul_ul]:list-[square]"
      {...props}
    />
  ),
  li: (props: ListItemProps) => (
    <li className="pl-1 text-lg leading-snug" {...props} />
  ),
  em: (props: ComponentPropsWithoutRef<'em'>) => (
    <em className="font-medium" {...props} />
  ),
  strong: (props: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-bold" {...props} />
  ),
  hr: (props: DividerProps) => (
    <hr className="m-4 border-2 border-muted" {...props} />
  ),
  a: MdxAnchor,
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <table
      className="w-full place-self-center text-sm lg:w-[58.95rem] lg:text-lg [&_td]:border-b [&_td]:px-4 [&_td]:py-2 [&_th]:border-b [&_th]:bg-sidebar [&_th]:px-4 [&_th]:py-2 [&_tr]:text-center [&_tr:nth-child(even)]:bg-sidebar/80"
      {...props}
    />
  ),
  blockquote: (props: BlockquoteProps) => (
    <blockquote
      className="my-4 border-l-4 pl-5 text-muted-foreground italic dark:border-primary"
      {...props}
    />
  ),
  MarkdownAlerts,
  MarkdownCodeBlock,
  MarkdownChecklist,
  MarkdownEmbed,
  MarkdownImage: (props: MarkdownImageProps) => (
    <Suspense
      fallback={
        <div className="mx-auto my-4 h-48 w-full max-w-3xl animate-pulse rounded-md bg-muted" />
      }>
      <MarkdownImage {...props} />
    </Suspense>
  ),
  MarkdownLink,
  MarkdownToggle,
};

/**
 * Export a client-safe MDX component registry for live editor previews.
 *
 * This mirrors `defaultComponents`, but replaces async server-only image
 * rendering with a synchronous client-safe image component.
 */
export const previewComponents = {
  ...defaultComponents,
  MarkdownImage: (props: MarkdownImageProps) => (
    <MarkdownPreviewImage {...props} />
  ),
};

/**
 * Return the package-provided MDX component registry for Next.js
 * `mdx-components.tsx` files.
 */
export function useMDXComponents() {
  return defaultComponents;
}
