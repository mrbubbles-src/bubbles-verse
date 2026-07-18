import type {
  BubblophyProjectInvitationAcceptStore,
  BubblophyProjectInvitationAcceptStoreResult,
} from '@/lib/projects/accept-invitation';

import { acceptBubblophyProjectInvitation } from '@/lib/projects/accept-invitation';
import { hashBubblophyProjectInvitationToken } from '@/lib/projects/invitations';

import { describe, expect, it, vi } from 'vitest';

const now = new Date('2026-07-18T10:00:00.000Z');
const token = `bubblophy_invite_${'a'.repeat(43)}`;

/** Creates an invitation acceptance store with an exact result. */
function createStore(
  result: BubblophyProjectInvitationAcceptStoreResult
): BubblophyProjectInvitationAcceptStore {
  return {
    acceptProjectInvitationWithMembership: vi.fn(async () => result),
  };
}

describe('project invitation acceptance service', () => {
  it('normalizes the verified identity and hashes the staged token', async () => {
    const store = createStore({
      status: 'accepted',
      projectKey: 'BV',
      role: 'member',
      membershipCreated: true,
    });

    await expect(
      acceptBubblophyProjectInvitation(
        {
          authUserId: 'user_martin',
          email: ' Martin@Example.Test ',
          plaintextToken: token,
        },
        { store, now: () => now }
      )
    ).resolves.toEqual({
      status: 'accepted',
      projectKey: 'BV',
      role: 'member',
      membershipCreated: true,
    });

    expect(store.acceptProjectInvitationWithMembership).toHaveBeenCalledWith({
      authUserId: 'user_martin',
      normalizedEmail: 'martin@example.test',
      tokenHash: hashBubblophyProjectInvitationToken(token),
      now: now.toISOString(),
    });
  });

  it('rejects malformed tokens before touching storage', async () => {
    const store = createStore({ status: 'unavailable' });

    await expect(
      acceptBubblophyProjectInvitation(
        {
          authUserId: 'user_martin',
          email: 'martin@example.test',
          plaintextToken: 'not-an-invitation',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_token' });
    expect(store.acceptProjectInvitationWithMembership).not.toHaveBeenCalled();
  });

  it('requires an email from the authenticated provider identity', async () => {
    const store = createStore({ status: 'unavailable' });

    await expect(
      acceptBubblophyProjectInvitation(
        {
          authUserId: 'user_phone_only',
          email: null,
          plaintextToken: token,
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'missing_email' });
    expect(store.acceptProjectInvitationWithMembership).not.toHaveBeenCalled();
  });

  it('reports a missing database without importing a store', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      acceptBubblophyProjectInvitation({
        authUserId: 'user_martin',
        email: 'martin@example.test',
        plaintextToken: token,
      })
    ).resolves.toEqual({ status: 'database_unavailable' });

    vi.unstubAllEnvs();
  });
});
