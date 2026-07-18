import type React from 'react';

import { BUBBLOPHY_LOGIN_ATTEMPT_STORAGE_KEY } from '@/lib/auth/login-feedback';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BubblophyLoginClient } from '@/app/login/login-client';

const signInWithOAuthMock = vi.fn();
const toastErrorMock = vi.fn<(message: string) => void>();

vi.mock('@/lib/supabase/client', () => ({
  createBubblophyBrowserSupabaseClient: () => ({
    auth: {
      signInWithOAuth: signInWithOAuthMock,
    },
  }),
}));

vi.mock('@bubbles/ui/lib/sonner', () => ({
  toast: {
    error: (message: string) => toastErrorMock(message),
  },
}));

vi.mock('@bubbles/ui/shadcn/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

describe('BubblophyLoginPanel', () => {
  beforeEach(() => {
    signInWithOAuthMock.mockReset();
    toastErrorMock.mockReset();
    signInWithOAuthMock.mockResolvedValue({ error: null });
    window.localStorage.clear();
    window.history.replaceState({}, '', '/login');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts GitHub OAuth with the configured Bubblophy callback and safe next path', async () => {
    window.history.replaceState({}, '', '/login?next=/issues?status=ready');

    render(<BubblophyLoginClient />);

    fireEvent.click(
      screen.getByRole('button', { name: /mit github anmelden/i })
    );

    await waitFor(() => {
      expect(signInWithOAuthMock).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=%2Fissues%3Fstatus%3Dready`,
        },
      });
    });

    expect(
      window.localStorage.getItem(BUBBLOPHY_LOGIN_ATTEMPT_STORAGE_KEY)
    ).toBe('true');
  });

  it('falls back to a safe callback next path for unsafe login URLs', async () => {
    window.history.replaceState(
      {},
      '',
      '/login?next=https://evil.test/dashboard'
    );

    render(<BubblophyLoginClient />);

    fireEvent.click(
      screen.getByRole('button', { name: /mit github anmelden/i })
    );

    await waitFor(() => {
      expect(signInWithOAuthMock).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=%2F`,
        },
      });
    });
  });

  it('keeps OAuth callback redirects on the current app origin', async () => {
    window.history.replaceState({}, '', '/login?next=/');

    render(<BubblophyLoginClient />);

    fireEvent.click(
      screen.getByRole('button', { name: /mit github anmelden/i })
    );

    await waitFor(() => {
      expect(signInWithOAuthMock).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=%2F`,
        },
      });
    });
  });

  it('shows URL auth errors inline without duplicating them as toasts', async () => {
    window.history.replaceState({}, '', '/login?error=access_denied');

    render(<BubblophyLoginClient />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Dieser User ist nicht autorisiert'
    );
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it('removes only the login error and preserves the OAuth consent return path', async () => {
    window.history.replaceState(
      {},
      '',
      '/login?next=%2Foauth%2Fconsent%3Fauthorization_id%3Dauthorization-request-1&error=server_error'
    );

    render(<BubblophyLoginClient />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
    expect(window.location.search).toBe(
      '?next=%2Foauth%2Fconsent%3Fauthorization_id%3Dauthorization-request-1'
    );
  });

  it('resets pending state when GitHub OAuth cannot start', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    signInWithOAuthMock.mockResolvedValue({
      error: new Error('OAuth failed'),
    });

    render(<BubblophyLoginClient />);

    fireEvent.click(
      screen.getByRole('button', { name: /mit github anmelden/i })
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mit github anmelden/i })
      ).toBeEnabled();
    });

    expect(
      window.localStorage.getItem(BUBBLOPHY_LOGIN_ATTEMPT_STORAGE_KEY)
    ).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Die GitHub-Anmeldung konnte nicht gestartet werden.'
    );
  });
});
