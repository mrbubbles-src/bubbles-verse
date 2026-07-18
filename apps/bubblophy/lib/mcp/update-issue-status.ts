import 'server-only';

import type { BubblophyIssueStatus } from '@/drizzle/db/schema';
import type {
  UpdateBubblophyIssueStatusInput,
  UpdateBubblophyIssueStatusResult,
} from '@/lib/issues/status';
import type {
  GetBubblophyMcpIssueInput,
  GetBubblophyMcpIssueResult,
} from '@/lib/mcp/issue-detail';

import { mapBubblophyIssueStatus } from '@/lib/issues/repository';
import {
  bubblophyIssueStatusLimits,
  updateBubblophyIssueStatus,
} from '@/lib/issues/status';
import { getBubblophyMcpIssue } from '@/lib/mcp/issue-detail';

import { bubblophyIssueStatus } from '@/drizzle/db/schema';

export interface UpdateBubblophyMcpIssueStatusInput {
  projectId: string;
  issueNumber: number;
  expectedStatus: BubblophyIssueStatus;
  status: BubblophyIssueStatus;
  reason?: string;
}

interface UpdateBubblophyMcpIssueStatusOptions {
  getIssue?: (
    authUserId: string,
    input: GetBubblophyMcpIssueInput
  ) => Promise<GetBubblophyMcpIssueResult>;
  writeStatus?: (
    input: UpdateBubblophyIssueStatusInput
  ) => Promise<UpdateBubblophyIssueStatusResult>;
}

type SharedValidationReason = Extract<
  UpdateBubblophyIssueStatusResult,
  { status: 'invalid' }
>['reason'];

export type UpdateBubblophyMcpIssueStatusResult =
  | {
      status: 'updated';
      project: { id: string; key: string; isArchived: false };
      issue: {
        key: string;
        issueNumber: number;
        title: string;
        status: BubblophyIssueStatus;
      };
    }
  | {
      status: 'invalid';
      reason:
        | 'empty_auth_user'
        | 'empty_oauth_client'
        | 'empty_project'
        | 'invalid_issue_number'
        | 'invalid_status'
        | 'reason_required'
        | SharedValidationReason;
    }
  | { status: 'unchanged' }
  | { status: 'conflict' }
  | { status: 'not_found' }
  | { status: 'forbidden' }
  | { status: 'database_unavailable' };

/**
 * Updates one visible issue through the locked, OAuth-attributed status writer.
 *
 * `expectedStatus` is rechecked inside the transaction, so this read is only a
 * public selector boundary. All existing human status targets remain valid;
 * remote closure and blocking additionally require an audit reason.
 */
export async function updateBubblophyMcpIssueStatus(
  authUserId: string,
  oauthClientId: string,
  input: UpdateBubblophyMcpIssueStatusInput,
  options: UpdateBubblophyMcpIssueStatusOptions = {}
): Promise<UpdateBubblophyMcpIssueStatusResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedOauthClientId = oauthClientId.trim();
  const normalizedProjectId = input.projectId.trim();
  const reason = input.reason?.trim() ?? '';

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

  if (
    !isBubblophyIssueStatus(input.expectedStatus) ||
    !isBubblophyIssueStatus(input.status)
  ) {
    return { status: 'invalid', reason: 'invalid_status' };
  }

  if (reason.length > bubblophyIssueStatusLimits.maxReasonLength) {
    return { status: 'invalid', reason: 'reason_too_long' };
  }

  if ((input.status === 'blocked' || input.status === 'done') && !reason) {
    return { status: 'invalid', reason: 'reason_required' };
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

  const writeStatus = options.writeStatus ?? updateBubblophyIssueStatus;

  try {
    const writeResult = await writeStatus({
      authUserId: normalizedAuthUserId,
      oauthClientId: normalizedOauthClientId,
      issueId: issueResult.issue.key,
      expectedStatus: mapBubblophyIssueStatus(input.expectedStatus),
      status: mapBubblophyIssueStatus(input.status),
      reason: input.reason,
    });

    if (writeResult.status !== 'updated') {
      return writeResult;
    }

    return {
      status: 'updated',
      project: { ...issueResult.project, isArchived: false },
      issue: {
        key: issueResult.issue.key,
        issueNumber: issueResult.issue.issueNumber,
        title: issueResult.issue.title,
        status: input.status,
      },
    };
  } catch {
    return { status: 'database_unavailable' };
  }
}

/** Returns whether a runtime string is one of Bubblophy's issue statuses. */
function isBubblophyIssueStatus(value: string): value is BubblophyIssueStatus {
  return bubblophyIssueStatus.enumValues.some((status) => status === value);
}
