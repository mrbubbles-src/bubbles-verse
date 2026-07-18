import type {
  BubblophyProjectInvitationManagerPersistenceRow,
  BubblophyProjectInvitationManagerReader,
} from '@/lib/projects/invitation-snapshot';

import { readBubblophyProjectInvitationManagerSnapshot } from '@/lib/projects/invitation-snapshot';

import { afterEach, describe, expect, it, vi } from 'vitest';

const now = new Date('2026-07-18T10:00:00.000Z');

describe('project invitation manager snapshot', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('maps manager-visible invitation states without private fields', async () => {
    const readRows = vi.fn<BubblophyProjectInvitationManagerReader>(
      async () => [
        createRow({
          invitationId: 'invitation_pending',
          normalizedEmail: 'pending@example.test',
          expiresAt: '2026-07-18 10:00:00.001',
        }),
        createRow({
          invitationId: 'invitation_expired',
          normalizedEmail: 'expired@example.test',
          expiresAt: '2026-07-18 09:59:59.999',
        }),
        createRow({
          invitationId: 'invitation_accepted',
          normalizedEmail: 'accepted@example.test',
          acceptedAt: '2026-07-18 09:00:00.000',
        }),
        createRow({
          invitationId: 'invitation_revoked',
          normalizedEmail: 'revoked@example.test',
          revokedAt: '2026-07-18 09:00:00.000',
        }),
      ]
    );

    const result = await readBubblophyProjectInvitationManagerSnapshot(
      { authUserId: 'user_owner', projectKey: ' bv ' },
      { readRows, now: () => now }
    );

    expect(readRows).toHaveBeenCalledWith('user_owner', 'BV');
    expect(result).toEqual({
      status: 'found',
      snapshot: {
        projectKey: 'BV',
        managerRole: 'owner',
        isArchived: false,
        invitations: [
          expect.objectContaining({
            id: 'invitation_pending',
            email: 'pending@example.test',
            state: 'pending',
          }),
          expect.objectContaining({
            id: 'invitation_expired',
            email: 'expired@example.test',
            state: 'expired',
          }),
          expect.objectContaining({
            id: 'invitation_accepted',
            email: 'accepted@example.test',
            state: 'accepted',
          }),
          expect.objectContaining({
            id: 'invitation_revoked',
            email: 'revoked@example.test',
            state: 'revoked',
          }),
        ],
      },
    });
    expect(JSON.stringify(result)).not.toContain('tokenHash');
    expect(JSON.stringify(result)).not.toContain('AuthUserId');
  });

  it('returns an authorized empty snapshot from the nullable join row', async () => {
    const readRows = vi.fn<BubblophyProjectInvitationManagerReader>(
      async () => [
        createRow({
          managerRole: 'maintainer',
          isArchived: true,
          invitationId: null,
          normalizedEmail: null,
          invitationRole: null,
          createdAt: null,
          expiresAt: null,
          updatedAt: null,
        }),
      ]
    );

    await expect(
      readBubblophyProjectInvitationManagerSnapshot(
        { authUserId: 'user_manager', projectKey: 'BV' },
        { readRows, now: () => now }
      )
    ).resolves.toEqual({
      status: 'found',
      snapshot: {
        projectKey: 'BV',
        managerRole: 'maintainer',
        isArchived: true,
        invitations: [],
      },
    });
  });

  it('hides empty and non-manager reads as not found', async () => {
    await expect(
      readBubblophyProjectInvitationManagerSnapshot(
        { authUserId: 'user_member', projectKey: 'BV' },
        { readRows: async () => [] }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      readBubblophyProjectInvitationManagerSnapshot(
        { authUserId: 'user_member', projectKey: 'BV' },
        {
          readRows: async () => [createRow({ managerRole: 'member' })],
        }
      )
    ).resolves.toEqual({ status: 'not_found' });
  });

  it('validates project keys and fails closed on reader errors', async () => {
    const readRows = vi.fn<BubblophyProjectInvitationManagerReader>();

    await expect(
      readBubblophyProjectInvitationManagerSnapshot(
        { authUserId: 'user_owner', projectKey: ' ' },
        { readRows }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_project' });
    await expect(
      readBubblophyProjectInvitationManagerSnapshot(
        { authUserId: 'user_owner', projectKey: 'B' },
        { readRows }
      )
    ).resolves.toEqual({
      status: 'invalid',
      reason: 'invalid_project_key',
    });

    readRows.mockRejectedValueOnce(new Error('private database detail'));
    await expect(
      readBubblophyProjectInvitationManagerSnapshot(
        { authUserId: 'user_owner', projectKey: 'BV' },
        { readRows }
      )
    ).resolves.toEqual({ status: 'database_unavailable' });
  });

  it('fails closed without database configuration', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      readBubblophyProjectInvitationManagerSnapshot({
        authUserId: 'user_owner',
        projectKey: 'BV',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});

/** Builds one persistence row without private invitation fields. */
function createRow(
  overrides: Partial<BubblophyProjectInvitationManagerPersistenceRow> = {}
): BubblophyProjectInvitationManagerPersistenceRow {
  return {
    projectKey: 'BV',
    managerRole: 'owner',
    isArchived: false,
    invitationId: 'invitation_1',
    normalizedEmail: 'martin@example.test',
    invitationRole: 'member',
    createdAt: '2026-07-18 08:00:00.000',
    expiresAt: '2026-07-25 10:00:00.000',
    acceptedAt: null,
    revokedAt: null,
    updatedAt: '2026-07-18 08:00:00.000',
    ...overrides,
  };
}
