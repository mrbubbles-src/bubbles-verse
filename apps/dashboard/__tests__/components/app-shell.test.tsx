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
    vi.spyOn(window, 'confirm').mockReturnValue(true);
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
      'editor-create-draft',
      JSON.stringify({ scope: 'vault-entry:create' })
    );
    window.localStorage.setItem(
      'editor-edit-draft',
      JSON.stringify({ scope: 'vault-entry:entry-123' })
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
    ).toHaveAttribute('href', '/vault/entries/new?draft=resume');
    expect(
      screen.getByRole('link', { name: 'Eintrag bearbeiten (Draft)' })
    ).toHaveAttribute('href', '/vault/entries/entry-123');
    expect(screen.getByRole('button', { name: 'Entwürfe' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('prefers the active edit route over an older stored edit draft', async () => {
    usePathnameMock.mockReturnValue('/vault/entries/entry-999');
    window.localStorage.setItem(
      'editor-edit-draft',
      JSON.stringify({ scope: 'vault-entry:entry-123' })
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
      screen.getByRole('link', { name: 'Eintrag bearbeiten (Draft)' })
    ).toHaveAttribute('href', '/vault/entries/entry-999');
    expect(
      document.querySelector('a[href="/vault/entries/entry-123"]')
    ).not.toBeInTheDocument();
  });

  it('lets editors discard the current draft from the sidebar action', async () => {
    const user = userEvent.setup();

    usePathnameMock.mockReturnValue('/vault/entries/new');
    window.localStorage.setItem(
      'editor-create-draft',
      JSON.stringify({ scope: 'vault-entry:create' })
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
    expect(screen.getByText('Entwurf verwerfen?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(
      screen.getByText('Wirklich endgültig verwerfen?')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ja, verwerfen' }));

    expect(window.localStorage.getItem('editor-create-draft')).toBeNull();
    expect(pushMock).toHaveBeenCalledWith('/vault/entries');
  });

  it('keeps the draft when the discard confirmation is cancelled', async () => {
    const user = userEvent.setup();

    usePathnameMock.mockReturnValue('/vault/entries/new');
    window.localStorage.setItem(
      'editor-create-draft',
      JSON.stringify({ scope: 'vault-entry:create' })
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
    expect(screen.getByText('Entwurf verwerfen?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(
      screen.getByText('Wirklich endgültig verwerfen?')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Zurück' }));

    expect(window.localStorage.getItem('editor-create-draft')).toBe(
      JSON.stringify({ scope: 'vault-entry:create' })
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
