import type { User } from '@supabase/supabase-js';

import {
  normalizeBubblophyProfileDisplayName,
  resolveBubblophyProfileDisplayName,
} from '@/lib/profiles/profile';

import { describe, expect, it } from 'vitest';

/** Builds a small verified Supabase user fixture. */
function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user_owner',
    app_metadata: { provider: 'github', providers: ['github'] },
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-07-18T00:00:00.000Z',
    email: 'owner@example.test',
    identities: [],
    is_anonymous: false,
    phone: '',
    role: 'authenticated',
    updated_at: '2026-07-18T00:00:00.000Z',
    ...overrides,
  };
}

describe('Bubblophy profile identity', () => {
  it('normalizes whitespace, controls, and maximum length', () => {
    expect(normalizeBubblophyProfileDisplayName('  Martin\n Bubbles  ')).toBe(
      'Martin Bubbles'
    );
    expect(normalizeBubblophyProfileDisplayName('x'.repeat(140))).toHaveLength(
      120
    );
    expect(normalizeBubblophyProfileDisplayName('   ')).toBeNull();
  });

  it('prefers provider-backed names over editable user metadata', () => {
    const user = createUser({
      identities: [
        {
          id: 'identity_owner',
          identity_id: 'identity_owner',
          user_id: 'user_owner',
          identity_data: {
            full_name: 'Verified Owner',
            user_name: 'owner-login',
          },
          provider: 'github',
          created_at: '2026-07-18T00:00:00.000Z',
          last_sign_in_at: '2026-07-18T00:00:00.000Z',
          updated_at: '2026-07-18T00:00:00.000Z',
        },
      ],
      user_metadata: { full_name: 'Editable Impostor' },
    });

    expect(resolveBubblophyProfileDisplayName(user)).toBe('Verified Owner');
  });

  it('returns null when no provider-backed name exists', () => {
    expect(
      resolveBubblophyProfileDisplayName(
        createUser({ user_metadata: { full_name: 'Metadata Only' } })
      )
    ).toBeNull();
  });
});
