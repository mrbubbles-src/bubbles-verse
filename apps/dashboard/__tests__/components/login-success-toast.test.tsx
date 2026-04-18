import { DASHBOARD_LOGIN_ATTEMPT_STORAGE_KEY } from '@/lib/auth/login-feedback';

import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginSuccessToast } from '@/components/auth/login-success-toast';

const toastSuccessMock = vi.fn<(message: string) => void>();

vi.mock('@bubbles/ui/lib/sonner', () => ({
  toast: {
    success: (message: string) => toastSuccessMock(message),
  },
}));

describe('LoginSuccessToast', () => {
  beforeEach(() => {
    toastSuccessMock.mockReset();
    window.localStorage.clear();
  });

  it('confirms a completed login attempt exactly once', async () => {
    window.localStorage.setItem(DASHBOARD_LOGIN_ATTEMPT_STORAGE_KEY, 'true');

    render(<LoginSuccessToast />);

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith('Erfolgreich angemeldet.');
    });

    expect(
      window.localStorage.getItem(DASHBOARD_LOGIN_ATTEMPT_STORAGE_KEY)
    ).toBeNull();
  });

  it('stays silent without a prior login attempt flag', () => {
    render(<LoginSuccessToast />);

    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});
