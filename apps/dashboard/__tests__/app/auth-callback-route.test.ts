import { NextRequest } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/auth/callback/route';

const exchangeCodeForSessionMock = vi.fn();
const getPublicDashboardEnvMock = vi.fn();

vi.mock('@/lib/env', () => ({
  getPublicDashboardEnv: () => getPublicDashboardEnvMock(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createDashboardServerSupabaseClient: async () => ({
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
    },
  }),
}));

describe('GET /auth/callback', () => {
  beforeEach(() => {
    exchangeCodeForSessionMock.mockReset();
    getPublicDashboardEnvMock.mockReset();
  });

  it('exchanges the auth code and redirects to the dashboard home', async () => {
    getPublicDashboardEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: 'http://dashboard.mrbubbles.test:3004',
    });
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });

    const response = await GET(
      new NextRequest(
        'http://dashboard.mrbubbles.test:3004/auth/callback?code=test-code'
      )
    );

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('test-code');
    expect(response.headers.get('location')).toBe(
      'http://dashboard.mrbubbles.test:3004/'
    );
  });

  it('redirects back to login when the auth code is missing', async () => {
    getPublicDashboardEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: 'http://dashboard.mrbubbles.test:3004',
    });

    const response = await GET(
      new NextRequest('http://dashboard.mrbubbles.test:3004/auth/callback')
    );

    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
    expect(response.headers.get('location')).toBe(
      'http://dashboard.mrbubbles.test:3004/login?error=server_error'
    );
  });
});
