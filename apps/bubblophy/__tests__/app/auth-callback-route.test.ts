import { NextRequest } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/auth/callback/route';

const exchangeCodeForSessionMock = vi.fn();
const getUserMock = vi.fn();
const getPublicBubblophyEnvMock = vi.fn();
const getAllowedBubblophySessionForUserMock = vi.fn();

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();

  return {
    ...actual,
    connection: vi.fn(async () => undefined),
  };
});

vi.mock('@/lib/env', () => ({
  getPublicBubblophyEnv: () => getPublicBubblophyEnvMock(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createBubblophyServerSupabaseClient: async () => ({
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
      getUser: getUserMock,
    },
  }),
}));

vi.mock('@/lib/auth/session', () => ({
  getAllowedBubblophySessionForUser: (user: unknown) =>
    getAllowedBubblophySessionForUserMock(user),
}));

describe('GET /auth/callback', () => {
  beforeEach(() => {
    exchangeCodeForSessionMock.mockReset();
    getUserMock.mockReset();
    getPublicBubblophyEnvMock.mockReset();
    getAllowedBubblophySessionForUserMock.mockReset();
    getAllowedBubblophySessionForUserMock.mockResolvedValue({
      authUserId: 'user-id',
      email: 'owner@example.test',
      user: {
        email: 'owner@example.test',
      },
    });
  });

  it('exchanges the auth code and redirects allowed users to a safe next path', async () => {
    getPublicBubblophyEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: 'http://bubblophy.mrbubbles.test:3005',
    });
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: {
        user: {
          email: 'Owner@Example.Test',
        },
      },
    });

    const response = await GET(
      new NextRequest(
        'http://bubblophy.mrbubbles.test:3005/auth/callback?code=test-code&next=/issues?status=ready'
      )
    );

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('test-code');
    expect(getUserMock).toHaveBeenCalled();
    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/issues?status=ready'
    );
  });

  it('returns to the exact OAuth consent request after human login', async () => {
    getPublicBubblophyEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: 'http://bubblophy.mrbubbles.test:3005',
    });
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: { user: { email: 'owner@example.test' } },
    });

    const response = await GET(
      new NextRequest(
        'http://bubblophy.mrbubbles.test:3005/auth/callback?code=test-code&next=%2Foauth%2Fconsent%3Fauthorization_id%3Dauthorization-request-1'
      )
    );

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/oauth/consent?authorization_id=authorization-request-1'
    );
  });

  it('falls back to home when callback next is unsafe', async () => {
    getPublicBubblophyEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: 'http://bubblophy.mrbubbles.test:3005',
    });
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: {
        user: {
          email: 'owner@example.test',
        },
      },
    });

    const response = await GET(
      new NextRequest(
        'http://bubblophy.mrbubbles.test:3005/auth/callback?code=test-code&next=https://evil.test'
      )
    );

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/'
    );
  });

  it('keeps callback redirects on the Bubblophy host when env points to dashboard', async () => {
    getPublicBubblophyEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: 'http://dashboard.mrbubbles.test:3004',
    });
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: {
        user: {
          email: 'owner@example.test',
        },
      },
    });

    const response = await GET(
      new NextRequest(
        'http://bubblophy.mrbubbles.test:3005/auth/callback?code=test-code&next=/issues?status=ready'
      )
    );

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/issues?status=ready'
    );
  });

  it('does not trust arbitrary callback hosts when env is valid', async () => {
    getPublicBubblophyEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: 'http://bubblophy.mrbubbles.test:3005',
    });
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: {
        user: {
          email: 'owner@example.test',
        },
      },
    });

    const response = await GET(
      new NextRequest('http://evil.test/auth/callback?code=test-code&next=/')
    );

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/'
    );
  });

  it('logs out denied users after a successful code exchange', async () => {
    getAllowedBubblophySessionForUserMock.mockResolvedValue(null);
    getPublicBubblophyEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: 'http://bubblophy.mrbubbles.test:3005',
    });
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: {
        user: {
          email: 'stranger@example.test',
        },
      },
    });

    const response = await GET(
      new NextRequest(
        'http://bubblophy.mrbubbles.test:3005/auth/callback?code=test-code'
      )
    );

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/auth/logout?next=%2Flogin%3Ferror%3Daccess_denied'
    );
  });

  it('redirects back to login when the auth code is missing', async () => {
    getPublicBubblophyEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: 'http://bubblophy.mrbubbles.test:3005',
    });

    const response = await GET(
      new NextRequest('http://bubblophy.mrbubbles.test:3005/auth/callback')
    );

    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
    expect(getUserMock).not.toHaveBeenCalled();
    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/login?error=server_error'
    );
  });

  it('redirects back to login when the code exchange fails', async () => {
    getPublicBubblophyEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: 'http://bubblophy.mrbubbles.test:3005',
    });
    exchangeCodeForSessionMock.mockResolvedValue({
      error: new Error('exchange failed'),
    });

    const response = await GET(
      new NextRequest(
        'http://bubblophy.mrbubbles.test:3005/auth/callback?code=test-code'
      )
    );

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/login?error=server_error'
    );
    expect(getUserMock).not.toHaveBeenCalled();
  });
});
