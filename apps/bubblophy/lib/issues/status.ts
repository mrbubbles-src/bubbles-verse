import 'server-only';

import type { BubblophyIssueStatus } from '@/drizzle/db/schema';
import type { IssueStatus, IssueSummary } from '@/lib/dashboard/types';

import {
  formatBubblophyIssueKey,
  mapBubblophyIssuePriority,
  mapBubblophyIssueStatus,
} from '@/lib/issues/repository';

export interface UpdateBubblophyIssueStatusInput {
  authUserId: string;
  oauthClientId?: string;
  issueId: string;
  expectedStatus?: IssueStatus;
  status: IssueStatus;
  reason?: string;
}

export interface BubblophyIssueStatusUpdateStoreInput {
  authUserId: string;
  oauthClientId?: string;
  issueId: string;
  expectedStatus?: BubblophyIssueStatus;
  status: BubblophyIssueStatus;
  reason: string;
}

export interface BubblophyIssueStatusUpdateStoreResult {
  project: {
    id: string;
    key: string;
    name: string;
  };
  issue: {
    id: string;
    issueNumber: number;
    title: string;
    status: BubblophyIssueStatus;
    priority: 'low' | 'medium' | 'high';
    assignedAuthUserId: string | null;
    requiresHumanApproval: boolean;
    planStepCount: number;
  };
}

export interface BubblophyIssueStatusUpdateStore {
  updateIssueStatusWithEvent(
    input: BubblophyIssueStatusUpdateStoreInput
  ): Promise<
    | {
        status: 'updated';
        issue: BubblophyIssueStatusUpdateStoreResult;
      }
    | {
        status: 'unchanged';
      }
    | {
        status: 'conflict';
      }
    | {
        status: 'not_found';
      }
    | {
        status: 'forbidden';
      }
  >;
}

export type UpdateBubblophyIssueStatusResult =
  | {
      status: 'updated';
      issue: IssueSummary;
    }
  | {
      status: 'unchanged';
    }
  | {
      status: 'conflict';
    }
  | {
      status: 'invalid';
      reason: 'empty_issue' | 'invalid_status' | 'reason_too_long';
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

export interface UpdateBubblophyIssueStatusOptions {
  store?: BubblophyIssueStatusUpdateStore;
}

export const bubblophyIssueStatusLimits = {
  maxReasonLength: 240,
} as const;

const statusByDashboardStatus = {
  triage: 'triage',
  geplant: 'planned',
  bereit: 'ready',
  in_arbeit: 'in_progress',
  review: 'review',
  blockiert: 'blocked',
  erledigt: 'done',
} satisfies Record<IssueStatus, BubblophyIssueStatus>;

/**
 * Updates a persisted issue status after server-side membership checks.
 *
 * The operation validates bounded human input, delegates authorization and
 * event writing to the server-only store, and never creates an agent run.
 *
 * @param input Authenticated user ID, issue key, target status, and reason.
 * @param options Optional store override for tests.
 * @returns Structured status update result for server actions.
 */
export async function updateBubblophyIssueStatus(
  input: UpdateBubblophyIssueStatusInput,
  options: UpdateBubblophyIssueStatusOptions = {}
): Promise<UpdateBubblophyIssueStatusResult> {
  const normalized = normalizeIssueStatusInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultStatusStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const result = await store.updateIssueStatusWithEvent(normalized.input);

  if (result.status !== 'updated') {
    return result;
  }

  return {
    status: 'updated',
    issue: mapUpdatedIssueStatusToSummary(result.issue),
  };
}

/**
 * Maps an updated persistence issue row into the dashboard issue summary.
 *
 * @param updated Project and issue values after the status update.
 * @returns Dashboard issue summary with the new status.
 */
export function mapUpdatedIssueStatusToSummary(
  updated: BubblophyIssueStatusUpdateStoreResult
): IssueSummary {
  const status = mapBubblophyIssueStatus(updated.issue.status);

  return {
    id: formatBubblophyIssueKey(updated.project.key, updated.issue.issueNumber),
    title: updated.issue.title,
    projectKey: updated.project.key,
    status,
    priority: mapBubblophyIssuePriority(updated.issue.priority),
    assigneeAuthUserId: updated.issue.assignedAuthUserId,
    assigneeLabel: updated.issue.assignedAuthUserId ?? 'Nicht zugewiesen',
    planSteps: Math.max(0, updated.issue.planStepCount),
    approvalRequired: updated.issue.requiresHumanApproval,
  };
}

/**
 * Converts raw action input into store-safe values.
 *
 * @param input Raw status update input.
 * @returns Validated store input or structured validation error.
 */
function normalizeIssueStatusInput(input: UpdateBubblophyIssueStatusInput):
  | {
      status: 'valid';
      input: BubblophyIssueStatusUpdateStoreInput;
    }
  | Extract<UpdateBubblophyIssueStatusResult, { status: 'invalid' }> {
  const issueId = input.issueId.trim();
  const status = mapDashboardStatusToDatabaseStatus(input.status);
  const expectedStatus = input.expectedStatus
    ? mapDashboardStatusToDatabaseStatus(input.expectedStatus)
    : undefined;
  const reason = input.reason?.trim() ?? '';

  if (!issueId) {
    return { status: 'invalid', reason: 'empty_issue' };
  }

  if (!status) {
    return { status: 'invalid', reason: 'invalid_status' };
  }

  if (input.expectedStatus && !expectedStatus) {
    return { status: 'invalid', reason: 'invalid_status' };
  }

  if (reason.length > bubblophyIssueStatusLimits.maxReasonLength) {
    return { status: 'invalid', reason: 'reason_too_long' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      ...(input.oauthClientId?.trim()
        ? { oauthClientId: input.oauthClientId.trim() }
        : {}),
      issueId,
      ...(expectedStatus ? { expectedStatus } : {}),
      status,
      reason,
    },
  };
}

/**
 * Maps dashboard status labels back into Drizzle enum values.
 *
 * @param status Dashboard issue status.
 * @returns Database issue status, or `null` for runtime-invalid input.
 */
function mapDashboardStatusToDatabaseStatus(
  status: IssueStatus
): BubblophyIssueStatus | null {
  if (status in statusByDashboardStatus) {
    return statusByDashboardStatus[status];
  }

  return null;
}

/**
 * Loads the Drizzle-backed status store only when a database URL exists.
 *
 * @returns Server-only status update store, or `null` without database config.
 */
async function getDefaultStatusStore(): Promise<BubblophyIssueStatusUpdateStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyIssueStatusUpdateStore } =
    await import('@/lib/issues/status-database-write');

  return createDrizzleBubblophyIssueStatusUpdateStore();
}
