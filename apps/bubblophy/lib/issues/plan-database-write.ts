import 'server-only';

import type { JsonObject, JsonValue } from '@/drizzle/db/schema';
import type {
  BubblophyIssuePlanDraftStore,
  BubblophyIssuePlanDraftStoreInput,
} from '@/lib/issues/plans';

import { canContributeToBubblophyProject } from '@/lib/projects/permissions';

import { and, desc, eq } from 'drizzle-orm';

import {
  bubblophyIssueEvents,
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

export interface BubblophyIssuePlanUpdatedEventInsert {
  issueId: string;
  eventType: 'plan_updated';
  actorAuthUserId: string;
  actorAgentTokenId: null;
  agentRunId: null;
  summary: string;
  payload: JsonObject;
}

interface BubblophyIssueKeyParts {
  projectKey: string;
  issueNumber: number;
}

/**
 * Creates the Drizzle-backed store for human-authored issue plan drafts.
 *
 * @returns Store implementation for server actions.
 */
export function createDrizzleBubblophyIssuePlanDraftStore(): BubblophyIssuePlanDraftStore {
  return {
    createIssuePlanVersionWithEvent,
  };
}

/**
 * Creates a new plan version and audit event after membership checks.
 *
 * @param input Authenticated human user and normalized plan draft fields.
 * @returns Created plan, `not_found`, or `forbidden`.
 */
async function createIssuePlanVersionWithEvent(
  input: BubblophyIssuePlanDraftStoreInput
): ReturnType<BubblophyIssuePlanDraftStore['createIssuePlanVersionWithEvent']> {
  const issueKey = parseBubblophyIssueKey(input.issueId);

  if (!issueKey) {
    return { status: 'not_found' };
  }

  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const [issue] = await tx
      .select({
        id: bubblophyIssues.id,
        issueNumber: bubblophyIssues.issueNumber,
        projectId: bubblophyProjects.id,
        projectKey: bubblophyProjects.key,
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

    if (!issue) {
      return { status: 'not_found' };
    }

    if (!canContributeToBubblophyProject(issue.memberRole)) {
      return { status: 'forbidden' };
    }

    const [lastPlan] = await tx
      .select({
        version: bubblophyIssuePlans.version,
      })
      .from(bubblophyIssuePlans)
      .where(eq(bubblophyIssuePlans.issueId, issue.id))
      .orderBy(desc(bubblophyIssuePlans.version))
      .limit(1);

    const version = getNextBubblophyIssuePlanVersion(lastPlan?.version);

    const [plan] = await tx
      .insert(bubblophyIssuePlans)
      .values({
        issueId: issue.id,
        version,
        summary: input.summary,
        steps: buildBubblophyIssuePlanStepsJson(input.steps),
        createdByAuthUserId: input.authUserId,
        createdByAgentTokenId: null,
        approvedByAuthUserId: null,
        approvedAt: null,
      })
      .returning({
        version: bubblophyIssuePlans.version,
        summary: bubblophyIssuePlans.summary,
        steps: bubblophyIssuePlans.steps,
      });

    if (!plan) {
      throw new Error('Bubblophy issue plan insert did not return a row.');
    }

    await tx.insert(bubblophyIssueEvents).values(
      buildBubblophyIssuePlanUpdatedEventInsert({
        issueDatabaseId: issue.id,
        authUserId: input.authUserId,
        issueId: input.issueId,
        version,
        stepCount: input.steps.length,
      })
    );

    return {
      status: 'created',
      plan: {
        issueId: input.issueId,
        version: plan.version,
        summary: plan.summary,
        steps: input.steps,
      },
    };
  });
}

/**
 * Parses a human-facing issue key such as `BV-12`.
 *
 * @param issueId Issue identifier from the dashboard.
 * @returns Project key and issue number, or `null` for malformed IDs.
 */
export function parseBubblophyIssueKey(
  issueId: string
): BubblophyIssueKeyParts | null {
  const match = /^(?<projectKey>[A-Z0-9]{2,8})-(?<issueNumber>\d+)$/.exec(
    issueId.trim()
  );

  if (!match?.groups) {
    return null;
  }

  const projectKey = match.groups.projectKey;
  const issueNumberText = match.groups.issueNumber;

  if (!projectKey || !issueNumberText) {
    return null;
  }

  const issueNumber = Number.parseInt(issueNumberText, 10);

  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) {
    return null;
  }

  return {
    projectKey,
    issueNumber,
  };
}

/**
 * Calculates the next per-issue plan version.
 *
 * @param lastVersion Highest existing plan version for the issue.
 * @returns Next plan version, starting at `1`.
 */
export function getNextBubblophyIssuePlanVersion(
  lastVersion: number | null | undefined
) {
  return (lastVersion ?? 0) + 1;
}

/**
 * Builds the insert values for a human `plan_updated` audit event.
 *
 * @param input Issue, actor, version, and step count for the new plan.
 * @returns Insert values for `bubblophy_issue_events`.
 */
export function buildBubblophyIssuePlanUpdatedEventInsert(input: {
  issueDatabaseId: string;
  authUserId: string;
  issueId: string;
  version: number;
  stepCount: number;
}): BubblophyIssuePlanUpdatedEventInsert {
  return {
    issueId: input.issueDatabaseId,
    eventType: 'plan_updated',
    actorAuthUserId: input.authUserId,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: `Plan ${input.issueId} v${input.version} aktualisiert.`,
    payload: {
      source: 'human',
      issueId: input.issueId,
      version: input.version,
      stepCount: input.stepCount,
    },
  };
}

/**
 * Converts typed plan steps into JSONB-safe plain objects.
 *
 * @param steps Normalized plan step DTOs.
 * @returns JSON value accepted by the Drizzle `jsonb` column.
 */
function buildBubblophyIssuePlanStepsJson(
  steps: BubblophyIssuePlanDraftStoreInput['steps']
): JsonValue {
  return steps.map((step) => ({
    id: step.id,
    text: step.text,
  })) satisfies JsonObject[];
}
