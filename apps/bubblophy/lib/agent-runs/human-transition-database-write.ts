import 'server-only';

import type { BubblophyAgentRunState, JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyAgentRunHumanTransitionStore,
  BubblophyAgentRunHumanTransitionStoreInput,
} from '@/lib/agent-runs/human-transition';

import { isExecutableBubblophyAgentToken } from '@/lib/agent-tokens/execution';
import { formatBubblophyIssueKey } from '@/lib/issues/repository';
import {
  lockBubblophyProjectForHumanWrite,
  lockBubblophyProjectMembersForHumanWrite,
} from '@/lib/projects/human-write-locks-database';
import { canContributeToBubblophyProject } from '@/lib/projects/permissions';

import { and, eq } from 'drizzle-orm';

import {
  bubblophyAgentRuns,
  bubblophyAgentTokens,
  bubblophyIssueEvents,
  bubblophyIssues,
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
 * Approves or cancels a requested run after locking its authorization context.
 *
 * The lock order is project `SHARE`, actor membership `UPDATE`, run `UPDATE`,
 * then token `UPDATE`. It keeps authorization and token state stable without
 * introducing an issue lock that could invert the agent run update order.
 *
 * @param input Authenticated human ID, run ID, and normalized decision.
 * @returns Updated run summary fields or an authorization/state failure.
 */
async function transitionRun(
  input: BubblophyAgentRunHumanTransitionStoreInput
): ReturnType<BubblophyAgentRunHumanTransitionStore['transitionRun']> {
  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const [runReference] = await tx
      .select({
        projectId: bubblophyIssues.projectId,
      })
      .from(bubblophyAgentRuns)
      .innerJoin(
        bubblophyIssues,
        eq(bubblophyIssues.id, bubblophyAgentRuns.issueId)
      )
      .where(eq(bubblophyAgentRuns.id, input.runId))
      .limit(1);

    if (!runReference) {
      return { status: 'not_found' };
    }

    const project = await lockBubblophyProjectForHumanWrite(tx, {
      project: { id: runReference.projectId },
      lockMode: 'share',
    });

    if (!project || project.isArchived) {
      return { status: 'not_found' };
    }

    const memberships = await lockBubblophyProjectMembersForHumanWrite(tx, {
      projectId: project.id,
      authUserIds: [input.authUserId],
    });
    const actorMembership = memberships.find(
      (membership) => membership.authUserId === input.authUserId
    );

    if (!canContributeToBubblophyProject(actorMembership?.role)) {
      return { status: 'forbidden' };
    }

    const [currentRun] = await tx
      .select({
        id: bubblophyAgentRuns.id,
        state: bubblophyAgentRuns.state,
        issueDatabaseId: bubblophyIssues.id,
        issueNumber: bubblophyIssues.issueNumber,
        agentTokenId: bubblophyAgentRuns.agentTokenId,
      })
      .from(bubblophyAgentRuns)
      .innerJoin(
        bubblophyIssues,
        eq(bubblophyIssues.id, bubblophyAgentRuns.issueId)
      )
      .where(
        and(
          eq(bubblophyAgentRuns.id, input.runId),
          eq(bubblophyIssues.projectId, project.id)
        )
      )
      .limit(1)
      .for('update', { of: bubblophyAgentRuns });

    if (!currentRun) {
      return { status: 'not_found' };
    }

    if (currentRun.state !== 'requested') {
      return { status: 'invalid_transition' };
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
          eq(bubblophyAgentTokens.id, currentRun.agentTokenId),
          eq(bubblophyAgentTokens.projectId, project.id)
        )
      )
      .limit(1)
      .for('update');

    if (!agentToken) {
      return { status: 'not_found' };
    }

    if (
      input.decision === 'approve' &&
      !isExecutableBubblophyAgentToken(agentToken)
    ) {
      return { status: 'token_unavailable' };
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

    const issueId = formatBubblophyIssueKey(
      project.key,
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
        agentTokenLabel: agentToken.label,
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
