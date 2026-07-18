import 'server-only';

import type {
  BubblophyMcpIssue,
  BubblophyMcpIssuePage,
  BubblophyMcpIssueReadInput,
} from '@/lib/mcp/issues';

import { formatBubblophyIssueKey } from '@/lib/issues/repository';

import { and, asc, eq, gt } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

const publicIssueSelection = {
  projectId: bubblophyProjects.id,
  projectKey: bubblophyProjects.key,
  projectIsArchived: bubblophyProjects.isArchived,
  issueNumber: bubblophyIssues.issueNumber,
  issueTitle: bubblophyIssues.title,
  issueStatus: bubblophyIssues.status,
  issuePriority: bubblophyIssues.priority,
  issueRequiresHumanApproval: bubblophyIssues.requiresHumanApproval,
  issueUpdatedAt: bubblophyIssues.updatedAt,
};

interface PublicIssueRow {
  projectId: string;
  projectKey: string;
  projectIsArchived: boolean;
  issueNumber: number | null;
  issueTitle: string | null;
  issueStatus: BubblophyMcpIssue['status'] | null;
  issuePriority: BubblophyMcpIssue['priority'] | null;
  issueRequiresHumanApproval: boolean | null;
  issueUpdatedAt: string | null;
}

/**
 * Selects one issue-number page through the current user's membership row.
 *
 * The left join preserves authorized empty projects. The cursor lives in the
 * join condition so it cannot turn that empty authorized result into a false
 * not-found response.
 */
export async function selectBubblophyMcpIssuesForUser(
  input: BubblophyMcpIssueReadInput
): Promise<BubblophyMcpIssuePage | null> {
  const rows = await db
    .select(publicIssueSelection)
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .leftJoin(
      bubblophyIssues,
      and(
        eq(bubblophyIssues.projectId, bubblophyProjects.id),
        gt(bubblophyIssues.issueNumber, input.afterIssueNumber)
      )
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        eq(bubblophyProjectMembers.projectId, input.projectId)
      )
    )
    .orderBy(asc(bubblophyIssues.issueNumber))
    .limit(input.limit + 1);

  const firstRow = rows[0] as PublicIssueRow | undefined;

  if (!firstRow) {
    return null;
  }

  const pageRows = (rows as PublicIssueRow[]).slice(0, input.limit);
  const issues = pageRows.flatMap((row) => {
    const issue = mapPublicIssueRow(row);
    return issue ? [issue] : [];
  });
  const lastIssue = issues.at(-1);

  return {
    project: {
      id: firstRow.projectId,
      key: firstRow.projectKey,
      isArchived: firstRow.projectIsArchived,
    },
    issues,
    nextAfterIssueNumber:
      rows.length > input.limit && lastIssue ? lastIssue.issueNumber : null,
  };
}

/** Maps one nullable left-join row into the public MCP issue contract. */
function mapPublicIssueRow(row: PublicIssueRow): BubblophyMcpIssue | null {
  if (
    row.issueNumber === null &&
    row.issueTitle === null &&
    row.issueStatus === null &&
    row.issuePriority === null &&
    row.issueRequiresHumanApproval === null &&
    row.issueUpdatedAt === null
  ) {
    return null;
  }

  if (
    row.issueNumber === null ||
    row.issueTitle === null ||
    row.issueStatus === null ||
    row.issuePriority === null ||
    row.issueRequiresHumanApproval === null ||
    row.issueUpdatedAt === null
  ) {
    throw new Error('Incomplete Bubblophy issue row.');
  }

  return {
    key: formatBubblophyIssueKey(row.projectKey, row.issueNumber),
    issueNumber: row.issueNumber,
    title: row.issueTitle,
    status: row.issueStatus,
    priority: row.issuePriority,
    requiresHumanApproval: row.issueRequiresHumanApproval,
    updatedAt: row.issueUpdatedAt,
  };
}
