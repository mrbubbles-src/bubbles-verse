import 'server-only';

import type { db as bubblophyDb } from '@/drizzle/db';
import type { JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyIssueAssigneeUpdateStore,
  BubblophyIssueAssigneeUpdateStoreInput,
} from '@/lib/issues/assignment';

import { lockBubblophyIssueContributorWriteContext } from '@/lib/issues/contributor-write-context-database';
import { parseBubblophyIssueKey } from '@/lib/issues/plan-database-write';

import { and, eq, sql } from 'drizzle-orm';

import {
  bubblophyIssueEvents,
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
  bubblophyUserProfiles,
} from '@/drizzle/db/schema';

type BubblophyIssueAssigneeUpdateTx = Parameters<
  Parameters<typeof bubblophyDb.transaction>[0]
>[0];

export interface BubblophyIssueAssigneeChangedEventInsert {
  issueId: string;
  eventType: 'commented';
  actorAuthUserId: string;
  actorAgentTokenId: null;
  agentRunId: null;
  summary: string;
  payload: JsonObject;
}

/**
 * Creates the Drizzle-backed store for human issue assignment updates.
 *
 * @returns Store implementation for server actions.
 */
export function createDrizzleBubblophyIssueAssigneeUpdateStore(): BubblophyIssueAssigneeUpdateStore {
  return {
    updateIssueAssigneeWithEvent,
  };
}

/**
 * Updates an issue assignee and writes a human audit event after role checks.
 *
 * @param input Authenticated human user, issue key, and assignee member ID.
 * @returns Updated issue or a structured denial/no-op result.
 */
async function updateIssueAssigneeWithEvent(
  input: BubblophyIssueAssigneeUpdateStoreInput
): ReturnType<
  BubblophyIssueAssigneeUpdateStore['updateIssueAssigneeWithEvent']
> {
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
      relatedAuthUserIds: input.assigneeAuthUserId
        ? [input.assigneeAuthUserId]
        : [],
    });

    if (writeContext.status !== 'ready') {
      return writeContext;
    }

    if (
      input.assigneeAuthUserId &&
      !writeContext.memberships.some(
        (membership) => membership.authUserId === input.assigneeAuthUserId
      )
    ) {
      return { status: 'invalid_assignee' };
    }

    const [currentIssue] = await tx
      .select({
        id: bubblophyIssues.id,
        issueNumber: bubblophyIssues.issueNumber,
        assignedAuthUserId: bubblophyIssues.assignedAuthUserId,
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

    if (
      shouldSkipBubblophyIssueAssigneeChangeEvent(
        currentIssue.assignedAuthUserId,
        input.assigneeAuthUserId
      )
    ) {
      return { status: 'unchanged' };
    }

    const [updatedIssue] = await tx
      .update(bubblophyIssues)
      .set({
        assignedAuthUserId: input.assigneeAuthUserId,
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
      throw new Error('Bubblophy issue assignee update did not return a row.');
    }

    const assigneeLabel = await selectCurrentAssigneeLabel(tx, {
      projectId: writeContext.projectId,
      assigneeAuthUserId: updatedIssue.assignedAuthUserId,
    });

    const [planCount] = await tx
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(bubblophyIssuePlans)
      .where(eq(bubblophyIssuePlans.issueId, currentIssue.id));

    await tx.insert(bubblophyIssueEvents).values(
      buildBubblophyIssueAssigneeChangedEventInsert({
        issueDatabaseId: currentIssue.id,
        authUserId: input.authUserId,
        issueId: input.issueId,
        previousAssigneeAuthUserId: currentIssue.assignedAuthUserId,
        nextAssigneeAuthUserId: input.assigneeAuthUserId,
      })
    );

    return {
      status: 'updated',
      issue: {
        project: {
          id: writeContext.projectId,
          key: writeContext.projectKey,
          name: currentIssue.projectName,
        },
        issue: {
          ...updatedIssue,
          assigneeLabel,
          planStepCount: Math.max(0, planCount?.count ?? 0),
        },
      },
    };
  });
}

/** Reads the locked target member's display label without selecting e-mail. */
async function selectCurrentAssigneeLabel(
  tx: BubblophyIssueAssigneeUpdateTx,
  input: {
    projectId: string;
    assigneeAuthUserId: string | null;
  }
) {
  if (!input.assigneeAuthUserId) {
    return 'Nicht zugewiesen';
  }

  const [assignee] = await tx
    .select({
      authUserId: bubblophyProjectMembers.authUserId,
      displayName: bubblophyUserProfiles.displayName,
    })
    .from(bubblophyProjectMembers)
    .leftJoin(
      bubblophyUserProfiles,
      eq(bubblophyUserProfiles.authUserId, bubblophyProjectMembers.authUserId)
    )
    .where(
      and(
        eq(bubblophyProjectMembers.projectId, input.projectId),
        eq(bubblophyProjectMembers.authUserId, input.assigneeAuthUserId)
      )
    )
    .limit(1);

  if (!assignee) {
    throw new Error('Locked Bubblophy assignee could not be reloaded.');
  }

  return assignee.displayName ?? assignee.authUserId;
}

/**
 * Checks whether an assignee write would be an audit-noisy no-op.
 *
 * @param previousAssigneeAuthUserId Current persisted assignee.
 * @param nextAssigneeAuthUserId Requested assignee.
 * @returns True when no update or event should be written.
 */
export function shouldSkipBubblophyIssueAssigneeChangeEvent(
  previousAssigneeAuthUserId: string | null,
  nextAssigneeAuthUserId: string | null
) {
  return previousAssigneeAuthUserId === nextAssigneeAuthUserId;
}

/**
 * Builds the insert values for a human issue assignment change event.
 *
 * @param input Issue, actor, previous assignee, and next assignee.
 * @returns Insert values for `bubblophy_issue_events`.
 */
export function buildBubblophyIssueAssigneeChangedEventInsert(input: {
  issueDatabaseId: string;
  authUserId: string;
  issueId: string;
  previousAssigneeAuthUserId: string | null;
  nextAssigneeAuthUserId: string | null;
}): BubblophyIssueAssigneeChangedEventInsert {
  return {
    issueId: input.issueDatabaseId,
    eventType: 'commented',
    actorAuthUserId: input.authUserId,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: `Zuweisung ${input.issueId} geändert.`,
    payload: {
      source: 'human',
      entity: 'issue',
      action: 'assignee_changed',
      issueId: input.issueId,
      previousAssigneeAuthUserId: input.previousAssigneeAuthUserId,
      nextAssigneeAuthUserId: input.nextAssigneeAuthUserId,
      changedFields: ['assignedAuthUserId'],
    },
  };
}
