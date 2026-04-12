import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MdxRenderer } from '../src';

vi.mock('next/image', () => ({
  default: ({
    alt,
    src,
    ...props
  }: {
    alt: string;
    src: string;
  }) => <img alt={alt} src={src} {...props} />,
}));

describe('MdxRenderer', () => {
  it('renders stored MDX with the package default component registry', async () => {
    render(
      <MdxRenderer
        content={'# Hello world\n\n<MarkdownAlerts type="info">Heads up</MarkdownAlerts>'}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Hello world' })).toBeInTheDocument();
    expect(await screen.findByText('Heads up')).toBeInTheDocument();
  });

  it('lets consumers override and extend MDX components', async () => {
    render(
      <MdxRenderer
        content={'# Hello override\n\n<Callout>Extended component</Callout>'}
        components={{
          h1: ({ children }: { children?: ReactNode }) => (
            <h1 data-testid="custom-heading">{children}</h1>
          ),
          Callout: ({ children }: { children?: ReactNode }) => (
            <aside data-testid="custom-callout">{children}</aside>
          ),
        }}
      />,
    );

    expect(await screen.findByTestId('custom-heading')).toHaveTextContent(
      'Hello override',
    );
    expect(await screen.findByTestId('custom-callout')).toHaveTextContent(
      'Extended component',
    );
  });

  it('renders a local error state when MDX compilation fails', async () => {
    render(<MdxRenderer content={'<Broken'} />);

    expect(await screen.findByText(/failed to render markdown/i)).toBeInTheDocument();
  });
});
