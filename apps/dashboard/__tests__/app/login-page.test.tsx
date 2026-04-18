import { DASHBOARD_LOGIN_ATTEMPT_STORAGE_KEY } from '@/lib/auth/login-feedback';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from '@/app/login/page';

const signInWithOAuthMock = vi.fn();
const getPublicDashboardEnvMock = vi.fn();
const toastErrorMock = vi.fn<(message: string) => void>();
const replaceStateMock =
  vi.fn<
    (data: string | null, unused: string, url?: string | URL | null) => void
  >();

vi.mock('@/lib/env', () => ({
  getPublicDashboardEnv: () => getPublicDashboardEnvMock(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createDashboardBrowserSupabaseClient: () => ({
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

describe('LoginPage', () => {
  beforeEach(() => {
    signInWithOAuthMock.mockReset();
    getPublicDashboardEnvMock.mockReset();
    toastErrorMock.mockReset();
    replaceStateMock.mockReset();
    getPublicDashboardEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: 'http://dashboard.mrbubbles.test:3004',
    });
    signInWithOAuthMock.mockResolvedValue({ error: null });
    window.localStorage.clear();
    window.history.replaceState({}, '', '/login');
    vi.spyOn(window.history, 'replaceState').mockImplementation(
      replaceStateMock
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts GitHub OAuth with the configured dashboard redirect', async () => {
    render(<LoginPage />);

    fireEvent.click(
      screen.getByRole('button', { name: /mit github anmelden/i })
    );

    await waitFor(() => {
      expect(signInWithOAuthMock).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: 'http://dashboard.mrbubbles.test:3004/auth/callback',
        },
      });
    });

    expect(
      window.localStorage.getItem(DASHBOARD_LOGIN_ATTEMPT_STORAGE_KEY)
    ).toBe('true');
  });

  it('resets the pending state when the login bootstrap throws', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    getPublicDashboardEnvMock.mockImplementation(() => {
      throw new Error('missing env');
    });

    render(<LoginPage />);

    fireEvent.click(
      screen.getByRole('button', { name: /mit github anmelden/i })
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mit github anmelden/i })
      ).toBeEnabled();
    });

    expect(
      window.localStorage.getItem(DASHBOARD_LOGIN_ATTEMPT_STORAGE_KEY)
    ).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Die GitHub-Anmeldung konnte nicht gestartet werden.'
    );

    consoleErrorSpy.mockRestore();
  });

  it('shows a neutral unauthorized message from the OAuth hash fragment', async () => {
    window.location.hash =
      '#error=access_denied&error_description=GitHub-Konto+nicht+erlaubt.&sb=';

    render(<LoginPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Dieser User ist nicht autorisiert, das Dashboard zu betreten. Wenn du denkst, das ist ein Fehler, melde dich bitte beim Admin.'
    );
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Dieser User ist nicht autorisiert, das Dashboard zu betreten. Wenn du denkst, das ist ein Fehler, melde dich bitte beim Admin.'
    );
    expect(replaceStateMock).toHaveBeenCalledWith(null, '', '/login');
  });
});
