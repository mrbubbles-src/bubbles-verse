import { beforeEach, describe, expect, it, vi } from 'vitest';

const lockWriteContextMock = vi.fn();
const returningMock = vi.fn();
const insertValuesMock = vi.fn(() => ({ returning: returningMock }));
const txMock = {
  insert: vi.fn(() => ({ values: insertValuesMock })),
};
const dbMock = {
  transaction: vi.fn(
    async <Result>(
      handler: (tx: typeof txMock) => Promise<Result>
    ): Promise<Result> => handler(txMock)
  ),
};

vi.mock('@/lib/issues/contributor-write-context-database', () => ({
  lockBubblophyIssueContributorWriteContext: (
    tx: typeof txMock,
    input: { authUserId: string; projectKey: string; issueNumber: number }
  ) => lockWriteContextMock(tx, input),
}));

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

beforeEach(() => {
  lockWriteContextMock.mockReset();
  returningMock.mockReset();
  insertValuesMock.mockClear();
  txMock.insert.mockClear();
  dbMock.transaction.mockClear();
});

describe('Drizzle issue note store', () => {
  it('writes one OAuth-attributed event after the shared locked recheck', async () => {
    lockWriteContextMock.mockResolvedValue({
      status: 'ready',
      issueDatabaseId: 'issue_bv_12',
    });
    returningMock.mockResolvedValue([
      {
        id: 'event_note_1',
        summary: 'Review abgeschlossen.',
        createdAt: '2026-07-18T12:30:00.000Z',
      },
    ]);
    const { createDrizzleBubblophyIssueNoteStore } =
      await import('@/lib/issues/notes-database-write');

    await expect(
      createDrizzleBubblophyIssueNoteStore().createIssueNoteWithEvent({
        authUserId: 'user_member',
        oauthClientId: 'client-1',
        issueId: 'BV-12',
        note: 'Review abgeschlossen.',
      })
    ).resolves.toEqual({
      status: 'created',
      note: {
        id: 'event_note_1',
        note: 'Review abgeschlossen.',
        actor: 'Mensch',
        createdAt: '2026-07-18T12:30:00.000Z',
      },
    });

    expect(lockWriteContextMock).toHaveBeenCalledWith(txMock, {
      authUserId: 'user_member',
      projectKey: 'BV',
      issueNumber: 12,
    });
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        issueId: 'issue_bv_12',
        actorAuthUserId: 'user_member',
        actorOauthClientId: 'client-1',
        actorAgentTokenId: null,
        agentRunId: null,
        payload: expect.objectContaining({ source: 'oauth_mcp' }),
      })
    );
  });

  it.each([
    ['forbidden', { status: 'forbidden' }],
    ['not_found', { status: 'not_found' }],
  ] as const)(
    'returns %s from the shared recheck without inserting',
    async (_label, contextResult) => {
      lockWriteContextMock.mockResolvedValue(contextResult);
      const { createDrizzleBubblophyIssueNoteStore } =
        await import('@/lib/issues/notes-database-write');

      await expect(
        createDrizzleBubblophyIssueNoteStore().createIssueNoteWithEvent({
          authUserId: 'user_viewer',
          oauthClientId: 'client-1',
          issueId: 'BV-12',
          note: 'Nicht erlaubt.',
        })
      ).resolves.toEqual(contextResult);
      expect(txMock.insert).not.toHaveBeenCalled();
    }
  );
});
