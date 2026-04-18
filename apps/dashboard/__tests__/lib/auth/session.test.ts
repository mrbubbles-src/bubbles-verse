import type { User } from '@supabase/supabase-js';

import { requireOwnerSession } from '@/lib/auth/session';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const redirectMock = vi.fn();
const getUserMock = vi.fn();
const getServerDashboardEnvMock = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: (href: string) => redirectMock(href),
}));

vi.mock('@/lib/env', () => ({
  getServerDashboardEnv: () => getServerDashboardEnvMock(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createDashboardServerSupabaseClient: async () => ({
    auth: {
      getUser: getUserMock,
    },
  }),
}));

function createGithubUser(username: string): User {
  return {
    id: 'user-id',
    app_metadata: {
      provider: 'github',
      providers: ['github'],
    },
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-04-18T00:00:00.000Z',
    email: `${username}@example.test`,
    identities: [
      {
        provider: 'github',
        identity_data: {
          user_name: username,
        },
        id: 'identity-id',
        user_id: 'user-id',
        identity_id: 'identity-id',
        created_at: '2026-04-18T00:00:00.000Z',
        updated_at: '2026-04-18T00:00:00.000Z',
        last_sign_in_at: '2026-04-18T00:00:00.000Z',
      },
    ],
    is_anonymous: false,
    phone: '',
    role: 'authenticated',
    updated_at: '2026-04-18T00:00:00.000Z',
  };
}

describe('requireOwnerSession', () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getUserMock.mockReset();
    getServerDashboardEnvMock.mockReset();
    getServerDashboardEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: 'http://dashboard.mrbubbles.test:3004',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      GITHUB_OWNER_ALLOWLIST: 'mrbubbles',
    });
  });

  it('redirects anonymous visitors to the login page', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: null,
      },
    });

    await requireOwnerSession();

    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('logs out non-allowlisted GitHub users before returning to login', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: createGithubUser('stranger'),
      },
    });

    await requireOwnerSession();

    expect(redirectMock).toHaveBeenCalledWith('/auth/logout?next=/login');
  });

  it('returns the user for an allowlisted GitHub identity', async () => {
    const user = createGithubUser('mrbubbles');

    getUserMock.mockResolvedValue({
      data: {
        user,
      },
    });

    await expect(requireOwnerSession()).resolves.toEqual(user);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
