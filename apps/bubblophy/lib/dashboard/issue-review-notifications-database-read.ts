import 'server-only';

import type {
  BubblophyIssueStatus,
  BubblophyProjectRole,
} from '@/drizzle/db/schema';
import type { DashboardIssueReviewCursor } from '@/lib/dashboard/issue-review-notification-query';
import type {
  DashboardIssueReviewPage,
  DashboardIssueReviewPageItem,
  DashboardIssueReviewPageReadInput,
} from '@/lib/dashboard/issue-review-notifications';

import { DASHBOARD_ISSUE_REVIEW_PAGE_SIZE } from '@/lib/dashboard/issue-review-notifications';
import { formatBubblophyIssueKey } from '@/lib/issues/repository';

import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

const issueReviewStatusCondition = sql`${bubblophyIssues.status} = 'review'`;

interface IssueReviewProjectBinding {
  projectId: string;
  projectKey: string;
  projectName: string;
  currentUserRole: BubblophyProjectRole;
}

interface IssueReviewProjectScope extends IssueReviewProjectBinding {
  projectIsArchived: boolean;
}

interface CandidateIssueReviewRow extends IssueReviewProjectBinding {
  issueId: string;
  issueNumber: number;
  title: string;
  status: 'review';
  updatedAt: string;
}

interface RawIssueReviewRow extends Omit<CandidateIssueReviewRow, 'status'> {
  status: BubblophyIssueStatus;
}

/**
 * Selects one bounded page of current issue-review notifications.
 *
 * Candidate rows are re-read before mapping. Revoked memberships, archived
 * projects, moved issues, resolved reviews, and changed timestamps are skipped;
 * later raw chunks refill the public page without exposing database IDs.
 *
 * @param input Normalized actor, optional project, and public cursor.
 * @returns Current live review notifications or null for inaccessible scope.
 */
export async function selectDashboardIssueReviewPageForUser(
  input: DashboardIssueReviewPageReadInput
): Promise<DashboardIssueReviewPage | null> {
  const initialScope = input.projectKey
    ? await selectConcreteProjectScope(input.authUserId, input.projectKey)
    : null;

  if (input.projectKey && !initialScope) {
    return null;
  }

  const visibleRows: CandidateIssueReviewRow[] = [];
  let after = input.after;

  while (visibleRows.length <= DASHBOARD_ISSUE_REVIEW_PAGE_SIZE) {
    const candidates = await selectIssueReviewCandidates(
      input.authUserId,
      initialScope,
      after
    );

    if (candidates.length === 0) {
      break;
    }

    const currentRows = await selectCurrentIssueReviewRows(
      input.authUserId,
      candidates.map((candidate) => candidate.issueId)
    );
    const currentByIssueId = new Map(
      currentRows.map((row) => [row.issueId, row])
    );

    for (const candidate of candidates) {
      const current = currentByIssueId.get(candidate.issueId);

      if (current && hasStableIssueReviewBinding(candidate, current)) {
        visibleRows.push(current);
      }

      if (visibleRows.length > DASHBOARD_ISSUE_REVIEW_PAGE_SIZE) {
        break;
      }
    }

    if (
      visibleRows.length > DASHBOARD_ISSUE_REVIEW_PAGE_SIZE ||
      candidates.length <= DASHBOARD_ISSUE_REVIEW_PAGE_SIZE
    ) {
      break;
    }

    const lastCandidate = candidates.at(-1);

    if (!lastCandidate) {
      break;
    }

    after = mapIssueReviewCursor(lastCandidate);
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

  if (finalScope?.projectIsArchived) {
    return {
      project: {
        key: finalScope.projectKey,
        name: finalScope.projectName,
        currentUserRole: finalScope.currentUserRole,
      },
      items: [],
      nextAfter: null,
    };
  }

  const publicRows = visibleRows.slice(0, DASHBOARD_ISSUE_REVIEW_PAGE_SIZE);
  const lastRow = publicRows.at(-1);

  return {
    project: finalScope
      ? {
          key: finalScope.projectKey,
          name: finalScope.projectName,
          currentUserRole: finalScope.currentUserRole,
        }
      : null,
    items: publicRows.map(mapIssueReviewItem),
    nextAfter:
      visibleRows.length > DASHBOARD_ISSUE_REVIEW_PAGE_SIZE && lastRow
        ? mapIssueReviewCursor(lastRow)
        : null,
  };
}

/** Reads one current membership-bound project scope, including archives. */
async function selectConcreteProjectScope(
  authUserId: string,
  projectKey: string
): Promise<IssueReviewProjectScope | null> {
  const rows = await db
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
      and(
        eq(bubblophyProjectMembers.authUserId, authUserId),
        eq(bubblophyProjects.key, projectKey)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

/** Reads one raw newest-first issue-review candidate chunk. */
async function selectIssueReviewCandidates(
  authUserId: string,
  scope: IssueReviewProjectScope | null,
  after: DashboardIssueReviewCursor | null
): Promise<CandidateIssueReviewRow[]> {
  const rows: RawIssueReviewRow[] = await db
    .select(issueReviewSelection)
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .innerJoin(
      bubblophyIssues,
      eq(bubblophyIssues.projectId, bubblophyProjects.id)
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, authUserId),
        scope ? eq(bubblophyProjects.id, scope.projectId) : undefined,
        eq(bubblophyProjects.isArchived, false),
        issueReviewStatusCondition,
        buildIssueReviewCursorCondition(after)
      )
    )
    .orderBy(
      desc(bubblophyIssues.updatedAt),
      desc(bubblophyProjects.key),
      desc(bubblophyIssues.issueNumber)
    )
    .limit(DASHBOARD_ISSUE_REVIEW_PAGE_SIZE + 1);

  return rows.filter(isCandidateIssueReviewRow);
}

/** Re-reads candidates through every current resource binding. */
async function selectCurrentIssueReviewRows(
  authUserId: string,
  issueIds: string[]
): Promise<CandidateIssueReviewRow[]> {
  if (issueIds.length === 0) {
    return [];
  }

  const rows: RawIssueReviewRow[] = await db
    .select(issueReviewSelection)
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .innerJoin(
      bubblophyIssues,
      eq(bubblophyIssues.projectId, bubblophyProjects.id)
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, authUserId),
        eq(bubblophyProjects.isArchived, false),
        inArray(bubblophyIssues.id, issueIds),
        issueReviewStatusCondition
      )
    );

  return rows.filter(isCandidateIssueReviewRow);
}

const issueReviewSelection = {
  projectId: bubblophyProjects.id,
  projectKey: bubblophyProjects.key,
  projectName: bubblophyProjects.name,
  currentUserRole: bubblophyProjectMembers.role,
  issueId: bubblophyIssues.id,
  issueNumber: bubblophyIssues.issueNumber,
  title: bubblophyIssues.title,
  status: bubblophyIssues.status,
  updatedAt: bubblophyIssues.updatedAt,
};

/** Narrows the database enum after the fixed SQL status filter. */
function isCandidateIssueReviewRow(
  row: RawIssueReviewRow
): row is CandidateIssueReviewRow {
  return row.status === 'review';
}

/** Builds the stable newest-first public issue cursor predicate. */
function buildIssueReviewCursorCondition(
  after: DashboardIssueReviewCursor | null
) {
  if (!after) {
    return undefined;
  }

  return or(
    lt(bubblophyIssues.updatedAt, after.updatedAt),
    and(
      eq(bubblophyIssues.updatedAt, after.updatedAt),
      lt(bubblophyProjects.key, after.projectKey)
    ),
    and(
      eq(bubblophyIssues.updatedAt, after.updatedAt),
      eq(bubblophyProjects.key, after.projectKey),
      lt(bubblophyIssues.issueNumber, after.issueNumber)
    )
  );
}

/** Checks that the final read still describes the same visible review. */
function hasStableIssueReviewBinding(
  candidate: CandidateIssueReviewRow,
  current: CandidateIssueReviewRow
) {
  return (
    candidate.projectId === current.projectId &&
    candidate.projectKey === current.projectKey &&
    candidate.issueId === current.issueId &&
    candidate.issueNumber === current.issueNumber &&
    candidate.status === current.status &&
    candidate.updatedAt === current.updatedAt
  );
}

/** Maps one final row into the minimal public issue-review DTO. */
function mapIssueReviewItem(
  row: CandidateIssueReviewRow
): DashboardIssueReviewPageItem {
  return {
    issueKey: formatBubblophyIssueKey(row.projectKey, row.issueNumber),
    title: row.title,
    projectKey: row.projectKey,
    projectName: row.projectName,
    updatedAt: row.updatedAt,
  };
}

/** Copies the complete public cursor from one validated issue row. */
function mapIssueReviewCursor(
  row: CandidateIssueReviewRow
): DashboardIssueReviewCursor {
  return {
    updatedAt: row.updatedAt,
    projectKey: row.projectKey,
    issueNumber: row.issueNumber,
  };
}
