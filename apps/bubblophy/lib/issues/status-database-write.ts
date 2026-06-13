import 'server-only';

import type { BubblophyIssueStatus, JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyIssueStatusUpdateStore,
  BubblophyIssueStatusUpdateStoreInput,
} from '@/lib/issues/status';

import { parseBubblophyIssueKey } from '@/lib/issues/plan-database-write';

import { and, eq, sql } from 'drizzle-orm';

import {
  bubblophyIssueEvents,
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

export interface BubblophyIssueStatusChangedEventInsert {
  issueId: string;
  eventType: 'status_changed';
  actorAuthUserId: string;
  actorAgentTokenId: null;
  agentRunId: null;
  summary: string;
  payload: JsonObject;
}

/**
 * Creates the Drizzle-backed store for human issue status updates.
 *
 * @returns Store implementation for server actions.
 */
export function createDrizzleBubblophyIssueStatusUpdateStore(): BubblophyIssueStatusUpdateStore {
  return {
    updateIssueStatusWithEvent,
  };
}

/**
 * Updates an issue status and writes a human audit event after membership check.
 *
 * @param input Authenticated human user, issue key, target status, and reason.
 * @returns Updated issue, `not_found`, or `forbidden`.
 */
async function updateIssueStatusWithEvent(
  input: BubblophyIssueStatusUpdateStoreInput
): ReturnType<BubblophyIssueStatusUpdateStore['updateIssueStatusWithEvent']> {
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
        status: bubblophyIssues.status,
        projectId: bubblophyProjects.id,
        projectKey: bubblophyProjects.key,
        projectName: bubblophyProjects.name,
        memberAuthUserId: bubblophyProjectMembers.authUserId,
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

    if (!currentIssue.memberAuthUserId) {
      return { status: 'forbidden' };
    }

    if (
      shouldSkipBubblophyIssueStatusChangeEvent(
        currentIssue.status,
        input.status
      )
    ) {
      return { status: 'unchanged' };
    }

    const [updatedIssue] = await tx
      .update(bubblophyIssues)
      .set({
        status: input.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(bubblophyIssues.id, currentIssue.id))
      .returning({
        id: bubblophyIssues.id,
        issueNumber: bubblophyIssues.issueNumber,
        title: bubblophyIssues.title,
        status: bubblophyIssues.status,
        priority: bubblophyIssues.priority,
        assignedAuthUserId: bubblophyIssues.assignedAuthUserId,
        requiresHumanApproval: bubblophyIssues.requiresHumanApproval,
      });

    if (!updatedIssue) {
      throw new Error('Bubblophy issue status update did not return a row.');
    }

    const [planCount] = await tx
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(bubblophyIssuePlans)
      .where(eq(bubblophyIssuePlans.issueId, currentIssue.id));

    await tx.insert(bubblophyIssueEvents).values(
      buildBubblophyIssueStatusChangedEventInsert({
        issueDatabaseId: currentIssue.id,
        authUserId: input.authUserId,
        issueId: input.issueId,
        previousStatus: currentIssue.status,
        nextStatus: input.status,
        reason: input.reason,
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
 * Checks whether a status write would be an audit-noisy no-op.
 *
 * @param previousStatus Current persisted issue status.
 * @param nextStatus Requested target issue status.
 * @returns True when no update or `status_changed` event should be written.
 */
export function shouldSkipBubblophyIssueStatusChangeEvent(
  previousStatus: BubblophyIssueStatus,
  nextStatus: BubblophyIssueStatus
) {
  return previousStatus === nextStatus;
}

/**
 * Builds the insert values for a human `status_changed` issue event.
 *
 * @param input Issue, actor, previous status, next status, and optional reason.
 * @returns Insert values for `bubblophy_issue_events`.
 */
export function buildBubblophyIssueStatusChangedEventInsert(input: {
  issueDatabaseId: string;
  authUserId: string;
  issueId: string;
  previousStatus: BubblophyIssueStatus;
  nextStatus: BubblophyIssueStatus;
  reason: string;
}): BubblophyIssueStatusChangedEventInsert {
  return {
    issueId: input.issueDatabaseId,
    eventType: 'status_changed',
    actorAuthUserId: input.authUserId,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: `Status ${input.issueId}: ${input.previousStatus} → ${input.nextStatus}.`,
    payload: {
      source: 'human',
      issueId: input.issueId,
      previousStatus: input.previousStatus,
      nextStatus: input.nextStatus,
      reason: input.reason,
    },
  };
}
