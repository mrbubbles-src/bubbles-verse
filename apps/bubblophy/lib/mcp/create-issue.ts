import 'server-only';

import type { IssuePriority } from '@/lib/dashboard/types';
import type {
  CreateBubblophyIssueDraftInput,
  CreateBubblophyIssueDraftResult,
} from '@/lib/issues/create';
import type { ListBubblophyMcpProjectsResult } from '@/lib/mcp/projects';

import { createBubblophyIssueDraft } from '@/lib/issues/create';
import { parseBubblophyIssueKey } from '@/lib/issues/plan-database-write';
import { listBubblophyMcpProjects } from '@/lib/mcp/projects';

export type BubblophyMcpIssuePriority = 'low' | 'medium' | 'high';

export interface CreateBubblophyMcpIssueInput {
  projectId: string;
  title: string;
  description?: string;
  priority: BubblophyMcpIssuePriority;
}

interface CreateBubblophyMcpIssueOptions {
  listProjects?: (
    authUserId: string
  ) => Promise<ListBubblophyMcpProjectsResult>;
  writeIssue?: (
    input: CreateBubblophyIssueDraftInput
  ) => Promise<CreateBubblophyIssueDraftResult>;
}

type IssueValidationReason = Extract<
  CreateBubblophyIssueDraftResult,
  { status: 'invalid' }
>['reason'];

export type CreateBubblophyMcpIssueResult =
  | {
      status: 'created';
      project: { id: string; key: string; isArchived: boolean };
      issue: {
        key: string;
        issueNumber: number;
        title: string;
        description: string;
        status: 'triage';
        priority: BubblophyMcpIssuePriority;
        requiresHumanApproval: true;
      };
    }
  | {
      status: 'invalid';
      reason:
        | 'empty_auth_user'
        | 'empty_oauth_client'
        | 'empty_project'
        | IssueValidationReason;
    }
  | { status: 'not_found' }
  | { status: 'forbidden' }
  | { status: 'database_unavailable' };

const dashboardPriorityByMcpPriority = {
  low: 'niedrig',
  medium: 'mittel',
  high: 'hoch',
} satisfies Record<BubblophyMcpIssuePriority, IssuePriority>;

const mcpPriorityByDashboardPriority = {
  niedrig: 'low',
  mittel: 'medium',
  hoch: 'high',
} satisfies Record<IssuePriority, BubblophyMcpIssuePriority>;

/**
 * Creates one OAuth-attributed issue without planning or starting work.
 *
 * Current project visibility is resolved through the MCP read boundary. The
 * shared create writer then rechecks active membership under database locks.
 *
 * @param authUserId Verified OAuth subject mapped to the Bubblophy user.
 * @param oauthClientId Verified OAuth client that initiated the write.
 * @param input Project ID and bounded public issue fields.
 * @param options Optional service dependencies for tests.
 * @returns Created public issue fields or a safe structured failure.
 */
export async function createBubblophyMcpIssue(
  authUserId: string,
  oauthClientId: string,
  input: CreateBubblophyMcpIssueInput,
  options: CreateBubblophyMcpIssueOptions = {}
): Promise<CreateBubblophyMcpIssueResult> {
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

  const listProjects = options.listProjects ?? listBubblophyMcpProjects;
  let projectResult: ListBubblophyMcpProjectsResult;

  try {
    projectResult = await listProjects(normalizedAuthUserId);
  } catch {
    return { status: 'database_unavailable' };
  }

  if (projectResult.status !== 'success') {
    return projectResult.status === 'database_unavailable'
      ? { status: 'database_unavailable' }
      : { status: 'invalid', reason: 'empty_auth_user' };
  }

  const project = projectResult.projects.find(
    (candidate) => candidate.id === normalizedProjectId
  );

  if (!project) {
    return { status: 'not_found' };
  }

  const writeIssue = options.writeIssue ?? createBubblophyIssueDraft;

  try {
    const writeResult = await writeIssue({
      authUserId: normalizedAuthUserId,
      oauthClientId: normalizedOauthClientId,
      projectKey: project.key,
      title: input.title,
      description: input.description,
      priority: dashboardPriorityByMcpPriority[input.priority],
    });

    if (writeResult.status !== 'created') {
      return writeResult;
    }

    const issueKey = parseBubblophyIssueKey(writeResult.issue.id);

    if (!issueKey) {
      return { status: 'database_unavailable' };
    }

    return {
      status: 'created',
      project: {
        id: project.id,
        key: project.key,
        isArchived: project.isArchived,
      },
      issue: {
        key: writeResult.issue.id,
        issueNumber: issueKey.issueNumber,
        title: writeResult.issue.title,
        description: writeResult.issue.description ?? '',
        status: 'triage',
        priority: mcpPriorityByDashboardPriority[writeResult.issue.priority],
        requiresHumanApproval: true,
      },
    };
  } catch {
    return { status: 'database_unavailable' };
  }
}
