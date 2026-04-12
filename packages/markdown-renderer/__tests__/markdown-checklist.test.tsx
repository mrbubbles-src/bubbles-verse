import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MarkdownChecklist } from '../src';

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

describe('MarkdownChecklist', () => {
  it('renders nested readonly checklist items and markdown links', () => {
    const { container } = render(
      <MarkdownChecklist
        items={[
          {
            content: 'Read <a href="/modules/foo">Module</a> next',
            meta: { checked: true },
            items: [
              {
                content: 'Child item',
                meta: { checked: false },
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText('Module')).toBeInTheDocument();
    expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/modules/foo');
  });
});
