import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../src/components/shadcn/dropdown-menu';

describe('DropdownMenu destructive items', () => {
  it('does not override destructive descendants back to accent foreground', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuItem variant="destructive">Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const content = document.querySelector(
      '[data-slot="dropdown-menu-content"]'
    );

    expect(content).not.toHaveClass(
      '**:data-[variant=destructive]:text-accent-foreground!'
    );
    expect(content).not.toHaveClass(
      '**:data-[variant=destructive]:**:text-accent-foreground!'
    );
  });

  it('uses foreground text for normal hover and focus states', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <DropdownMenuItem>Dashboard</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const item = document.querySelector('[data-slot="dropdown-menu-item"]');

    expect(item).toHaveClass('focus:bg-foreground/10');
    expect(item).toHaveClass('focus:text-foreground');
    expect(item).toHaveClass(
      'not-data-[variant=destructive]:focus:**:text-foreground'
    );
  });
});
