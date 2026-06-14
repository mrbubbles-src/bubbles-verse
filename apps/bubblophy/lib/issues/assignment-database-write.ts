import 'server-only';

import type { JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyIssueAssigneeUpdateStore,
  BubblophyIssueAssigneeUpdateStoreInput,
} from '@/lib/issues/assignment';

import { parseBubblophyIssueKey } from '@/lib/issues/plan-database-write';

import { and, eq, sql } from 'drizzle-orm';

import {
  bubblophyIssueEvents,
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

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
): ReturnType<BubblophyIssueAssigneeUpdateStore['updateIssueAssigneeWithEvent']> {
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
        assignedAuthUserId: bubblophyIssues.assignedAuthUserId,
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
      !canMutateBubblophyIssueAssignee(currentIssue.memberRole)
    ) {
      return { status: 'forbidden' };
    }

    if (input.assigneeAuthUserId) {
      const [assigneeMembership] = await tx
        .select({
          authUserId: bubblophyProjectMembers.authUserId,
        })
        .from(bubblophyProjectMembers)
        .where(
          and(
            eq(bubblophyProjectMembers.projectId, currentIssue.projectId),
            eq(bubblophyProjectMembers.authUserId, input.assigneeAuthUserId)
          )
        )
        .limit(1);

      if (!assigneeMembership) {
        return { status: 'invalid_assignee' };
      }
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
 * Checks whether a project role may mutate issue assignments.
 *
 * @param role Project membership role from persistence.
 * @returns True for contributors, false for read-only viewers.
 */
export function canMutateBubblophyIssueAssignee(role: string) {
  return ['owner', 'maintainer', 'member'].includes(role);
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
