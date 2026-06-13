import type {
  BubblophyProjectMemberMutationStore,
  BubblophyProjectMemberMutationStoreResult,
} from '@/lib/projects/members';

import {
  canManageBubblophyProjectMembers,
  isManageableBubblophyProjectMemberRole,
  removeBubblophyProjectMember,
  updateBubblophyProjectMemberRole,
} from '@/lib/projects/members';
import { buildBubblophyProjectMemberEventInsert } from '@/lib/projects/members-database-write';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  result: BubblophyProjectMemberMutationStoreResult
): BubblophyProjectMemberMutationStore {
  return {
    updateProjectMemberRoleWithEvent: vi.fn(async () => result),
    removeProjectMemberWithEvent: vi.fn(async () => result),
  };
}

describe('project member mutation services', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('validates role mutations before touching the store', async () => {
    const store = createStore({ status: 'unchanged' });

    await expect(
      updateBubblophyProjectMemberRole(
        {
          authUserId: 'user_owner',
          projectKey: ' ',
          memberAuthUserId: 'user_member',
          role: 'member',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_project' });
    await expect(
      updateBubblophyProjectMemberRole(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          memberAuthUserId: ' ',
          role: 'member',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_member' });
    await expect(
      updateBubblophyProjectMemberRole(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          memberAuthUserId: 'user_member',
          role: 'owner' as 'member',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_role' });

    expect(store.updateProjectMemberRoleWithEvent).not.toHaveBeenCalled();
  });

  it('normalizes role changes and preserves authorization denials', async () => {
    const store = createStore({ status: 'forbidden' });

    await expect(
      updateBubblophyProjectMemberRole(
        {
          authUserId: 'user_member',
          projectKey: ' bv ',
          memberAuthUserId: ' user_viewer ',
          role: 'viewer',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'forbidden' });

    expect(store.updateProjectMemberRoleWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_member',
      projectKey: 'BV',
      memberAuthUserId: 'user_viewer',
      role: 'viewer',
    });
  });

  it('blocks missing database configuration without a store', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      removeBubblophyProjectMember({
        authUserId: 'user_owner',
        projectKey: 'BV',
        memberAuthUserId: 'user_member',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });

  it('preserves owner, self-removal, and archived project guard statuses', async () => {
    await expect(
      updateBubblophyProjectMemberRole(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          memberAuthUserId: 'user_owner',
          role: 'maintainer',
        },
        { store: createStore({ status: 'owner_protected' }) }
      )
    ).resolves.toEqual({ status: 'owner_protected' });
    await expect(
      removeBubblophyProjectMember(
        {
          authUserId: 'user_maintainer',
          projectKey: 'BV',
          memberAuthUserId: 'user_owner',
        },
        { store: createStore({ status: 'owner_protected' }) }
      )
    ).resolves.toEqual({ status: 'owner_protected' });
    await expect(
      removeBubblophyProjectMember(
        {
          authUserId: 'user_maintainer',
          projectKey: 'BV',
          memberAuthUserId: 'user_maintainer',
        },
        { store: createStore({ status: 'self_removal' }) }
      )
    ).resolves.toEqual({ status: 'self_removal' });
    await expect(
      removeBubblophyProjectMember(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          memberAuthUserId: 'user_member',
        },
        { store: createStore({ status: 'archived_project' }) }
      )
    ).resolves.toEqual({ status: 'archived_project' });
  });
});

describe('project member helpers', () => {
  it('allows owner and maintainer to manage members but blocks member and viewer', () => {
    expect(canManageBubblophyProjectMembers('owner')).toBe(true);
    expect(canManageBubblophyProjectMembers('maintainer')).toBe(true);
    expect(canManageBubblophyProjectMembers('member')).toBe(false);
    expect(canManageBubblophyProjectMembers('viewer')).toBe(false);
  });

  it('only treats non-owner roles as mutable in the MVP', () => {
    expect(isManageableBubblophyProjectMemberRole('owner')).toBe(false);
    expect(isManageableBubblophyProjectMemberRole('maintainer')).toBe(true);
    expect(isManageableBubblophyProjectMemberRole('member')).toBe(true);
    expect(isManageableBubblophyProjectMemberRole('viewer')).toBe(true);
  });

  it('builds project member audit metadata without profile or email content', () => {
    expect(
      buildBubblophyProjectMemberEventInsert({
        projectId: 'project_bv',
        projectKey: 'BV',
        actorAuthUserId: 'user_owner',
        memberAuthUserId: 'user_member',
        action: 'role_changed',
        changedFields: ['role'],
        previousRole: 'member',
        nextRole: 'viewer',
      })
    ).toEqual({
      projectId: 'project_bv',
      eventType: 'project_updated',
      actorAuthUserId: 'user_owner',
      actorAgentTokenId: null,
      agentRunId: null,
      summary: 'Projekt BV: Mitglied role_changed.',
      payload: {
        source: 'human',
        entity: 'project_member',
        action: 'role_changed',
        projectId: 'project_bv',
        projectKey: 'BV',
        memberUserId: 'user_member',
        changedFields: ['role'],
        previousRole: 'member',
        nextRole: 'viewer',
      },
    });
  });
});
