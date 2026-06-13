import 'server-only';

import type { BubblophySession } from '@/lib/auth/session';
import type { DashboardSnapshot } from '@/lib/dashboard/types';
import type {
  BubblophyActivityPersistenceRow,
  BubblophyAgentTokenPersistenceRow,
  BubblophyProjectIssuePersistenceRow,
} from '@/lib/issues/repository';

import { dashboardSnapshot } from '@/lib/dashboard/sample-data';
import {
  buildBubblophyActivityEvents,
  buildBubblophyAgentTokenSummaries,
  buildBubblophyProjectIssueSnapshot,
} from '@/lib/issues/repository';

export interface BubblophyDashboardPersistenceRows {
  projectIssueRows: BubblophyProjectIssuePersistenceRow[];
  agentTokenRows: BubblophyAgentTokenPersistenceRow[];
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
    issues: snapshot.issues.map((issue) => ({ ...issue })),
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

  return {
    meta: {
      dataSource: 'database',
      label: 'Datenbankdaten',
      description: 'Read-only aus Projekten mit menschlicher Mitgliedschaft.',
    },
    projects,
    issues,
    agentTokens: buildBubblophyAgentTokenSummaries(rows.agentTokenRows),
    agentRuns: [],
    activity: buildBubblophyActivityEvents(rows.activityRows),
  };
}

/**
 * Loads the dashboard DTO for the Bubblophy command center.
 *
 * The preferred path reads Bubblophy rows through a server-only Drizzle adapter.
 * During the MVP, unavailable local database configuration falls back to sample
 * data with an explicit `database_unavailable` source marker.
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
    return cloneSampleFallbackSnapshot();
  }

  try {
    return await loadBubblophyProjectIssueDashboardSnapshot({
      authUserId: input.session.authUserId,
      selectRows: loadRows,
    });
  } catch {
    return cloneSampleFallbackSnapshot();
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
 * Clones sample data while marking the database as unavailable.
 *
 * @returns Detached sample snapshot with explicit fallback metadata.
 */
function cloneSampleFallbackSnapshot(): DashboardSnapshot {
  return {
    ...cloneDashboardSnapshot(dashboardSnapshot),
    meta: {
      dataSource: 'database_unavailable',
      label: 'Sample-Fallback',
      description: 'Datenbank gerade nicht verfügbar, Beispiel-Daten aktiv.',
    },
  };
}
