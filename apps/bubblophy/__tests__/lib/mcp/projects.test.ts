// @vitest-environment node

import type { BubblophyMcpProjectReader } from '@/lib/mcp/projects';

import { listBubblophyMcpProjects } from '@/lib/mcp/projects';

import { afterEach, describe, expect, it, vi } from 'vitest';

describe('listBubblophyMcpProjects', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects an empty authenticated user ID before reading data', async () => {
    const readProjects = vi.fn();

    await expect(
      listBubblophyMcpProjects('  ', { readProjects })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_auth_user' });
    expect(readProjects).not.toHaveBeenCalled();
  });

  it('returns only the current memberships with roles and archive state', async () => {
    const readProjects = vi.fn<BubblophyMcpProjectReader>(async () => [
      {
        id: 'project_active',
        key: 'BV',
        name: 'Bubblesverse',
        description: 'Aktives Projekt',
        role: 'owner',
        isArchived: false,
      },
      {
        id: 'project_archived',
        key: 'OLD',
        name: 'Archiv',
        description: '',
        role: 'viewer',
        isArchived: true,
      },
    ]);

    await expect(
      listBubblophyMcpProjects(' user-1 ', { readProjects })
    ).resolves.toEqual({
      status: 'success',
      projects: [
        {
          id: 'project_active',
          key: 'BV',
          name: 'Bubblesverse',
          description: 'Aktives Projekt',
          role: 'owner',
          isArchived: false,
        },
        {
          id: 'project_archived',
          key: 'OLD',
          name: 'Archiv',
          description: '',
          role: 'viewer',
          isArchived: true,
        },
      ],
    });
    expect(readProjects).toHaveBeenCalledWith('user-1');
  });

  it('returns a successful empty list when the user has no memberships', async () => {
    await expect(
      listBubblophyMcpProjects('user-1', {
        readProjects: async () => [],
      })
    ).resolves.toEqual({ status: 'success', projects: [] });
  });

  it('re-reads memberships on every tool invocation', async () => {
    const readProjects = vi
      .fn<BubblophyMcpProjectReader>()
      .mockResolvedValueOnce([
        {
          id: 'project_bv',
          key: 'BV',
          name: 'Bubblesverse',
          description: '',
          role: 'member',
          isArchived: false,
        },
      ])
      .mockResolvedValueOnce([]);

    await expect(
      listBubblophyMcpProjects('user-1', { readProjects })
    ).resolves.toMatchObject({ projects: [{ role: 'member' }] });
    await expect(
      listBubblophyMcpProjects('user-1', { readProjects })
    ).resolves.toEqual({ status: 'success', projects: [] });
    expect(readProjects).toHaveBeenCalledTimes(2);
  });

  it('returns database_unavailable without database configuration', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(listBubblophyMcpProjects('user-1')).resolves.toEqual({
      status: 'database_unavailable',
    });
  });

  it('does not expose database failure details', async () => {
    const secret = 'postgres://secret@database.example/bubblophy';

    const result = await listBubblophyMcpProjects('user-1', {
      readProjects: async () => {
        throw new Error(`connection failed: ${secret}`);
      },
    });

    expect(result).toEqual({ status: 'database_unavailable' });
    expect(JSON.stringify(result)).not.toContain(secret);
  });
});
