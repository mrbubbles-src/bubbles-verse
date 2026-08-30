import type {
  DashboardRunTargetOptionsReader,
  DashboardRunTargetOptionsReaderResult,
} from '@/lib/dashboard/run-target-options';

import { readDashboardRunTargetOptions } from '@/lib/dashboard/run-target-options';

import { describe, expect, it, vi } from 'vitest';

const successResult: DashboardRunTargetOptionsReaderResult = {
  status: 'success',
  project: {
    key: 'BV',
    name: 'Bubblesverse',
    currentUserRole: 'member',
  },
  issueKey: 'BV-12',
  query: null,
  after: null,
  items: [],
  nextAfter: null,
};

describe('readDashboardRunTargetOptions', () => {
  it('normalizes the issue, query, cursor, and injected clock', async () => {
    const readOptions = vi.fn<DashboardRunTargetOptionsReader>();
    readOptions.mockResolvedValue(successResult);

    await expect(
      readDashboardRunTargetOptions(
        ' user-1 ',
        {
          issueKey: ' bv-12 ',
          query: ' Mar ',
          after: undefined,
        },
        { readOptions, now: '2026-08-30T14:15:16+02:00' }
      )
    ).resolves.toEqual(successResult);

    expect(readOptions).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectKey: 'BV',
      issueNumber: 12,
      issueKey: 'BV-12',
      query: 'Mar',
      after: null,
      now: '2026-08-30T12:15:16.000Z',
    });
  });

  it('normalizes a blank query and the lower-label cursor', async () => {
    const readOptions = vi.fn<DashboardRunTargetOptionsReader>();
    readOptions.mockResolvedValue(successResult);

    await readDashboardRunTargetOptions(
      'user-1',
      {
        issueKey: 'BV-12',
        query: '  ',
        after: {
          normalizedLabel: '  Zeta  ',
          id: ' token-20 ',
        },
      },
      { readOptions, now: '2026-08-30T12:00:00.000Z' }
    );

    expect(readOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        query: null,
        after: { normalizedLabel: 'zeta', id: 'token-20' },
      })
    );
  });

  it.each([
    ['', { issueKey: 'BV-12' }, 'empty_auth_user'],
    ['user-1', { issueKey: 'invalid' }, 'invalid_issue_key'],
    ['user-1', { issueKey: 'BV-0' }, 'invalid_issue_key'],
    ['user-1', { issueKey: 'BV-2147483648' }, 'invalid_issue_key'],
    ['user-1', { issueKey: 'BV-12', query: 'x' }, 'query_too_short'],
    ['user-1', { issueKey: 'BV-12', query: 'x'.repeat(81) }, 'query_too_long'],
    [
      'user-1',
      {
        issueKey: 'BV-12',
        after: { normalizedLabel: '', id: 'token-20' },
      },
      'invalid_cursor',
    ],
    [
      'user-1',
      {
        issueKey: 'BV-12',
        query: 'token',
        after: { normalizedLabel: 'token', id: 'token-20' },
      },
      'invalid_cursor',
    ],
  ] as const)('rejects invalid public input', async (actor, input, reason) => {
    const readOptions = vi.fn<DashboardRunTargetOptionsReader>();

    await expect(
      readDashboardRunTargetOptions(actor, input, { readOptions })
    ).resolves.toEqual({ status: 'invalid', reason });
    expect(readOptions).not.toHaveBeenCalled();
  });

  it('maps access states and hides reader or missing-database failures', async () => {
    await expect(
      readDashboardRunTargetOptions(
        'user-1',
        { issueKey: 'BV-12' },
        { readOptions: async () => ({ status: 'not_found' }) }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      readDashboardRunTargetOptions(
        'user-1',
        { issueKey: 'BV-12' },
        { readOptions: async () => ({ status: 'forbidden' }) }
      )
    ).resolves.toEqual({ status: 'forbidden' });
    await expect(
      readDashboardRunTargetOptions(
        'user-1',
        { issueKey: 'BV-12' },
        {
          readOptions: async () => {
            throw new Error('database detail');
          },
        }
      )
    ).resolves.toEqual({ status: 'database_unavailable' });

    const previousDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    await expect(
      readDashboardRunTargetOptions('user-1', { issueKey: 'BV-12' })
    ).resolves.toEqual({ status: 'database_unavailable' });
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  });
});
