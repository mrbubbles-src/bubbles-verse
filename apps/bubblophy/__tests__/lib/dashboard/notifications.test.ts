// @vitest-environment node

import type {
  DashboardNotificationPage,
  DashboardNotificationPageReader,
  ReadDashboardNotificationPageInput,
} from '@/lib/dashboard/notifications';

import { readDashboardNotificationPage } from '@/lib/dashboard/notifications';

import { describe, expect, it, vi } from 'vitest';

const page: DashboardNotificationPage = {
  project: null,
  items: [],
  nextAfter: null,
};

const invalidCases: Array<{
  authUserId: string;
  input: ReadDashboardNotificationPageInput;
  reason: string;
}> = [
  { authUserId: '', input: {}, reason: 'empty_auth_user' },
  {
    authUserId: 'user-1',
    input: { projectKey: 'bad-key' },
    reason: 'invalid_project_key',
  },
  {
    authUserId: 'user-1',
    input: {
      after: { updatedAt: 'not-a-date', runId: 'run-20' },
    },
    reason: 'invalid_cursor',
  },
  {
    authUserId: 'user-1',
    input: {
      after: {
        updatedAt: '2026-08-31T12:00:00.000Z',
        runId: '',
      },
    },
    reason: 'invalid_cursor',
  },
];

describe('readDashboardNotificationPage', () => {
  it('normalizes the actor, project, and stable cursor before reading', async () => {
    const readPage = vi
      .fn<DashboardNotificationPageReader>()
      .mockResolvedValue(page);

    await expect(
      readDashboardNotificationPage(
        ' user-1 ',
        {
          projectKey: ' bv ',
          after: {
            updatedAt: ' 2026-08-31T12:00:00.000Z ',
            runId: ' run-20 ',
          },
        },
        { readPage }
      )
    ).resolves.toEqual({ status: 'success', ...page });
    expect(readPage).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectKey: 'BV',
      after: {
        updatedAt: '2026-08-31T12:00:00.000Z',
        runId: 'run-20',
      },
    });
  });

  it.each(invalidCases)(
    'rejects invalid public input',
    async ({ authUserId, input, reason }) => {
      const readPage = vi.fn<DashboardNotificationPageReader>();

      await expect(
        readDashboardNotificationPage(authUserId, input, { readPage })
      ).resolves.toEqual({ status: 'invalid', reason });
      expect(readPage).not.toHaveBeenCalled();
    }
  );

  it('maps missing project access and reader failures safely', async () => {
    const missingReader = vi
      .fn<DashboardNotificationPageReader>()
      .mockResolvedValue(null);
    const failingReader = vi
      .fn<DashboardNotificationPageReader>()
      .mockRejectedValue(new Error('secret database detail'));

    await expect(
      readDashboardNotificationPage(
        'user-1',
        { projectKey: 'BV' },
        { readPage: missingReader }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      readDashboardNotificationPage('user-1', {}, { readPage: failingReader })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
