import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardRedirectFeedbackToast } from '@/components/feedback/dashboard-redirect-feedback-toast';

const toastMock = vi.fn<(message: string) => void>();

let mockedPathname = '/account';
let mockedSearch = 'access=created';

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
  useSearchParams: () => new URLSearchParams(mockedSearch),
}));

vi.mock('@bubbles/ui/lib/sonner', () => ({
  toast: (message: string) => toastMock(message),
}));

describe('DashboardRedirectFeedbackToast', () => {
  beforeEach(() => {
    toastMock.mockReset();
    mockedPathname = '/account';
    mockedSearch = 'access=created';
    window.history.replaceState(null, '', '/account?access=created');
  });

  it('shows the matching route toast and removes only the handled param', async () => {
    mockedSearch = 'access=created&tab=owners';
    window.history.replaceState(null, '', '/account?access=created&tab=owners');

    render(<DashboardRedirectFeedbackToast />);

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Zugang freigegeben.');
    });

    expect(window.location.pathname).toBe('/account');
    expect(window.location.search).toBe('?tab=owners');
  });

  it('stays silent when the current route has no supported feedback code', () => {
    mockedPathname = '/vault';
    mockedSearch = '';
    window.history.replaceState(null, '', '/vault');

    render(<DashboardRedirectFeedbackToast />);

    expect(toastMock).not.toHaveBeenCalled();
  });
});
