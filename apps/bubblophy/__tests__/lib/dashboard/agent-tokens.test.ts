import type { DashboardAgentTokenPageReader } from '@/lib/dashboard/agent-tokens';

import { readDashboardAgentTokenPage } from '@/lib/dashboard/agent-tokens';

import { describe, expect, it, vi } from 'vitest';

describe('readDashboardAgentTokenPage', () => {
  it('normalizes all-project input, cursor, and the server clock', async () => {
    const readPage = vi.fn<DashboardAgentTokenPageReader>(async () => ({
      project: null,
      query: 'Codex',
      items: [],
      nextAfter: null,
    }));

    await expect(
      readDashboardAgentTokenPage(
        ' user-1 ',
        {
          after: {
            projectKey: ' bv ',
            normalizedLabel: ' Codex ',
            tokenId: ' token-20 ',
          },
          query: ' Codex ',
        },
        {
          readPage,
          clock: () => new Date('2026-08-31T10:00:00.000Z'),
        }
      )
    ).resolves.toMatchObject({ status: 'success' });
    expect(readPage).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectKey: null,
      query: 'Codex',
      after: {
        projectKey: 'BV',
        normalizedLabel: 'codex',
        tokenId: 'token-20',
      },
      now: '2026-08-31T10:00:00.000Z',
    });
  });

  it('rejects invalid actors, projects, foreign project cursors, and cursors', async () => {
    const readPage = vi.fn<DashboardAgentTokenPageReader>();

    await expect(
      readDashboardAgentTokenPage('', {}, { readPage })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_auth_user' });
    await expect(
      readDashboardAgentTokenPage('user-1', { projectKey: '!' }, { readPage })
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_project_key' });
    await expect(
      readDashboardAgentTokenPage(
        'user-1',
        {
          projectKey: 'BV',
          after: {
            projectKey: 'NO',
            normalizedLabel: 'codex',
            tokenId: 'token-20',
          },
        },
        { readPage }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_cursor' });
    await expect(
      readDashboardAgentTokenPage('user-1', { query: 'x' }, { readPage })
    ).resolves.toEqual({ status: 'invalid', reason: 'query_too_short' });
    await expect(
      readDashboardAgentTokenPage(
        'user-1',
        { query: 'x'.repeat(81) },
        { readPage }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'query_too_long' });
    await expect(
      readDashboardAgentTokenPage(
        'user-1',
        {
          after: {
            projectKey: 'BV',
            normalizedLabel: '',
            tokenId: 'token-20',
          },
        },
        { readPage }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_cursor' });
    expect(readPage).not.toHaveBeenCalled();
  });

  it('maps missing and unavailable readers to safe states', async () => {
    await expect(
      readDashboardAgentTokenPage(
        'user-1',
        { projectKey: 'BV' },
        { readPage: async () => null }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      readDashboardAgentTokenPage(
        'user-1',
        {},
        {
          readPage: async () => {
            throw new Error('tokenHash=secret');
          },
        }
      )
    ).resolves.toEqual({ status: 'database_unavailable' });
  });

  it('isolates default reader initialization failures', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://bubblophy.test/database');
    vi.doMock('@/lib/dashboard/agent-tokens-database-read', () => {
      throw new Error('database client initialization failed');
    });

    await expect(readDashboardAgentTokenPage('user-1')).resolves.toEqual({
      status: 'database_unavailable',
    });

    vi.doUnmock('@/lib/dashboard/agent-tokens-database-read');
    vi.unstubAllEnvs();
  });
});
