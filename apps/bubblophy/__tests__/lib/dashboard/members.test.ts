import type { DashboardMemberPageReader } from '@/lib/dashboard/members';

import { readDashboardMemberPage } from '@/lib/dashboard/members';

import { describe, expect, it, vi } from 'vitest';

describe('readDashboardMemberPage', () => {
  it('normalizes input and forwards the stable cursor', async () => {
    const readPage = vi.fn<DashboardMemberPageReader>(async (input) => ({
      project: {
        key: input.projectKey,
        name: 'Bubblesverse',
        isArchived: false,
        currentUserRole: 'member',
      },
      items: [],
      nextAfter: null,
    }));

    await expect(
      readDashboardMemberPage(
        ' user-1 ',
        {
          projectKey: ' bv ',
          after: {
            createdAt: ' 2026-07-19T12:00:00.000Z ',
            authUserId: ' user-20 ',
          },
        },
        { readPage }
      )
    ).resolves.toMatchObject({ status: 'success' });
    expect(readPage).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectKey: 'BV',
      after: {
        createdAt: '2026-07-19T12:00:00.000Z',
        authUserId: 'user-20',
      },
    });
  });

  it('rejects invalid identities, projects, and cursors', async () => {
    const readPage = vi.fn<DashboardMemberPageReader>();

    await expect(
      readDashboardMemberPage('', { projectKey: 'BV' }, { readPage })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_auth_user' });
    await expect(
      readDashboardMemberPage('user-1', { projectKey: '!' }, { readPage })
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_project_key' });
    await expect(
      readDashboardMemberPage(
        'user-1',
        {
          projectKey: 'BV',
          after: { createdAt: 'invalid', authUserId: 'user-20' },
        },
        { readPage }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_cursor' });
    expect(readPage).not.toHaveBeenCalled();
  });

  it('maps missing and unavailable readers to safe states', async () => {
    await expect(
      readDashboardMemberPage(
        'user-1',
        { projectKey: 'BV' },
        { readPage: async () => null }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      readDashboardMemberPage(
        'user-1',
        { projectKey: 'BV' },
        {
          readPage: async () => {
            throw new Error('database unavailable');
          },
        }
      )
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
