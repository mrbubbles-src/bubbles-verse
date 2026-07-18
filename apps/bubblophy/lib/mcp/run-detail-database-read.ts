import 'server-only';

import type {
  BubblophyMcpRunDetail,
  BubblophyMcpRunDetailReadInput,
} from '@/lib/mcp/run-detail';

import {
  buildSafeAgentRunResultSummary,
  formatBubblophyIssueKey,
} from '@/lib/issues/repository';

import { and, eq } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyAgentRuns,
  bubblophyAgentTokens,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

/**
 * Selects one run through the current user's project membership.
 *
 * The token join verifies that the run's assigned token belongs to the same
 * project. User IDs, token credentials, events, and raw results never leave
 * this server-only mapping boundary.
 */
export async function selectBubblophyMcpRunForUser(
  input: BubblophyMcpRunDetailReadInput
): Promise<BubblophyMcpRunDetail | null> {
  const [row] = await db
    .select({
      project: {
        id: bubblophyProjects.id,
        key: bubblophyProjects.key,
        isArchived: bubblophyProjects.isArchived,
      },
      issue: {
        issueNumber: bubblophyIssues.issueNumber,
        title: bubblophyIssues.title,
      },
      run: {
        id: bubblophyAgentRuns.id,
        state: bubblophyAgentRuns.state,
        agentLabel: bubblophyAgentTokens.label,
        approvedAt: bubblophyAgentRuns.approvedAt,
        startedAt: bubblophyAgentRuns.startedAt,
        finishedAt: bubblophyAgentRuns.finishedAt,
        createdAt: bubblophyAgentRuns.createdAt,
        updatedAt: bubblophyAgentRuns.updatedAt,
        result: bubblophyAgentRuns.result,
      },
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .innerJoin(
      bubblophyIssues,
      eq(bubblophyIssues.projectId, bubblophyProjects.id)
    )
    .innerJoin(
      bubblophyAgentRuns,
      eq(bubblophyAgentRuns.issueId, bubblophyIssues.id)
    )
    .innerJoin(
      bubblophyAgentTokens,
      and(
        eq(bubblophyAgentTokens.id, bubblophyAgentRuns.agentTokenId),
        eq(bubblophyAgentTokens.projectId, bubblophyProjects.id)
      )
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        eq(bubblophyProjectMembers.projectId, input.projectId),
        eq(bubblophyAgentRuns.id, input.runId)
      )
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const { result, ...publicRun } = row.run;

  return {
    project: row.project,
    issue: {
      ...row.issue,
      key: formatBubblophyIssueKey(row.project.key, row.issue.issueNumber),
    },
    run: {
      ...publicRun,
      resultSummary: buildSafeAgentRunResultSummary(result) ?? null,
    },
  };
}
