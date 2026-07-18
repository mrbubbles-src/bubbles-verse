import type {
  BubblophyProjectInvitationCreateStoreResult,
  BubblophyProjectInvitationMutationStore,
  BubblophyProjectInvitationReinviteStoreResult,
  BubblophyProjectInvitationRevokeStoreResult,
} from '@/lib/projects/invitations';

import {
  BUBBLOPHY_PROJECT_INVITATION_LIFETIME_MS,
  createBubblophyProjectInvitation,
  hashBubblophyProjectInvitationToken,
  reinviteBubblophyProjectInvitation,
  revokeBubblophyProjectInvitation,
} from '@/lib/projects/invitations';

import { afterEach, describe, expect, it, vi } from 'vitest';

const now = new Date('2026-07-18T10:00:00.000Z');
const plaintextToken = 'bubblophy_invite_test_secret';
const conflictResult = { status: 'conflict' } as const;

/** Creates an exact-result invitation store for service tests. */
function createStore(
  results: {
    create?: BubblophyProjectInvitationCreateStoreResult;
    reinvite?: BubblophyProjectInvitationReinviteStoreResult;
    revoke?: BubblophyProjectInvitationRevokeStoreResult;
  } = {}
): BubblophyProjectInvitationMutationStore {
  return {
    createProjectInvitationWithEvent: vi.fn(
      async () => results.create ?? conflictResult
    ),
    reinviteProjectInvitationWithEvent: vi.fn(
      async () => results.reinvite ?? conflictResult
    ),
    revokeProjectInvitationWithEvent: vi.fn(
      async () => results.revoke ?? conflictResult
    ),
  };
}

describe('project invitation mutation services', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('normalizes an invitation and returns its plaintext token once', async () => {
    const invitation = {
      id: 'invitation_1',
      projectKey: 'BV',
      email: 'martin@example.test',
      role: 'member',
      expiresAt: '2026-07-25T10:00:00.000Z',
      updatedAt: now.toISOString(),
    } as const;
    const store = createStore({ create: { status: 'created', invitation } });

    await expect(
      createBubblophyProjectInvitation(
        {
          authUserId: 'user_owner',
          projectKey: ' bv ',
          email: ' Martin@Example.Test ',
          role: 'member',
        },
        {
          store,
          tokenFactory: () => plaintextToken,
          now: () => now,
        }
      )
    ).resolves.toEqual({
      status: 'created',
      invitation: { ...invitation, plaintextToken },
    });

    expect(store.createProjectInvitationWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      projectKey: 'BV',
      normalizedEmail: 'martin@example.test',
      role: 'member',
      tokenHash: hashBubblophyProjectInvitationToken(plaintextToken),
      now: now.toISOString(),
      expiresAt: new Date(
        now.getTime() + BUBBLOPHY_PROJECT_INVITATION_LIFETIME_MS
      ).toISOString(),
    });
  });

  it('does not expose generated plaintext after a create conflict', async () => {
    const store = createStore({ create: { status: 'already_open' } });

    const result = await createBubblophyProjectInvitation(
      {
        authUserId: 'user_owner',
        projectKey: 'BV',
        email: 'martin@example.test',
        role: 'viewer',
      },
      { store, tokenFactory: () => plaintextToken, now: () => now }
    );

    expect(result).toEqual({ status: 'already_open' });
    expect(result).not.toHaveProperty('plaintextToken');
    expect(result).not.toHaveProperty('invitation');
  });

  it('rejects malformed create input and owner invitations before storage', async () => {
    const store = createStore({ create: { status: 'already_open' } });

    await expect(
      createBubblophyProjectInvitation(
        {
          authUserId: 'user_owner',
          projectKey: 'B',
          email: 'martin@example.test',
          role: 'member',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_project_key' });
    await expect(
      createBubblophyProjectInvitation(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          email: 'not-an-email',
          role: 'member',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_email' });
    await expect(
      createBubblophyProjectInvitation(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          email: 'owner@example.test',
          role: 'owner' as 'member',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_role' });

    expect(store.createProjectInvitationWithEvent).not.toHaveBeenCalled();
  });

  it('rotates a reinvited secret and preserves its database timestamp', async () => {
    const invitation = {
      id: 'invitation_1',
      projectKey: 'BV',
      email: 'martin@example.test',
      role: 'maintainer',
      expiresAt: '2026-07-25T10:00:00.000Z',
      updatedAt: now.toISOString(),
    } as const;
    const store = createStore({
      reinvite: { status: 'reinvited', invitation },
    });

    await expect(
      reinviteBubblophyProjectInvitation(
        {
          authUserId: 'user_owner',
          invitationId: ' invitation_1 ',
          expectedUpdatedAt: ' 2026-07-18 10:00:00.000 ',
        },
        {
          store,
          tokenFactory: () => plaintextToken,
          now: () => now,
        }
      )
    ).resolves.toEqual({
      status: 'reinvited',
      invitation: { ...invitation, plaintextToken },
    });

    expect(store.reinviteProjectInvitationWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      invitationId: 'invitation_1',
      expectedUpdatedAt: '2026-07-18 10:00:00.000',
      tokenHash: hashBubblophyProjectInvitationToken(plaintextToken),
      now: now.toISOString(),
      expiresAt: '2026-07-25T10:00:00.000Z',
    });
  });

  it('revokes through the store without generating a token', async () => {
    const store = createStore({
      revoke: {
        status: 'revoked',
        invitationId: 'invitation_1',
        projectKey: 'BV',
        updatedAt: now.toISOString(),
      },
    });
    const tokenFactory = vi.fn(() => plaintextToken);

    await expect(
      revokeBubblophyProjectInvitation(
        {
          authUserId: 'user_owner',
          invitationId: ' invitation_1 ',
          expectedUpdatedAt: now.toISOString(),
        },
        { store, tokenFactory, now: () => now }
      )
    ).resolves.toEqual({
      status: 'revoked',
      invitationId: 'invitation_1',
      projectKey: 'BV',
      updatedAt: now.toISOString(),
    });

    expect(tokenFactory).not.toHaveBeenCalled();
    expect(store.revokeProjectInvitationWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      invitationId: 'invitation_1',
      expectedUpdatedAt: now.toISOString(),
      now: now.toISOString(),
    });
  });

  it('fails closed without database configuration', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      createBubblophyProjectInvitation({
        authUserId: 'user_owner',
        projectKey: 'BV',
        email: 'martin@example.test',
        role: 'member',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
