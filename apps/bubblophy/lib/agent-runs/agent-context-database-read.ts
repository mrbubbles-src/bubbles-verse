import 'server-only';

import type { BubblophyAgentRunState } from '@/drizzle/db/schema';
import type {
  BubblophyAgentRunContextStore,
  BubblophyAgentRunContextStoreInput,
} from '@/lib/agent-runs/agent-context';

import { formatBubblophyIssueKey } from '@/lib/issues/repository';
import { mapBubblophyIssuePlanSteps } from '@/lib/issues/repository';

import { and, desc, eq } from 'drizzle-orm';

import {
  bubblophyAgentRuns,
  bubblophyAgentTokens,
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjects,
} from '@/drizzle/db/schema';

/**
 * Creates the Drizzle-backed store for read-only agent run context.
 *
 * @returns Store implementation for the agent GET route.
 */
export function createDrizzleBubblophyAgentRunContextStore(): BubblophyAgentRunContextStore {
  return {
    readRunContextForAgent,
  };
}

/**
 * Reads one minimal run context after token, scope, and project checks.
 *
 * @param input Token hash and run ID from the route service.
 * @returns Minimal context or a structured authorization/read failure.
 */
async function readRunContextForAgent(
  input: BubblophyAgentRunContextStoreInput
): ReturnType<BubblophyAgentRunContextStore['readRunContextForAgent']> {
  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const [agentToken] = await tx
      .select({
        id: bubblophyAgentTokens.id,
        projectId: bubblophyAgentTokens.projectId,
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

    if (!agentToken.scopes.includes('issues:read')) {
      return { status: 'forbidden_scope' };
    }

    const [currentRun] = await tx
      .select({
        id: bubblophyAgentRuns.id,
        state: bubblophyAgentRuns.state,
        updatedAt: bubblophyAgentRuns.updatedAt,
        issueDatabaseId: bubblophyIssues.id,
        issueNumber: bubblophyIssues.issueNumber,
        issueTitle: bubblophyIssues.title,
        issueStatus: bubblophyIssues.status,
        issuePriority: bubblophyIssues.priority,
        projectId: bubblophyProjects.id,
        projectKey: bubblophyProjects.key,
        projectName: bubblophyProjects.name,
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

    if (!canAgentReadRunContext(currentRun.state)) {
      return { status: 'not_found' };
    }

    const [latestPlan] = await tx
      .select({
        version: bubblophyIssuePlans.version,
        summary: bubblophyIssuePlans.summary,
        steps: bubblophyIssuePlans.steps,
      })
      .from(bubblophyIssuePlans)
      .where(eq(bubblophyIssuePlans.issueId, currentRun.issueDatabaseId))
      .orderBy(
        desc(bubblophyIssuePlans.version),
        desc(bubblophyIssuePlans.createdAt)
      )
      .limit(1);

    const now = new Date().toISOString();

    await tx
      .update(bubblophyAgentTokens)
      .set({
        lastUsedAt: now,
      })
      .where(eq(bubblophyAgentTokens.id, agentToken.id));

    return {
      status: 'found',
      context: {
        run: {
          id: currentRun.id,
          state: currentRun.state,
          updatedAt: currentRun.updatedAt,
        },
        project: {
          id: currentRun.projectId,
          key: currentRun.projectKey,
          name: currentRun.projectName,
        },
        issue: {
          id: formatBubblophyIssueKey(
            currentRun.projectKey,
            currentRun.issueNumber
          ),
          title: currentRun.issueTitle,
          status: currentRun.issueStatus,
          priority: currentRun.issuePriority,
        },
        latestPlan: latestPlan
          ? {
              version: latestPlan.version,
              summary: latestPlan.summary,
              steps: mapBubblophyIssuePlanSteps(latestPlan.steps),
            }
          : null,
      },
    };
  });
}

/**
 * Checks whether a run state is visible to local agent context reads.
 *
 * @param state Current persisted run state.
 * @returns True once a human has approved the run and it is agent-relevant.
 */
export function canAgentReadRunContext(state: BubblophyAgentRunState) {
  return (
    state === 'approved' ||
    state === 'running' ||
    state === 'needs_review' ||
    state === 'completed' ||
    state === 'failed'
  );
}
