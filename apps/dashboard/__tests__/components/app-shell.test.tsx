import type { ComponentProps } from 'react';

import { ThemeProvider } from '@bubbles/theme';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AppShell from '@/components/app-shell';

const usePathnameMock = vi.fn();
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => ({
    push: pushMock,
  }),
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
    pushMock.mockReset();
    window.localStorage.clear();
  });

  it('renders the shared sidebar navigation and owner footer menu', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <AppShell
          user={{
            name: 'Mr Bubbles',
            email: 'dashboard@mrbubbles.test',
            dashboardHref: '/',
            settingsHref: '/profile',
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
      screen.getByRole('link', { name: 'Zugangsverwaltung' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Profil' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /mr bubbles/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('renders temporary Vault draft links below Einträge from local storage', async () => {
    usePathnameMock.mockReturnValue('/vault/entries/new');
    window.localStorage.setItem(
      'topic-editor-create-draft:vault-entry:create',
      '{}'
    );
    window.localStorage.setItem(
      'topic-editor-edit-draft:vault-entry:entry-123',
      '{}'
    );

    render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <AppShell
          user={{
            name: 'Mr Bubbles',
            email: 'dashboard@mrbubbles.test',
            dashboardHref: '/',
            settingsHref: '/profile',
            logoutHref: '/auth/logout',
          }}>
          <div>Draft content</div>
        </AppShell>
      </ThemeProvider>
    );

    expect(
      await screen.findByRole('link', { name: 'Neuer Eintrag (Draft)' })
    ).toHaveAttribute('href', '/vault/entries/new');
    expect(
      screen.getByRole('link', { name: 'Eintrag bearbeiten (Draft)' })
    ).toHaveAttribute('href', '/vault/entries/entry-123');
  });

  it('lets editors discard the current draft from the sidebar action', async () => {
    const user = userEvent.setup();

    usePathnameMock.mockReturnValue('/vault/entries/new');
    window.localStorage.setItem(
      'topic-editor-create-draft:vault-entry:create',
      '{}'
    );

    render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <AppShell
          user={{
            name: 'Mr Bubbles',
            email: 'dashboard@mrbubbles.test',
            dashboardHref: '/',
            settingsHref: '/profile',
            logoutHref: '/auth/logout',
          }}>
          <div>Draft content</div>
        </AppShell>
      </ThemeProvider>
    );

    await user.click(
      await screen.findByRole('button', { name: 'Draft verwerfen' })
    );

    expect(
      window.localStorage.getItem(
        'topic-editor-create-draft:vault-entry:create'
      )
    ).toBeNull();
    expect(pushMock).toHaveBeenCalledWith('/vault/entries');
  });
});
