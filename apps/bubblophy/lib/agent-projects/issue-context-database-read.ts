import 'server-only';

import type { JsonValue } from '@/drizzle/db/schema';
import type {
  BubblophyAgentProjectIssuesStore,
  BubblophyAgentProjectIssuesStoreInput,
} from '@/lib/agent-projects/issue-context';

import {
  formatBubblophyIssueKey,
  mapBubblophyIssuePlanSteps,
} from '@/lib/issues/repository';

import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import {
  bubblophyAgentTokens,
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjects,
} from '@/drizzle/db/schema';

const openAgentIssueStatuses = [
  'triage',
  'planned',
  'ready',
  'in_progress',
  'review',
  'blocked',
] as const;

type LatestPlanByIssueId = Record<
  string,
  {
    version: number;
    summary: string;
    steps: JsonValue;
  }
>;

/**
 * Creates the Drizzle-backed store for read-only agent project issues.
 *
 * @returns Store implementation for the agent project issues GET route.
 */
export function createDrizzleBubblophyAgentProjectIssuesStore(): BubblophyAgentProjectIssuesStore {
  return {
    readProjectIssuesForAgent,
  };
}

/**
 * Reads open issues for the token-bound project after auth checks.
 *
 * @param input Token hash and project ID from the route service.
 * @returns Minimal issue context or a structured authorization/read failure.
 */
async function readProjectIssuesForAgent(
  input: BubblophyAgentProjectIssuesStoreInput
): ReturnType<BubblophyAgentProjectIssuesStore['readProjectIssuesForAgent']> {
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

    const [project] = await tx
      .select({
        id: bubblophyProjects.id,
        key: bubblophyProjects.key,
        name: bubblophyProjects.name,
        isArchived: bubblophyProjects.isArchived,
      })
      .from(bubblophyProjects)
      .where(eq(bubblophyProjects.id, input.projectId))
      .limit(1);

    if (!project || project.isArchived) {
      return { status: 'not_found' };
    }

    if (project.id !== agentToken.projectId) {
      return { status: 'project_mismatch' };
    }

    const issues = await tx
      .select({
        databaseId: bubblophyIssues.id,
        issueNumber: bubblophyIssues.issueNumber,
        title: bubblophyIssues.title,
        description: bubblophyIssues.description,
        status: bubblophyIssues.status,
        priority: bubblophyIssues.priority,
        assignedAuthUserId: bubblophyIssues.assignedAuthUserId,
      })
      .from(bubblophyIssues)
      .where(
        and(
          eq(bubblophyIssues.projectId, project.id),
          inArray(bubblophyIssues.status, openAgentIssueStatuses)
        )
      )
      .orderBy(asc(bubblophyIssues.issueNumber));

    const latestPlans =
      issues.length === 0
        ? {}
        : toLatestPlanByIssueId(
            await tx
              .select({
                issueId: bubblophyIssuePlans.issueId,
                version: bubblophyIssuePlans.version,
                summary: bubblophyIssuePlans.summary,
                steps: bubblophyIssuePlans.steps,
              })
              .from(bubblophyIssuePlans)
              .where(
                inArray(
                  bubblophyIssuePlans.issueId,
                  issues.map((issue) => issue.databaseId)
                )
              )
              .orderBy(
                asc(bubblophyIssuePlans.issueId),
                desc(bubblophyIssuePlans.version),
                desc(bubblophyIssuePlans.createdAt)
              )
          );

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
        project: {
          id: project.id,
          key: project.key,
          name: project.name,
        },
        issues: issues.map((issue) => {
          const latestPlan = latestPlans[issue.databaseId];

          return {
            id: formatBubblophyIssueKey(project.key, issue.issueNumber),
            title: issue.title,
            description: issue.description,
            status: issue.status,
            priority: issue.priority,
            assignee: issue.assignedAuthUserId ? 'assigned' : 'unassigned',
            latestPlan: latestPlan
              ? {
                  version: latestPlan.version,
                  summary: latestPlan.summary,
                  steps: mapBubblophyIssuePlanSteps(latestPlan.steps),
                }
              : null,
          };
        }),
      },
    };
  });
}

/**
 * Picks the newest plan row per issue from rows sorted newest-first per issue.
 *
 * @param rows Latest-plan candidate rows.
 * @returns Latest plan keyed by database issue ID.
 */
function toLatestPlanByIssueId(
  rows: {
    issueId: string;
    version: number;
    summary: string;
    steps: JsonValue;
  }[]
): LatestPlanByIssueId {
  const latestPlans: LatestPlanByIssueId = {};

  for (const row of rows) {
    if (latestPlans[row.issueId]) {
      continue;
    }

    latestPlans[row.issueId] = {
      version: row.version,
      summary: row.summary,
      steps: row.steps,
    };
  }

  return latestPlans;
}
