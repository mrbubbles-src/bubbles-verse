import 'server-only';

import type { BubblophyIssuePriority } from '@/drizzle/db/schema';
import type { IssuePriority, IssueSummary } from '@/lib/dashboard/types';

import {
  formatBubblophyIssueKey,
  mapBubblophyIssuePriority,
  mapBubblophyIssueStatus,
} from '@/lib/issues/repository';

export interface CreateBubblophyIssueDraftInput {
  authUserId: string;
  projectKey: string;
  title: string;
  description?: string;
  priority?: IssuePriority;
}

export interface BubblophyCreatedIssueProject {
  id: string;
  key: string;
  name: string;
}

export interface BubblophyCreatedIssueRecord {
  id: string;
  issueNumber: number;
  title: string;
  status: 'triage';
  priority: BubblophyIssuePriority;
  assignedAuthUserId: string | null;
  requiresHumanApproval: boolean;
}

export interface BubblophyIssueDraftCreateStoreInput {
  authUserId: string;
  projectKey: string;
  title: string;
  description: string;
  priority: BubblophyIssuePriority;
}

export interface BubblophyIssueDraftCreateStoreResult {
  project: BubblophyCreatedIssueProject;
  issue: BubblophyCreatedIssueRecord;
}

export interface BubblophyIssueDraftCreateStore {
  createIssueWithCreatedEvent(
    input: BubblophyIssueDraftCreateStoreInput
  ): Promise<BubblophyIssueDraftCreateStoreResult | null>;
}

export type CreateBubblophyIssueDraftResult =
  | {
      status: 'created';
      issue: IssueSummary;
    }
  | {
      status: 'invalid';
      reason: 'empty_title' | 'empty_project' | 'invalid_priority';
    }
  | {
      status: 'forbidden';
    }
  | {
      status: 'database_unavailable';
    };

export interface CreateBubblophyIssueDraftOptions {
  store?: BubblophyIssueDraftCreateStore;
}

const priorityByDashboardPriority = {
  niedrig: 'low',
  mittel: 'medium',
  hoch: 'high',
} satisfies Record<IssuePriority, BubblophyIssuePriority>;

/**
 * Creates a persisted human issue draft after server-side membership checks.
 *
 * The default store is loaded only when `DATABASE_URL` exists. Tests can inject
 * a store so no real database is touched. Creating an issue writes only the
 * issue and its `created` audit event; it never starts an agent run.
 *
 * @param input Human user, target project, and issue draft fields.
 * @param options Optional store override for tests or future server actions.
 * @returns Creation result with a dashboard-ready issue summary on success.
 */
export async function createBubblophyIssueDraft(
  input: CreateBubblophyIssueDraftInput,
  options: CreateBubblophyIssueDraftOptions = {}
): Promise<CreateBubblophyIssueDraftResult> {
  const normalized = normalizeCreateInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultCreateStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const created = await store.createIssueWithCreatedEvent(normalized.input);

  if (!created) {
    return { status: 'forbidden' };
  }

  return {
    status: 'created',
    issue: mapCreatedIssueToSummary(created),
  };
}

/**
 * Maps a freshly created persistence record into the dashboard issue DTO.
 *
 * @param created Project and issue data returned from the server-only store.
 * @returns Issue summary that the dashboard can insert after a future action.
 */
export function mapCreatedIssueToSummary(
  created: BubblophyIssueDraftCreateStoreResult
): IssueSummary {
  const status = mapBubblophyIssueStatus(created.issue.status);

  return {
    id: formatBubblophyIssueKey(created.project.key, created.issue.issueNumber),
    title: created.issue.title,
    projectKey: created.project.key,
    status: status ?? 'triage',
    priority: mapBubblophyIssuePriority(created.issue.priority),
    owner: created.issue.assignedAuthUserId ?? 'Nicht zugewiesen',
    planSteps: 0,
    approvalRequired: created.issue.requiresHumanApproval,
  };
}

/**
 * Converts trusted UI inputs into persistence inputs.
 *
 * @param input Raw create input from a future server action or test.
 * @returns Validated store input or a structured validation error.
 */
function normalizeCreateInput(input: CreateBubblophyIssueDraftInput):
  | {
      status: 'valid';
      input: BubblophyIssueDraftCreateStoreInput;
    }
  | Extract<CreateBubblophyIssueDraftResult, { status: 'invalid' }> {
  const title = input.title.trim();
  const projectKey = input.projectKey.trim();
  const priority = mapDashboardPriorityToDatabasePriority(
    input.priority ?? 'mittel'
  );

  if (!title) {
    return { status: 'invalid', reason: 'empty_title' };
  }

  if (!projectKey) {
    return { status: 'invalid', reason: 'empty_project' };
  }

  if (!priority) {
    return { status: 'invalid', reason: 'invalid_priority' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      projectKey,
      title,
      description: input.description?.trim() ?? '',
      priority,
    },
  };
}

/**
 * Maps dashboard priority labels back to the Drizzle enum.
 *
 * @param priority Priority label from the UI boundary.
 * @returns Database priority enum or `null` for invalid runtime input.
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
 * Loads the Drizzle-backed store only when a database URL is configured.
 *
 * @returns Server-only create store, or `null` in sample/fallback mode.
 */
async function getDefaultCreateStore(): Promise<BubblophyIssueDraftCreateStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyIssueDraftStore } =
    await import('@/lib/issues/database-write');

  return createDrizzleBubblophyIssueDraftStore();
}
