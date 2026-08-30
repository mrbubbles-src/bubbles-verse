import 'server-only';

import type {
  BubblophyIssuePriority,
  BubblophyIssueStatus,
  BubblophyProjectRole,
} from '@/drizzle/db/schema';
import type {
  IssueNoteSummary,
  IssuePlanStepSummary,
} from '@/lib/dashboard/types';

import {
  DASHBOARD_ISSUE_QUERY_MAX_LENGTH,
  isDashboardIssuePriority,
  isDashboardIssueStatus,
  MAX_POSTGRES_INTEGER,
} from '@/lib/dashboard/issue-query';

export type DashboardIssueSort = 'newest' | 'oldest';

export interface DashboardIssueFilters {
  query: string | null;
  status: BubblophyIssueStatus | null;
  priority: BubblophyIssuePriority | null;
}

export interface DashboardIssuePageItem {
  key: string;
  issueNumber: number;
  title: string;
  status: BubblophyIssueStatus;
  priority: BubblophyIssuePriority;
  requiresHumanApproval: boolean;
  assignedAuthUserId: string | null;
  assigneeLabel: string;
  latestPlan: {
    version: number;
    stepCount: number;
  } | null;
}

export interface DashboardIssuePage {
  project: {
    key: string;
    name: string;
    isArchived: boolean;
    currentUserRole: BubblophyProjectRole;
  };
  sort: DashboardIssueSort;
  filters: DashboardIssueFilters;
  items: DashboardIssuePageItem[];
  nextAfterIssueNumber: number | null;
}

export interface DashboardIssueDetail {
  project: {
    key: string;
    name: string;
    isArchived: boolean;
    currentUserRole: BubblophyProjectRole;
  };
  issue: {
    key: string;
    issueNumber: number;
    title: string;
    description: string;
    status: BubblophyIssueStatus;
    priority: BubblophyIssuePriority;
    requiresHumanApproval: boolean;
    assignedAuthUserId: string | null;
    assigneeLabel: string;
    createdAt: string;
    updatedAt: string;
    latestPlan: {
      version: number;
      summary: string;
      steps: IssuePlanStepSummary[];
    } | null;
    notes: IssueNoteSummary[];
    hasMoreNotes: boolean;
  };
}

export interface DashboardIssuePageReadInput {
  authUserId: string;
  projectKey: string;
  sort: DashboardIssueSort;
  afterIssueNumber: number | null;
  filters: DashboardIssueFilters;
}

export type DashboardIssuePageReader = (
  input: DashboardIssuePageReadInput
) => Promise<DashboardIssuePage | null>;

export interface DashboardIssueDetailReadInput {
  authUserId: string;
  projectKey: string;
  issueNumber: number;
}

export type DashboardIssueDetailReader = (
  input: DashboardIssueDetailReadInput
) => Promise<DashboardIssueDetail | null>;

export interface ReadDashboardIssuePageInput {
  projectKey: string;
  sort?: DashboardIssueSort;
  afterIssueNumber?: number;
  query?: string;
  status?: BubblophyIssueStatus | 'all';
  priority?: BubblophyIssuePriority | 'all';
}

export interface ReadDashboardIssuePageOptions {
  readPage?: DashboardIssuePageReader;
}

export interface ReadDashboardIssueDetailInput {
  issueKey: string;
}

export interface ReadDashboardIssueDetailOptions {
  readDetail?: DashboardIssueDetailReader;
}

export type ReadDashboardIssuePageResult =
  | ({ status: 'success' } & DashboardIssuePage)
  | {
      status: 'invalid';
      reason:
        | 'empty_auth_user'
        | 'invalid_project_key'
        | 'invalid_sort'
        | 'invalid_cursor'
        | 'query_too_long'
        | 'invalid_status'
        | 'invalid_priority';
    }
  | { status: 'not_found' }
  | { status: 'database_unavailable' };

export type ReadDashboardIssueDetailResult =
  | ({ status: 'success' } & DashboardIssueDetail)
  | {
      status: 'invalid';
      reason: 'empty_auth_user' | 'invalid_issue_key';
    }
  | { status: 'not_found' }
  | { status: 'database_unavailable' };

export const DASHBOARD_ISSUE_PAGE_SIZE = 25;
export const DASHBOARD_UNASSIGNED_LABEL = 'Nicht zugewiesen';
export const DASHBOARD_FORMER_MEMBER_LABEL = 'Ehemaliges Projektmitglied';

const projectKeyPattern = /^[A-Z0-9]{2,8}$/;
const issueKeyPattern = /^([A-Z0-9]{2,8})-(\d+)$/;

/**
 * Resolves a public assignee label from a final same-project membership read.
 *
 * @param assignedAuthUserId Current persisted assignee ID, or null.
 * @param memberAuthUserId Same-project membership ID from the final read.
 * @param displayName Optional synchronized display name for that member.
 * @returns A display name, stable ID fallback, or explicit lifecycle label.
 */
export function getDashboardAssigneeLabel(
  assignedAuthUserId: string | null,
  memberAuthUserId: string | null,
  displayName: string | null
) {
  if (!assignedAuthUserId) {
    return DASHBOARD_UNASSIGNED_LABEL;
  }

  if (memberAuthUserId !== assignedAuthUserId) {
    return DASHBOARD_FORMER_MEMBER_LABEL;
  }

  return displayName ?? assignedAuthUserId;
}

/**
 * Reads one bounded issue-number page for a concrete visible project.
 *
 * Missing projects and missing memberships intentionally share one result.
 * Search and filters are later URL-backed slices layered onto this cursor.
 *
 * @param authUserId Authenticated Supabase user ID from the server session.
 * @param input Project key, stable sort direction, and optional cursor.
 * @param options Optional reader override for tests.
 * @returns A membership-scoped page or a safe public failure state.
 */
export async function readDashboardIssuePage(
  authUserId: string,
  input: ReadDashboardIssuePageInput,
  options: ReadDashboardIssuePageOptions = {}
): Promise<ReadDashboardIssuePageResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedProjectKey = input.projectKey.trim().toUpperCase();
  const sort = input.sort ?? 'newest';
  const afterIssueNumber = input.afterIssueNumber ?? null;
  const query = input.query?.trim() || null;
  const status = input.status ?? 'all';
  const priority = input.priority ?? 'all';

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (!projectKeyPattern.test(normalizedProjectKey)) {
    return { status: 'invalid', reason: 'invalid_project_key' };
  }

  if (sort !== 'newest' && sort !== 'oldest') {
    return { status: 'invalid', reason: 'invalid_sort' };
  }

  if (query && query.length > DASHBOARD_ISSUE_QUERY_MAX_LENGTH) {
    return { status: 'invalid', reason: 'query_too_long' };
  }

  if (status !== 'all' && !isDashboardIssueStatus(status)) {
    return { status: 'invalid', reason: 'invalid_status' };
  }

  if (priority !== 'all' && !isDashboardIssuePriority(priority)) {
    return { status: 'invalid', reason: 'invalid_priority' };
  }

  if (
    afterIssueNumber !== null &&
    (!Number.isSafeInteger(afterIssueNumber) ||
      afterIssueNumber < 1 ||
      afterIssueNumber > MAX_POSTGRES_INTEGER)
  ) {
    return { status: 'invalid', reason: 'invalid_cursor' };
  }

  const readPage = options.readPage ?? (await getDefaultIssuePageReader());

  if (!readPage) {
    return { status: 'database_unavailable' };
  }

  try {
    const page = await readPage({
      authUserId: normalizedAuthUserId,
      projectKey: normalizedProjectKey,
      sort,
      afterIssueNumber,
      filters: {
        query,
        status: status === 'all' ? null : status,
        priority: priority === 'all' ? null : priority,
      },
    });

    return page ? { status: 'success', ...page } : { status: 'not_found' };
  } catch {
    return { status: 'database_unavailable' };
  }
}

/**
 * Reads one issue detail directly through its stable public key.
 *
 * This lookup is independent of the current queue page and later filters, so
 * deep links remain resolvable even when the issue is outside the first page.
 * Missing issues, projects, and memberships intentionally share one result.
 *
 * @param authUserId Authenticated Supabase user ID from the server session.
 * @param input Stable issue key such as `BV-14`.
 * @param options Optional reader override for tests.
 * @returns A membership-scoped detail or a safe public failure state.
 */
export async function readDashboardIssueDetail(
  authUserId: string,
  input: ReadDashboardIssueDetailInput,
  options: ReadDashboardIssueDetailOptions = {}
): Promise<ReadDashboardIssueDetailResult> {
  const normalizedAuthUserId = authUserId.trim();
  const normalizedIssueKey = input.issueKey.trim().toUpperCase();
  const issueKeyMatch = issueKeyPattern.exec(normalizedIssueKey);
  const projectKey = issueKeyMatch?.[1] ?? '';
  const issueNumber = issueKeyMatch ? Number(issueKeyMatch[2]) : Number.NaN;

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (
    !issueKeyMatch ||
    !Number.isSafeInteger(issueNumber) ||
    issueNumber < 1 ||
    issueNumber > MAX_POSTGRES_INTEGER
  ) {
    return { status: 'invalid', reason: 'invalid_issue_key' };
  }

  const readDetail =
    options.readDetail ?? (await getDefaultIssueDetailReader());

  if (!readDetail) {
    return { status: 'database_unavailable' };
  }

  try {
    const detail = await readDetail({
      authUserId: normalizedAuthUserId,
      projectKey,
      issueNumber,
    });

    return detail ? { status: 'success', ...detail } : { status: 'not_found' };
  } catch {
    return { status: 'database_unavailable' };
  }
}

/** Loads the server-only Drizzle reader when database access is configured. */
async function getDefaultIssuePageReader(): Promise<DashboardIssuePageReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectDashboardIssuePageForUser } =
    await import('@/lib/dashboard/issues-database-read');

  return selectDashboardIssuePageForUser;
}

/** Loads the server-only detail reader when database access is configured. */
async function getDefaultIssueDetailReader(): Promise<DashboardIssueDetailReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectDashboardIssueDetailForUser } =
    await import('@/lib/dashboard/issues-database-read');

  return selectDashboardIssueDetailForUser;
}
