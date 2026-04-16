import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '../src/components/shadcn/sheet';

describe('SheetContent', () => {
  it('keeps the desktop right-side positioning classes intact', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Page info</SheetTitle>
        </SheetContent>
      </Sheet>
    );

    const content = document.querySelector('[data-slot="sheet-content"]');

    expect(content).toHaveClass('data-[side=right]:inset-y-0');
    expect(content).toHaveClass('data-[side=right]:right-0');
    expect(content).toHaveClass(
      'data-[side=right]:data-ending-style:translate-x-10'
    );
    expect(content).toHaveClass(
      'data-[side=right]:data-starting-style:translate-x-[2.5rem]'
    );
  });
});
