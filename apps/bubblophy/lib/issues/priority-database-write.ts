import 'server-only';

import type { BubblophyIssuePriority, JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyIssuePriorityUpdateStore,
  BubblophyIssuePriorityUpdateStoreInput,
} from '@/lib/issues/priority';

import { parseBubblophyIssueKey } from '@/lib/issues/plan-database-write';

import { and, eq, sql } from 'drizzle-orm';

import {
  bubblophyIssueEvents,
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

export interface BubblophyIssuePriorityChangedEventInsert {
  issueId: string;
  eventType: 'commented';
  actorAuthUserId: string;
  actorAgentTokenId: null;
  agentRunId: null;
  summary: string;
  payload: JsonObject;
}

/**
 * Creates the Drizzle-backed store for human issue priority updates.
 *
 * @returns Store implementation for server actions.
 */
export function createDrizzleBubblophyIssuePriorityUpdateStore(): BubblophyIssuePriorityUpdateStore {
  return {
    updateIssuePriorityWithEvent,
  };
}

/**
 * Updates an issue priority and writes a human audit event after role checks.
 *
 * @param input Authenticated human user, issue key, and target priority.
 * @returns Updated issue, `unchanged`, `not_found`, or `forbidden`.
 */
async function updateIssuePriorityWithEvent(
  input: BubblophyIssuePriorityUpdateStoreInput
): ReturnType<BubblophyIssuePriorityUpdateStore['updateIssuePriorityWithEvent']> {
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
        priority: bubblophyIssues.priority,
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
      !canMutateBubblophyIssuePriority(currentIssue.memberRole)
    ) {
      return { status: 'forbidden' };
    }

    if (
      shouldSkipBubblophyIssuePriorityChangeEvent(
        currentIssue.priority,
        input.priority
      )
    ) {
      return { status: 'unchanged' };
    }

    const [updatedIssue] = await tx
      .update(bubblophyIssues)
      .set({
        priority: input.priority,
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
      throw new Error('Bubblophy issue priority update did not return a row.');
    }

    const [planCount] = await tx
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(bubblophyIssuePlans)
      .where(eq(bubblophyIssuePlans.issueId, currentIssue.id));

    await tx.insert(bubblophyIssueEvents).values(
      buildBubblophyIssuePriorityChangedEventInsert({
        issueDatabaseId: currentIssue.id,
        authUserId: input.authUserId,
        issueId: input.issueId,
        previousPriority: currentIssue.priority,
        nextPriority: input.priority,
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
 * Checks whether a project role may mutate issue priority.
 *
 * @param role Project membership role from persistence.
 * @returns True for contributors, false for read-only viewers.
 */
export function canMutateBubblophyIssuePriority(role: string) {
  return ['owner', 'maintainer', 'member'].includes(role);
}

/**
 * Checks whether a priority write would be an audit-noisy no-op.
 *
 * @param previousPriority Current persisted issue priority.
 * @param nextPriority Requested target issue priority.
 * @returns True when no update or event should be written.
 */
export function shouldSkipBubblophyIssuePriorityChangeEvent(
  previousPriority: BubblophyIssuePriority,
  nextPriority: BubblophyIssuePriority
) {
  return previousPriority === nextPriority;
}

/**
 * Builds the insert values for a human issue priority change event.
 *
 * @param input Issue, actor, previous priority, and next priority.
 * @returns Insert values for `bubblophy_issue_events`.
 */
export function buildBubblophyIssuePriorityChangedEventInsert(input: {
  issueDatabaseId: string;
  authUserId: string;
  issueId: string;
  previousPriority: BubblophyIssuePriority;
  nextPriority: BubblophyIssuePriority;
}): BubblophyIssuePriorityChangedEventInsert {
  return {
    issueId: input.issueDatabaseId,
    eventType: 'commented',
    actorAuthUserId: input.authUserId,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: `Priorität ${input.issueId}: ${input.previousPriority} -> ${input.nextPriority}.`,
    payload: {
      source: 'human',
      entity: 'issue',
      action: 'priority_changed',
      issueId: input.issueId,
      previousPriority: input.previousPriority,
      nextPriority: input.nextPriority,
      changedFields: ['priority'],
    },
  };
}
