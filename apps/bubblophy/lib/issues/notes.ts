import 'server-only';

import type { IssueNoteSummary } from '@/lib/dashboard/types';

export const BUBBLOPHY_ISSUE_NOTE_MAX_LENGTH = 2000;

export interface CreateBubblophyIssueNoteInput {
  authUserId: string;
  oauthClientId?: string;
  issueId: string;
  note: string;
}

export interface BubblophyIssueNoteStoreInput {
  authUserId: string;
  oauthClientId?: string;
  issueId: string;
  note: string;
}

export interface BubblophyIssueNoteStore {
  createIssueNoteWithEvent(input: BubblophyIssueNoteStoreInput): Promise<
    | {
        status: 'created';
        note: IssueNoteSummary;
      }
    | {
        status: 'not_found';
      }
    | {
        status: 'forbidden';
      }
  >;
}

export type CreateBubblophyIssueNoteResult =
  | {
      status: 'created';
      note: IssueNoteSummary;
    }
  | {
      status: 'invalid';
      reason: 'empty_issue' | 'empty_note' | 'note_too_long';
    }
  | {
      status: 'not_found';
    }
  | {
      status: 'forbidden';
    }
  | {
      status: 'database_unavailable';
    };

export interface CreateBubblophyIssueNoteOptions {
  store?: BubblophyIssueNoteStore;
}

/**
 * Appends a human-readable issue note after server-side validation.
 *
 * The note is trimmed, bounded to the issue-note contract, and persisted as an
 * append-only issue event. This never edits plans or starts agent runs.
 *
 * @param input Authenticated user ID, issue key, and note text.
 * @param options Optional store override for tests.
 * @returns Structured result for the dashboard note form.
 */
export async function createBubblophyIssueNote(
  input: CreateBubblophyIssueNoteInput,
  options: CreateBubblophyIssueNoteOptions = {}
): Promise<CreateBubblophyIssueNoteResult> {
  const normalized = normalizeIssueNoteInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultIssueNoteStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  return store.createIssueNoteWithEvent(normalized.input);
}

/**
 * Normalizes issue-note input before persistence.
 *
 * @param input Raw action input plus authenticated user ID.
 * @returns Store input with trimmed text or a validation result.
 */
export function normalizeIssueNoteInput(input: CreateBubblophyIssueNoteInput):
  | {
      status: 'valid';
      input: BubblophyIssueNoteStoreInput;
    }
  | Extract<CreateBubblophyIssueNoteResult, { status: 'invalid' }> {
  const issueId = input.issueId.trim();
  const oauthClientId = input.oauthClientId?.trim();
  const note = input.note.trim();

  if (!issueId) {
    return { status: 'invalid', reason: 'empty_issue' };
  }

  if (!note) {
    return { status: 'invalid', reason: 'empty_note' };
  }

  if (note.length > BUBBLOPHY_ISSUE_NOTE_MAX_LENGTH) {
    return { status: 'invalid', reason: 'note_too_long' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      ...(oauthClientId ? { oauthClientId } : {}),
      issueId,
      note,
    },
  };
}

/**
 * Loads the production issue-note store when the database is configured.
 *
 * @returns Drizzle-backed store, or undefined when the database is unavailable.
 */
async function getDefaultIssueNoteStore() {
  if (!process.env.DATABASE_URL) {
    return undefined;
  }

  const { createDrizzleBubblophyIssueNoteStore } =
    await import('@/lib/issues/notes-database-write');

  return createDrizzleBubblophyIssueNoteStore();
}
