import 'server-only';

import type {
  CreateOrUpdateBubblophyIssuePlanDraftInput,
  CreateOrUpdateBubblophyIssuePlanDraftResult,
} from '@/lib/issues/plans';
import type {
  GetBubblophyMcpIssueInput,
  GetBubblophyMcpIssueResult,
} from '@/lib/mcp/issue-detail';

import { createOrUpdateBubblophyIssuePlanDraft } from '@/lib/issues/plans';
import { getBubblophyMcpIssue } from '@/lib/mcp/issue-detail';

export interface ProposeBubblophyMcpPlanInput {
  projectId: string;
  issueNumber: number;
  summary?: string;
  steps: string[];
}

interface ProposeBubblophyMcpPlanOptions {
  getIssue?: (
    authUserId: string,
    input: GetBubblophyMcpIssueInput
  ) => Promise<GetBubblophyMcpIssueResult>;
  writePlan?: (
    input: CreateOrUpdateBubblophyIssuePlanDraftInput
  ) => Promise<CreateOrUpdateBubblophyIssuePlanDraftResult>;
}

type PlanValidationReason = Extract<
  CreateOrUpdateBubblophyIssuePlanDraftResult,
  { status: 'invalid' }
>['reason'];

export type ProposeBubblophyMcpPlanResult =
  | {
      status: 'created';
      project: { id: string; key: string; isArchived: boolean };
      issue: { key: string; issueNumber: number; title: string };
      plan: {
        version: number;
        summary: string;
        steps: { id: string; text: string }[];
        approvalStatus: 'draft';
      };
    }
  | {
      status: 'invalid';
      reason:
        | 'empty_auth_user'
        | 'empty_oauth_client'
        | 'empty_project'
        | 'invalid_issue_number'
        | PlanValidationReason;
    }
  | { status: 'not_found' }
  | { status: 'forbidden' }
  | { status: 'database_unavailable' };

/**
 * Proposes one OAuth-attributed plan draft without approving or running it.
 *
 * The issue is first resolved through the MCP read boundary. The existing
 * transactional plan writer then rechecks membership, role, and archive state
 * before creating the next draft version and audit event.
 */
export async function proposeBubblophyMcpPlan(
  authUserId: string,
  oauthClientId: string,
  input: ProposeBubblophyMcpPlanInput,
  options: ProposeBubblophyMcpPlanOptions = {}
): Promise<ProposeBubblophyMcpPlanResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedOauthClientId = oauthClientId.trim();
  const normalizedProjectId = input.projectId.trim();

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

  const writePlan = options.writePlan ?? createOrUpdateBubblophyIssuePlanDraft;

  try {
    const writeResult = await writePlan({
      authUserId: normalizedAuthUserId,
      oauthClientId: normalizedOauthClientId,
      issueId: issueResult.issue.key,
      summary: input.summary,
      steps: input.steps,
    });

    if (writeResult.status !== 'created') {
      return writeResult;
    }

    return {
      status: 'created',
      project: issueResult.project,
      issue: {
        key: issueResult.issue.key,
        issueNumber: issueResult.issue.issueNumber,
        title: issueResult.issue.title,
      },
      plan: {
        version: writeResult.plan.version,
        summary: writeResult.plan.summary,
        steps: writeResult.plan.steps,
        approvalStatus: 'draft',
      },
    };
  } catch {
    return { status: 'database_unavailable' };
  }
}
