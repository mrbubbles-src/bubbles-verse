import type { DashboardRunPageReader } from '@/lib/dashboard/runs';

import { readDashboardRunPage } from '@/lib/dashboard/runs';

import { describe, expect, it, vi } from 'vitest';

describe('readDashboardRunPage', () => {
  it('normalizes input and forwards the stable cursor', async () => {
    const readPage = vi.fn<DashboardRunPageReader>(async (input) => ({
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
      readDashboardRunPage(
        ' user-1 ',
        {
          projectKey: ' bv ',
          after: {
            updatedAt: ' 2026-07-19T12:00:00.000Z ',
            id: ' run-20 ',
          },
        },
        { readPage }
      )
    ).resolves.toMatchObject({ status: 'success' });
    expect(readPage).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectKey: 'BV',
      after: {
        updatedAt: '2026-07-19T12:00:00.000Z',
        id: 'run-20',
      },
    });
  });

  it('rejects invalid identities, projects, and partial cursors', async () => {
    const readPage = vi.fn<DashboardRunPageReader>();

    await expect(
      readDashboardRunPage('', { projectKey: 'BV' }, { readPage })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_auth_user' });
    await expect(
      readDashboardRunPage('user-1', { projectKey: '!' }, { readPage })
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_project_key' });
    await expect(
      readDashboardRunPage(
        'user-1',
        { projectKey: 'BV', after: { updatedAt: 'invalid', id: 'run' } },
        { readPage }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_cursor' });
    expect(readPage).not.toHaveBeenCalled();
  });

  it('maps missing and unavailable readers to safe states', async () => {
    await expect(
      readDashboardRunPage(
        'user-1',
        { projectKey: 'BV' },
        {
          readPage: async () => null,
        }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      readDashboardRunPage(
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
