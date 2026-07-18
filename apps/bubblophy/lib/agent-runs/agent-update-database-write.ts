import 'server-only';

import type { BubblophyAgentRunState, JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyAgentRunAgentUpdateState,
  BubblophyAgentRunAgentUpdateStore,
  BubblophyAgentRunAgentUpdateStoreInput,
} from '@/lib/agent-runs/agent-update';

import { buildAgentRunUpdatePayload } from '@/lib/agent-runs/agent-update';
import { isBubblophyAgentRunBoundToToken } from '@/lib/agent-runs/authorization';
import { formatBubblophyIssueKey } from '@/lib/issues/repository';

import { and, eq } from 'drizzle-orm';

import {
  bubblophyAgentRuns,
  bubblophyAgentTokens,
  bubblophyIssueEvents,
  bubblophyIssues,
  bubblophyProjects,
} from '@/drizzle/db/schema';

export interface BubblophyAgentRunAgentEventInsert {
  issueId: string;
  eventType: 'agent_run_event';
  actorAuthUserId: null;
  actorAgentTokenId: string;
  agentRunId: string;
  summary: string;
  payload: JsonObject;
}

/**
 * Creates the Drizzle-backed store for agent-submitted run updates.
 *
 * @returns Store implementation for the API route.
 */
export function createDrizzleBubblophyAgentRunAgentUpdateStore(): BubblophyAgentRunAgentUpdateStore {
  return {
    updateRunFromAgent,
  };
}

/**
 * Persists one scoped agent status update after token and project checks.
 *
 * @param input Token hash, run ID, target state, and bounded payload.
 * @returns Updated run or a structured authorization/state failure.
 */
async function updateRunFromAgent(
  input: BubblophyAgentRunAgentUpdateStoreInput
): ReturnType<BubblophyAgentRunAgentUpdateStore['updateRunFromAgent']> {
  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const [agentToken] = await tx
      .select({
        id: bubblophyAgentTokens.id,
        projectId: bubblophyAgentTokens.projectId,
        label: bubblophyAgentTokens.label,
        scopes: bubblophyAgentTokens.scopes,
        state: bubblophyAgentTokens.state,
        expiresAt: bubblophyAgentTokens.expiresAt,
      })
      .from(bubblophyAgentTokens)
      .where(eq(bubblophyAgentTokens.tokenHash, input.tokenHash))
      .limit(1);

    if (!agentToken) {
      return { status: 'invalid_token' };
    }

    if (agentToken.state !== 'active') {
      return {
        status: 'token_unavailable',
        reason: agentToken.state,
      };
    }

    if (
      agentToken.expiresAt &&
      agentToken.expiresAt <= new Date().toISOString()
    ) {
      return { status: 'token_unavailable', reason: 'expired' };
    }

    if (!agentToken.scopes.includes('runs:update')) {
      return { status: 'forbidden_scope' };
    }

    const [currentRun] = await tx
      .select({
        id: bubblophyAgentRuns.id,
        agentTokenId: bubblophyAgentRuns.agentTokenId,
        state: bubblophyAgentRuns.state,
        issueDatabaseId: bubblophyIssues.id,
        issueNumber: bubblophyIssues.issueNumber,
        projectId: bubblophyProjects.id,
        projectKey: bubblophyProjects.key,
      })
      .from(bubblophyAgentRuns)
      .innerJoin(
        bubblophyIssues,
        eq(bubblophyIssues.id, bubblophyAgentRuns.issueId)
      )
      .innerJoin(
        bubblophyProjects,
        eq(bubblophyProjects.id, bubblophyIssues.projectId)
      )
      .where(
        and(
          eq(bubblophyAgentRuns.id, input.runId),
          eq(bubblophyProjects.isArchived, false)
        )
      )
      .limit(1);

    if (!currentRun) {
      return { status: 'not_found' };
    }

    if (currentRun.projectId !== agentToken.projectId) {
      return { status: 'project_mismatch' };
    }

    if (
      !isBubblophyAgentRunBoundToToken({
        runAgentTokenId: currentRun.agentTokenId,
        authenticatedAgentTokenId: agentToken.id,
      })
    ) {
      return { status: 'not_found' };
    }

    if (!canAgentTransitionRun(currentRun.state, input.state)) {
      return { status: 'invalid_transition' };
    }

    const now = new Date().toISOString();
    const [updatedRun] = await tx
      .update(bubblophyAgentRuns)
      .set({
        state: input.state,
        startedAt:
          input.state === 'running' && currentRun.state === 'approved'
            ? now
            : undefined,
        finishedAt:
          input.state === 'completed' || input.state === 'failed'
            ? now
            : undefined,
        result: input.result,
        updatedAt: now,
      })
      .where(
        and(
          eq(bubblophyAgentRuns.id, currentRun.id),
          eq(bubblophyAgentRuns.state, currentRun.state)
        )
      )
      .returning({
        id: bubblophyAgentRuns.id,
        state: bubblophyAgentRuns.state,
      });

    if (!updatedRun) {
      return { status: 'invalid_transition' };
    }

    await tx
      .update(bubblophyAgentTokens)
      .set({
        lastUsedAt: now,
      })
      .where(eq(bubblophyAgentTokens.id, agentToken.id));

    const issueId = formatBubblophyIssueKey(
      currentRun.projectKey,
      currentRun.issueNumber
    );

    await tx.insert(bubblophyIssueEvents).values(
      buildBubblophyAgentRunAgentEventInsert({
        issueDatabaseId: currentRun.issueDatabaseId,
        issueId,
        runId: currentRun.id,
        agentTokenId: agentToken.id,
        previousState: currentRun.state,
        nextState: input.state,
        message: input.message,
        result: input.result,
      })
    );

    return {
      status: 'updated',
      run: updatedRun,
    };
  });
}

/**
 * Checks the allowed state machine for agent-submitted updates.
 *
 * @param previous Current persisted run state.
 * @param next Requested agent-writeable state.
 * @returns True when the transition is allowed.
 */
export function canAgentTransitionRun(
  previous: BubblophyAgentRunState,
  next: BubblophyAgentRunAgentUpdateState
) {
  if (previous === 'approved') {
    return next === 'running';
  }

  if (previous === 'running') {
    return next === 'needs_review' || next === 'completed' || next === 'failed';
  }

  if (previous === 'needs_review') {
    return next === 'running' || next === 'completed' || next === 'failed';
  }

  return false;
}

/**
 * Builds an issue event for an authenticated agent run update.
 *
 * @param input Issue/run identifiers, actor token, transition, and payload.
 * @returns Insert values for `bubblophy_issue_events`.
 */
export function buildBubblophyAgentRunAgentEventInsert(input: {
  issueDatabaseId: string;
  issueId: string;
  runId: string;
  agentTokenId: string;
  previousState: BubblophyAgentRunState;
  nextState: BubblophyAgentRunAgentUpdateState;
  message: string;
  result: BubblophyAgentRunAgentUpdateStoreInput['result'];
}): BubblophyAgentRunAgentEventInsert {
  return {
    issueId: input.issueDatabaseId,
    eventType: 'agent_run_event',
    actorAuthUserId: null,
    actorAgentTokenId: input.agentTokenId,
    agentRunId: input.runId,
    summary: `Agent-Run ${input.issueId}: ${input.previousState} → ${input.nextState}.`,
    payload: buildAgentRunUpdatePayload({
      source: 'agent',
      runId: input.runId,
      previousState: input.previousState,
      nextState: input.nextState,
      message: input.message,
      result: input.result,
    }),
  };
}
