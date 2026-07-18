import 'server-only';

import type { JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyAgentRunRequestStore,
  BubblophyAgentRunRequestStoreInput,
} from '@/lib/agent-runs/request';

import { isExecutableBubblophyAgentToken } from '@/lib/agent-tokens/execution';
import { lockBubblophyIssueContributorWriteContext } from '@/lib/issues/contributor-write-context-database';
import { parseBubblophyIssueKey } from '@/lib/issues/plan-database-write';

import { and, eq } from 'drizzle-orm';

import {
  bubblophyAgentRuns,
  bubblophyAgentTokens,
  bubblophyIssueEvents,
  bubblophyIssues,
  bubblophyProjects,
} from '@/drizzle/db/schema';

export interface BubblophyAgentRunRequestedIssueEventInsert {
  issueId: string;
  eventType: 'agent_run_requested';
  actorAuthUserId: string;
  actorOauthClientId: string | null;
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
 * Creates a requested run after locking its active issue, membership, and token.
 *
 * The lock order is project `SHARE`, issue `NO KEY UPDATE`, membership
 * `UPDATE`, then token `UPDATE`. This serializes token lifecycle changes with
 * the final executable-token check without approving or starting the requested
 * run.
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
    const writeContext = await lockBubblophyIssueContributorWriteContext(tx, {
      authUserId: input.authUserId,
      projectKey: issueKey.projectKey,
      issueNumber: issueKey.issueNumber,
    });

    if (writeContext.status !== 'ready') {
      return writeContext;
    }

    const [issue] = await tx
      .select({
        id: bubblophyIssues.id,
        projectId: bubblophyProjects.id,
        projectKey: bubblophyProjects.key,
      })
      .from(bubblophyIssues)
      .innerJoin(
        bubblophyProjects,
        eq(bubblophyProjects.id, bubblophyIssues.projectId)
      )
      .where(eq(bubblophyIssues.id, writeContext.issueDatabaseId))
      .limit(1);

    if (!issue) {
      throw new Error('Locked Bubblophy issue could not be reloaded.');
    }

    const [agentToken] = await tx
      .select({
        id: bubblophyAgentTokens.id,
        label: bubblophyAgentTokens.label,
        scopes: bubblophyAgentTokens.scopes,
        state: bubblophyAgentTokens.state,
        expiresAt: bubblophyAgentTokens.expiresAt,
      })
      .from(bubblophyAgentTokens)
      .where(
        and(
          eq(bubblophyAgentTokens.id, input.agentTokenId),
          eq(bubblophyAgentTokens.projectId, issue.projectId)
        )
      )
      .limit(1)
      .for('update');

    if (!agentToken || !isExecutableBubblophyAgentToken(agentToken)) {
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
        createdAt: bubblophyAgentRuns.createdAt,
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
        oauthClientId: input.oauthClientId,
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
        createdAt: run.createdAt,
      },
    };
  });
}

/**
 * Builds an issue event for a human or OAuth-created run request.
 *
 * @param input Issue, run, token metadata, actor, and bounded instructions.
 * @returns Insert values for `bubblophy_issue_events`.
 */
export function buildBubblophyAgentRunRequestedIssueEventInsert(input: {
  issueDatabaseId: string;
  issueId: string;
  runId: string;
  authUserId: string;
  oauthClientId?: string;
  agentTokenId: string;
  agentTokenLabel: string;
  projectKey: string;
  instructions: string;
}): BubblophyAgentRunRequestedIssueEventInsert {
  return {
    issueId: input.issueDatabaseId,
    eventType: 'agent_run_requested',
    actorAuthUserId: input.authUserId,
    actorOauthClientId: input.oauthClientId ?? null,
    actorAgentTokenId: null,
    agentRunId: input.runId,
    summary: `Run für ${input.issueId} mit "${input.agentTokenLabel}" angefragt.`,
    payload: {
      source: input.oauthClientId ? 'oauth_mcp' : 'human',
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
