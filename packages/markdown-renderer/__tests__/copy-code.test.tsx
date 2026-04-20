import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CopyCode } from '../src/components/markdown-code/copy-code';

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

describe('CopyCode', () => {
  it('renders the trigger as a button without an outer span wrapper', () => {
    const { container } = render(
      <CopyCode code={'const value = 1;'} className="top-2 right-2" />
    );

    expect(screen.getByRole('button', { name: 'Kopiere Code' })).toBeVisible();
    expect(container.firstElementChild?.tagName).toBe('BUTTON');
  });
});
