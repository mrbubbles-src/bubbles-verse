import type {
  DashboardAssigneeOptionsReader,
  DashboardAssigneeOptionsReaderResult,
} from '@/lib/dashboard/assignee-options';

import { readDashboardAssigneeOptions } from '@/lib/dashboard/assignee-options';

import { describe, expect, it, vi } from 'vitest';

const successResult: DashboardAssigneeOptionsReaderResult = {
  status: 'success',
  project: {
    key: 'BV',
    name: 'Bubblesverse',
    currentUserRole: 'member',
  },
  issueKey: 'BV-12',
  query: 'mar',
  after: null,
  currentAssignee: null,
  items: [],
  nextAfter: null,
};

describe('readDashboardAssigneeOptions', () => {
  it('normalizes the issue and Auth user ID query fingerprint', async () => {
    const readOptions = vi.fn<DashboardAssigneeOptionsReader>();
    readOptions.mockResolvedValue(successResult);

    await expect(
      readDashboardAssigneeOptions(
        ' user-1 ',
        {
          issueKey: ' bv-12 ',
          query: ' mar ',
        },
        { readOptions }
      )
    ).resolves.toEqual(successResult);
    expect(readOptions).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectKey: 'BV',
      issueNumber: 12,
      issueKey: 'BV-12',
      query: 'mar',
      after: null,
    });
  });

  it('canonicalizes a blank query and normalizes its stable cursor', async () => {
    const readOptions = vi.fn<DashboardAssigneeOptionsReader>();
    const cursor = {
      createdAt: '2026-07-19T12:00:00.000Z',
      authUserId: 'user-20',
    };
    readOptions.mockResolvedValue({
      ...successResult,
      query: null,
      after: cursor,
    });

    await readDashboardAssigneeOptions(
      'user-1',
      {
        issueKey: 'BV-12',
        query: '  ',
        after: {
          createdAt: ` ${cursor.createdAt} `,
          authUserId: ` ${cursor.authUserId} `,
        },
      },
      { readOptions }
    );

    expect(readOptions).toHaveBeenCalledWith(
      expect.objectContaining({ query: null, after: cursor })
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
        after: { createdAt: 'invalid', authUserId: 'user-20' },
      },
      'invalid_cursor',
    ],
    [
      'user-1',
      {
        issueKey: 'BV-12',
        query: 'user',
        after: {
          createdAt: '2026-07-19T12:00:00.000Z',
          authUserId: 'user-20',
        },
      },
      'invalid_cursor',
    ],
  ] as const)('rejects invalid public input', async (actor, input, reason) => {
    const readOptions = vi.fn<DashboardAssigneeOptionsReader>();

    await expect(
      readDashboardAssigneeOptions(actor, input, { readOptions })
    ).resolves.toEqual({ status: 'invalid', reason });
    expect(readOptions).not.toHaveBeenCalled();
  });

  it('preserves safe access states and hides reader failures', async () => {
    await expect(
      readDashboardAssigneeOptions(
        'user-1',
        { issueKey: 'BV-12' },
        { readOptions: async () => ({ status: 'not_found' }) }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      readDashboardAssigneeOptions(
        'user-1',
        { issueKey: 'BV-12' },
        { readOptions: async () => ({ status: 'forbidden' }) }
      )
    ).resolves.toEqual({ status: 'forbidden' });
    await expect(
      readDashboardAssigneeOptions(
        'user-1',
        { issueKey: 'BV-12' },
        {
          readOptions: async () => {
            throw new Error('database detail');
          },
        }
      )
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
