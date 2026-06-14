import 'server-only';

import type { JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyIssueNoteStore,
  BubblophyIssueNoteStoreInput,
} from '@/lib/issues/notes';

import { parseBubblophyIssueKey } from '@/lib/issues/plan-database-write';
import { canCreateBubblophyIssueNote } from '@/lib/issues/notes';

import { and, eq } from 'drizzle-orm';

import {
  bubblophyIssueEvents,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

export interface BubblophyIssueNoteEventInsert {
  issueId: string;
  eventType: 'commented';
  actorAuthUserId: string;
  actorAgentTokenId: null;
  agentRunId: null;
  summary: string;
  payload: JsonObject;
}

/**
 * Creates the Drizzle-backed store for append-only human issue notes.
 *
 * @returns Store implementation for server actions.
 */
export function createDrizzleBubblophyIssueNoteStore(): BubblophyIssueNoteStore {
  return {
    createIssueNoteWithEvent,
  };
}

/**
 * Appends an issue note event after project membership and archive checks.
 *
 * @param input Authenticated human user, issue key, and normalized note text.
 * @returns Created note, `not_found`, or `forbidden`.
 */
async function createIssueNoteWithEvent(
  input: BubblophyIssueNoteStoreInput
): ReturnType<BubblophyIssueNoteStore['createIssueNoteWithEvent']> {
  const issueKey = parseBubblophyIssueKey(input.issueId);

  if (!issueKey) {
    return { status: 'not_found' };
  }

  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const [currentIssue] = await tx
      .select({
        id: bubblophyIssues.id,
        memberAuthUserId: bubblophyProjectMembers.authUserId,
        memberRole: bubblophyProjectMembers.role,
      })
      .from(bubblophyIssues)
      .innerJoin(
        bubblophyProjects,
        eq(bubblophyProjects.id, bubblophyIssues.projectId)
      )
      .leftJoin(
        bubblophyProjectMembers,
        and(
          eq(bubblophyProjectMembers.projectId, bubblophyProjects.id),
          eq(bubblophyProjectMembers.authUserId, input.authUserId)
        )
      )
      .where(
        and(
          eq(bubblophyProjects.key, issueKey.projectKey),
          eq(bubblophyProjects.isArchived, false),
          eq(bubblophyIssues.issueNumber, issueKey.issueNumber)
        )
      )
      .limit(1);

    if (!currentIssue) {
      return { status: 'not_found' };
    }

    if (
      !currentIssue.memberAuthUserId ||
      !currentIssue.memberRole ||
      !canCreateBubblophyIssueNote(currentIssue.memberRole)
    ) {
      return { status: 'forbidden' };
    }

    const [createdEvent] = await tx
      .insert(bubblophyIssueEvents)
      .values(
        buildBubblophyIssueNoteEventInsert({
          issueDatabaseId: currentIssue.id,
          authUserId: input.authUserId,
          issueId: input.issueId,
          note: input.note,
        })
      )
      .returning({
        id: bubblophyIssueEvents.id,
        summary: bubblophyIssueEvents.summary,
        createdAt: bubblophyIssueEvents.createdAt,
      });

    if (!createdEvent) {
      throw new Error('Bubblophy issue note insert did not return a row.');
    }

    return {
      status: 'created',
      note: {
        id: createdEvent.id,
        note: createdEvent.summary,
        actor: 'Mensch',
        createdAt: createdEvent.createdAt,
      },
    };
  });
}

/**
 * Builds the insert values for a human-created issue note event.
 *
 * @param input Issue database ID, dashboard issue key, actor, and note text.
 * @returns Insert values for `bubblophy_issue_events`.
 */
export function buildBubblophyIssueNoteEventInsert(input: {
  issueDatabaseId: string;
  authUserId: string;
  issueId: string;
  note: string;
}): BubblophyIssueNoteEventInsert {
  return {
    issueId: input.issueDatabaseId,
    eventType: 'commented',
    actorAuthUserId: input.authUserId,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: input.note,
    payload: {
      source: 'human',
      entity: 'issue_note',
      action: 'created',
      issueId: input.issueId,
    },
  };
}
