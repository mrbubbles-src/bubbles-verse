import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MarkdownImage } from '../src/components/markdown-image/markdown-image';

vi.mock('next-cloudinary', () => ({
  CldImage: ({
    alt,
    src,
    ...props
  }: {
    alt: string;
    src: string;
  }) => <img alt={alt} src={src} {...props} />,
  getCldImageUrl: () => 'https://cdn.example/preview.png',
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MarkdownImage', () => {
  it('renders the full-size image link as a plain external anchor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
        type: 'image/png',
      })),
    );

    render(
      await MarkdownImage({
        url: 'https://images.example/full.png',
        caption: 'Diagram',
        original_filename: 'diagram.png',
        public_id: 'vault/diagram',
        width: 1280,
        height: 720,
      }),
    );

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://images.example/full.png',
    );
    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('img', { name: 'Diagram' })).toBeInTheDocument();
  });
});
