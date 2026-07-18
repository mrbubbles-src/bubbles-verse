import 'server-only';

import type { JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyAgentRunRequestStore,
  BubblophyAgentRunRequestStoreInput,
} from '@/lib/agent-runs/request';

import { parseBubblophyIssueKey } from '@/lib/issues/plan-database-write';
import { canContributeToBubblophyProject } from '@/lib/projects/permissions';

import { and, eq } from 'drizzle-orm';

import {
  bubblophyAgentRuns,
  bubblophyAgentTokens,
  bubblophyIssueEvents,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

export interface BubblophyAgentRunRequestedIssueEventInsert {
  issueId: string;
  eventType: 'agent_run_requested';
  actorAuthUserId: string;
  actorAgentTokenId: null;
  agentRunId: string;
  summary: string;
  payload: JsonObject;
}

/**
 * Creates the Drizzle-backed store for human agent-run requests.
 *
 * Run requests are transactionally written with an issue audit event. No agent
 * execution is started, and the selected token is not treated as the actor.
 *
 * @returns Store implementation for server actions.
 */
export function createDrizzleBubblophyAgentRunRequestStore(): BubblophyAgentRunRequestStore {
  return {
    requestAgentRun,
  };
}

/**
 * Creates a requested run after issue membership and token project checks.
 *
 * @param input Authenticated human user and normalized run request fields.
 * @returns Requested run, `not_found`, `forbidden`, or `token_unavailable`.
 */
async function requestAgentRun(
  input: BubblophyAgentRunRequestStoreInput
): ReturnType<BubblophyAgentRunRequestStore['requestAgentRun']> {
  const issueKey = parseBubblophyIssueKey(input.issueId);

  if (!issueKey) {
    return { status: 'not_found' };
  }

  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const [issue] = await tx
      .select({
        id: bubblophyIssues.id,
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

    const [agentToken] = await tx
      .select({
        id: bubblophyAgentTokens.id,
        label: bubblophyAgentTokens.label,
      })
      .from(bubblophyAgentTokens)
      .where(
        and(
          eq(bubblophyAgentTokens.id, input.agentTokenId),
          eq(bubblophyAgentTokens.projectId, issue.projectId),
          eq(bubblophyAgentTokens.state, 'active')
        )
      )
      .limit(1);

    if (!agentToken) {
      return { status: 'token_unavailable' };
    }

    const [run] = await tx
      .insert(bubblophyAgentRuns)
      .values({
        issueId: issue.id,
        agentTokenId: agentToken.id,
        state: 'requested',
        requestedByAuthUserId: input.authUserId,
      })
      .returning({
        id: bubblophyAgentRuns.id,
        state: bubblophyAgentRuns.state,
      });

    if (!run) {
      throw new Error('Bubblophy agent run request did not return a row.');
    }

    await tx.insert(bubblophyIssueEvents).values(
      buildBubblophyAgentRunRequestedIssueEventInsert({
        issueDatabaseId: issue.id,
        issueId: input.issueId,
        runId: run.id,
        authUserId: input.authUserId,
        agentTokenId: agentToken.id,
        agentTokenLabel: agentToken.label,
        projectKey: issue.projectKey,
        instructions: input.instructions,
      })
    );

    return {
      status: 'requested',
      run: {
        id: run.id,
        issueId: input.issueId,
        agentTokenLabel: agentToken.label,
        requestedByAuthUserId: input.authUserId,
        instructions: input.instructions,
      },
    };
  });
}

/**
 * Builds an issue event for a human-created run request.
 *
 * @param input Issue, run, token metadata, actor, and bounded instructions.
 * @returns Insert values for `bubblophy_issue_events`.
 */
export function buildBubblophyAgentRunRequestedIssueEventInsert(input: {
  issueDatabaseId: string;
  issueId: string;
  runId: string;
  authUserId: string;
  agentTokenId: string;
  agentTokenLabel: string;
  projectKey: string;
  instructions: string;
}): BubblophyAgentRunRequestedIssueEventInsert {
  return {
    issueId: input.issueDatabaseId,
    eventType: 'agent_run_requested',
    actorAuthUserId: input.authUserId,
    actorAgentTokenId: null,
    agentRunId: input.runId,
    summary: `Run für ${input.issueId} mit "${input.agentTokenLabel}" angefragt.`,
    payload: {
      source: 'human',
      projectKey: input.projectKey,
      issueId: input.issueId,
      runId: input.runId,
      selectedAgentTokenId: input.agentTokenId,
      selectedAgentTokenLabel: input.agentTokenLabel,
      instructions: input.instructions,
      executionStarted: false,
    },
  };
}
