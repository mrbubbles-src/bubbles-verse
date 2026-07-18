import 'server-only';

import type { BubblophyIssueStatus, JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyIssueStatusUpdateStore,
  BubblophyIssueStatusUpdateStoreInput,
} from '@/lib/issues/status';

import { lockBubblophyIssueContributorWriteContext } from '@/lib/issues/contributor-write-context-database';
import { parseBubblophyIssueKey } from '@/lib/issues/plan-database-write';

import { eq, sql } from 'drizzle-orm';

import {
  bubblophyIssueEvents,
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjects,
} from '@/drizzle/db/schema';

export interface BubblophyIssueStatusChangedEventInsert {
  issueId: string;
  eventType: 'status_changed';
  actorAuthUserId: string;
  actorOauthClientId: string | null;
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
 * Updates an issue status after locking its project, issue, and membership.
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
    const writeContext = await lockBubblophyIssueContributorWriteContext(tx, {
      authUserId: input.authUserId,
      projectKey: issueKey.projectKey,
      issueNumber: issueKey.issueNumber,
    });

    if (writeContext.status !== 'ready') {
      return writeContext;
    }

    const [currentIssue] = await tx
      .select({
        id: bubblophyIssues.id,
        issueNumber: bubblophyIssues.issueNumber,
        status: bubblophyIssues.status,
        projectId: bubblophyProjects.id,
        projectKey: bubblophyProjects.key,
        projectName: bubblophyProjects.name,
      })
      .from(bubblophyIssues)
      .innerJoin(
        bubblophyProjects,
        eq(bubblophyProjects.id, bubblophyIssues.projectId)
      )
      .where(eq(bubblophyIssues.id, writeContext.issueDatabaseId))
      .limit(1);

    if (!currentIssue) {
      throw new Error('Locked Bubblophy issue could not be reloaded.');
    }

    if (input.expectedStatus && currentIssue.status !== input.expectedStatus) {
      return { status: 'conflict' };
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
        oauthClientId: input.oauthClientId,
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
 * Builds the insert values for a human or OAuth status-change event.
 *
 * @param input Issue, actor, previous status, next status, and optional reason.
 * @returns Insert values for `bubblophy_issue_events`.
 */
export function buildBubblophyIssueStatusChangedEventInsert(input: {
  issueDatabaseId: string;
  authUserId: string;
  oauthClientId?: string;
  issueId: string;
  previousStatus: BubblophyIssueStatus;
  nextStatus: BubblophyIssueStatus;
  reason: string;
}): BubblophyIssueStatusChangedEventInsert {
  return {
    issueId: input.issueDatabaseId,
    eventType: 'status_changed',
    actorAuthUserId: input.authUserId,
    actorOauthClientId: input.oauthClientId ?? null,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: `Status ${input.issueId}: ${input.previousStatus} → ${input.nextStatus}.`,
    payload: {
      source: input.oauthClientId ? 'oauth_mcp' : 'human',
      issueId: input.issueId,
      previousStatus: input.previousStatus,
      nextStatus: input.nextStatus,
      reason: input.reason,
    },
  };
}
