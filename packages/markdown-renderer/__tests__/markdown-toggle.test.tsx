import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarkdownToggle } from '../src/components/markdown-toggle';

describe('MarkdownToggle', () => {
  it('styles open state using Base UI data attributes', () => {
    render(<MarkdownToggle text="Details">Hidden content</MarkdownToggle>);

    const trigger = screen.getByText('Details').closest('button');
    expect(trigger).toHaveClass('group-data-open/collapsible:text-primary');

    fireEvent.click(screen.getByText('Details'));

    const panel = screen
      .getByText('Hidden content')
      .closest('[data-slot="collapsible-content"]');
    const content = screen
      .getByText('Hidden content')
      .closest('[data-slot="card"]');

    expect(panel).toHaveClass(
      'h-(--collapsible-panel-height)',
      'data-ending-style:h-0',
      'data-starting-style:h-0'
    );
    expect(content).not.toHaveClass('opacity-0');
  });
});
