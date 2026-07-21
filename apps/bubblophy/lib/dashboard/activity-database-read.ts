import 'server-only';

import type {
  DashboardActivityCursor,
  DashboardActivityPage,
  DashboardActivityPageItem,
  DashboardActivityPageReadInput,
  DashboardActivitySource,
} from '@/lib/dashboard/activity';

import { DASHBOARD_ACTIVITY_PAGE_SIZE } from '@/lib/dashboard/activity';
import { formatBubblophyIssueKey } from '@/lib/issues/repository';

import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyAgentTokens,
  bubblophyIssueEvents,
  bubblophyIssues,
  bubblophyProjectEvents,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

interface CandidateActivityRow {
  eventId: string;
  source: DashboardActivitySource;
  projectId: string;
  projectKey: string;
  issueId: string | null;
  issueNumber: number | null;
  label: string;
  actorAuthUserId: string | null;
  actorOauthClientId: string | null;
  actorAgentTokenLabel: string | null;
  occurredAt: string;
}

interface CurrentActivityAccessRow {
  eventId: string;
  source: DashboardActivitySource;
  projectId: string;
  projectKey: string;
  issueId: string | null;
  issueNumber: number | null;
}

interface ConcreteProjectScope {
  projectId: string;
  projectKey: string;
}

/**
 * Selects one globally ordered audit page from project and issue events.
 *
 * Candidate rows start at current memberships. A second read rebinds every
 * candidate before it becomes public. Concrete project scopes are also checked
 * before and after the page read so revoked or reused keys fail closed.
 *
 * @param input Normalized actor, filters, and public stable cursor.
 * @returns Bounded activity, or null when a concrete project is inaccessible.
 */
export async function selectDashboardActivityPageForUser(
  input: DashboardActivityPageReadInput
): Promise<DashboardActivityPage | null> {
  const initialScope = input.filters.projectKey
    ? await selectConcreteProjectScope(
        input.authUserId,
        input.filters.projectKey
      )
    : null;

  if (input.filters.projectKey && !initialScope) {
    return null;
  }

  const visibleRows: CandidateActivityRow[] = [];
  let after = input.after;

  while (visibleRows.length <= DASHBOARD_ACTIVITY_PAGE_SIZE) {
    const candidateRows = await selectCandidateRows(input, after, initialScope);

    if (candidateRows.length === 0) {
      break;
    }

    const currentAccessRows = await selectCurrentActivityAccess(
      input.authUserId,
      candidateRows
    );
    const accessByKey = new Map(
      currentAccessRows.map((row) => [formatCandidateKey(row), row])
    );

    for (const row of candidateRows) {
      const access = accessByKey.get(formatCandidateKey(row));

      if (access && hasStableActivityBinding(row, access)) {
        visibleRows.push(row);
      }

      if (visibleRows.length > DASHBOARD_ACTIVITY_PAGE_SIZE) {
        break;
      }
    }

    if (
      visibleRows.length > DASHBOARD_ACTIVITY_PAGE_SIZE ||
      candidateRows.length <= DASHBOARD_ACTIVITY_PAGE_SIZE
    ) {
      break;
    }

    const lastCandidate = candidateRows.at(-1);

    if (!lastCandidate) {
      break;
    }

    after = mapActivityCursor(lastCandidate);
  }

  if (initialScope) {
    const finalScope = await selectConcreteProjectScope(
      input.authUserId,
      initialScope.projectKey
    );

    if (
      !finalScope ||
      finalScope.projectId !== initialScope.projectId ||
      finalScope.projectKey !== initialScope.projectKey
    ) {
      return null;
    }
  }

  const publicRows = visibleRows.slice(0, DASHBOARD_ACTIVITY_PAGE_SIZE);
  const lastRow = publicRows.at(-1);

  return {
    filters: input.filters,
    items: publicRows.map(mapActivityItem),
    nextAfter:
      visibleRows.length > DASHBOARD_ACTIVITY_PAGE_SIZE && lastRow
        ? mapActivityCursor(lastRow)
        : null,
  };
}

/** Loads and globally orders one raw page-sized candidate chunk. */
async function selectCandidateRows(
  input: DashboardActivityPageReadInput,
  after: DashboardActivityCursor | null,
  scope: ConcreteProjectScope | null
): Promise<CandidateActivityRow[]> {
  const [projectRows, issueRows] = await Promise.all([
    input.filters.kind === 'issue'
      ? Promise.resolve([])
      : selectProjectEventCandidates(input, after, scope),
    input.filters.kind === 'project'
      ? Promise.resolve([])
      : selectIssueEventCandidates(input, after, scope),
  ]);

  return [...projectRows, ...issueRows]
    .sort(compareActivityRows)
    .slice(0, DASHBOARD_ACTIVITY_PAGE_SIZE + 1);
}

/** Selects membership-bound project event candidates without payloads. */
async function selectProjectEventCandidates(
  input: DashboardActivityPageReadInput,
  after: DashboardActivityCursor | null,
  scope: ConcreteProjectScope | null
): Promise<CandidateActivityRow[]> {
  const rows = await db
    .select({
      eventId: bubblophyProjectEvents.id,
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      label: bubblophyProjectEvents.summary,
      actorAuthUserId: bubblophyProjectEvents.actorAuthUserId,
      actorOauthClientId: bubblophyProjectEvents.actorOauthClientId,
      actorAgentTokenLabel: bubblophyAgentTokens.label,
      occurredAt: bubblophyProjectEvents.createdAt,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .innerJoin(
      bubblophyProjectEvents,
      eq(bubblophyProjectEvents.projectId, bubblophyProjects.id)
    )
    .leftJoin(
      bubblophyAgentTokens,
      and(
        eq(bubblophyAgentTokens.id, bubblophyProjectEvents.actorAgentTokenId),
        eq(bubblophyAgentTokens.projectId, bubblophyProjects.id)
      )
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        scope ? eq(bubblophyProjects.id, scope.projectId) : undefined,
        buildProjectEventCursorCondition(after)
      )
    )
    .orderBy(
      desc(bubblophyProjectEvents.createdAt),
      desc(bubblophyProjectEvents.id)
    )
    .limit(DASHBOARD_ACTIVITY_PAGE_SIZE + 1);

  return rows.map((row) => ({
    ...row,
    source: 'project',
    issueId: null,
    issueNumber: null,
  }));
}

/** Selects membership- and issue-bound issue event candidates without payloads. */
async function selectIssueEventCandidates(
  input: DashboardActivityPageReadInput,
  after: DashboardActivityCursor | null,
  scope: ConcreteProjectScope | null
): Promise<CandidateActivityRow[]> {
  const rows = await db
    .select({
      eventId: bubblophyIssueEvents.id,
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      issueId: bubblophyIssues.id,
      issueNumber: bubblophyIssues.issueNumber,
      label: bubblophyIssueEvents.summary,
      actorAuthUserId: bubblophyIssueEvents.actorAuthUserId,
      actorOauthClientId: bubblophyIssueEvents.actorOauthClientId,
      actorAgentTokenLabel: bubblophyAgentTokens.label,
      occurredAt: bubblophyIssueEvents.createdAt,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .innerJoin(
      bubblophyIssues,
      eq(bubblophyIssues.projectId, bubblophyProjects.id)
    )
    .innerJoin(
      bubblophyIssueEvents,
      eq(bubblophyIssueEvents.issueId, bubblophyIssues.id)
    )
    .leftJoin(
      bubblophyAgentTokens,
      and(
        eq(bubblophyAgentTokens.id, bubblophyIssueEvents.actorAgentTokenId),
        eq(bubblophyAgentTokens.projectId, bubblophyProjects.id)
      )
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        scope ? eq(bubblophyProjects.id, scope.projectId) : undefined,
        buildIssueEventCursorCondition(after)
      )
    )
    .orderBy(
      desc(bubblophyIssueEvents.createdAt),
      desc(bubblophyIssueEvents.id)
    )
    .limit(DASHBOARD_ACTIVITY_PAGE_SIZE + 1);

  return rows.map((row) => ({ ...row, source: 'issue' }));
}

/** Builds the newest-first cursor for project events. */
function buildProjectEventCursorCondition(
  after: DashboardActivityCursor | null
) {
  if (!after) {
    return undefined;
  }

  return or(
    lt(bubblophyProjectEvents.createdAt, after.occurredAt),
    and(
      eq(bubblophyProjectEvents.createdAt, after.occurredAt),
      after.source === 'project'
        ? lt(bubblophyProjectEvents.id, after.eventId)
        : sql<boolean>`false`
    )
  );
}

/** Builds the newest-first cursor for issue events. */
function buildIssueEventCursorCondition(after: DashboardActivityCursor | null) {
  if (!after) {
    return undefined;
  }

  return or(
    lt(bubblophyIssueEvents.createdAt, after.occurredAt),
    and(
      eq(bubblophyIssueEvents.createdAt, after.occurredAt),
      after.source === 'issue'
        ? lt(bubblophyIssueEvents.id, after.eventId)
        : sql<boolean>`true`
    )
  );
}

/** Reads one concrete project through the current membership. */
async function selectConcreteProjectScope(
  authUserId: string,
  projectKey: string
): Promise<ConcreteProjectScope | null> {
  const rows = await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, authUserId),
        eq(bubblophyProjects.key, projectKey)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

/** Rechecks current membership and event-to-resource bindings. */
async function selectCurrentActivityAccess(
  authUserId: string,
  candidates: CandidateActivityRow[]
): Promise<CurrentActivityAccessRow[]> {
  const projectEventIds = candidates
    .filter((row) => row.source === 'project')
    .map((row) => row.eventId);
  const issueEventIds = candidates
    .filter((row) => row.source === 'issue')
    .map((row) => row.eventId);
  const [projectRows, issueRows] = await Promise.all([
    selectCurrentProjectEventAccess(authUserId, projectEventIds),
    selectCurrentIssueEventAccess(authUserId, issueEventIds),
  ]);

  return [...projectRows, ...issueRows];
}

/** Rechecks project event membership and project identity. */
async function selectCurrentProjectEventAccess(
  authUserId: string,
  eventIds: string[]
): Promise<CurrentActivityAccessRow[]> {
  if (eventIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      eventId: bubblophyProjectEvents.id,
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .innerJoin(
      bubblophyProjectEvents,
      eq(bubblophyProjectEvents.projectId, bubblophyProjects.id)
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, authUserId),
        inArray(bubblophyProjectEvents.id, eventIds)
      )
    );

  return rows.map((row) => ({
    ...row,
    source: 'project',
    issueId: null,
    issueNumber: null,
  }));
}

/** Rechecks issue event membership and the current issue-project relation. */
async function selectCurrentIssueEventAccess(
  authUserId: string,
  eventIds: string[]
): Promise<CurrentActivityAccessRow[]> {
  if (eventIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      eventId: bubblophyIssueEvents.id,
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      issueId: bubblophyIssues.id,
      issueNumber: bubblophyIssues.issueNumber,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .innerJoin(
      bubblophyIssues,
      eq(bubblophyIssues.projectId, bubblophyProjects.id)
    )
    .innerJoin(
      bubblophyIssueEvents,
      eq(bubblophyIssueEvents.issueId, bubblophyIssues.id)
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, authUserId),
        inArray(bubblophyIssueEvents.id, eventIds)
      )
    );

  return rows.map((row) => ({ ...row, source: 'issue' }));
}

/** Compares the complete newest-first public cursor tuple. */
function compareActivityRows(
  left: CandidateActivityRow,
  right: CandidateActivityRow
) {
  return (
    right.occurredAt.localeCompare(left.occurredAt) ||
    right.source.localeCompare(left.source) ||
    right.eventId.localeCompare(left.eventId)
  );
}

/** Checks that the final read still describes the candidate resource binding. */
function hasStableActivityBinding(
  candidate: CandidateActivityRow,
  access: CurrentActivityAccessRow
) {
  return (
    candidate.source === access.source &&
    candidate.projectId === access.projectId &&
    candidate.projectKey === access.projectKey &&
    candidate.issueId === access.issueId &&
    candidate.issueNumber === access.issueNumber
  );
}

/** Builds a collision-free key across the two event tables. */
function formatCandidateKey(
  row: Pick<CandidateActivityRow, 'source' | 'eventId'>
) {
  return `${row.source}:${row.eventId}`;
}

/** Maps one validated candidate into the safe public activity DTO. */
function mapActivityItem(row: CandidateActivityRow): DashboardActivityPageItem {
  return {
    id: formatCandidateKey(row),
    source: row.source,
    label: row.label,
    actor: formatActivityActor(row),
    occurredAt: row.occurredAt,
    projectKey: row.projectKey,
    issueKey:
      row.source === 'issue' && row.issueNumber !== null
        ? formatBubblophyIssueKey(row.projectKey, row.issueNumber)
        : null,
  };
}

/** Formats an actor label without exposing raw identity or client IDs. */
function formatActivityActor(row: CandidateActivityRow) {
  if (row.actorAuthUserId) {
    return 'Mensch';
  }

  if (row.actorOauthClientId) {
    return 'OAuth-Client';
  }

  if (row.actorAgentTokenLabel) {
    return `Agent-Token ${row.actorAgentTokenLabel}`;
  }

  return 'System';
}

/** Copies the complete public cursor tuple from one candidate. */
function mapActivityCursor(row: CandidateActivityRow): DashboardActivityCursor {
  return {
    occurredAt: row.occurredAt,
    source: row.source,
    eventId: row.eventId,
  };
}
