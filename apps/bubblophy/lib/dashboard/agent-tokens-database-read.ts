import 'server-only';

import type {
  BubblophyAgentTokenScope,
  BubblophyAgentTokenState,
  BubblophyProjectRole,
} from '@/drizzle/db/schema';
import type { DashboardAgentTokenCursor } from '@/lib/dashboard/agent-token-query';
import type {
  DashboardAgentTokenPage,
  DashboardAgentTokenPageItem,
  DashboardAgentTokenPageReadInput,
} from '@/lib/dashboard/agent-tokens';

import { DASHBOARD_AGENT_TOKEN_PAGE_SIZE } from '@/lib/dashboard/agent-tokens';
import { deriveBubblophyAgentTokenState } from '@/lib/issues/repository';

import { and, asc, eq, gt, inArray, or, sql } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyAgentTokens,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

interface TokenProjectRow {
  projectId: string;
  projectKey: string;
  projectName: string;
  projectIsArchived: boolean;
  currentUserRole: BubblophyProjectRole;
}

interface AgentTokenPageRow extends TokenProjectRow {
  id: string;
  label: string;
  normalizedLabel: string;
  scopes: BubblophyAgentTokenScope[];
  state: BubblophyAgentTokenState;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

interface AcceptedTokenRow {
  item: DashboardAgentTokenPageItem;
  cursor: DashboardAgentTokenCursor;
}

/**
 * Selects one 20-item public token-management page through current membership.
 *
 * Candidate rows never include token hashes or creator/revocation actor IDs.
 * A final membership read refreshes role, archive state, project identity, and
 * skips access lost during pagination without starving later visible rows.
 *
 * @param input Normalized actor, optional project, cursor, and server clock.
 * @returns Public token page or null after concrete project access is lost.
 */
export async function selectDashboardAgentTokenPageForUser(
  input: DashboardAgentTokenPageReadInput
): Promise<DashboardAgentTokenPage | null> {
  const candidateProject = input.projectKey
    ? await selectConcreteTokenProject(input.authUserId, input.projectKey)
    : null;

  if (input.projectKey && !candidateProject) {
    return null;
  }

  const acceptedRows: AcceptedTokenRow[] = [];
  let candidateAfter = input.after;
  let reachedEnd = false;

  while (
    acceptedRows.length <= DASHBOARD_AGENT_TOKEN_PAGE_SIZE &&
    !reachedEnd
  ) {
    const rows = await selectCandidateTokenRows(input, candidateAfter);

    if (rows.length === 0) {
      break;
    }

    const currentProjects = await selectCurrentTokenProjects(input.authUserId, [
      ...new Set(rows.map((row) => row.projectId)),
    ]);
    const currentProjectById = new Map(
      currentProjects.map((project) => [project.projectId, project])
    );

    for (const row of rows) {
      const project = currentProjectById.get(row.projectId);

      if (!project || project.projectKey !== row.projectKey) {
        continue;
      }

      acceptedRows.push({
        item: mapAgentTokenPageItem(row, project, input.now),
        cursor: toAgentTokenCursor(row),
      });

      if (acceptedRows.length > DASHBOARD_AGENT_TOKEN_PAGE_SIZE) {
        break;
      }
    }

    const lastRawRow = rows.at(-1);
    reachedEnd = rows.length < DASHBOARD_AGENT_TOKEN_PAGE_SIZE + 1;
    candidateAfter = lastRawRow ? toAgentTokenCursor(lastRawRow) : null;
  }

  const finalProject = input.projectKey
    ? await selectConcreteTokenProject(input.authUserId, input.projectKey)
    : null;

  if (
    input.projectKey &&
    (!candidateProject ||
      !finalProject ||
      finalProject.projectId !== candidateProject.projectId ||
      finalProject.projectKey !== candidateProject.projectKey)
  ) {
    return null;
  }

  const visibleRows = acceptedRows.slice(0, DASHBOARD_AGENT_TOKEN_PAGE_SIZE);
  const visibleItems = finalProject
    ? visibleRows.map(({ item }) => ({
        ...item,
        projectKey: finalProject.projectKey,
        projectIsArchived: finalProject.projectIsArchived,
        currentUserRole: finalProject.currentUserRole,
      }))
    : visibleRows.map(({ item }) => item);
  const lastVisibleRow = visibleRows.at(-1);

  return {
    project: finalProject
      ? {
          key: finalProject.projectKey,
          name: finalProject.projectName,
          isArchived: finalProject.projectIsArchived,
          currentUserRole: finalProject.currentUserRole,
        }
      : null,
    query: input.query,
    items: visibleItems,
    nextAfter:
      acceptedRows.length > DASHBOARD_AGENT_TOKEN_PAGE_SIZE && lastVisibleRow
        ? lastVisibleRow.cursor
        : null,
  };
}

/** Selects the next raw 20+1 token candidates in database cursor order. */
async function selectCandidateTokenRows(
  input: DashboardAgentTokenPageReadInput,
  after: DashboardAgentTokenCursor | null
) {
  const normalizedLabel = sql<string>`lower(${bubblophyAgentTokens.label})`;
  const projectCondition = input.projectKey
    ? eq(bubblophyProjects.key, input.projectKey)
    : undefined;
  const queryCondition = input.query
    ? sql`${normalizedLabel} like ${buildLiteralLabelPrefix(input.query)} escape '\\'`
    : undefined;
  const cursorCondition = after
    ? or(
        gt(bubblophyProjects.key, after.projectKey),
        and(
          eq(bubblophyProjects.key, after.projectKey),
          or(
            gt(normalizedLabel, after.normalizedLabel),
            and(
              eq(normalizedLabel, after.normalizedLabel),
              gt(bubblophyAgentTokens.id, after.tokenId)
            )
          )
        )
      )
    : undefined;

  return (await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      projectName: bubblophyProjects.name,
      projectIsArchived: bubblophyProjects.isArchived,
      currentUserRole: bubblophyProjectMembers.role,
      id: bubblophyAgentTokens.id,
      label: bubblophyAgentTokens.label,
      normalizedLabel,
      scopes: bubblophyAgentTokens.scopes,
      state: bubblophyAgentTokens.state,
      lastUsedAt: bubblophyAgentTokens.lastUsedAt,
      expiresAt: bubblophyAgentTokens.expiresAt,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .innerJoin(
      bubblophyAgentTokens,
      eq(bubblophyAgentTokens.projectId, bubblophyProjects.id)
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        projectCondition,
        queryCondition,
        cursorCondition
      )
    )
    .orderBy(
      asc(bubblophyProjects.key),
      asc(normalizedLabel),
      asc(bubblophyAgentTokens.id)
    )
    .limit(DASHBOARD_AGENT_TOKEN_PAGE_SIZE + 1)) as AgentTokenPageRow[];
}

/** Builds a case-insensitive literal prefix for a token label. */
function buildLiteralLabelPrefix(query: string) {
  return `${escapeLikePattern(query.toLowerCase())}%`;
}

/** Escapes PostgreSQL LIKE wildcards in a user-entered token prefix. */
function escapeLikePattern(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
}

/** Reads one concrete visible project for empty-page and final access checks. */
async function selectConcreteTokenProject(
  authUserId: string,
  projectKey: string
) {
  const rows = await selectTokenProjects(authUserId, { projectKey });
  return rows[0] ?? null;
}

/** Revalidates current memberships for candidate project IDs. */
async function selectCurrentTokenProjects(
  authUserId: string,
  projectIds: string[]
) {
  if (projectIds.length === 0) {
    return [];
  }

  return selectTokenProjects(authUserId, { projectIds });
}

/** Selects public project metadata and the actor's current project role. */
async function selectTokenProjects(
  authUserId: string,
  filter: { projectKey: string } | { projectIds: string[] }
): Promise<TokenProjectRow[]> {
  const filterCondition =
    'projectKey' in filter
      ? eq(bubblophyProjects.key, filter.projectKey)
      : inArray(bubblophyProjects.id, filter.projectIds);

  return db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      projectName: bubblophyProjects.name,
      projectIsArchived: bubblophyProjects.isArchived,
      currentUserRole: bubblophyProjectMembers.role,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .where(
      and(eq(bubblophyProjectMembers.authUserId, authUserId), filterCondition)
    );
}

/** Maps one hash-free row with final project authorization metadata. */
function mapAgentTokenPageItem(
  row: AgentTokenPageRow,
  project: TokenProjectRow,
  now: string
): DashboardAgentTokenPageItem {
  return {
    id: row.id,
    label: row.label,
    projectKey: project.projectKey,
    scopes: [...row.scopes],
    state: deriveBubblophyAgentTokenState(row, Date.parse(now)),
    lastUsedAt: row.lastUsedAt ?? 'noch nie verwendet',
    expiresAt: row.expiresAt ?? 'läuft nicht automatisch ab',
    projectIsArchived: project.projectIsArchived,
    currentUserRole: project.currentUserRole,
  };
}

/** Builds the public stable cursor from database-normalized values. */
function toAgentTokenCursor(
  row: Pick<AgentTokenPageRow, 'projectKey' | 'normalizedLabel' | 'id'>
): DashboardAgentTokenCursor {
  return {
    projectKey: row.projectKey,
    normalizedLabel: row.normalizedLabel,
    tokenId: row.id,
  };
}
