import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BubblophyLoginGate } from '@/app/login/page';

const getOptionalBubblophySessionMock = vi.fn();
const redirectMock = vi.fn((location: string) => {
  throw new Error(`NEXT_REDIRECT:${location}`);
});

vi.mock('next/navigation', () => ({
  redirect: (location: string) => redirectMock(location),
}));

vi.mock('next/server', () => ({
  connection: vi.fn(async () => undefined),
}));

vi.mock('@/lib/auth/session', () => ({
  getOptionalBubblophySession: () => getOptionalBubblophySessionMock(),
  isDeniedBubblophySessionResult: (result: { status: string }) =>
    result.status === 'denied',
}));

beforeEach(() => {
  getOptionalBubblophySessionMock.mockReset();
  redirectMock.mockClear();
});

describe('Bubblophy login gate', () => {
  it('lets an authenticated invitee resume only the exact acceptance path', async () => {
    getOptionalBubblophySessionMock.mockResolvedValue({
      status: 'denied',
      user: { id: 'user_invitee' },
    });

    await expect(
      BubblophyLoginGate({
        searchParams: Promise.resolve({ next: '/invitations/accept' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT:/invitations/accept');
    expect(redirectMock).toHaveBeenCalledWith('/invitations/accept');
  });

  it('keeps normal denied sessions behind the existing access gate', async () => {
    getOptionalBubblophySessionMock.mockResolvedValue({
      status: 'denied',
      user: { id: 'user_denied' },
    });

    await expect(
      BubblophyLoginGate({
        searchParams: Promise.resolve({ next: '/' }),
      })
    ).rejects.toThrow(
      'NEXT_REDIRECT:/auth/logout?next=/login?error=access_denied'
    );
  });

  it('does not treat a similar path as invitation acceptance', async () => {
    getOptionalBubblophySessionMock.mockResolvedValue({
      status: 'denied',
      user: { id: 'user_denied' },
    });

    await expect(
      BubblophyLoginGate({
        searchParams: Promise.resolve({ next: '/invitations/accept/extra' }),
      })
    ).rejects.toThrow(
      'NEXT_REDIRECT:/auth/logout?next=/login?error=access_denied'
    );
  });
});
