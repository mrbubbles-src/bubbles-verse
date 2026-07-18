import 'server-only';

import type {
  RequestBubblophyAgentRunInput,
  RequestBubblophyAgentRunResult,
} from '@/lib/agent-runs/request';
import type {
  GetBubblophyMcpIssueInput,
  GetBubblophyMcpIssueResult,
} from '@/lib/mcp/issue-detail';

import { requestBubblophyAgentRun } from '@/lib/agent-runs/request';
import { getBubblophyMcpIssue } from '@/lib/mcp/issue-detail';

export interface RequestBubblophyMcpRunInput {
  projectId: string;
  issueNumber: number;
  runTargetId: string;
  instructions?: string;
}

interface RequestBubblophyMcpRunOptions {
  getIssue?: (
    authUserId: string,
    input: GetBubblophyMcpIssueInput
  ) => Promise<GetBubblophyMcpIssueResult>;
  writeRun?: (
    input: RequestBubblophyAgentRunInput
  ) => Promise<RequestBubblophyAgentRunResult>;
}

type RunValidationReason = Extract<
  RequestBubblophyAgentRunResult,
  { status: 'invalid' }
>['reason'];

export type RequestBubblophyMcpRunResult =
  | {
      status: 'requested';
      project: { id: string; key: string; isArchived: false };
      issue: { key: string; issueNumber: number; title: string };
      run: {
        id: string;
        state: 'requested';
        agentLabel: string;
        createdAt: string;
      };
    }
  | {
      status: 'invalid';
      reason:
        | 'empty_auth_user'
        | 'empty_oauth_client'
        | 'empty_project'
        | 'invalid_issue_number'
        | 'empty_run_target'
        | RunValidationReason;
    }
  | { status: 'not_found' }
  | { status: 'forbidden' }
  | { status: 'token_unavailable' }
  | { status: 'database_unavailable' };

/**
 * Requests one OAuth-attributed run while preserving human approval control.
 *
 * The public issue read narrows the selected resource. The transactional
 * writer is the authoritative boundary for membership, archive state, token
 * project, lifecycle, expiry, and execution scopes before persisting
 * `requested` only.
 */
export async function requestBubblophyMcpRun(
  authUserId: string,
  oauthClientId: string,
  input: RequestBubblophyMcpRunInput,
  options: RequestBubblophyMcpRunOptions = {}
): Promise<RequestBubblophyMcpRunResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedOauthClientId = oauthClientId.trim();
  const normalizedProjectId = input.projectId.trim();
  const normalizedRunTargetId = input.runTargetId.trim();

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (!normalizedOauthClientId) {
    return { status: 'invalid', reason: 'empty_oauth_client' };
  }

  if (!normalizedProjectId) {
    return { status: 'invalid', reason: 'empty_project' };
  }

  if (!Number.isSafeInteger(input.issueNumber) || input.issueNumber < 1) {
    return { status: 'invalid', reason: 'invalid_issue_number' };
  }

  if (!normalizedRunTargetId) {
    return { status: 'invalid', reason: 'empty_run_target' };
  }

  const getIssue = options.getIssue ?? getBubblophyMcpIssue;
  const issueResult = await getIssue(normalizedAuthUserId, {
    projectId: normalizedProjectId,
    issueNumber: input.issueNumber,
  });

  if (issueResult.status !== 'success') {
    return issueResult.status === 'database_unavailable'
      ? { status: 'database_unavailable' }
      : issueResult.status === 'not_found'
        ? { status: 'not_found' }
        : { status: 'invalid', reason: 'invalid_issue_number' };
  }

  const writeRun = options.writeRun ?? requestBubblophyAgentRun;

  try {
    const writeResult = await writeRun({
      authUserId: normalizedAuthUserId,
      oauthClientId: normalizedOauthClientId,
      issueId: issueResult.issue.key,
      agentTokenId: normalizedRunTargetId,
      instructions: input.instructions,
    });

    if (writeResult.status !== 'requested') {
      return writeResult;
    }

    return {
      status: 'requested',
      project: { ...issueResult.project, isArchived: false },
      issue: {
        key: issueResult.issue.key,
        issueNumber: issueResult.issue.issueNumber,
        title: issueResult.issue.title,
      },
      run: {
        id: writeResult.run.id,
        state: 'requested',
        agentLabel: writeResult.run.agentLabel,
        createdAt: writeResult.createdAt,
      },
    };
  } catch {
    return { status: 'database_unavailable' };
  }
}
