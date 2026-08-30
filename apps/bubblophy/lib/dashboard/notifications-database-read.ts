import 'server-only';

import type {
  BubblophyAgentRunState,
  BubblophyProjectRole,
} from '@/drizzle/db/schema';
import type { DashboardNotificationCursor } from '@/lib/dashboard/notification-query';
import type {
  DashboardNotificationPage,
  DashboardNotificationPageItem,
  DashboardNotificationPageReadInput,
  DashboardNotificationRunState,
} from '@/lib/dashboard/notifications';

import { DASHBOARD_NOTIFICATION_PAGE_SIZE } from '@/lib/dashboard/notifications';
import { formatBubblophyIssueKey } from '@/lib/issues/repository';
import { canContributeToBubblophyProject } from '@/lib/projects/permissions';

import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyAgentRuns,
  bubblophyAgentTokens,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

const notificationRunStates = [
  'requested',
  'needs_review',
  'failed',
] as const satisfies readonly DashboardNotificationRunState[];

const notificationRunStateCondition = sql`${bubblophyAgentRuns.state} in ('requested', 'needs_review', 'failed')`;

interface NotificationProjectScope {
  projectId: string;
  projectKey: string;
  projectName: string;
  currentUserRole: BubblophyProjectRole;
}

interface CandidateNotificationRow extends NotificationProjectScope {
  issueId: string;
  issueNumber: number;
  runId: string;
  agentTokenId: string;
  agentLabel: string;
  state: DashboardNotificationRunState;
  updatedAt: string;
}

interface RawNotificationRow extends Omit<CandidateNotificationRow, 'state'> {
  state: BubblophyAgentRunState;
}

/**
 * Selects one bounded page of current run notifications through membership.
 *
 * Candidate rows are re-read before mapping. Revoked memberships, archived
 * projects, changed run states, and broken issue or token bindings are skipped;
 * later chunks refill the public page without exposing internal IDs.
 *
 * @param input Normalized actor, optional project, and public cursor.
 * @returns Current live notifications or null for an inaccessible project.
 */
export async function selectDashboardNotificationPageForUser(
  input: DashboardNotificationPageReadInput
): Promise<DashboardNotificationPage | null> {
  const initialScope = input.projectKey
    ? await selectConcreteProjectScope(input.authUserId, input.projectKey)
    : null;

  if (input.projectKey && !initialScope) {
    return null;
  }

  const visibleRows: CandidateNotificationRow[] = [];
  let after = input.after;

  while (visibleRows.length <= DASHBOARD_NOTIFICATION_PAGE_SIZE) {
    const candidates = await selectNotificationCandidates(
      input.authUserId,
      initialScope,
      after
    );

    if (candidates.length === 0) {
      break;
    }

    const currentRows = await selectCurrentNotificationRows(
      input.authUserId,
      candidates.map((candidate) => candidate.runId)
    );
    const currentByRunId = new Map(currentRows.map((row) => [row.runId, row]));

    for (const candidate of candidates) {
      const current = currentByRunId.get(candidate.runId);

      if (current && hasStableNotificationBinding(candidate, current)) {
        visibleRows.push(current);
      }

      if (visibleRows.length > DASHBOARD_NOTIFICATION_PAGE_SIZE) {
        break;
      }
    }

    if (
      visibleRows.length > DASHBOARD_NOTIFICATION_PAGE_SIZE ||
      candidates.length <= DASHBOARD_NOTIFICATION_PAGE_SIZE
    ) {
      break;
    }

    const lastCandidate = candidates.at(-1);

    if (!lastCandidate) {
      break;
    }

    after = mapNotificationCursor(lastCandidate);
  }

  const finalScope = initialScope
    ? await selectConcreteProjectScope(
        input.authUserId,
        initialScope.projectKey
      )
    : null;

  if (
    initialScope &&
    (!finalScope ||
      finalScope.projectId !== initialScope.projectId ||
      finalScope.projectKey !== initialScope.projectKey)
  ) {
    return null;
  }

  const publicRows = visibleRows.slice(0, DASHBOARD_NOTIFICATION_PAGE_SIZE);
  const lastRow = publicRows.at(-1);

  return {
    project: finalScope
      ? {
          key: finalScope.projectKey,
          name: finalScope.projectName,
          currentUserRole: finalScope.currentUserRole,
        }
      : null,
    items: publicRows.map(mapNotificationItem),
    nextAfter:
      visibleRows.length > DASHBOARD_NOTIFICATION_PAGE_SIZE && lastRow
        ? mapNotificationCursor(lastRow)
        : null,
  };
}

/** Reads one current membership-bound project scope. */
async function selectConcreteProjectScope(
  authUserId: string,
  projectKey: string
): Promise<NotificationProjectScope | null> {
  const rows = await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      projectName: bubblophyProjects.name,
      currentUserRole: bubblophyProjectMembers.role,
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

/** Reads one raw newest-first candidate chunk. */
async function selectNotificationCandidates(
  authUserId: string,
  scope: NotificationProjectScope | null,
  after: DashboardNotificationCursor | null
): Promise<CandidateNotificationRow[]> {
  const rows: RawNotificationRow[] = await db
    .select(notificationSelection)
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
      bubblophyAgentRuns,
      eq(bubblophyAgentRuns.issueId, bubblophyIssues.id)
    )
    .innerJoin(
      bubblophyAgentTokens,
      and(
        eq(bubblophyAgentTokens.id, bubblophyAgentRuns.agentTokenId),
        eq(bubblophyAgentTokens.projectId, bubblophyProjects.id)
      )
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, authUserId),
        scope ? eq(bubblophyProjects.id, scope.projectId) : undefined,
        eq(bubblophyProjects.isArchived, false),
        notificationRunStateCondition,
        buildNotificationCursorCondition(after)
      )
    )
    .orderBy(desc(bubblophyAgentRuns.updatedAt), desc(bubblophyAgentRuns.id))
    .limit(DASHBOARD_NOTIFICATION_PAGE_SIZE + 1);

  return rows.filter(isCandidateNotificationRow);
}

/** Re-reads candidates through all current resource bindings. */
async function selectCurrentNotificationRows(
  authUserId: string,
  runIds: string[]
): Promise<CandidateNotificationRow[]> {
  if (runIds.length === 0) {
    return [];
  }

  const rows: RawNotificationRow[] = await db
    .select(notificationSelection)
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
      bubblophyAgentRuns,
      eq(bubblophyAgentRuns.issueId, bubblophyIssues.id)
    )
    .innerJoin(
      bubblophyAgentTokens,
      and(
        eq(bubblophyAgentTokens.id, bubblophyAgentRuns.agentTokenId),
        eq(bubblophyAgentTokens.projectId, bubblophyProjects.id)
      )
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, authUserId),
        eq(bubblophyProjects.isArchived, false),
        inArray(bubblophyAgentRuns.id, runIds),
        notificationRunStateCondition
      )
    );

  return rows.filter(isCandidateNotificationRow);
}

const notificationSelection = {
  projectId: bubblophyProjects.id,
  projectKey: bubblophyProjects.key,
  projectName: bubblophyProjects.name,
  currentUserRole: bubblophyProjectMembers.role,
  issueId: bubblophyIssues.id,
  issueNumber: bubblophyIssues.issueNumber,
  runId: bubblophyAgentRuns.id,
  agentTokenId: bubblophyAgentTokens.id,
  agentLabel: bubblophyAgentTokens.label,
  state: bubblophyAgentRuns.state,
  updatedAt: bubblophyAgentRuns.updatedAt,
};

/** Narrows the database enum after the fixed SQL state filter. */
function isCandidateNotificationRow(
  row: RawNotificationRow
): row is CandidateNotificationRow {
  return notificationRunStates.some((state) => state === row.state);
}

/** Builds the stable newest-first run cursor predicate. */
function buildNotificationCursorCondition(
  after: DashboardNotificationCursor | null
) {
  if (!after) {
    return undefined;
  }

  return or(
    lt(bubblophyAgentRuns.updatedAt, after.updatedAt),
    and(
      eq(bubblophyAgentRuns.updatedAt, after.updatedAt),
      lt(bubblophyAgentRuns.id, after.runId)
    )
  );
}

/** Checks that the final read still describes the same visible run. */
function hasStableNotificationBinding(
  candidate: CandidateNotificationRow,
  current: CandidateNotificationRow
) {
  return (
    candidate.runId === current.runId &&
    candidate.projectId === current.projectId &&
    candidate.projectKey === current.projectKey &&
    candidate.issueId === current.issueId &&
    candidate.issueNumber === current.issueNumber &&
    candidate.agentTokenId === current.agentTokenId &&
    candidate.state === current.state &&
    candidate.updatedAt === current.updatedAt
  );
}

/** Maps one final row into the public, secret-free notification DTO. */
function mapNotificationItem(
  row: CandidateNotificationRow
): DashboardNotificationPageItem {
  return {
    runId: row.runId,
    issueKey: formatBubblophyIssueKey(row.projectKey, row.issueNumber),
    projectKey: row.projectKey,
    projectName: row.projectName,
    agentLabel: row.agentLabel,
    state: row.state,
    updatedAt: row.updatedAt,
    canManage: canContributeToBubblophyProject(row.currentUserRole),
  };
}

/** Copies the complete public cursor from one validated run row. */
function mapNotificationCursor(
  row: CandidateNotificationRow
): DashboardNotificationCursor {
  return { updatedAt: row.updatedAt, runId: row.runId };
}
