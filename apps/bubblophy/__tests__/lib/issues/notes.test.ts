import type {
  BubblophyIssueNoteStore,
  BubblophyIssueNoteStoreInput,
} from '@/lib/issues/notes';

import {
  BUBBLOPHY_ISSUE_NOTE_MAX_LENGTH,
  createBubblophyIssueNote,
  normalizeIssueNoteInput,
} from '@/lib/issues/notes';
import { buildBubblophyIssueNoteEventInsert } from '@/lib/issues/notes-database-write';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  handler: (
    input: BubblophyIssueNoteStoreInput
  ) => ReturnType<BubblophyIssueNoteStore['createIssueNoteWithEvent']>
): BubblophyIssueNoteStore {
  return {
    createIssueNoteWithEvent: vi.fn(handler),
  };
}

describe('createBubblophyIssueNote', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects empty and overlong notes before touching the store', async () => {
    const store = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      createBubblophyIssueNote(
        {
          authUserId: 'user_owner',
          issueId: '   ',
          note: 'Review steht.',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_issue' });
    await expect(
      createBubblophyIssueNote(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          note: '   ',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_note' });
    await expect(
      createBubblophyIssueNote(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          note: 'x'.repeat(BUBBLOPHY_ISSUE_NOTE_MAX_LENGTH + 1),
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'note_too_long' });

    expect(store.createIssueNoteWithEvent).not.toHaveBeenCalled();
  });

  it('passes trimmed issue note data to the store', async () => {
    const store = createStore(async (input) => ({
      status: 'created',
      note: {
        id: 'event_note_1',
        note: input.note,
        actor: 'Mensch',
        createdAt: '2026-06-14T10:00:00.000Z',
      },
    }));

    await expect(
      createBubblophyIssueNote(
        {
          authUserId: 'user_owner',
          issueId: ' BV-12 ',
          note: '  Entscheidung bleibt menschlich.  ',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'created',
      note: {
        id: 'event_note_1',
        note: 'Entscheidung bleibt menschlich.',
        actor: 'Mensch',
        createdAt: '2026-06-14T10:00:00.000Z',
      },
    });

    expect(store.createIssueNoteWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      issueId: 'BV-12',
      note: 'Entscheidung bleibt menschlich.',
    });
  });

  it('normalizes optional OAuth client attribution for personal MCP writes', async () => {
    const store = createStore(async (input) => ({
      status: 'created',
      note: {
        id: 'event_note_1',
        note: input.note,
        actor: 'Mensch',
        createdAt: '2026-07-18T12:30:00.000Z',
      },
    }));

    await createBubblophyIssueNote(
      {
        authUserId: 'user_owner',
        oauthClientId: ' client-1 ',
        issueId: 'BV-12',
        note: 'Review abgeschlossen.',
      },
      { store }
    );

    expect(store.createIssueNoteWithEvent).toHaveBeenCalledWith(
      expect.objectContaining({ oauthClientId: 'client-1' })
    );
  });

  it('returns store not_found and forbidden results unchanged', async () => {
    await expect(
      createBubblophyIssueNote(
        {
          authUserId: 'user_owner',
          issueId: 'BV-99',
          note: 'Nicht vorhanden.',
        },
        { store: createStore(async () => ({ status: 'not_found' })) }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      createBubblophyIssueNote(
        {
          authUserId: 'user_viewer',
          issueId: 'BV-12',
          note: 'Viewer darf nicht schreiben.',
        },
        { store: createStore(async () => ({ status: 'forbidden' })) }
      )
    ).resolves.toEqual({ status: 'forbidden' });
  });

  it('returns database_unavailable when no store and no database URL exist', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      createBubblophyIssueNote({
        authUserId: 'user_owner',
        issueId: 'BV-12',
        note: 'Datenbank fehlt.',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});

describe('Bubblophy issue note helpers', () => {
  it('normalizes text after trimming and enforces the 2,000 character limit', () => {
    expect(
      normalizeIssueNoteInput({
        authUserId: 'user_owner',
        issueId: ' BV-12 ',
        note: ` ${'x'.repeat(BUBBLOPHY_ISSUE_NOTE_MAX_LENGTH)} `,
      })
    ).toEqual({
      status: 'valid',
      input: {
        authUserId: 'user_owner',
        issueId: 'BV-12',
        note: 'x'.repeat(BUBBLOPHY_ISSUE_NOTE_MAX_LENGTH),
      },
    });

    expect(
      normalizeIssueNoteInput({
        authUserId: 'user_owner',
        issueId: 'BV-12',
        note: 'x'.repeat(BUBBLOPHY_ISSUE_NOTE_MAX_LENGTH + 1),
      })
    ).toEqual({ status: 'invalid', reason: 'note_too_long' });
  });

  it('builds an append-only issue note event with explicit metadata', () => {
    expect(
      buildBubblophyIssueNoteEventInsert({
        issueDatabaseId: 'issue_bv_12',
        authUserId: 'user_owner',
        issueId: 'BV-12',
        note: 'Plan-Review ist abgeschlossen.',
      })
    ).toEqual({
      issueId: 'issue_bv_12',
      eventType: 'commented',
      actorAuthUserId: 'user_owner',
      actorOauthClientId: null,
      actorAgentTokenId: null,
      agentRunId: null,
      summary: 'Plan-Review ist abgeschlossen.',
      payload: {
        source: 'human',
        entity: 'issue_note',
        action: 'created',
        issueId: 'BV-12',
      },
    });
  });

  it('builds OAuth-attributed issue notes for personal MCP writes', () => {
    expect(
      buildBubblophyIssueNoteEventInsert({
        issueDatabaseId: 'issue_bv_12',
        authUserId: 'user_owner',
        oauthClientId: 'client-1',
        issueId: 'BV-12',
        note: 'Review abgeschlossen.',
      })
    ).toMatchObject({
      actorAuthUserId: 'user_owner',
      actorOauthClientId: 'client-1',
      actorAgentTokenId: null,
      payload: { source: 'oauth_mcp' },
    });
  });
});
