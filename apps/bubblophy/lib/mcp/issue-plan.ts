import 'server-only';

import type { IssuePlanStepSummary } from '@/lib/dashboard/types';

export interface BubblophyMcpIssuePlanDetail {
  project: {
    id: string;
    key: string;
    isArchived: boolean;
  };
  issue: {
    key: string;
    issueNumber: number;
    title: string;
  };
  plan: {
    version: number;
    summary: string;
    steps: IssuePlanStepSummary[];
    approvalStatus: 'draft' | 'approved';
    approvedAt: string | null;
    createdAt: string;
  } | null;
}

export interface BubblophyMcpIssuePlanReadInput {
  authUserId: string;
  projectId: string;
  issueNumber: number;
}

export type BubblophyMcpIssuePlanReader = (
  input: BubblophyMcpIssuePlanReadInput
) => Promise<BubblophyMcpIssuePlanDetail | null>;

export interface GetBubblophyMcpIssuePlanInput {
  projectId: string;
  issueNumber: number;
}

export interface GetBubblophyMcpIssuePlanOptions {
  readIssuePlan?: BubblophyMcpIssuePlanReader;
}

export type GetBubblophyMcpIssuePlanResult =
  | ({ status: 'success' } & BubblophyMcpIssuePlanDetail)
  | {
      status: 'invalid';
      reason: 'empty_auth_user' | 'empty_project' | 'invalid_issue_number';
    }
  | { status: 'not_found' }
  | { status: 'database_unavailable' };

/**
 * Gets the latest plan for one issue through the current project membership.
 *
 * A visible issue without a plan succeeds with `plan: null`. Missing issues,
 * projects, and memberships share one result to prevent resource enumeration.
 */
export async function getBubblophyMcpIssuePlan(
  authUserId: string,
  input: GetBubblophyMcpIssuePlanInput,
  options: GetBubblophyMcpIssuePlanOptions = {}
): Promise<GetBubblophyMcpIssuePlanResult> {
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

  const readIssuePlan =
    options.readIssuePlan ?? (await getDefaultBubblophyMcpIssuePlanReader());

  if (!readIssuePlan) {
    return { status: 'database_unavailable' };
  }

  try {
    const detail = await readIssuePlan({
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
async function getDefaultBubblophyMcpIssuePlanReader(): Promise<BubblophyMcpIssuePlanReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectBubblophyMcpIssuePlanForUser } =
    await import('@/lib/mcp/issue-plan-database-read');

  return selectBubblophyMcpIssuePlanForUser;
}
