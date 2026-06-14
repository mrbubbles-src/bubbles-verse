import 'server-only';

import type { BubblophyIssuePriority, BubblophyIssueStatus } from '@/drizzle/db/schema';
import type { IssueSummary } from '@/lib/dashboard/types';

import {
  formatBubblophyIssueKey,
  mapBubblophyIssuePriority,
  mapBubblophyIssueStatus,
} from '@/lib/issues/repository';

export interface UpdateBubblophyIssueAssigneeInput {
  authUserId: string;
  issueId: string;
  assigneeAuthUserId?: string | null;
}

export interface BubblophyIssueAssigneeUpdateStoreInput {
  authUserId: string;
  issueId: string;
  assigneeAuthUserId: string | null;
}

export interface BubblophyIssueAssigneeUpdateStoreResult {
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

export interface BubblophyIssueAssigneeUpdateStore {
  updateIssueAssigneeWithEvent(
    input: BubblophyIssueAssigneeUpdateStoreInput
  ): Promise<
    | {
        status: 'updated';
        issue: BubblophyIssueAssigneeUpdateStoreResult;
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
    | {
        status: 'invalid_assignee';
      }
  >;
}

export type UpdateBubblophyIssueAssigneeResult =
  | {
      status: 'updated';
      issue: IssueSummary;
    }
  | {
      status: 'unchanged';
    }
  | {
      status: 'invalid';
      reason: 'empty_issue' | 'assignee_too_long';
    }
  | {
      status: 'invalid_assignee';
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

export interface UpdateBubblophyIssueAssigneeOptions {
  store?: BubblophyIssueAssigneeUpdateStore;
}

const maxAssigneeAuthUserIdLength = 160;

/**
 * Updates an issue assignee after server-side membership checks.
 *
 * The operation accepts either a project member auth user ID or an empty value
 * to remove the assignment. It does not alter status, plan, or agent runs.
 *
 * @param input Authenticated user, issue key, and optional assignee member ID.
 * @param options Optional store override for tests.
 * @returns Structured assignment update result for server actions.
 */
export async function updateBubblophyIssueAssignee(
  input: UpdateBubblophyIssueAssigneeInput,
  options: UpdateBubblophyIssueAssigneeOptions = {}
): Promise<UpdateBubblophyIssueAssigneeResult> {
  const normalized = normalizeIssueAssigneeInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultAssignmentStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const result = await store.updateIssueAssigneeWithEvent(normalized.input);

  if (result.status !== 'updated') {
    return result;
  }

  return {
    status: 'updated',
    issue: mapUpdatedIssueAssigneeToSummary(result.issue),
  };
}

/**
 * Maps an updated persistence issue row into the dashboard issue summary.
 *
 * @param updated Project and issue values after the assignment update.
 * @returns Dashboard issue summary with the new assignee label.
 */
export function mapUpdatedIssueAssigneeToSummary(
  updated: BubblophyIssueAssigneeUpdateStoreResult
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
 * Converts raw action input into store-safe assignee values.
 *
 * @param input Raw issue assignment input.
 * @returns Validated store input or structured validation error.
 */
function normalizeIssueAssigneeInput(input: UpdateBubblophyIssueAssigneeInput):
  | {
      status: 'valid';
      input: BubblophyIssueAssigneeUpdateStoreInput;
    }
  | Extract<UpdateBubblophyIssueAssigneeResult, { status: 'invalid' }> {
  const issueId = input.issueId.trim();
  const assigneeAuthUserId = input.assigneeAuthUserId?.trim() || null;

  if (!issueId) {
    return { status: 'invalid', reason: 'empty_issue' };
  }

  if (
    assigneeAuthUserId &&
    assigneeAuthUserId.length > maxAssigneeAuthUserIdLength
  ) {
    return { status: 'invalid', reason: 'assignee_too_long' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      issueId,
      assigneeAuthUserId,
    },
  };
}

/**
 * Loads the Drizzle-backed assignment store only when a database URL exists.
 *
 * @returns Server-only assignment store, or `null` without database config.
 */
async function getDefaultAssignmentStore(): Promise<BubblophyIssueAssigneeUpdateStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyIssueAssigneeUpdateStore } =
    await import('@/lib/issues/assignment-database-write');

  return createDrizzleBubblophyIssueAssigneeUpdateStore();
}
