import type { ReactNode } from 'react';

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MarkdownLink } from '../src';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@bubbles/ui/shadcn/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({
    children,
    render,
  }: {
    children?: ReactNode;
    render?: ReactNode;
  }) => <>{render ?? children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe('MarkdownLink', () => {
  it('strips nested anchors for external links', () => {
    const { container } = render(
      <MarkdownLink href="https://example.com">
        <a href="https://nested.example.com">External docs</a>
      </MarkdownLink>,
    );

    const anchors = container.querySelectorAll('a');

    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.getAttribute('href')).toBe('https://example.com');
    expect(anchors[0]?.textContent).toContain('External docs');
  });

  it('renders plain children when href is missing', () => {
    const { container } = render(
      <MarkdownLink href={undefined}>No target</MarkdownLink>,
    );

    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toContain('No target');
  });
});
