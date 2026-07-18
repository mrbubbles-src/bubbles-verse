import 'server-only';

import type { BubblophyAgentRunState, JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyAgentRunHumanTransitionStore,
  BubblophyAgentRunHumanTransitionStoreInput,
} from '@/lib/agent-runs/human-transition';

import { formatBubblophyIssueKey } from '@/lib/issues/repository';
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

export interface BubblophyAgentRunHumanEventInsert {
  issueId: string;
  eventType: 'agent_run_event';
  actorAuthUserId: string;
  actorAgentTokenId: null;
  agentRunId: string;
  summary: string;
  payload: JsonObject;
}

/**
 * Creates the Drizzle-backed store for human run decisions.
 *
 * @returns Store implementation for server actions.
 */
export function createDrizzleBubblophyAgentRunHumanTransitionStore(): BubblophyAgentRunHumanTransitionStore {
  return {
    transitionRun,
  };
}

/**
 * Approves or cancels a requested run after project membership checks.
 *
 * @param input Authenticated human ID, run ID, and normalized decision.
 * @returns Updated run summary fields or an authorization/state failure.
 */
async function transitionRun(
  input: BubblophyAgentRunHumanTransitionStoreInput
): ReturnType<BubblophyAgentRunHumanTransitionStore['transitionRun']> {
  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const [currentRun] = await tx
      .select({
        id: bubblophyAgentRuns.id,
        state: bubblophyAgentRuns.state,
        issueDatabaseId: bubblophyIssues.id,
        issueNumber: bubblophyIssues.issueNumber,
        projectId: bubblophyProjects.id,
        projectKey: bubblophyProjects.key,
        memberRole: bubblophyProjectMembers.role,
        agentTokenLabel: bubblophyAgentTokens.label,
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
      .innerJoin(
        bubblophyAgentTokens,
        and(
          eq(bubblophyAgentTokens.id, bubblophyAgentRuns.agentTokenId),
          eq(bubblophyAgentTokens.projectId, bubblophyProjects.id)
        )
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
          eq(bubblophyAgentRuns.id, input.runId),
          eq(bubblophyProjects.isArchived, false)
        )
      )
      .limit(1);

    if (!currentRun) {
      return { status: 'not_found' };
    }

    if (!canContributeToBubblophyProject(currentRun.memberRole)) {
      return { status: 'forbidden' };
    }

    if (currentRun.state !== 'requested') {
      return { status: 'invalid_transition' };
    }

    const nextState = getHumanDecisionRunState(input.decision);
    const now = new Date().toISOString();
    const [updatedRun] = await tx
      .update(bubblophyAgentRuns)
      .set({
        state: nextState,
        approvedByAuthUserId:
          input.decision === 'approve' ? input.authUserId : null,
        approvedAt: input.decision === 'approve' ? now : null,
        finishedAt: input.decision === 'cancel' ? now : null,
        updatedAt: now,
      })
      .where(eq(bubblophyAgentRuns.id, currentRun.id))
      .returning({
        id: bubblophyAgentRuns.id,
        state: bubblophyAgentRuns.state,
      });

    if (!updatedRun) {
      throw new Error('Bubblophy agent run transition did not return a row.');
    }

    const issueId = formatBubblophyIssueKey(
      currentRun.projectKey,
      currentRun.issueNumber
    );
    const message =
      input.decision === 'approve'
        ? `Run ${issueId} wurde menschlich freigegeben.`
        : `Run ${issueId} wurde menschlich abgebrochen.`;

    await tx.insert(bubblophyIssueEvents).values(
      buildBubblophyAgentRunHumanEventInsert({
        issueDatabaseId: currentRun.issueDatabaseId,
        issueId,
        runId: currentRun.id,
        authUserId: input.authUserId,
        previousState: currentRun.state,
        nextState,
        decision: input.decision,
      })
    );

    return {
      status: 'updated',
      run: {
        id: updatedRun.id,
        issueId,
        agentTokenLabel: currentRun.agentTokenLabel,
        state: updatedRun.state,
        message,
      },
    };
  });
}

/**
 * Resolves the persisted state for a human run decision.
 *
 * @param decision Human decision from the service boundary.
 * @returns Database run state to write.
 */
function getHumanDecisionRunState(
  decision: BubblophyAgentRunHumanTransitionStoreInput['decision']
): BubblophyAgentRunState {
  return decision === 'approve' ? 'approved' : 'cancelled';
}

/**
 * Builds an issue audit event for human run approval or cancellation.
 *
 * @param input Issue/run identifiers, actor, and state transition.
 * @returns Insert values for `bubblophy_issue_events`.
 */
export function buildBubblophyAgentRunHumanEventInsert(input: {
  issueDatabaseId: string;
  issueId: string;
  runId: string;
  authUserId: string;
  previousState: BubblophyAgentRunState;
  nextState: BubblophyAgentRunState;
  decision: BubblophyAgentRunHumanTransitionStoreInput['decision'];
}): BubblophyAgentRunHumanEventInsert {
  return {
    issueId: input.issueDatabaseId,
    eventType: 'agent_run_event',
    actorAuthUserId: input.authUserId,
    actorAgentTokenId: null,
    agentRunId: input.runId,
    summary:
      input.decision === 'approve'
        ? `Run ${input.issueId} menschlich freigegeben.`
        : `Run ${input.issueId} menschlich abgebrochen.`,
    payload: {
      source: 'human',
      issueId: input.issueId,
      runId: input.runId,
      previousState: input.previousState,
      nextState: input.nextState,
      decision: input.decision,
      executionStarted: false,
    },
  };
}
