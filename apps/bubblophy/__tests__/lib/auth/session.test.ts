import type { User } from '@supabase/supabase-js';

import {
  getAllowedBubblophySessionForUser,
  requireBubblophySession,
} from '@/lib/auth/session';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const redirectMock = vi.fn<(href: string) => never>();
const getUserMock = vi.fn();
const cookieGetAllMock = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: (href: string) => redirectMock(href),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: cookieGetAllMock,
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createBubblophyServerSupabaseClient: async () => ({
    auth: {
      getUser: getUserMock,
    },
  }),
}));

function createUser(email: string): User {
  return {
    id: 'user-id',
    app_metadata: {
      provider: 'github',
      providers: ['github'],
    },
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-06-13T00:00:00.000Z',
    email,
    identities: [],
    is_anonymous: false,
    phone: '',
    role: 'authenticated',
    updated_at: '2026-06-13T00:00:00.000Z',
  };
}

describe('Bubblophy session helpers', () => {
  beforeEach(() => {
    redirectMock.mockReset();
    redirectMock.mockImplementation((href) => {
      throw new Error(`NEXT_REDIRECT:${href}`);
    });
    getUserMock.mockReset();
    cookieGetAllMock.mockReset();
    cookieGetAllMock.mockReturnValue([
      {
        name: 'sb-test-auth-token',
        value: 'present',
      },
    ]);
    vi.stubEnv('BUBBLOPHY_ALLOWED_AUTH_EMAILS', 'owner@example.test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('redirects anonymous visitors to login with a relative next path', async () => {
    cookieGetAllMock.mockReturnValue([]);

    await expect(
      requireBubblophySession({ nextPath: '/issues?status=ready' })
    ).rejects.toThrow('NEXT_REDIRECT:/login?next=%2Fissues%3Fstatus%3Dready');
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it('logs out authenticated users that are not temporarily allowed', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: createUser('stranger@example.test'),
      },
    });

    await expect(requireBubblophySession({ nextPath: '/' })).rejects.toThrow(
      'NEXT_REDIRECT:/auth/logout?next=%2Flogin%3Ferror%3Daccess_denied'
    );
  });

  it('returns an authorized human session for allowed users', async () => {
    const user = createUser('Owner@Example.Test');

    getUserMock.mockResolvedValue({
      data: {
        user,
      },
    });

    await expect(requireBubblophySession({ nextPath: '/' })).resolves.toEqual({
      user,
      authUserId: 'user-id',
      email: 'owner@example.test',
    });
  });

  it('fails closed when the temporary allowlist is empty', () => {
    vi.stubEnv('BUBBLOPHY_ALLOWED_AUTH_EMAILS', '');

    expect(
      getAllowedBubblophySessionForUser(createUser('owner@example.test'))
    ).toBeNull();
  });

  it('allows only exact normalized email matches', () => {
    vi.stubEnv('BUBBLOPHY_ALLOWED_AUTH_EMAILS', 'owner@example.test');

    expect(
      getAllowedBubblophySessionForUser(createUser('Owner@Example.Test'))?.email
    ).toBe('owner@example.test');
    expect(
      getAllowedBubblophySessionForUser(createUser('not-owner@example.test'))
    ).toBeNull();
  });
});
