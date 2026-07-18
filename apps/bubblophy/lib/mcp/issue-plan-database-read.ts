import 'server-only';

import type {
  BubblophyMcpIssuePlanDetail,
  BubblophyMcpIssuePlanReadInput,
} from '@/lib/mcp/issue-plan';

import {
  formatBubblophyIssueKey,
  mapBubblophyIssuePlanSteps,
} from '@/lib/issues/repository';

import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyIssuePlans,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

/**
 * Selects the latest issue plan through the current user's project membership.
 *
 * The left join preserves visible issues without plans. Actor and internal row
 * identifiers are deliberately excluded from the selection.
 */
export async function selectBubblophyMcpIssuePlanForUser(
  input: BubblophyMcpIssuePlanReadInput
): Promise<BubblophyMcpIssuePlanDetail | null> {
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
      plan: {
        version: bubblophyIssuePlans.version,
        summary: bubblophyIssuePlans.summary,
        steps: bubblophyIssuePlans.steps,
        approvedAt: bubblophyIssuePlans.approvedAt,
        createdAt: bubblophyIssuePlans.createdAt,
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
    .leftJoin(
      bubblophyIssuePlans,
      eq(bubblophyIssuePlans.issueId, bubblophyIssues.id)
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        eq(bubblophyProjectMembers.projectId, input.projectId),
        eq(bubblophyIssues.issueNumber, input.issueNumber)
      )
    )
    .orderBy(
      desc(bubblophyIssuePlans.version),
      desc(bubblophyIssuePlans.createdAt)
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    project: row.project,
    issue: {
      ...row.issue,
      key: formatBubblophyIssueKey(row.project.key, row.issue.issueNumber),
    },
    plan: row.plan
      ? {
          version: row.plan.version,
          summary: row.plan.summary,
          steps: mapBubblophyIssuePlanSteps(row.plan.steps),
          approvalStatus: row.plan.approvedAt ? 'approved' : 'draft',
          approvedAt: row.plan.approvedAt,
          createdAt: row.plan.createdAt,
        }
      : null,
  };
}
