import type { User } from '@supabase/supabase-js';

import {
  requireDashboardManagerSession,
  requireDashboardSession,
  requireOwnerSession,
} from '@/lib/auth/session';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const redirectMock = vi.fn<(href: string) => never>();
const getUserMock = vi.fn();
const getDashboardAccessEntryByIdentityMock = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: (href: string) => redirectMock(href),
}));

vi.mock('@/lib/account/dashboard-access', () => ({
  getDashboardAccessEntryByIdentity: (identity: {
    githubUsername: string;
    email: string;
  }) => getDashboardAccessEntryByIdentityMock(identity),
  normalizeDashboardEmail: (value: string | null | undefined) =>
    value ? value.trim().toLowerCase() : null,
  normalizeGithubUsername: (value: string | null | undefined) =>
    value ? value.trim().toLowerCase() : null,
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

describe('dashboard session helpers', () => {
  beforeEach(() => {
    redirectMock.mockReset();
    redirectMock.mockImplementation((href) => {
      throw new Error(`NEXT_REDIRECT:${href}`);
    });
    getUserMock.mockReset();
    getDashboardAccessEntryByIdentityMock.mockReset();
  });

  it('redirects anonymous visitors to the login page', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: null,
      },
    });

    await expect(requireDashboardSession()).rejects.toThrow(
      'NEXT_REDIRECT:/login'
    );
  });

  it('logs out GitHub users that do not have an access row', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: createGithubUser('stranger'),
      },
    });
    getDashboardAccessEntryByIdentityMock.mockResolvedValue(null);

    await expect(requireDashboardSession()).rejects.toThrow(
      'NEXT_REDIRECT:/auth/logout?next=/login'
    );
  });

  it('logs out GitHub users whose dashboard access is disabled', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: createGithubUser('editor'),
      },
    });
    getDashboardAccessEntryByIdentityMock.mockResolvedValue({
      githubUsername: 'editor',
      email: 'editor@example.test',
      note: null,
      userRole: 'editor',
      dashboardAccess: false,
      createdAt: '2026-04-18T00:00:00.000Z',
    });

    await expect(requireDashboardSession()).rejects.toThrow(
      'NEXT_REDIRECT:/auth/logout?next=/login'
    );
  });

  it('returns the full dashboard session for an active access row', async () => {
    const user = createGithubUser('mrbubbles-src');
    const accessEntry = {
      githubUsername: 'mrbubbles-src',
      email: 'mrbubbles-src@example.test',
      note: 'owner',
      userRole: 'owner',
      dashboardAccess: true,
      createdAt: '2026-04-18T00:00:00.000Z',
    };

    getUserMock.mockResolvedValue({
      data: {
        user,
      },
    });
    getDashboardAccessEntryByIdentityMock.mockResolvedValue(accessEntry);

    await expect(requireDashboardSession()).resolves.toEqual({
      user,
      accessEntry,
      githubUsername: 'mrbubbles-src',
    });
  });

  it('redirects non-owner dashboard users away from owner-only routes', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: createGithubUser('editor'),
      },
    });
    getDashboardAccessEntryByIdentityMock.mockResolvedValue({
      githubUsername: 'editor',
      email: 'editor@example.test',
      note: null,
      userRole: 'editor',
      dashboardAccess: true,
      createdAt: '2026-04-18T00:00:00.000Z',
    });

    await expect(requireOwnerSession()).rejects.toThrow('NEXT_REDIRECT:/');
  });

  it('allows editors through the shared dashboard manager gate', async () => {
    const user = createGithubUser('editor');
    const accessEntry = {
      githubUsername: 'editor',
      email: 'editor@example.test',
      note: null,
      userRole: 'editor',
      dashboardAccess: true,
      createdAt: '2026-04-18T00:00:00.000Z',
    };

    getUserMock.mockResolvedValue({
      data: {
        user,
      },
    });
    getDashboardAccessEntryByIdentityMock.mockResolvedValue(accessEntry);

    await expect(requireDashboardManagerSession()).resolves.toEqual({
      user,
      accessEntry,
      githubUsername: 'editor',
    });
  });
});
