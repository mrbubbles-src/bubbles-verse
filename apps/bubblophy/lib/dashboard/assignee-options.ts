import 'server-only';

import type { BubblophyProjectRole } from '@/drizzle/db/schema';

export interface DashboardAssigneeOptionsCursor {
  createdAt: string;
  authUserId: string;
}

export interface DashboardAssigneeOption {
  authUserId: string;
  label: string;
  role: BubblophyProjectRole;
}

export type DashboardCurrentAssignee =
  | (DashboardAssigneeOption & { isCurrentMember: true })
  | {
      authUserId: string;
      label: 'Ehemaliges Projektmitglied';
      role: null;
      isCurrentMember: false;
    };

export interface DashboardAssigneeOptionsPage {
  project: {
    key: string;
    name: string;
    currentUserRole: Exclude<BubblophyProjectRole, 'viewer'>;
  };
  issueKey: string;
  query: string | null;
  after: DashboardAssigneeOptionsCursor | null;
  currentAssignee: DashboardCurrentAssignee | null;
  items: DashboardAssigneeOption[];
  nextAfter: DashboardAssigneeOptionsCursor | null;
}

export interface DashboardAssigneeOptionsReadInput {
  authUserId: string;
  projectKey: string;
  issueNumber: number;
  issueKey: string;
  query: string | null;
  after: DashboardAssigneeOptionsCursor | null;
}

export type DashboardAssigneeOptionsReaderResult =
  | ({ status: 'success' } & DashboardAssigneeOptionsPage)
  | { status: 'not_found' }
  | { status: 'forbidden' };

export type DashboardAssigneeOptionsReader = (
  input: DashboardAssigneeOptionsReadInput
) => Promise<DashboardAssigneeOptionsReaderResult>;

export interface ReadDashboardAssigneeOptionsInput {
  issueKey: string;
  query?: string;
  after?: DashboardAssigneeOptionsCursor;
}

export interface ReadDashboardAssigneeOptionsOptions {
  readOptions?: DashboardAssigneeOptionsReader;
}

export type ReadDashboardAssigneeOptionsResult =
  | DashboardAssigneeOptionsReaderResult
  | {
      status: 'invalid';
      reason:
        | 'empty_auth_user'
        | 'invalid_issue_key'
        | 'query_too_short'
        | 'query_too_long'
        | 'invalid_cursor';
    }
  | { status: 'database_unavailable' };

export const DASHBOARD_ASSIGNEE_OPTIONS_PAGE_SIZE = 20;
export const DASHBOARD_ASSIGNEE_OPTIONS_QUERY_MAX_LENGTH = 80;

const maxPostgresInteger = 2_147_483_647;
const cursorAuthUserIdMaxLength = 160;
const issueKeyPattern = /^(?<projectKey>[A-Z0-9]{2,8})-(?<issueNumber>\d+)$/;

/**
 * Reads one issue-bound, searchable page of current assignment targets.
 *
 * @param authUserId Authenticated Supabase user ID from the server session.
 * @param input Issue key, optional Auth user ID prefix, and stable cursor.
 * @param options Optional reader override for contract tests.
 * @returns Contributor-scoped options or a safe public failure state.
 */
export async function readDashboardAssigneeOptions(
  authUserId: string,
  input: ReadDashboardAssigneeOptionsInput,
  options: ReadDashboardAssigneeOptionsOptions = {}
): Promise<ReadDashboardAssigneeOptionsResult> {
  const normalizedAuthUserId = authUserId.trim();
  const issueKey = input.issueKey.trim().toUpperCase();
  const issue = parseIssueKey(issueKey);
  const query = input.query?.trim() || null;
  const after = input.after ? normalizeCursor(input.after) : null;

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (!issue) {
    return { status: 'invalid', reason: 'invalid_issue_key' };
  }

  if (query && query.length < 2) {
    return { status: 'invalid', reason: 'query_too_short' };
  }

  if (query && query.length > DASHBOARD_ASSIGNEE_OPTIONS_QUERY_MAX_LENGTH) {
    return { status: 'invalid', reason: 'query_too_long' };
  }

  if (query && input.after) {
    return { status: 'invalid', reason: 'invalid_cursor' };
  }

  if (input.after && !after) {
    return { status: 'invalid', reason: 'invalid_cursor' };
  }

  const readOptions =
    options.readOptions ?? (await getDefaultAssigneeOptionsReader());

  if (!readOptions) {
    return { status: 'database_unavailable' };
  }

  try {
    return await readOptions({
      authUserId: normalizedAuthUserId,
      projectKey: issue.projectKey,
      issueNumber: issue.issueNumber,
      issueKey,
      query,
      after,
    });
  } catch {
    return { status: 'database_unavailable' };
  }
}

/** Parses the public issue key into bounded database values. */
function parseIssueKey(issueKey: string) {
  const match = issueKeyPattern.exec(issueKey);
  const projectKey = match?.groups?.projectKey;
  const issueNumberText = match?.groups?.issueNumber;

  if (!projectKey || !issueNumberText) {
    return null;
  }

  const issueNumber = Number.parseInt(issueNumberText, 10);

  return Number.isInteger(issueNumber) &&
    issueNumber >= 1 &&
    issueNumber <= maxPostgresInteger
    ? { projectKey, issueNumber }
    : null;
}

/** Normalizes the all-or-nothing stable member cursor. */
function normalizeCursor(
  cursor: DashboardAssigneeOptionsCursor
): DashboardAssigneeOptionsCursor | null {
  const createdAt = cursor.createdAt.trim();
  const authUserId = cursor.authUserId.trim();

  if (
    !createdAt ||
    createdAt.length > 64 ||
    !Number.isFinite(Date.parse(createdAt)) ||
    !authUserId ||
    authUserId.length > cursorAuthUserIdMaxLength
  ) {
    return null;
  }

  return { createdAt, authUserId };
}

/** Loads the Drizzle reader only when the database is configured. */
async function getDefaultAssigneeOptionsReader(): Promise<DashboardAssigneeOptionsReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectDashboardAssigneeOptionsForUser } =
    await import('@/lib/dashboard/assignee-options-database-read');

  return selectDashboardAssigneeOptionsForUser;
}
