import 'server-only';

import type { JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyIssueDraftCreateStore,
  BubblophyIssueDraftCreateStoreInput,
  BubblophyIssueDraftCreateStoreResult,
} from '@/lib/issues/create';

import { and, desc, eq } from 'drizzle-orm';

import {
  bubblophyIssueEvents,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

export interface BubblophyIssueCreatedEventInsert {
  issueId: string;
  eventType: 'created';
  actorAuthUserId: string;
  actorAgentTokenId: null;
  agentRunId: null;
  summary: string;
  payload: JsonObject;
}

/**
 * Creates the Drizzle-backed store for persisted human issue drafts.
 *
 * Issue number selection and event creation run in one transaction. The MVP
 * still relies on the existing `(project_id, issue_number)` unique index for
 * concurrent duplicate protection; a future project counter can make retries
 * friendlier without changing the service contract.
 *
 * @returns Store implementation for server actions or route handlers.
 */
export function createDrizzleBubblophyIssueDraftStore(): BubblophyIssueDraftCreateStore {
  return {
    createIssueWithCreatedEvent,
  };
}

/**
 * Creates an issue and its audit event after checking project membership.
 *
 * @param input Authenticated human user and normalized draft fields.
 * @returns Created issue data, or `null` when the user is not a project member.
 */
async function createIssueWithCreatedEvent(
  input: BubblophyIssueDraftCreateStoreInput
): Promise<BubblophyIssueDraftCreateStoreResult | null> {
  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({
        id: bubblophyProjects.id,
        key: bubblophyProjects.key,
        name: bubblophyProjects.name,
      })
      .from(bubblophyProjects)
      .innerJoin(
        bubblophyProjectMembers,
        eq(bubblophyProjectMembers.projectId, bubblophyProjects.id)
      )
      .where(
        and(
          eq(bubblophyProjects.key, input.projectKey),
          eq(bubblophyProjects.isArchived, false),
          eq(bubblophyProjectMembers.authUserId, input.authUserId)
        )
      )
      .limit(1);

    if (!project) {
      return null;
    }

    const [lastIssue] = await tx
      .select({
        issueNumber: bubblophyIssues.issueNumber,
      })
      .from(bubblophyIssues)
      .where(eq(bubblophyIssues.projectId, project.id))
      .orderBy(desc(bubblophyIssues.issueNumber))
      .limit(1);

    const issueNumber = getNextBubblophyIssueNumber(lastIssue?.issueNumber);

    const [issue] = await tx
      .insert(bubblophyIssues)
      .values({
        projectId: project.id,
        issueNumber,
        title: input.title,
        description: input.description,
        status: 'triage',
        priority: input.priority,
        createdByAuthUserId: input.authUserId,
        assignedAuthUserId: null,
        requiresHumanApproval: true,
      })
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

    if (!issue) {
      throw new Error('Bubblophy issue insert did not return a row.');
    }

    await tx.insert(bubblophyIssueEvents).values(
      buildBubblophyIssueCreatedEventInsert({
        issueId: issue.id,
        authUserId: input.authUserId,
        projectKey: project.key,
        issueNumber,
      })
    );

    return {
      project,
      issue: {
        ...issue,
        status: 'triage',
      },
    };
  });
}

/**
 * Calculates the next per-project issue number from the current highest row.
 *
 * @param lastIssueNumber Highest existing issue number for the project.
 * @returns Next issue number, starting at `1`.
 */
export function getNextBubblophyIssueNumber(
  lastIssueNumber: number | null | undefined
) {
  return (lastIssueNumber ?? 0) + 1;
}

/**
 * Builds the insert values for the human `created` issue audit event.
 *
 * The event is intentionally human-authored and detached from agent tokens or
 * runs, so creating an issue cannot implicitly start agentic work.
 *
 * @param input Created issue ID, actor, project key, and issue number.
 * @returns Insert values for `bubblophy_issue_events`.
 */
export function buildBubblophyIssueCreatedEventInsert(input: {
  issueId: string;
  authUserId: string;
  projectKey: string;
  issueNumber: number;
}): BubblophyIssueCreatedEventInsert {
  return {
    issueId: input.issueId,
    eventType: 'created',
    actorAuthUserId: input.authUserId,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: `Issue ${input.projectKey}-${input.issueNumber.toString().padStart(2, '0')} erstellt.`,
    payload: {
      source: 'human',
      projectKey: input.projectKey,
      issueNumber: input.issueNumber,
    },
  };
}
