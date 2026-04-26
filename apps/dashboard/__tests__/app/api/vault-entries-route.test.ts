import { NextRequest } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/vault/entries/route';

const getUserMock = vi.fn();
const getDashboardAccessEntryByIdentityMock = vi.fn();
const parseCreateVaultEntryRequestMock = vi.fn();
const createVaultEntryMock = vi.fn();
const revalidatePathMock = vi.fn();
const revalidateTagMock = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: (path: string) => revalidatePathMock(path),
  revalidateTag: (tag: string, profile: { expire: number }) =>
    revalidateTagMock(tag, profile),
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
  createVaultEntry: (input: object) => createVaultEntryMock(input),
  parseCreateVaultEntryRequest: (value: object) =>
    parseCreateVaultEntryRequestMock(value),
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

describe('POST /api/vault/entries', () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getDashboardAccessEntryByIdentityMock.mockReset();
    parseCreateVaultEntryRequestMock.mockReset();
    createVaultEntryMock.mockReset();
    revalidatePathMock.mockReset();
    revalidateTagMock.mockReset();
  });

  it('rejects anonymous requests', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: null,
      },
    });

    const response = await POST(
      new NextRequest(
        'http://dashboard.mrbubbles.test:3004/api/vault/entries',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )
    );

    expect(response.status).toBe(401);
  });

  it('creates a new vault entry for an active editor session', async () => {
    const requestBody = {
      title: 'React Rendering',
      slug: 'react/rendering',
      description: 'Alles rund um Rendering.',
      tags: ['react'],
      status: 'published',
      editorContent: {
        blocks: [],
      },
      serializedContent: '# React Rendering',
      primaryCategoryId: 'category-id',
    };

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
    parseCreateVaultEntryRequestMock.mockReturnValue({
      success: true,
      data: requestBody,
    });
    createVaultEntryMock.mockResolvedValue({
      id: 'entry-id',
      slug: 'react/rendering',
    });

    const response = await POST(
      new NextRequest(
        'http://dashboard.mrbubbles.test:3004/api/vault/entries',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      )
    );

    expect(response.status).toBe(201);
    expect(createVaultEntryMock).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith('/vault/entries');
    expect(revalidatePathMock).toHaveBeenCalledWith('/vault/entries/new');
    expect(revalidateTagMock).toHaveBeenCalledWith('dashboard:home', {
      expire: 0,
    });
    expect(revalidateTagMock).toHaveBeenCalledWith(
      'dashboard:profile:user-id',
      { expire: 0 }
    );
    expect(revalidateTagMock).toHaveBeenCalledWith('dashboard:vault:entries', {
      expire: 0,
    });
  });
});
