import 'server-only';

import type {
  BubblophyIssuePriority,
  BubblophyIssueStatus,
} from '@/drizzle/db/schema';
import type { IssueSummary } from '@/lib/dashboard/types';

import { bubblophyIssueContentLimits } from '@/lib/issues/content-limits';
import {
  formatBubblophyIssueKey,
  mapBubblophyIssuePriority,
  mapBubblophyIssueStatus,
} from '@/lib/issues/repository';

export interface UpdateBubblophyIssueContentInput {
  authUserId: string;
  issueId: string;
  title: string;
  description?: string;
}

export interface BubblophyIssueContentUpdateStoreInput {
  authUserId: string;
  issueId: string;
  title: string;
  description: string;
}

export interface BubblophyIssueContentUpdateStoreResult {
  project: {
    id: string;
    key: string;
    name: string;
  };
  issue: {
    id: string;
    issueNumber: number;
    title: string;
    description: string;
    status: BubblophyIssueStatus;
    priority: BubblophyIssuePriority;
    assignedAuthUserId: string | null;
    requiresHumanApproval: boolean;
    planStepCount: number;
  };
}

export interface BubblophyIssueContentUpdateStore {
  updateIssueContentWithEvent(
    input: BubblophyIssueContentUpdateStoreInput
  ): Promise<
    | {
        status: 'updated';
        issue: BubblophyIssueContentUpdateStoreResult;
      }
    | {
        status: 'unchanged';
      }
    | {
        status: 'not_found';
      }
    | {
        status: 'forbidden';
      }
  >;
}

export type UpdateBubblophyIssueContentResult =
  | {
      status: 'updated';
      issue: IssueSummary;
    }
  | {
      status: 'unchanged';
    }
  | {
      status: 'invalid';
      reason:
        | 'empty_issue'
        | 'empty_title'
        | 'title_too_long'
        | 'description_too_long';
    }
  | {
      status: 'not_found';
    }
  | {
      status: 'forbidden';
    }
  | {
      status: 'database_unavailable';
    };

export interface UpdateBubblophyIssueContentOptions {
  store?: BubblophyIssueContentUpdateStore;
}

/**
 * Updates a persisted issue title and description after authorization checks.
 *
 * The operation is human-only, normalizes bounded text input, writes an audit
 * event through the store, and never starts or modifies an agent run.
 *
 * @param input Authenticated user ID, issue key, title, and description.
 * @param options Optional store override for tests.
 * @returns Structured issue content update result for server actions.
 */
export async function updateBubblophyIssueContent(
  input: UpdateBubblophyIssueContentInput,
  options: UpdateBubblophyIssueContentOptions = {}
): Promise<UpdateBubblophyIssueContentResult> {
  const normalized = normalizeIssueContentInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultEditStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const result = await store.updateIssueContentWithEvent(normalized.input);

  if (result.status !== 'updated') {
    return result;
  }

  return {
    status: 'updated',
    issue: mapUpdatedIssueContentToSummary(result.issue),
  };
}

/**
 * Maps an updated persistence issue row into the dashboard issue summary.
 *
 * @param updated Project and issue values after the content update.
 * @returns Dashboard issue summary with title and description included.
 */
export function mapUpdatedIssueContentToSummary(
  updated: BubblophyIssueContentUpdateStoreResult
): IssueSummary {
  return {
    id: formatBubblophyIssueKey(updated.project.key, updated.issue.issueNumber),
    title: updated.issue.title,
    description: updated.issue.description,
    projectKey: updated.project.key,
    status: mapBubblophyIssueStatus(updated.issue.status),
    priority: mapBubblophyIssuePriority(updated.issue.priority),
    owner: updated.issue.assignedAuthUserId ?? 'Nicht zugewiesen',
    planSteps: Math.max(0, updated.issue.planStepCount),
    approvalRequired: updated.issue.requiresHumanApproval,
  };
}

/**
 * Converts raw action input into store-safe issue content values.
 *
 * @param input Raw issue edit input.
 * @returns Validated store input or structured validation error.
 */
function normalizeIssueContentInput(input: UpdateBubblophyIssueContentInput):
  | {
      status: 'valid';
      input: BubblophyIssueContentUpdateStoreInput;
    }
  | Extract<UpdateBubblophyIssueContentResult, { status: 'invalid' }> {
  const issueId = input.issueId.trim();
  const title = input.title.trim();
  const description = input.description?.trim() ?? '';

  if (!issueId) {
    return { status: 'invalid', reason: 'empty_issue' };
  }

  if (!title) {
    return { status: 'invalid', reason: 'empty_title' };
  }

  if (title.length > bubblophyIssueContentLimits.maxTitleLength) {
    return { status: 'invalid', reason: 'title_too_long' };
  }

  if (description.length > bubblophyIssueContentLimits.maxDescriptionLength) {
    return { status: 'invalid', reason: 'description_too_long' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      issueId,
      title,
      description,
    },
  };
}

/**
 * Loads the Drizzle-backed edit store only when a database URL exists.
 *
 * @returns Server-only issue edit store, or `null` without database config.
 */
async function getDefaultEditStore(): Promise<BubblophyIssueContentUpdateStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyIssueContentUpdateStore } =
    await import('@/lib/issues/edit-database-write');

  return createDrizzleBubblophyIssueContentUpdateStore();
}
