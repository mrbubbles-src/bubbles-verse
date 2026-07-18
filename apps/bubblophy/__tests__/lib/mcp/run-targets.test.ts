// @vitest-environment node

import type { BubblophyMcpRunTargetReadResult } from '@/lib/mcp/run-targets';

import { listBubblophyMcpRunTargets } from '@/lib/mcp/run-targets';

import { describe, expect, it, vi } from 'vitest';

const targetReadResult: BubblophyMcpRunTargetReadResult = {
  project: {
    id: 'project_bv',
    key: 'BV',
    isArchived: false,
    role: 'member',
  },
  candidates: [
    {
      id: 'token_codex',
      label: 'Codex',
      state: 'active',
      scopes: ['issues:read', 'runs:update'],
      expiresAt: null,
    },
    {
      id: 'token_expired',
      label: 'Alt',
      state: 'active',
      scopes: ['issues:read', 'runs:update'],
      expiresAt: '2026-07-17T12:00:00.000Z',
    },
    {
      id: 'token_missing_scope',
      label: 'Nur lesen',
      state: 'active',
      scopes: ['issues:read'],
      expiresAt: null,
    },
  ],
};

describe('listBubblophyMcpRunTargets', () => {
  it('rejects invalid identity and project before reading', async () => {
    const readTargets = vi.fn();

    await expect(
      listBubblophyMcpRunTargets(
        ' ',
        { projectId: 'project_bv' },
        {
          readTargets,
        }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_auth_user' });
    await expect(
      listBubblophyMcpRunTargets('user-1', { projectId: ' ' }, { readTargets })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_project' });
    expect(readTargets).not.toHaveBeenCalled();
  });

  it('returns only executable public run targets for a contributor', async () => {
    const readTargets = vi.fn(async () => targetReadResult);

    await expect(
      listBubblophyMcpRunTargets(
        ' user-1 ',
        { projectId: ' project_bv ' },
        { readTargets, now: '2026-07-18T12:00:00.000Z' }
      )
    ).resolves.toEqual({
      status: 'success',
      project: { id: 'project_bv', key: 'BV', isArchived: false },
      targets: [{ id: 'token_codex', label: 'Codex' }],
    });
    expect(readTargets).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectId: 'project_bv',
    });
  });

  it.each(['viewer', null] as const)(
    'denies non-contributors represented by %s',
    async (role) => {
      const readTargets = vi.fn(async () =>
        role
          ? {
              ...targetReadResult,
              project: { ...targetReadResult.project, role },
            }
          : null
      );

      await expect(
        listBubblophyMcpRunTargets(
          'user-1',
          { projectId: 'project_bv' },
          {
            readTargets,
          }
        )
      ).resolves.toEqual(
        role ? { status: 'forbidden' } : { status: 'not_found' }
      );
    }
  );

  it('denies archived projects even when a stale reader row exists', async () => {
    await expect(
      listBubblophyMcpRunTargets(
        'user-1',
        { projectId: 'project_bv' },
        {
          readTargets: async () => ({
            ...targetReadResult,
            project: { ...targetReadResult.project, isArchived: true },
          }),
        }
      )
    ).resolves.toEqual({ status: 'forbidden' });
  });

  it('maps reader failures without leaking details', async () => {
    await expect(
      listBubblophyMcpRunTargets(
        'user-1',
        { projectId: 'project_bv' },
        {
          readTargets: async () => {
            throw new Error('database host and credentials');
          },
        }
      )
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
