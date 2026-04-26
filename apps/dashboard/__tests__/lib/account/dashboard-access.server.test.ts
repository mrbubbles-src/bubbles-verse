import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbSelectMock = vi.fn();
const dbFromMock = vi.fn();
const dbWhereMock = vi.fn();
const dbLimitMock = vi.fn();

vi.mock('@/drizzle/db', () => ({
  db: {
    select: () => dbSelectMock(),
  },
}));

describe('dashboard access server reads', () => {
  beforeEach(() => {
    dbSelectMock.mockReset();
    dbFromMock.mockReset();
    dbWhereMock.mockReset();
    dbLimitMock.mockReset();

    dbSelectMock.mockReturnValue({
      from: dbFromMock,
    });
    dbFromMock.mockReturnValue({
      where: dbWhereMock,
    });
    dbWhereMock.mockReturnValue({
      limit: dbLimitMock,
    });
  });

  it('retries one statement-timeout access read', async () => {
    const accessEntry = {
      githubUsername: 'mrbubbles-src',
      email: 'manuel.fahrenholz@mrbubbles-src.dev',
      note: null,
      userRole: 'owner',
      dashboardAccess: true,
      createdAt: '2026-04-18T00:00:00.000Z',
    };

    dbLimitMock
      .mockRejectedValueOnce(
        Object.assign(
          new Error('canceling statement due to statement timeout'),
          {
            code: '57014',
          }
        )
      )
      .mockResolvedValueOnce([accessEntry]);

    const { getDashboardAccessEntryByIdentity } =
      await import('@/lib/account/dashboard-access');

    await expect(
      getDashboardAccessEntryByIdentity({
        githubUsername: 'mrbubbles-src',
        email: 'manuel.fahrenholz@mrbubbles-src.dev',
      })
    ).resolves.toEqual(accessEntry);
    expect(dbLimitMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-timeout access read errors', async () => {
    dbLimitMock.mockRejectedValueOnce(new Error('permission denied'));

    const { getDashboardAccessEntryByIdentity } =
      await import('@/lib/account/dashboard-access');

    await expect(
      getDashboardAccessEntryByIdentity({
        githubUsername: 'mrbubbles-src',
        email: 'manuel.fahrenholz@mrbubbles-src.dev',
      })
    ).rejects.toThrow('permission denied');
    expect(dbLimitMock).toHaveBeenCalledTimes(1);
  });
});
