import 'server-only';

import type { BubblophySession } from '@/lib/auth/session';
import type {
  DashboardSnapshot,
  DashboardUnavailableReason,
} from '@/lib/dashboard/types';
import type {
  BubblophyActivityPersistenceRow,
  BubblophyAgentRunPersistenceRow,
  BubblophyAgentTokenPersistenceRow,
  BubblophyProjectIssuePersistenceRow,
  BubblophyProjectMemberPersistenceRow,
} from '@/lib/issues/repository';

import {
  buildBubblophyActivityEvents,
  buildBubblophyAgentRunSummaries,
  buildBubblophyAgentTokenSummaries,
  buildBubblophyProjectIssueSnapshot,
  buildBubblophyProjectMemberSummaries,
} from '@/lib/issues/repository';

export interface BubblophyDashboardPersistenceRows {
  projectIssueRows: BubblophyProjectIssuePersistenceRow[];
  projectMemberRows: BubblophyProjectMemberPersistenceRow[];
  agentTokenRows: BubblophyAgentTokenPersistenceRow[];
  agentRunRows: BubblophyAgentRunPersistenceRow[];
  activityRows: BubblophyActivityPersistenceRow[];
}

export type BubblophyDashboardRowSelector = (
  authUserId: string
) => Promise<BubblophyDashboardPersistenceRows>;

export interface BubblophyDashboardSnapshotInput {
  session: Pick<BubblophySession, 'authUserId'>;
  loadRows?: BubblophyDashboardRowSelector;
}

/**
 * Copies a dashboard DTO so UI code cannot mutate the shared source object.
 *
 * @param snapshot Dashboard DTO from a sample or database-backed source.
 * @returns A detached snapshot safe to pass into React components.
 */
export function cloneDashboardSnapshot(
  snapshot: DashboardSnapshot
): DashboardSnapshot {
  return {
    meta: { ...snapshot.meta },
    projects: snapshot.projects.map((project) => ({ ...project })),
    issues: snapshot.issues.map((issue) => ({
      ...issue,
      latestPlan: issue.latestPlan
        ? {
            ...issue.latestPlan,
            steps: issue.latestPlan.steps.map((step) => ({ ...step })),
          }
        : undefined,
    })),
    projectMembers: snapshot.projectMembers.map((member) => ({ ...member })),
    agentTokens: snapshot.agentTokens.map((token) => ({
      ...token,
      scopes: [...token.scopes],
    })),
    agentRuns: snapshot.agentRuns.map((run) => ({ ...run })),
    activity: snapshot.activity.map((event) => ({ ...event })),
  };
}

/**
 * Builds a dashboard snapshot from read-only project and issue rows.
 *
 * Empty row sets represent a real empty database state and intentionally do
 * not fall back to sample data.
 *
 * @param input.authUserId Supabase Auth user ID used by the row selector.
 * @param input.selectRows Injected read function for tests or the DB adapter.
 * @returns Database-sourced dashboard snapshot.
 */
export async function loadBubblophyProjectIssueDashboardSnapshot({
  authUserId,
  selectRows,
}: {
  authUserId: string;
  selectRows: BubblophyDashboardRowSelector;
}): Promise<DashboardSnapshot> {
  const rows = await selectRows(authUserId);
  const { projects, issues } = buildBubblophyProjectIssueSnapshot(
    rows.projectIssueRows
  );
  const isEmptyDatabase =
    projects.length === 0 &&
    issues.length === 0 &&
    rows.projectMemberRows.length === 0 &&
    rows.agentTokenRows.length === 0 &&
    rows.agentRunRows.length === 0 &&
    rows.activityRows.length === 0;

  return {
    meta: {
      dataSource: isEmptyDatabase ? 'empty_database' : 'database',
      label: isEmptyDatabase ? 'Leere Datenbank' : 'Datenbankdaten',
      description: isEmptyDatabase
        ? 'Datenbank erreichbar, aber für diesen User gibt es noch keine Projekte.'
        : 'Read-only aus Projekten mit menschlicher Mitgliedschaft.',
    },
    projects,
    issues,
    projectMembers: buildBubblophyProjectMemberSummaries(
      rows.projectMemberRows
    ),
    agentTokens: buildBubblophyAgentTokenSummaries(rows.agentTokenRows),
    agentRuns: buildBubblophyAgentRunSummaries(rows.agentRunRows),
    activity: buildBubblophyActivityEvents(rows.activityRows),
  };
}

/**
 * Loads the dashboard DTO for the Bubblophy command center.
 *
 * The preferred path reads Bubblophy rows through a server-only Drizzle adapter.
 * During the MVP, unavailable local database configuration returns an explicit
 * empty setup state instead of silently hiding the problem behind sample data.
 *
 * @param input Authorized human session and optional injected row loader.
 * @returns Snapshot of projects, issues, agent tokens, runs, and activity.
 */
export async function getBubblophyDashboardSnapshot(
  input: BubblophyDashboardSnapshotInput
) {
  const loadRows =
    input.loadRows ?? (await getDefaultProjectIssueRowSelector());

  if (!loadRows) {
    return createDatabaseUnavailableSnapshot('not_configured');
  }

  try {
    return await loadBubblophyProjectIssueDashboardSnapshot({
      authUserId: input.session.authUserId,
      selectRows: loadRows,
    });
  } catch (error) {
    return createDatabaseUnavailableSnapshot(
      error instanceof Error
        ? classifyDatabaseUnavailableReason(error)
        : 'unknown'
    );
  }
}

/**
 * Resolves the default DB row selector only when database env exists.
 *
 * @returns Row selector or null when the local DB is intentionally unavailable.
 */
async function getDefaultProjectIssueRowSelector() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectBubblophyDashboardRowsForUser } =
    await import('@/lib/issues/database');

  return selectBubblophyDashboardRowsForUser;
}

/**
 * Creates an empty setup snapshot when database reads cannot run.
 *
 * @param reason Safe high-level reason for the unavailable state.
 * @returns Empty dashboard snapshot with explicit setup metadata.
 */
function createDatabaseUnavailableSnapshot(
  reason: DashboardUnavailableReason
): DashboardSnapshot {
  return {
    meta: {
      dataSource: 'database_unavailable',
      label: 'Datenbank nicht bereit',
      description:
        'Bubblophy kann die Datenbank oder Tabellen gerade nicht lesen.',
      reason,
      hint: getDatabaseUnavailableHint(reason),
    },
    projects: [],
    issues: [],
    projectMembers: [],
    agentTokens: [],
    agentRuns: [],
    activity: [],
  };
}

/**
 * Classifies database read failures into UI-safe setup reasons.
 *
 * @param error Thrown database or adapter error.
 * @returns Safe reason without stack traces, SQL, URLs, or credentials.
 */
function classifyDatabaseUnavailableReason(
  error: Error
): DashboardUnavailableReason {
  const message = error.message.toLowerCase();

  if (
    message.includes('does not exist') ||
    message.includes('relation') ||
    message.includes('schema') ||
    ('code' in error &&
      typeof error.code === 'string' &&
      error.code.toUpperCase() === '42P01')
  ) {
    return 'schema_missing';
  }

  if (
    message.includes('connect') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('econnrefused')
  ) {
    return 'connection_failed';
  }

  return 'unknown';
}

/**
 * Provides a short setup hint for the dashboard without leaking internals.
 *
 * @param reason Safe unavailable reason.
 * @returns Human-readable setup hint.
 */
function getDatabaseUnavailableHint(reason: DashboardUnavailableReason) {
  if (reason === 'not_configured') {
    return 'DATABASE_URL ist nicht gesetzt. Konfiguriere die lokale Env und starte den Dev-Server neu.';
  }

  if (reason === 'schema_missing') {
    return 'Die Bubblophy-Tabellen scheinen zu fehlen. Prüfe die lokale Strukturmigration.';
  }

  if (reason === 'connection_failed') {
    return 'Die Datenbank ist nicht erreichbar. Prüfe Verbindung, Host und lokale Supabase/Postgres-Umgebung.';
  }

  return 'Prüfe Datenbank-Konfiguration und Migration, ohne Secrets in Logs oder UI auszugeben.';
}
