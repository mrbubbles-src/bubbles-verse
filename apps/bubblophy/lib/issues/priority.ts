import 'server-only';

import type {
  BubblophyIssuePriority,
  BubblophyIssueStatus,
} from '@/drizzle/db/schema';
import type { IssuePriority, IssueSummary } from '@/lib/dashboard/types';

import {
  formatBubblophyIssueKey,
  mapBubblophyIssuePriority,
  mapBubblophyIssueStatus,
} from '@/lib/issues/repository';

export interface UpdateBubblophyIssuePriorityInput {
  authUserId: string;
  issueId: string;
  priority: IssuePriority;
}

export interface BubblophyIssuePriorityUpdateStoreInput {
  authUserId: string;
  issueId: string;
  priority: BubblophyIssuePriority;
}

export interface BubblophyIssuePriorityUpdateStoreResult {
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

export interface BubblophyIssuePriorityUpdateStore {
  updateIssuePriorityWithEvent(
    input: BubblophyIssuePriorityUpdateStoreInput
  ): Promise<
    | {
        status: 'updated';
        issue: BubblophyIssuePriorityUpdateStoreResult;
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

export type UpdateBubblophyIssuePriorityResult =
  | {
      status: 'updated';
      issue: IssueSummary;
    }
  | {
      status: 'unchanged';
    }
  | {
      status: 'invalid';
      reason: 'empty_issue' | 'invalid_priority';
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

export interface UpdateBubblophyIssuePriorityOptions {
  store?: BubblophyIssuePriorityUpdateStore;
}

const priorityByDashboardPriority = {
  niedrig: 'low',
  mittel: 'medium',
  hoch: 'high',
} satisfies Record<IssuePriority, BubblophyIssuePriority>;

/**
 * Updates a persisted issue priority after server-side membership checks.
 *
 * The operation validates the dashboard priority vocabulary, delegates object
 * ownership and audit writing to the store, and never starts an agent run.
 *
 * @param input Authenticated user ID, issue key, and target priority.
 * @param options Optional store override for tests.
 * @returns Structured priority update result for server actions.
 */
export async function updateBubblophyIssuePriority(
  input: UpdateBubblophyIssuePriorityInput,
  options: UpdateBubblophyIssuePriorityOptions = {}
): Promise<UpdateBubblophyIssuePriorityResult> {
  const normalized = normalizeIssuePriorityInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultPriorityStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const result = await store.updateIssuePriorityWithEvent(normalized.input);

  if (result.status !== 'updated') {
    return result;
  }

  return {
    status: 'updated',
    issue: mapUpdatedIssuePriorityToSummary(result.issue),
  };
}

/**
 * Maps an updated persistence issue row into the dashboard issue summary.
 *
 * @param updated Project and issue values after the priority update.
 * @returns Dashboard issue summary with the new priority.
 */
export function mapUpdatedIssuePriorityToSummary(
  updated: BubblophyIssuePriorityUpdateStoreResult
): IssueSummary {
  return {
    id: formatBubblophyIssueKey(updated.project.key, updated.issue.issueNumber),
    title: updated.issue.title,
    description: updated.issue.description,
    projectKey: updated.project.key,
    status: mapBubblophyIssueStatus(updated.issue.status),
    priority: mapBubblophyIssuePriority(updated.issue.priority),
    assigneeAuthUserId: updated.issue.assignedAuthUserId,
    assigneeLabel: updated.issue.assignedAuthUserId ?? 'Nicht zugewiesen',
    planSteps: Math.max(0, updated.issue.planStepCount),
    approvalRequired: updated.issue.requiresHumanApproval,
  };
}

/**
 * Converts raw action input into store-safe priority values.
 *
 * @param input Raw issue priority update input.
 * @returns Validated store input or structured validation error.
 */
function normalizeIssuePriorityInput(input: UpdateBubblophyIssuePriorityInput):
  | {
      status: 'valid';
      input: BubblophyIssuePriorityUpdateStoreInput;
    }
  | Extract<UpdateBubblophyIssuePriorityResult, { status: 'invalid' }> {
  const issueId = input.issueId.trim();
  const priority = mapDashboardPriorityToDatabasePriority(input.priority);

  if (!issueId) {
    return { status: 'invalid', reason: 'empty_issue' };
  }

  if (!priority) {
    return { status: 'invalid', reason: 'invalid_priority' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      issueId,
      priority,
    },
  };
}

/**
 * Maps dashboard priority labels back into Drizzle enum values.
 *
 * @param priority Dashboard issue priority.
 * @returns Database priority enum, or `null` for runtime-invalid input.
 */
function mapDashboardPriorityToDatabasePriority(
  priority: IssuePriority
): BubblophyIssuePriority | null {
  if (priority in priorityByDashboardPriority) {
    return priorityByDashboardPriority[priority];
  }

  return null;
}

/**
 * Loads the Drizzle-backed priority store only when a database URL exists.
 *
 * @returns Server-only priority update store, or `null` without database config.
 */
async function getDefaultPriorityStore(): Promise<BubblophyIssuePriorityUpdateStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyIssuePriorityUpdateStore } =
    await import('@/lib/issues/priority-database-write');

  return createDrizzleBubblophyIssuePriorityUpdateStore();
}
