import 'server-only';

import type {
  BubblophyIssuePriority,
  BubblophyIssueStatus,
} from '@/drizzle/db/schema';

export interface BubblophyMcpIssueProject {
  id: string;
  key: string;
  isArchived: boolean;
}

export interface BubblophyMcpIssue {
  key: string;
  issueNumber: number;
  title: string;
  status: BubblophyIssueStatus;
  priority: BubblophyIssuePriority;
  requiresHumanApproval: boolean;
  updatedAt: string;
}

export interface BubblophyMcpIssuePage {
  project: BubblophyMcpIssueProject;
  issues: BubblophyMcpIssue[];
  nextAfterIssueNumber: number | null;
}

export interface BubblophyMcpIssueReadInput {
  authUserId: string;
  projectId: string;
  limit: number;
  afterIssueNumber: number;
}

export type BubblophyMcpIssueReader = (
  input: BubblophyMcpIssueReadInput
) => Promise<BubblophyMcpIssuePage | null>;

export interface ListBubblophyMcpIssuesInput {
  projectId: string;
  limit?: number;
  afterIssueNumber?: number;
}

export interface ListBubblophyMcpIssuesOptions {
  readIssues?: BubblophyMcpIssueReader;
}

export type ListBubblophyMcpIssuesResult =
  | ({ status: 'success' } & BubblophyMcpIssuePage)
  | {
      status: 'invalid';
      reason:
        | 'empty_auth_user'
        | 'empty_project'
        | 'invalid_limit'
        | 'invalid_cursor';
    }
  | { status: 'not_found' }
  | { status: 'database_unavailable' };

const DEFAULT_ISSUE_PAGE_SIZE = 50;
const MAX_ISSUE_PAGE_SIZE = 100;

/**
 * Lists one bounded page of public issue summaries for a visible project.
 *
 * Membership and project state are re-read for every invocation. Missing and
 * unauthorized projects intentionally share one result to avoid enumeration.
 */
export async function listBubblophyMcpIssues(
  authUserId: string,
  input: ListBubblophyMcpIssuesInput,
  options: ListBubblophyMcpIssuesOptions = {}
): Promise<ListBubblophyMcpIssuesResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedProjectId = input.projectId.trim();

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (!normalizedProjectId) {
    return { status: 'invalid', reason: 'empty_project' };
  }

  const limit = input.limit ?? DEFAULT_ISSUE_PAGE_SIZE;
  const afterIssueNumber = input.afterIssueNumber ?? 0;

  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > MAX_ISSUE_PAGE_SIZE
  ) {
    return { status: 'invalid', reason: 'invalid_limit' };
  }

  if (!Number.isSafeInteger(afterIssueNumber) || afterIssueNumber < 0) {
    return { status: 'invalid', reason: 'invalid_cursor' };
  }

  const readIssues =
    options.readIssues ?? (await getDefaultBubblophyMcpIssueReader());

  if (!readIssues) {
    return { status: 'database_unavailable' };
  }

  try {
    const page = await readIssues({
      authUserId: normalizedAuthUserId,
      projectId: normalizedProjectId,
      limit,
      afterIssueNumber,
    });

    return page ? { status: 'success', ...page } : { status: 'not_found' };
  } catch {
    return { status: 'database_unavailable' };
  }
}

/** Loads the server-only Drizzle reader when database access is configured. */
async function getDefaultBubblophyMcpIssueReader(): Promise<BubblophyMcpIssueReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectBubblophyMcpIssuesForUser } =
    await import('@/lib/mcp/issues-database-read');

  return selectBubblophyMcpIssuesForUser;
}
