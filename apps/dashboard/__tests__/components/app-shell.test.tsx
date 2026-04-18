import type { ComponentProps } from 'react';

import { ThemeProvider } from '@bubbles/theme';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AppShell from '@/components/app-shell';

const usePathnameMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  default: (
    props: ComponentProps<'img'> & {
      src: string;
      alt: string;
      priority?: boolean;
    }
  ) => {
    const { alt, priority, src, ...imageProps } = props;

    void priority;

    return <span data-alt={alt} data-src={src} {...imageProps} />;
  },
}));

describe('AppShell', () => {
  beforeEach(() => {
    usePathnameMock.mockReturnValue('/');
  });

  it('renders the shared sidebar navigation and owner footer menu', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <AppShell
          user={{
            name: 'Mr Bubbles',
            email: 'dashboard@mrbubbles.test',
            dashboardHref: '/',
            settingsHref: '/account',
            logoutHref: '/auth/logout',
          }}>
          <div>Dashboard content</div>
        </AppShell>
      </ThemeProvider>
    );

    expect(
      screen.getAllByRole('link', { name: 'Dashboard' }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: /mr bubbles/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });
});
