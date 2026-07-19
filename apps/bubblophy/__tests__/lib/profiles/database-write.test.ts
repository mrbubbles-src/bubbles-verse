import type { User } from '@supabase/supabase-js';

import { syncBubblophyUserProfile } from '@/lib/profiles/database-write';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { insertMock, onConflictDoUpdateMock, valuesMock } = vi.hoisted(() => ({
  insertMock: vi.fn(),
  onConflictDoUpdateMock: vi.fn(),
  valuesMock: vi.fn(),
}));

vi.mock('@/drizzle/db', () => ({
  db: {
    insert: insertMock,
  },
}));

/** Builds one verified GitHub-backed Supabase user. */
function createUser(): User {
  return {
    id: 'user_martin',
    app_metadata: { provider: 'github', providers: ['github'] },
    user_metadata: { full_name: 'Editable Name' },
    aud: 'authenticated',
    created_at: '2026-07-18T00:00:00.000Z',
    email: 'martin@example.test',
    identities: [
      {
        id: 'identity_martin',
        identity_id: 'identity_martin',
        user_id: 'user_martin',
        identity_data: { name: 'Martin Verified' },
        provider: 'github',
        created_at: '2026-07-18T00:00:00.000Z',
        last_sign_in_at: '2026-07-18T00:00:00.000Z',
        updated_at: '2026-07-18T00:00:00.000Z',
      },
    ],
    is_anonymous: false,
    phone: '',
    role: 'authenticated',
    updated_at: '2026-07-18T00:00:00.000Z',
  };
}

describe('syncBubblophyUserProfile', () => {
  beforeEach(() => {
    insertMock.mockReset();
    valuesMock.mockReset();
    onConflictDoUpdateMock.mockReset();
    insertMock.mockReturnValue({ values: valuesMock });
    valuesMock.mockReturnValue({ onConflictDoUpdate: onConflictDoUpdateMock });
    onConflictDoUpdateMock.mockResolvedValue(undefined);
  });

  it('upserts only verified session identity fields', async () => {
    await expect(
      syncBubblophyUserProfile({
        user: createUser(),
        normalizedEmail: 'martin@example.test',
      })
    ).resolves.toEqual({
      authUserId: 'user_martin',
      normalizedEmail: 'martin@example.test',
      displayName: 'Martin Verified',
    });

    expect(valuesMock).toHaveBeenCalledWith({
      authUserId: 'user_martin',
      normalizedEmail: 'martin@example.test',
      displayName: 'Martin Verified',
    });
    expect(onConflictDoUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.any(Object),
        set: expect.objectContaining({
          normalizedEmail: 'martin@example.test',
          displayName: 'Martin Verified',
        }),
        setWhere: expect.any(Object),
      })
    );
  });
});
