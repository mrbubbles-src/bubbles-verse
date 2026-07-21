import 'server-only';

export type DashboardActivitySource = 'issue' | 'project';
export type DashboardActivityKind = DashboardActivitySource | 'all';

export interface DashboardActivityCursor {
  occurredAt: string;
  source: DashboardActivitySource;
  eventId: string;
}

export interface DashboardActivityFilters {
  projectKey: string | null;
  kind: DashboardActivitySource | null;
}

export interface DashboardActivityPageItem {
  id: string;
  source: DashboardActivitySource;
  label: string;
  actor: string;
  occurredAt: string;
  projectKey: string;
  issueKey: string | null;
}

export interface DashboardActivityPage {
  filters: DashboardActivityFilters;
  items: DashboardActivityPageItem[];
  nextAfter: DashboardActivityCursor | null;
}

export interface DashboardActivityPageReadInput {
  authUserId: string;
  after: DashboardActivityCursor | null;
  filters: DashboardActivityFilters;
}

export type DashboardActivityPageReader = (
  input: DashboardActivityPageReadInput
) => Promise<DashboardActivityPage | null>;

export interface ReadDashboardActivityPageInput {
  after?: DashboardActivityCursor;
  projectKey?: string;
  kind?: DashboardActivityKind;
}

export interface ReadDashboardActivityPageOptions {
  readPage?: DashboardActivityPageReader;
}

export type ReadDashboardActivityPageResult =
  | ({ status: 'success' } & DashboardActivityPage)
  | {
      status: 'invalid';
      reason:
        | 'empty_auth_user'
        | 'invalid_cursor'
        | 'invalid_project_key'
        | 'invalid_kind';
    }
  | { status: 'not_found' }
  | { status: 'database_unavailable' };

export const DASHBOARD_ACTIVITY_PAGE_SIZE = 20;
export const DASHBOARD_ACTIVITY_EVENT_ID_MAX_LENGTH = 128;

const projectKeyPattern = /^[A-Z0-9]{2,8}$/;

/**
 * Reads one bounded, newest-first audit page for the current user.
 *
 * @param authUserId Authenticated Supabase user ID from the server session.
 * @param input Optional project, event kind, and stable pagination cursor.
 * @param options Optional reader override for contract tests.
 * @returns Membership-scoped activity or a safe public failure state.
 */
export async function readDashboardActivityPage(
  authUserId: string,
  input: ReadDashboardActivityPageInput = {},
  options: ReadDashboardActivityPageOptions = {}
): Promise<ReadDashboardActivityPageResult> {
  const normalizedAuthUserId = authUserId.trim();
  const projectKey = input.projectKey?.trim().toUpperCase() || null;
  const kind = input.kind === 'all' || !input.kind ? null : input.kind;
  const after = input.after ? normalizeActivityCursor(input.after) : null;

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  if (input.after && !after) {
    return { status: 'invalid', reason: 'invalid_cursor' };
  }

  if (projectKey && !projectKeyPattern.test(projectKey)) {
    return { status: 'invalid', reason: 'invalid_project_key' };
  }

  if (input.kind && input.kind !== 'all' && !isActivitySource(input.kind)) {
    return { status: 'invalid', reason: 'invalid_kind' };
  }

  const readPage = options.readPage ?? (await getDefaultActivityPageReader());

  if (!readPage) {
    return { status: 'database_unavailable' };
  }

  try {
    const page = await readPage({
      authUserId: normalizedAuthUserId,
      after,
      filters: { projectKey, kind },
    });

    return page ? { status: 'success', ...page } : { status: 'not_found' };
  } catch {
    return { status: 'database_unavailable' };
  }
}

/** Normalizes a complete public activity cursor. */
function normalizeActivityCursor(
  cursor: DashboardActivityCursor
): DashboardActivityCursor | null {
  const occurredAt = cursor.occurredAt.trim();
  const eventId = cursor.eventId.trim();

  if (
    !occurredAt ||
    occurredAt.length > 64 ||
    !Number.isFinite(Date.parse(occurredAt)) ||
    !isActivitySource(cursor.source) ||
    !eventId ||
    eventId.length > DASHBOARD_ACTIVITY_EVENT_ID_MAX_LENGTH
  ) {
    return null;
  }

  return { occurredAt, source: cursor.source, eventId };
}

/** Checks the narrow public source vocabulary. */
function isActivitySource(value: string): value is DashboardActivitySource {
  return value === 'issue' || value === 'project';
}

/** Loads the server-only Drizzle reader when database access is configured. */
async function getDefaultActivityPageReader(): Promise<DashboardActivityPageReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectDashboardActivityPageForUser } =
    await import('@/lib/dashboard/activity-database-read');

  return selectDashboardActivityPageForUser;
}
