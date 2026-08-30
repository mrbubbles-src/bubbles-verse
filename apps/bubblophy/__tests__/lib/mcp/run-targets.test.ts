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
  targets: [{ id: 'token_codex', label: 'Codex' }],
  nextAfter: null,
};

describe('listBubblophyMcpRunTargets', () => {
  it('normalizes the bounded public page input', async () => {
    const readTargets = vi.fn(async () => targetReadResult);

    await expect(
      listBubblophyMcpRunTargets(
        ' user-1 ',
        {
          projectId: ' project_bv ',
          query: ' Co ',
          after: { normalizedLabel: ' CODEX ', id: ' token-20 ' },
        },
        { readTargets, now: '2026-08-30T14:15:16+02:00' }
      )
    ).resolves.toEqual({
      status: 'success',
      project: { id: 'project_bv', key: 'BV', isArchived: false },
      query: 'Co',
      targets: [{ id: 'token_codex', label: 'Codex' }],
      nextAfter: null,
    });
    expect(readTargets).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectId: 'project_bv',
      query: 'Co',
      after: { normalizedLabel: 'codex', id: 'token-20' },
      now: '2026-08-30T12:15:16.000Z',
    });
  });

  it.each([
    [' ', { projectId: 'project_bv' }, 'empty_auth_user'],
    ['user-1', { projectId: ' ' }, 'empty_project'],
    ['user-1', { projectId: 'x'.repeat(201) }, 'invalid_project'],
    ['user-1', { projectId: 'project_bv', query: 'x' }, 'query_too_short'],
    [
      'user-1',
      { projectId: 'project_bv', query: 'x'.repeat(81) },
      'query_too_long',
    ],
    [
      'user-1',
      {
        projectId: 'project_bv',
        after: { normalizedLabel: '', id: 'token-20' },
      },
      'invalid_cursor',
    ],
  ] as const)('rejects invalid public input', async (actor, input, reason) => {
    const readTargets = vi.fn();

    await expect(
      listBubblophyMcpRunTargets(actor, input, { readTargets })
    ).resolves.toEqual({ status: 'invalid', reason });
    expect(readTargets).not.toHaveBeenCalled();
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
          { readTargets }
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

  it('maps missing database access and reader-resolution failures', async () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    await expect(
      listBubblophyMcpRunTargets('user-1', { projectId: 'project_bv' })
    ).resolves.toEqual({ status: 'database_unavailable' });

    const options = Object.defineProperty({}, 'readTargets', {
      get() {
        throw new Error('module initialization detail');
      },
    });

    await expect(
      listBubblophyMcpRunTargets('user-1', { projectId: 'project_bv' }, options)
    ).resolves.toEqual({ status: 'database_unavailable' });

    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  });
});
