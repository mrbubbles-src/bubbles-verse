import type {
  BubblophyProjectMemberMutationStore,
  BubblophyProjectMemberMutationStoreResult,
} from '@/lib/projects/members';

import {
  addBubblophyProjectMember,
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
    addProjectMemberWithEvent: vi.fn(async () => result),
    updateProjectMemberRoleWithEvent: vi.fn(async () => result),
    removeProjectMemberWithEvent: vi.fn(async () => result),
  };
}

describe('project member mutation services', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('adds a project member through the member service', async () => {
    const addedMember = {
      id: 'BV:user_martin',
      projectKey: 'BV',
      authUserId: 'user_martin',
      label: 'user_martin',
      role: 'member',
      createdAt: '2026-06-14T10:00:00.000Z',
    } as const;
    const store = createStore({
      status: 'added',
      member: addedMember,
      memberCount: 4,
    });

    await expect(
      addBubblophyProjectMember(
        {
          authUserId: 'user_owner',
          projectKey: ' bv ',
          memberAuthUserId: ' user_martin ',
          role: 'member',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'added',
      member: addedMember,
      memberCount: 4,
    });

    expect(store.addProjectMemberWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      projectKey: 'BV',
      memberAuthUserId: 'user_martin',
      role: 'member',
    });
  });

  it('blocks viewer/member and archived project member additions', async () => {
    await expect(
      addBubblophyProjectMember(
        {
          authUserId: 'user_viewer',
          projectKey: 'BV',
          memberAuthUserId: 'user_new',
          role: 'viewer',
        },
        { store: createStore({ status: 'forbidden' }) }
      )
    ).resolves.toEqual({ status: 'forbidden' });
    await expect(
      addBubblophyProjectMember(
        {
          authUserId: 'user_member',
          projectKey: 'BV',
          memberAuthUserId: 'user_new',
          role: 'member',
        },
        { store: createStore({ status: 'forbidden' }) }
      )
    ).resolves.toEqual({ status: 'forbidden' });
    await expect(
      addBubblophyProjectMember(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          memberAuthUserId: 'user_new',
          role: 'maintainer',
        },
        { store: createStore({ status: 'archived_project' }) }
      )
    ).resolves.toEqual({ status: 'archived_project' });
  });

  it('validates member additions before touching the store', async () => {
    const store = createStore({ status: 'unchanged' });

    await expect(
      addBubblophyProjectMember(
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
      addBubblophyProjectMember(
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
      addBubblophyProjectMember(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          memberAuthUserId: 'user_member',
          role: 'owner' as 'member',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_role' });

    expect(store.addProjectMemberWithEvent).not.toHaveBeenCalled();
  });

  it('validates role mutations before touching the store', async () => {
    const store = createStore({ status: 'unchanged' });

    await expect(
      updateBubblophyProjectMemberRole(
        {
          authUserId: 'user_owner',
          projectKey: ' ',
          memberAuthUserId: 'user_member',
          expectedRole: 'member',
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
          expectedRole: 'member',
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
          expectedRole: 'member',
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
          expectedRole: 'member',
          role: 'viewer',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'forbidden' });

    expect(store.updateProjectMemberRoleWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_member',
      projectKey: 'BV',
      memberAuthUserId: 'user_viewer',
      expectedRole: 'member',
      role: 'viewer',
    });
  });

  it('blocks missing database configuration without a store', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      addBubblophyProjectMember({
        authUserId: 'user_owner',
        projectKey: 'BV',
        memberAuthUserId: 'user_member',
        role: 'member',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
    await expect(
      removeBubblophyProjectMember({
        authUserId: 'user_owner',
        projectKey: 'BV',
        memberAuthUserId: 'user_member',
        expectedRole: 'member',
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
          expectedRole: 'owner',
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
          expectedRole: 'owner',
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
          expectedRole: 'maintainer',
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
          expectedRole: 'member',
        },
        { store: createStore({ status: 'archived_project' }) }
      )
    ).resolves.toEqual({ status: 'archived_project' });
  });

  it('preserves conflicts from stale role and removal requests', async () => {
    await expect(
      updateBubblophyProjectMemberRole(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          memberAuthUserId: 'user_member',
          expectedRole: 'member',
          role: 'viewer',
        },
        { store: createStore({ status: 'conflict' }) }
      )
    ).resolves.toEqual({ status: 'conflict' });
    await expect(
      removeBubblophyProjectMember(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          memberAuthUserId: 'user_member',
          expectedRole: 'member',
        },
        { store: createStore({ status: 'conflict' }) }
      )
    ).resolves.toEqual({ status: 'conflict' });
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

  it('builds project member added audit metadata without invite data', () => {
    expect(
      buildBubblophyProjectMemberEventInsert({
        projectId: 'project_bv',
        projectKey: 'BV',
        actorAuthUserId: 'user_owner',
        memberAuthUserId: 'user_new',
        action: 'added',
        changedFields: ['membership'],
        previousRole: null,
        nextRole: 'member',
      })
    ).toEqual({
      projectId: 'project_bv',
      eventType: 'project_updated',
      actorAuthUserId: 'user_owner',
      actorAgentTokenId: null,
      agentRunId: null,
      summary: 'Projekt BV: Mitglied added.',
      payload: {
        source: 'human',
        entity: 'project_member',
        action: 'added',
        projectId: 'project_bv',
        projectKey: 'BV',
        memberUserId: 'user_new',
        changedFields: ['membership'],
        previousRole: null,
        nextRole: 'member',
      },
    });
  });
});
