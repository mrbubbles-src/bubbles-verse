import 'server-only';

import type { JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyIssueDraftCreateStore,
  BubblophyIssueDraftCreateStoreInput,
  BubblophyIssueDraftCreateStoreResult,
} from '@/lib/issues/create';

import { canContributeToBubblophyProject } from '@/lib/projects/permissions';

import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/drizzle/db';
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
  actorOauthClientId: string | null;
  actorAgentTokenId: null;
  agentRunId: null;
  summary: string;
  payload: JsonObject;
}

/**
 * Creates the Drizzle-backed store for persisted human issue drafts.
 *
 * Issue number selection and event creation run in one transaction. A project
 * `NO KEY UPDATE` lock serializes per-project numbering while remaining
 * compatible with the project `KEY SHARE` locks used by issue inserts and
 * project audit writes. The existing unique index remains defense in depth.
 *
 * @returns Store implementation for server actions or route handlers.
 */
export function createDrizzleBubblophyIssueDraftStore(): BubblophyIssueDraftCreateStore {
  return {
    createIssueWithCreatedEvent,
  };
}

/**
 * Creates an issue and its audit event after locked authorization checks.
 *
 * The project lock keeps archival state stable and serializes number
 * allocation. The membership lock prevents role removal or changes from
 * racing the write.
 *
 * @param input Authenticated human user and normalized draft fields.
 * @returns Created issue data, or `null` when the user is not a project member.
 */
async function createIssueWithCreatedEvent(
  input: BubblophyIssueDraftCreateStoreInput
): Promise<BubblophyIssueDraftCreateStoreResult | null> {
  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({
        id: bubblophyProjects.id,
        key: bubblophyProjects.key,
        name: bubblophyProjects.name,
      })
      .from(bubblophyProjects)
      .where(
        and(
          eq(bubblophyProjects.key, input.projectKey),
          eq(bubblophyProjects.isArchived, false)
        )
      )
      .limit(1)
      .for('no key update');

    if (!project) {
      return null;
    }

    const [membership] = await tx
      .select({ role: bubblophyProjectMembers.role })
      .from(bubblophyProjectMembers)
      .where(
        and(
          eq(bubblophyProjectMembers.projectId, project.id),
          eq(bubblophyProjectMembers.authUserId, input.authUserId)
        )
      )
      .limit(1)
      .for('update');

    if (!canContributeToBubblophyProject(membership?.role)) {
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
        oauthClientId: input.oauthClientId,
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
  oauthClientId?: string;
  projectKey: string;
  issueNumber: number;
}): BubblophyIssueCreatedEventInsert {
  return {
    issueId: input.issueId,
    eventType: 'created',
    actorAuthUserId: input.authUserId,
    actorOauthClientId: input.oauthClientId ?? null,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: `Issue ${input.projectKey}-${input.issueNumber.toString().padStart(2, '0')} erstellt.`,
    payload: {
      source: input.oauthClientId ? 'oauth_mcp' : 'human',
      projectKey: input.projectKey,
      issueNumber: input.issueNumber,
    },
  };
}
