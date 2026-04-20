import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MarkdownCodeBlock } from '../src/components/markdown-code/markdown-code-block';

vi.mock('shiki', () => ({
  codeToHtml: vi.fn(
    async () =>
      '<pre><code><span class="token keyword">const</span>\n<span class="token identifier">value</span></code></pre>'
  ),
}));

describe('MarkdownCodeBlock', () => {
  it('requests the repo-standard Catppuccin themes from Shiki', async () => {
    const { codeToHtml } = await import('shiki');

    render(<MarkdownCodeBlock code={'const value = 1;'} language="ts" />);

    await waitFor(() => {
      expect(codeToHtml).toHaveBeenCalledWith('const value = 1;', {
        lang: 'ts',
        themes: {
          dark: 'catppuccin-mocha',
          light: 'catppuccin-latte',
        },
      });
    });

    expect(screen.getByText('const')).toBeInTheDocument();
  });

  it('renders the highlighted Shiki subtree without rebuilding line spans', async () => {
    const { container } = render(
      <MarkdownCodeBlock code={'const value = 1;'} language="ts" />
    );

    await waitFor(() => {
      expect(container.querySelector('.token.keyword')).not.toBeNull();
    });

    expect(container.querySelector('.line')).toBeNull();
  });
});
