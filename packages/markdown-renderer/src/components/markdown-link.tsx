'use client';

import type {
  ComponentPropsWithoutRef,
  ReactElement,
  ReactNode,
} from 'react';
import type { Route } from 'next';

import {
  Children,
  cloneElement,
  isValidElement,
} from 'react';

import Link from 'next/link';
import { ExternalLink, SquareArrowOutUpRight } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@bubbles/ui/shadcn/tooltip';
import { cn } from '@bubbles/ui/lib/utils';

export type MarkdownLinkProps = ComponentPropsWithoutRef<'a'>;

type ElementWithChildrenProps = {
  children?: ReactNode;
};

/**
 * Guard anchor elements so nested anchors can be removed before render.
 *
 * @param node - Candidate node from the rendered children tree.
 * @returns Whether the node is a literal anchor element.
 */
function isAnchorElement(
  node: ReactNode,
): node is ReactElement<ElementWithChildrenProps, 'a'> {
  return isValidElement(node) && node.type === 'a';
}

/**
 * Recursively unwrap nested anchor descendants to avoid invalid anchor-in-anchor
 * markup coming from rich MDX content.
 *
 * @param node - React node tree to sanitize.
 * @returns Sanitized node tree with nested anchors removed.
 */
function stripNestedAnchors(node: ReactNode): ReactNode {
  if (isAnchorElement(node)) {
    return Children.map(node.props.children, stripNestedAnchors);
  }

  if (!isValidElement<ElementWithChildrenProps>(node)) {
    return node;
  }

  if (node.props.children === undefined) {
    return node;
  }

  return cloneElement(
    node,
    node.props,
    Children.map(node.props.children, stripNestedAnchors),
  );
}

/**
 * Render internal, hash, and external links with the tooltip behavior used in
 * the reference implementation.
 *
 * @param props - Native anchor props with optional href and rich children.
 * @returns Styled link or plain children when no href is provided.
 */
export function MarkdownLink({
  href,
  children,
  ...props
}: MarkdownLinkProps) {
  const className =
    'text-primary hover:text-primary/80 inline-block cursor-pointer font-bold underline underline-offset-4 transition-all duration-300 ease-in-out active:scale-95';
  const sanitizedChildren = Children.map(children, stripNestedAnchors);

  if (!href) {
    return <>{sanitizedChildren}</>;
  }

  if (href.startsWith('/')) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={href as Route}
              className={cn(className, 'touch-hitbox')}
              {...props}>
              {sanitizedChildren}
              <SquareArrowOutUpRight className="ml-0.5 inline-block size-4" />
            </Link>
          }
        />
        <TooltipContent className="TooltipContent z-1001 max-w-[20rem] font-bold text-pretty md:max-w-full">
          {href === '/' ? 'Zum Vault-Eingang' : `Navigiere zu ${href}`}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (href.startsWith('#')) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <a href={href} className={cn(className, 'touch-hitbox')} {...props}>
              {sanitizedChildren}
            </a>
          }
        />
        <TooltipContent className="TooltipContent z-1001 max-w-[20rem] font-bold text-pretty md:max-w-full">
          {`Scroll zur ${href} Sektion`}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(className, 'touch-hitbox')}
            {...props}>
            {sanitizedChildren}
            <ExternalLink className="ml-0.5 inline-block size-4" />
          </a>
        }
      />
      <TooltipContent className="TooltipContent z-1001 max-w-[20rem] font-bold text-pretty md:max-w-full">
        {`Oeffne '${href}' in einem neuen Tab`}
      </TooltipContent>
    </Tooltip>
  );
}
