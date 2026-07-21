// @vitest-environment node

import type {
  DashboardActivityKind,
  DashboardActivityPage,
  DashboardActivityPageReader,
  ReadDashboardActivityPageInput,
} from '@/lib/dashboard/activity';

import { readDashboardActivityPage } from '@/lib/dashboard/activity';

import { describe, expect, it, vi } from 'vitest';

const page: DashboardActivityPage = {
  filters: { projectKey: 'BV', kind: null },
  items: [],
  nextAfter: null,
};

const invalidCases: Array<{
  authUserId: string;
  input: ReadDashboardActivityPageInput;
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
    input: { kind: 'other' as DashboardActivityKind },
    reason: 'invalid_kind',
  },
  {
    authUserId: 'user-1',
    input: {
      after: {
        occurredAt: 'not-a-date',
        source: 'issue',
        eventId: 'event-1',
      },
    },
    reason: 'invalid_cursor',
  },
];

describe('readDashboardActivityPage', () => {
  it('normalizes a bounded activity request before calling the reader', async () => {
    const readPage = vi
      .fn<DashboardActivityPageReader>()
      .mockResolvedValue(page);

    await expect(
      readDashboardActivityPage(
        ' user-1 ',
        {
          projectKey: ' bv ',
          kind: 'all',
          after: {
            occurredAt: ' 2026-07-21T12:00:00.000Z ',
            source: 'project',
            eventId: ' event-20 ',
          },
        },
        { readPage }
      )
    ).resolves.toEqual({ status: 'success', ...page });
    expect(readPage).toHaveBeenCalledWith({
      authUserId: 'user-1',
      after: {
        occurredAt: '2026-07-21T12:00:00.000Z',
        source: 'project',
        eventId: 'event-20',
      },
      filters: { projectKey: 'BV', kind: null },
    });
  });

  it.each(invalidCases)(
    'rejects invalid public input',
    async ({ authUserId, input, reason }) => {
      const readPage = vi.fn<DashboardActivityPageReader>();

      await expect(
        readDashboardActivityPage(authUserId, input, { readPage })
      ).resolves.toEqual({ status: 'invalid', reason });
      expect(readPage).not.toHaveBeenCalled();
    }
  );

  it('maps inaccessible concrete projects and reader failures safely', async () => {
    const notFoundReader = vi
      .fn<DashboardActivityPageReader>()
      .mockResolvedValue(null);
    const failingReader = vi
      .fn<DashboardActivityPageReader>()
      .mockRejectedValue(new Error('secret database detail'));

    await expect(
      readDashboardActivityPage(
        'user-1',
        { projectKey: 'BV' },
        { readPage: notFoundReader }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      readDashboardActivityPage('user-1', {}, { readPage: failingReader })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
