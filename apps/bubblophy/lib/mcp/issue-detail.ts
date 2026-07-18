import 'server-only';

import type {
  BubblophyIssuePriority,
  BubblophyIssueStatus,
} from '@/drizzle/db/schema';

export interface BubblophyMcpIssueDetail {
  project: {
    id: string;
    key: string;
    isArchived: boolean;
  };
  issue: {
    key: string;
    issueNumber: number;
    title: string;
    description: string;
    status: BubblophyIssueStatus;
    priority: BubblophyIssuePriority;
    requiresHumanApproval: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface BubblophyMcpIssueDetailReadInput {
  authUserId: string;
  projectId: string;
  issueNumber: number;
}

export type BubblophyMcpIssueDetailReader = (
  input: BubblophyMcpIssueDetailReadInput
) => Promise<BubblophyMcpIssueDetail | null>;

export interface GetBubblophyMcpIssueInput {
  projectId: string;
  issueNumber: number;
}

export interface GetBubblophyMcpIssueOptions {
  readIssue?: BubblophyMcpIssueDetailReader;
}

export type GetBubblophyMcpIssueResult =
  | ({ status: 'success' } & BubblophyMcpIssueDetail)
  | {
      status: 'invalid';
      reason: 'empty_auth_user' | 'empty_project' | 'invalid_issue_number';
    }
  | { status: 'not_found' }
  | { status: 'database_unavailable' };

/**
 * Gets one public issue detail through the current project membership.
 *
 * Missing issues, projects, and memberships intentionally share one result so
 * the tool cannot be used to enumerate inaccessible resources.
 */
export async function getBubblophyMcpIssue(
  authUserId: string,
  input: GetBubblophyMcpIssueInput,
  options: GetBubblophyMcpIssueOptions = {}
): Promise<GetBubblophyMcpIssueResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedProjectId = input.projectId.trim();

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (!normalizedProjectId) {
    return { status: 'invalid', reason: 'empty_project' };
  }

  if (!Number.isSafeInteger(input.issueNumber) || input.issueNumber < 1) {
    return { status: 'invalid', reason: 'invalid_issue_number' };
  }

  const readIssue =
    options.readIssue ?? (await getDefaultBubblophyMcpIssueDetailReader());

  if (!readIssue) {
    return { status: 'database_unavailable' };
  }

  try {
    const detail = await readIssue({
      authUserId: normalizedAuthUserId,
      projectId: normalizedProjectId,
      issueNumber: input.issueNumber,
    });

    return detail ? { status: 'success', ...detail } : { status: 'not_found' };
  } catch {
    return { status: 'database_unavailable' };
  }
}

/** Loads the server-only Drizzle reader when database access is configured. */
async function getDefaultBubblophyMcpIssueDetailReader(): Promise<BubblophyMcpIssueDetailReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectBubblophyMcpIssueForUser } =
    await import('@/lib/mcp/issue-detail-database-read');

  return selectBubblophyMcpIssueForUser;
}
