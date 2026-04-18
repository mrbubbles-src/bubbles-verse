import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from '@/app/login/page';

const signInWithOAuthMock = vi.fn();
const getPublicDashboardEnvMock = vi.fn();

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

describe('LoginPage', () => {
  beforeEach(() => {
    signInWithOAuthMock.mockReset();
    getPublicDashboardEnvMock.mockReset();
    getPublicDashboardEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: 'http://dashboard.mrbubbles.test:3004',
    });
    signInWithOAuthMock.mockResolvedValue({ error: null });
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
          redirectTo: 'http://dashboard.mrbubbles.test:3004/',
        },
      });
    });
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

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
