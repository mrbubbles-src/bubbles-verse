import type {
  BubblophyProjectManagementStore,
  BubblophyProjectManagementStoreResult,
} from '@/lib/projects/manage';

import {
  canManageBubblophyProject,
  mapManagedProjectToSummary,
  transitionBubblophyProjectArchive,
  updateBubblophyProjectContent,
} from '@/lib/projects/manage';
import {
  buildBubblophyProjectUpdatedEventInsert,
  getChangedBubblophyProjectContentFields,
} from '@/lib/projects/manage-database-write';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createManagedProject(
  overrides: Partial<BubblophyProjectManagementStoreResult> = {}
): BubblophyProjectManagementStoreResult {
  return {
    id: 'project_bv',
    key: 'BV',
    name: 'Bubblesverse',
    description: 'Lokale Arbeit',
    isArchived: false,
    openIssues: 3,
    readyIssues: 1,
    blockedIssues: 0,
    memberCount: 2,
    agentTokenCount: 1,
    ...overrides,
  };
}

describe('project management services', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('validates project content before touching the store', async () => {
    const store: BubblophyProjectManagementStore = {
      updateProjectContentWithEvent: vi.fn(async () => ({
        status: 'unchanged' as const,
      })),
      transitionProjectArchiveWithEvent: vi.fn(async () => ({
        status: 'unchanged' as const,
      })),
    };

    await expect(
      updateBubblophyProjectContent(
        { authUserId: 'user', projectKey: ' ', name: 'Name' },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_project' });
    await expect(
      updateBubblophyProjectContent(
        { authUserId: 'user', projectKey: 'BV', name: ' ' },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_name' });
    await expect(
      updateBubblophyProjectContent(
        { authUserId: 'user', projectKey: 'BV', name: 'x'.repeat(161) },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'name_too_long' });

    expect(store.updateProjectContentWithEvent).not.toHaveBeenCalled();
  });

  it('passes normalized project edits to the store', async () => {
    const store: BubblophyProjectManagementStore = {
      updateProjectContentWithEvent: vi.fn(async (input) => ({
        status: 'updated' as const,
        project: createManagedProject({
          key: input.projectKey,
          name: input.name,
          description: input.description,
        }),
      })),
      transitionProjectArchiveWithEvent: vi.fn(async () => ({
        status: 'unchanged' as const,
      })),
    };

    await expect(
      updateBubblophyProjectContent(
        {
          authUserId: 'user_owner',
          projectKey: ' bv ',
          name: '  Bubblesverse Local  ',
          description: '  Steuerzentrale  ',
        },
        { store }
      )
    ).resolves.toMatchObject({
      status: 'updated',
      project: {
        key: 'BV',
        name: 'Bubblesverse Local',
        description: 'Steuerzentrale',
        isArchived: false,
      },
    });

    expect(store.updateProjectContentWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      projectKey: 'BV',
      name: 'Bubblesverse Local',
      description: 'Steuerzentrale',
    });
  });

  it('normalizes archive decisions and preserves store denials', async () => {
    const store: BubblophyProjectManagementStore = {
      updateProjectContentWithEvent: vi.fn(async () => ({
        status: 'unchanged' as const,
      })),
      transitionProjectArchiveWithEvent: vi.fn(async () => ({
        status: 'forbidden' as const,
      })),
    };

    await expect(
      transitionBubblophyProjectArchive(
        {
          authUserId: 'user_member',
          projectKey: ' bv ',
          decision: 'archive',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'forbidden' });
    expect(store.transitionProjectArchiveWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_member',
      projectKey: 'BV',
      decision: 'archive',
    });
  });

  it('returns database_unavailable without a configured store', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      updateBubblophyProjectContent({
        authUserId: 'user_owner',
        projectKey: 'BV',
        name: 'Bubblesverse',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});

describe('project management helpers', () => {
  it('allows owner and maintainer but blocks member and viewer', () => {
    expect(canManageBubblophyProject('owner')).toBe(true);
    expect(canManageBubblophyProject('maintainer')).toBe(true);
    expect(canManageBubblophyProject('member')).toBe(false);
    expect(canManageBubblophyProject('viewer')).toBe(false);
  });

  it('maps archived projects to a non-operative summary', () => {
    expect(
      mapManagedProjectToSummary(
        createManagedProject({
          isArchived: true,
          openIssues: 7,
          readyIssues: 3,
          blockedIssues: 2,
        })
      )
    ).toMatchObject({
      isArchived: true,
      openIssues: 0,
      readyIssues: 0,
      blockedIssues: 0,
    });
  });

  it('detects changed project fields for no-op protection', () => {
    expect(
      getChangedBubblophyProjectContentFields({
        current: { name: 'Bubblesverse', description: 'Alt' },
        next: { name: 'Bubblesverse', description: 'Alt' },
      })
    ).toEqual([]);
    expect(
      getChangedBubblophyProjectContentFields({
        current: { name: 'Bubblesverse', description: 'Alt' },
        next: { name: 'Bubblesverse lokal', description: '' },
      })
    ).toEqual(['name', 'description']);
  });

  it('builds minimal project audit metadata', () => {
    expect(
      buildBubblophyProjectUpdatedEventInsert({
        projectId: 'project_bv',
        projectKey: 'BV',
        authUserId: 'user_owner',
        action: 'archived',
        changedFields: [],
      })
    ).toEqual({
      projectId: 'project_bv',
      eventType: 'project_updated',
      actorAuthUserId: 'user_owner',
      actorAgentTokenId: null,
      agentRunId: null,
      summary: 'Projekt BV: archived.',
      payload: {
        source: 'human',
        entity: 'project',
        action: 'archived',
        projectId: 'project_bv',
        projectKey: 'BV',
        changedFields: [],
      },
    });
  });
});
