import type { User } from '@supabase/supabase-js';

import {
  getBubblophyDbAccessForUser,
  getBubblophyGithubIdentityUsername,
  normalizeBubblophyAuthEmail,
  normalizeBubblophyGithubUsername,
} from '@/lib/auth/access';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { dbExecuteMock } = vi.hoisted(() => ({
  dbExecuteMock: vi.fn(),
}));

vi.mock('@/drizzle/db', () => ({
  db: {
    execute: dbExecuteMock,
  },
}));

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-id',
    app_metadata: {
      provider: 'github',
      providers: ['github'],
    },
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-06-13T00:00:00.000Z',
    email: 'Owner@Example.Test',
    identities: [],
    is_anonymous: false,
    phone: '',
    role: 'authenticated',
    updated_at: '2026-06-13T00:00:00.000Z',
    ...overrides,
  };
}

describe('Bubblophy DB access', () => {
  beforeEach(() => {
    dbExecuteMock.mockReset();
  });

  it('normalizes auth identity fields', () => {
    expect(normalizeBubblophyAuthEmail(' Owner@Example.Test ')).toBe(
      'owner@example.test'
    );
    expect(normalizeBubblophyGithubUsername(' MrBubbles ')).toBe('mrbubbles');
  });

  it('prefers the immutable GitHub identity username over metadata', () => {
    expect(
      getBubblophyGithubIdentityUsername({
        identities: [
          {
            provider: 'github',
            identity_data: {
              user_name: 'ImmutableName',
            },
          },
        ],
        userMetadata: {
          user_name: 'EditableName',
        },
      })
    ).toBe('ImmutableName');
  });

  it('allows users with active dashboard access', async () => {
    dbExecuteMock.mockResolvedValue([
      {
        hasDashboardAccess: true,
        hasProjectMembership: false,
      },
    ]);

    await expect(
      getBubblophyDbAccessForUser(
        createUser({
          user_metadata: {
            user_name: 'MrBubbles',
          },
        })
      )
    ).resolves.toEqual({
      authUserId: 'user-id',
      email: 'owner@example.test',
    });
  });

  it('allows users with at least one Bubblophy project membership', async () => {
    dbExecuteMock.mockResolvedValue([
      {
        hasDashboardAccess: false,
        hasProjectMembership: true,
      },
    ]);

    await expect(getBubblophyDbAccessForUser(createUser())).resolves.toEqual({
      authUserId: 'user-id',
      email: 'owner@example.test',
    });
  });

  it('denies authenticated users without DB access', async () => {
    dbExecuteMock.mockResolvedValue([
      {
        hasDashboardAccess: false,
        hasProjectMembership: false,
      },
    ]);

    await expect(getBubblophyDbAccessForUser(createUser())).resolves.toBeNull();
  });

  it('denies incomplete Supabase users before querying the database', async () => {
    await expect(
      getBubblophyDbAccessForUser(createUser({ email: undefined }))
    ).resolves.toBeNull();

    expect(dbExecuteMock).not.toHaveBeenCalled();
  });
});
