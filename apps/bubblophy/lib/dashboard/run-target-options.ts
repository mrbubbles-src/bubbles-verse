import 'server-only';

import type { BubblophyProjectRole } from '@/drizzle/db/schema';

export interface DashboardRunTargetOptionsCursor {
  normalizedLabel: string;
  id: string;
}

export interface DashboardRunTargetOption {
  id: string;
  label: string;
}

export interface DashboardRunTargetOptionsPage {
  project: {
    key: string;
    name: string;
    currentUserRole: Exclude<BubblophyProjectRole, 'viewer'>;
  };
  issueKey: string;
  query: string | null;
  after: DashboardRunTargetOptionsCursor | null;
  items: DashboardRunTargetOption[];
  nextAfter: DashboardRunTargetOptionsCursor | null;
}

export interface DashboardRunTargetOptionsReadInput {
  authUserId: string;
  projectKey: string;
  issueNumber: number;
  issueKey: string;
  query: string | null;
  after: DashboardRunTargetOptionsCursor | null;
  now: string;
}

export type DashboardRunTargetOptionsReaderResult =
  | ({ status: 'success' } & DashboardRunTargetOptionsPage)
  | { status: 'not_found' }
  | { status: 'forbidden' };

export type DashboardRunTargetOptionsReader = (
  input: DashboardRunTargetOptionsReadInput
) => Promise<DashboardRunTargetOptionsReaderResult>;

export interface ReadDashboardRunTargetOptionsInput {
  issueKey: string;
  query?: string;
  after?: DashboardRunTargetOptionsCursor;
}

export interface ReadDashboardRunTargetOptionsOptions {
  readOptions?: DashboardRunTargetOptionsReader;
  now?: string;
}

export type ReadDashboardRunTargetOptionsResult =
  | DashboardRunTargetOptionsReaderResult
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

export const DASHBOARD_RUN_TARGET_OPTIONS_PAGE_SIZE = 20;
export const DASHBOARD_RUN_TARGET_OPTIONS_QUERY_MAX_LENGTH = 80;

const maxPostgresInteger = 2_147_483_647;
const cursorLabelMaxLength = 256;
const cursorIdMaxLength = 128;
const issueKeyPattern = /^(?<projectKey>[A-Z0-9]{2,8})-(?<issueNumber>\d+)$/;

/**
 * Reads one issue-bound, searchable page of executable run targets.
 *
 * @param authUserId Authenticated Supabase user ID from the server session.
 * @param input Public issue key, optional literal label prefix, and cursor.
 * @param options Optional reader and clock dependencies for contract tests.
 * @returns Public `{id,label}` options or a safe structured failure state.
 */
export async function readDashboardRunTargetOptions(
  authUserId: string,
  input: ReadDashboardRunTargetOptionsInput,
  options: ReadDashboardRunTargetOptionsOptions = {}
): Promise<ReadDashboardRunTargetOptionsResult> {
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

  if (query && query.length > DASHBOARD_RUN_TARGET_OPTIONS_QUERY_MAX_LENGTH) {
    return { status: 'invalid', reason: 'query_too_long' };
  }

  if (query && input.after) {
    return { status: 'invalid', reason: 'invalid_cursor' };
  }

  if (input.after && !after) {
    return { status: 'invalid', reason: 'invalid_cursor' };
  }

  const normalizedNow = normalizeNow(options.now);

  try {
    const readOptions =
      options.readOptions ?? (await getDefaultRunTargetOptionsReader());

    if (!readOptions) {
      return { status: 'database_unavailable' };
    }

    return await readOptions({
      authUserId: normalizedAuthUserId,
      projectKey: issue.projectKey,
      issueNumber: issue.issueNumber,
      issueKey,
      query,
      after,
      now: normalizedNow,
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

/** Normalizes the all-or-nothing stable `(lower(label), id)` cursor. */
function normalizeCursor(
  cursor: DashboardRunTargetOptionsCursor
): DashboardRunTargetOptionsCursor | null {
  const normalizedLabel = cursor.normalizedLabel.trim().toLowerCase();
  const id = cursor.id.trim();

  if (
    !normalizedLabel ||
    normalizedLabel.length > cursorLabelMaxLength ||
    !id ||
    id.length > cursorIdMaxLength
  ) {
    return null;
  }

  return { normalizedLabel, id };
}

/** Uses a deterministic ISO timestamp for SQL expiry comparisons. */
function normalizeNow(now?: string) {
  if (!now) {
    return new Date().toISOString();
  }

  const parsed = new Date(now);

  return Number.isFinite(parsed.getTime())
    ? parsed.toISOString()
    : new Date().toISOString();
}

/** Loads the Drizzle reader only when the database is configured. */
async function getDefaultRunTargetOptionsReader(): Promise<DashboardRunTargetOptionsReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectDashboardRunTargetOptionsForUser } =
    await import('@/lib/dashboard/run-target-options-database-read');

  return selectDashboardRunTargetOptionsForUser;
}
