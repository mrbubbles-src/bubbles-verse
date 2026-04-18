import { NextRequest } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/vault/entries/[id]/duplicate/route';

const getUserMock = vi.fn();
const getDashboardAccessEntryByIdentityMock = vi.fn();
const duplicateVaultEntryMock = vi.fn();
const revalidatePathMock = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: (path: string) => revalidatePathMock(path),
}));

vi.mock('@/lib/supabase/server', () => ({
  createDashboardServerSupabaseClient: async () => ({
    auth: {
      getUser: getUserMock,
    },
  }),
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

vi.mock('@/lib/vault/entries', () => ({
  duplicateVaultEntry: (input: object) => duplicateVaultEntryMock(input),
}));

function createGithubUser(username: string) {
  return {
    id: 'user-id',
    app_metadata: {
      provider: 'github',
      providers: ['github'],
    },
    user_metadata: {
      user_name: username,
    },
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

describe('POST /api/vault/entries/[id]/duplicate', () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getDashboardAccessEntryByIdentityMock.mockReset();
    duplicateVaultEntryMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it('creates a draft duplicate for an active editor session', async () => {
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
    duplicateVaultEntryMock.mockResolvedValue({
      id: 'duplicate-id',
      slug: 'react/rendering-kopie',
    });

    const response = await POST(
      new NextRequest(
        'http://dashboard.mrbubbles.test:3004/api/vault/entries/entry-id/duplicate',
        {
          method: 'POST',
        }
      ),
      {
        params: Promise.resolve({
          id: 'entry-id',
        }),
      }
    );

    expect(response.status).toBe(201);
    expect(duplicateVaultEntryMock).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith('/vault');
    expect(revalidatePathMock).toHaveBeenCalledWith('/vault/entries');
    expect(revalidatePathMock).toHaveBeenCalledWith('/vault/entries/entry-id');
    expect(revalidatePathMock).toHaveBeenCalledWith(
      '/vault/entries/duplicate-id'
    );
  });
});
