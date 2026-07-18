import 'server-only';

import type {
  BubblophyMcpIssueDetail,
  BubblophyMcpIssueDetailReadInput,
} from '@/lib/mcp/issue-detail';

import { formatBubblophyIssueKey } from '@/lib/issues/repository';

import { and, eq } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

/**
 * Selects one issue detail through the current user's project membership.
 *
 * Only the explicit public detail fields are selected; user IDs, plans, runs,
 * tokens, and events never enter this query contract.
 */
export async function selectBubblophyMcpIssueForUser(
  input: BubblophyMcpIssueDetailReadInput
): Promise<BubblophyMcpIssueDetail | null> {
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
        description: bubblophyIssues.description,
        status: bubblophyIssues.status,
        priority: bubblophyIssues.priority,
        requiresHumanApproval: bubblophyIssues.requiresHumanApproval,
        createdAt: bubblophyIssues.createdAt,
        updatedAt: bubblophyIssues.updatedAt,
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
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        eq(bubblophyProjectMembers.projectId, input.projectId),
        eq(bubblophyIssues.issueNumber, input.issueNumber)
      )
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
  };
}
