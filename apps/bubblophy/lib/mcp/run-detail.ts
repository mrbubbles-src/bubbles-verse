import 'server-only';

import type { BubblophyAgentRunState } from '@/drizzle/db/schema';

export interface BubblophyMcpRunDetail {
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
  run: {
    id: string;
    state: BubblophyAgentRunState;
    agentLabel: string;
    approvedAt: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    resultSummary: string | null;
  };
}

export interface BubblophyMcpRunDetailReadInput {
  authUserId: string;
  projectId: string;
  runId: string;
}

export type BubblophyMcpRunDetailReader = (
  input: BubblophyMcpRunDetailReadInput
) => Promise<BubblophyMcpRunDetail | null>;

export interface GetBubblophyMcpRunInput {
  projectId: string;
  runId: string;
}

export interface GetBubblophyMcpRunOptions {
  readRun?: BubblophyMcpRunDetailReader;
}

export type GetBubblophyMcpRunResult =
  | ({ status: 'success' } & BubblophyMcpRunDetail)
  | {
      status: 'invalid';
      reason: 'empty_auth_user' | 'empty_project' | 'empty_run';
    }
  | { status: 'not_found' }
  | { status: 'database_unavailable' };

/**
 * Gets one public run detail through the current project membership.
 *
 * Missing runs, projects, and memberships intentionally share one result so
 * the tool cannot enumerate inaccessible resources.
 */
export async function getBubblophyMcpRun(
  authUserId: string,
  input: GetBubblophyMcpRunInput,
  options: GetBubblophyMcpRunOptions = {}
): Promise<GetBubblophyMcpRunResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedProjectId = input.projectId.trim();
  const normalizedRunId = input.runId.trim();

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (!normalizedProjectId) {
    return { status: 'invalid', reason: 'empty_project' };
  }

  if (!normalizedRunId) {
    return { status: 'invalid', reason: 'empty_run' };
  }

  const readRun =
    options.readRun ?? (await getDefaultBubblophyMcpRunDetailReader());

  if (!readRun) {
    return { status: 'database_unavailable' };
  }

  try {
    const detail = await readRun({
      authUserId: normalizedAuthUserId,
      projectId: normalizedProjectId,
      runId: normalizedRunId,
    });

    return detail ? { status: 'success', ...detail } : { status: 'not_found' };
  } catch {
    return { status: 'database_unavailable' };
  }
}

/** Loads the server-only Drizzle reader when database access is configured. */
async function getDefaultBubblophyMcpRunDetailReader(): Promise<BubblophyMcpRunDetailReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectBubblophyMcpRunForUser } =
    await import('@/lib/mcp/run-detail-database-read');

  return selectBubblophyMcpRunForUser;
}
