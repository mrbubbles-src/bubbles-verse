import 'server-only';

import type { JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyIssueContentUpdateStore,
  BubblophyIssueContentUpdateStoreInput,
} from '@/lib/issues/edit';

import { parseBubblophyIssueKey } from '@/lib/issues/plan-database-write';

import { and, eq, sql } from 'drizzle-orm';

import {
  bubblophyIssueEvents,
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

type IssueContentField = 'title' | 'description';

export interface BubblophyIssueUpdatedEventInsert {
  issueId: string;
  eventType: 'commented';
  actorAuthUserId: string;
  actorAgentTokenId: null;
  agentRunId: null;
  summary: string;
  payload: JsonObject;
}

/**
 * Creates the Drizzle-backed store for human issue content updates.
 *
 * @returns Store implementation for server actions.
 */
export function createDrizzleBubblophyIssueContentUpdateStore(): BubblophyIssueContentUpdateStore {
  return {
    updateIssueContentWithEvent,
  };
}

/**
 * Updates title/description and writes a human audit event after role checks.
 *
 * @param input Authenticated human user, issue key, and normalized content.
 * @returns Updated issue, `unchanged`, `not_found`, or `forbidden`.
 */
async function updateIssueContentWithEvent(
  input: BubblophyIssueContentUpdateStoreInput
): ReturnType<BubblophyIssueContentUpdateStore['updateIssueContentWithEvent']> {
  const issueKey = parseBubblophyIssueKey(input.issueId);

  if (!issueKey) {
    return { status: 'not_found' };
  }

  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const [currentIssue] = await tx
      .select({
        id: bubblophyIssues.id,
        issueNumber: bubblophyIssues.issueNumber,
        title: bubblophyIssues.title,
        description: bubblophyIssues.description,
        status: bubblophyIssues.status,
        projectId: bubblophyProjects.id,
        projectKey: bubblophyProjects.key,
        projectName: bubblophyProjects.name,
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
      !canMutateBubblophyIssueContent(currentIssue.memberRole)
    ) {
      return { status: 'forbidden' };
    }

    const changedFields = getChangedBubblophyIssueContentFields({
      current: currentIssue,
      next: input,
    });

    if (changedFields.length === 0) {
      return { status: 'unchanged' };
    }

    const [updatedIssue] = await tx
      .update(bubblophyIssues)
      .set({
        title: input.title,
        description: input.description,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(bubblophyIssues.id, currentIssue.id))
      .returning({
        id: bubblophyIssues.id,
        issueNumber: bubblophyIssues.issueNumber,
        title: bubblophyIssues.title,
        description: bubblophyIssues.description,
        status: bubblophyIssues.status,
        priority: bubblophyIssues.priority,
        assignedAuthUserId: bubblophyIssues.assignedAuthUserId,
        requiresHumanApproval: bubblophyIssues.requiresHumanApproval,
      });

    if (!updatedIssue) {
      throw new Error('Bubblophy issue content update did not return a row.');
    }

    const [planCount] = await tx
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(bubblophyIssuePlans)
      .where(eq(bubblophyIssuePlans.issueId, currentIssue.id));

    await tx.insert(bubblophyIssueEvents).values(
      buildBubblophyIssueUpdatedEventInsert({
        issueDatabaseId: currentIssue.id,
        authUserId: input.authUserId,
        issueId: input.issueId,
        changedFields,
      })
    );

    return {
      status: 'updated',
      issue: {
        project: {
          id: currentIssue.projectId,
          key: currentIssue.projectKey,
          name: currentIssue.projectName,
        },
        issue: {
          ...updatedIssue,
          planStepCount: Math.max(0, planCount?.count ?? 0),
        },
      },
    };
  });
}

/**
 * Checks whether a project role may mutate issue content.
 *
 * @param role Project membership role from persistence.
 * @returns True for contributors, false for read-only viewers.
 */
export function canMutateBubblophyIssueContent(role: string) {
  return ['owner', 'maintainer', 'member'].includes(role);
}

/**
 * Returns the content fields changed by an edit request.
 *
 * @param input Current issue content and requested next content.
 * @returns Stable field list for no-op detection and audit payloads.
 */
export function getChangedBubblophyIssueContentFields(input: {
  current: {
    title: string;
    description: string;
  };
  next: {
    title: string;
    description: string;
  };
}): IssueContentField[] {
  return [
    input.current.title === input.next.title ? null : 'title',
    input.current.description === input.next.description ? null : 'description',
  ].filter((field): field is IssueContentField => field !== null);
}

/**
 * Builds the insert values for a human issue content edit event.
 *
 * @param input Issue, actor, and changed fields.
 * @returns Insert values for `bubblophy_issue_events`.
 */
export function buildBubblophyIssueUpdatedEventInsert(input: {
  issueDatabaseId: string;
  authUserId: string;
  issueId: string;
  changedFields: IssueContentField[];
}): BubblophyIssueUpdatedEventInsert {
  return {
    issueId: input.issueDatabaseId,
    eventType: 'commented',
    actorAuthUserId: input.authUserId,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: `Issue ${input.issueId} bearbeitet.`,
    payload: {
      source: 'human',
      entity: 'issue',
      action: 'updated',
      issueId: input.issueId,
      changedFields: input.changedFields,
    },
  };
}
