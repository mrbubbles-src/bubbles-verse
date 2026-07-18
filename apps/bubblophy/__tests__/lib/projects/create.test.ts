import type {
  BubblophyProjectCreateStore,
  BubblophyProjectCreateStoreInput,
} from '@/lib/projects/create';

import {
  buildBubblophyProjectSlug,
  createBubblophyProject,
  mapCreatedProjectToSummary,
  normalizeBubblophyProjectKey,
} from '@/lib/projects/create';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  handler: (
    input: BubblophyProjectCreateStoreInput
  ) => ReturnType<
    BubblophyProjectCreateStore['createProjectWithOwnerMembership']
  >
): BubblophyProjectCreateStore {
  return {
    createProjectWithOwnerMembership: vi.fn(handler),
  };
}

describe('createBubblophyProject', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('normalizes project keys and slugs', () => {
    expect(normalizeBubblophyProjectKey(' bv42 ')).toBe('BV42');
    expect(buildBubblophyProjectSlug('BV42')).toBe('bv42');
  });

  it('rejects invalid project inputs before touching the store', async () => {
    const store = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      createBubblophyProject(
        {
          authUserId: 'user_owner',
          name: '   ',
          key: 'BV',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'invalid',
      reason: 'empty_name',
    });
    await expect(
      createBubblophyProject(
        {
          authUserId: 'user_owner',
          name: 'Bubblesverse',
          key: '   ',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'invalid',
      reason: 'empty_key',
    });
    await expect(
      createBubblophyProject(
        {
          authUserId: 'user_owner',
          name: 'Bubblesverse',
          key: 'a-b',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'invalid',
      reason: 'invalid_key',
    });
    await expect(
      createBubblophyProject(
        {
          authUserId: 'user_owner',
          name: 'Bubblesverse',
          key: 'b',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'invalid',
      reason: 'invalid_key',
    });
    await expect(
      createBubblophyProject(
        {
          authUserId: 'user_owner',
          name: 'Bubblesverse',
          key: 'TOOLONG99',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'invalid',
      reason: 'invalid_key',
    });
    await expect(
      createBubblophyProject(
        {
          authUserId: 'user_owner',
          name: 'Bubblesverse',
          key: 'BV',
          repositoryUrl: 'http://example.test/repo',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'invalid',
      reason: 'invalid_repository_url',
    });

    expect(store.createProjectWithOwnerMembership).not.toHaveBeenCalled();
  });

  it('returns duplicate as a structured result', async () => {
    const store = createStore(async () => ({ status: 'duplicate' }));

    await expect(
      createBubblophyProject(
        {
          authUserId: 'user_owner',
          name: 'Bubblesverse',
          key: 'BV',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'duplicate',
    });
  });

  it('creates a project with owner membership through the store', async () => {
    const store = createStore(async (input) => ({
      status: 'created',
      project: {
        id: 'project_bubblesverse',
        name: input.name,
        key: input.key,
      },
    }));

    await expect(
      createBubblophyProject(
        {
          authUserId: 'user_owner',
          name: '  Bubblesverse  ',
          key: ' bv ',
          description: '  Human-gesteuerte Arbeit  ',
          repositoryUrl: ' https://github.com/mrbubbles/bubbles-verse ',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'created',
      project: {
        id: 'project_bubblesverse',
        name: 'Bubblesverse',
        key: 'BV',
        description: '',
        isArchived: false,
        health: 'stabil',
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
        memberCount: 1,
        agentTokenCount: 0,
        currentUserRole: 'owner',
      },
    });

    expect(store.createProjectWithOwnerMembership).toHaveBeenCalledTimes(1);
    expect(store.createProjectWithOwnerMembership).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      name: 'Bubblesverse',
      key: 'BV',
      slug: 'bv',
      description: 'Human-gesteuerte Arbeit',
      repositoryUrl: 'https://github.com/mrbubbles/bubbles-verse',
    });
  });

  it('returns database_unavailable when no store and no database URL exist', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      createBubblophyProject({
        authUserId: 'user_owner',
        name: 'Bubblesverse',
        key: 'BV',
      })
    ).resolves.toEqual({
      status: 'database_unavailable',
    });
  });
});

describe('mapCreatedProjectToSummary', () => {
  it('maps created project rows into empty dashboard project summaries', () => {
    expect(
      mapCreatedProjectToSummary({
        id: 'project_bv',
        name: 'Bubblesverse',
        key: 'BV',
      })
    ).toEqual({
      id: 'project_bv',
      name: 'Bubblesverse',
      key: 'BV',
      description: '',
      isArchived: false,
      health: 'stabil',
      openIssues: 0,
      readyIssues: 0,
      blockedIssues: 0,
      memberCount: 1,
      agentTokenCount: 0,
      currentUserRole: 'owner',
    });
  });
});
