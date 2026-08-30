import 'server-only';

import type { BubblophyProjectRole } from '@/drizzle/db/schema';
import type {
  DashboardRunTargetOption,
  DashboardRunTargetOptionsReaderResult,
  DashboardRunTargetOptionsReadInput,
} from '@/lib/dashboard/run-target-options';

import { DASHBOARD_RUN_TARGET_OPTIONS_PAGE_SIZE } from '@/lib/dashboard/run-target-options';
import { canContributeToBubblophyProject } from '@/lib/projects/permissions';

import { and, asc, eq, gt, isNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '@/drizzle/db';
import {
  bubblophyAgentTokens,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

interface RunTargetIssueContextRow {
  projectId: string;
  projectKey: string;
  projectName: string;
  projectIsArchived: boolean;
  currentUserRole: BubblophyProjectRole;
  issueId: string;
  issueNumber: number;
}

interface FinalRunTargetIssueContextRow extends RunTargetIssueContextRow {
  tokenId: string | null;
  tokenLabel: string | null;
  tokenNormalizedLabel: string | null;
}

interface FinalRunTargetOptionRow {
  option: DashboardRunTargetOption;
  normalizedLabel: string;
}

/**
 * Selects one bounded, issue-bound page of executable run-target options.
 *
 * The first statement is a cheap existence/access gate. The final statement
 * refreshes actor membership, project and issue identity, and the complete
 * executable-token window in one read before any option is mapped publicly.
 *
 * @param input Normalized actor, issue identity, prefix, cursor, and clock.
 * @returns Public options, not-found, or forbidden without token metadata.
 */
export async function selectDashboardRunTargetOptionsForUser(
  input: DashboardRunTargetOptionsReadInput
): Promise<DashboardRunTargetOptionsReaderResult> {
  const initialContext = await selectRunTargetIssueContext(input);

  if (!initialContext || initialContext.projectIsArchived) {
    return { status: 'not_found' };
  }

  if (!canContributeToBubblophyProject(initialContext.currentUserRole)) {
    return { status: 'forbidden' };
  }

  const finalRows = await selectFinalRunTargetRows(
    input,
    initialContext.projectId,
    initialContext.issueId
  );
  const finalContext = finalRows[0] ?? null;

  if (!hasStableIssueBinding(initialContext, finalContext, input)) {
    return { status: 'not_found' };
  }

  if (!canContributeToBubblophyProject(finalContext.currentUserRole)) {
    return { status: 'forbidden' };
  }

  const optionRows = finalRows.flatMap(mapFinalRunTargetOption);
  const visibleRows = optionRows.slice(
    0,
    DASHBOARD_RUN_TARGET_OPTIONS_PAGE_SIZE
  );
  const lastRow = visibleRows.at(-1);

  return {
    status: 'success',
    project: {
      key: finalContext.projectKey,
      name: finalContext.projectName,
      currentUserRole: finalContext.currentUserRole,
    },
    issueKey: input.issueKey,
    query: input.query,
    after: input.after,
    items: visibleRows.map((row) => row.option),
    nextAfter:
      !input.query &&
      optionRows.length > DASHBOARD_RUN_TARGET_OPTIONS_PAGE_SIZE &&
      lastRow
        ? {
            normalizedLabel: lastRow.normalizedLabel,
            id: lastRow.option.id,
          }
        : null,
  };
}

/** Reads the initial actor, project, and issue existence/access binding. */
async function selectRunTargetIssueContext(
  input: DashboardRunTargetOptionsReadInput
): Promise<RunTargetIssueContextRow | null> {
  const [row] = (await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      projectName: bubblophyProjects.name,
      projectIsArchived: bubblophyProjects.isArchived,
      currentUserRole: bubblophyProjectMembers.role,
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
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        eq(bubblophyProjects.key, input.projectKey),
        eq(bubblophyIssues.issueNumber, input.issueNumber)
      )
    )
    .limit(1)) as RunTargetIssueContextRow[];

  return row ?? null;
}

/** Builds a literal case-insensitive prefix without wildcard expansion. */
function buildLiteralLabelPrefix(query: string) {
  return `${escapeLikePattern(query.toLowerCase())}%`;
}

/** Escapes PostgreSQL LIKE wildcard characters in a user-entered prefix. */
function escapeLikePattern(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
}

/**
 * Rechecks access and hydrates the final executable token window in one read.
 *
 * Token predicates live in the left-join condition so a valid issue still
 * returns its project context when no executable token matches.
 */
async function selectFinalRunTargetRows(
  input: DashboardRunTargetOptionsReadInput,
  projectId: string,
  issueId: string
): Promise<FinalRunTargetIssueContextRow[]> {
  const candidateTokens = alias(
    bubblophyAgentTokens,
    'bubblophy_run_target_options_candidates'
  );
  const normalizedLabel = sql`lower(${candidateTokens.label})`;
  const tokenWindowCondition = and(
    eq(candidateTokens.projectId, bubblophyProjects.id),
    eq(candidateTokens.state, 'active'),
    or(
      isNull(candidateTokens.expiresAt),
      gt(candidateTokens.expiresAt, input.now)
    ),
    sql`${candidateTokens.scopes} @> ${JSON.stringify(['issues:read'])}::jsonb`,
    sql`${candidateTokens.scopes} @> ${JSON.stringify(['runs:update'])}::jsonb`,
    input.query
      ? sql`${normalizedLabel} like ${buildLiteralLabelPrefix(input.query)} escape '\\'`
      : input.after
        ? or(
            gt(normalizedLabel, input.after.normalizedLabel),
            and(
              eq(normalizedLabel, input.after.normalizedLabel),
              gt(candidateTokens.id, input.after.id)
            )
          )
        : undefined
  );

  return (await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      projectName: bubblophyProjects.name,
      projectIsArchived: bubblophyProjects.isArchived,
      currentUserRole: bubblophyProjectMembers.role,
      issueId: bubblophyIssues.id,
      issueNumber: bubblophyIssues.issueNumber,
      tokenId: candidateTokens.id,
      tokenLabel: candidateTokens.label,
      tokenNormalizedLabel: normalizedLabel,
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
    .leftJoin(candidateTokens, tokenWindowCondition)
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        eq(bubblophyProjects.id, projectId),
        eq(bubblophyProjects.key, input.projectKey),
        eq(bubblophyProjects.isArchived, false),
        eq(bubblophyIssues.id, issueId),
        eq(bubblophyIssues.issueNumber, input.issueNumber)
      )
    )
    .orderBy(asc(normalizedLabel), asc(candidateTokens.id))
    .limit(
      DASHBOARD_RUN_TARGET_OPTIONS_PAGE_SIZE + 1
    )) as FinalRunTargetIssueContextRow[];
}

/** Checks final project, issue, active-state, and public-key stability. */
function hasStableIssueBinding(
  initial: RunTargetIssueContextRow,
  final: FinalRunTargetIssueContextRow | null,
  input: DashboardRunTargetOptionsReadInput
): final is FinalRunTargetIssueContextRow {
  return Boolean(
    final &&
    !final.projectIsArchived &&
    final.projectId === initial.projectId &&
    final.projectKey === initial.projectKey &&
    final.projectKey === input.projectKey &&
    final.issueId === initial.issueId &&
    final.issueNumber === initial.issueNumber &&
    final.issueNumber === input.issueNumber
  );
}

/** Maps one final executable token row to its deliberately minimal DTO. */
function mapFinalRunTargetOption(
  row: FinalRunTargetIssueContextRow
): FinalRunTargetOptionRow[] {
  return row.tokenId !== null &&
    row.tokenLabel !== null &&
    row.tokenNormalizedLabel !== null
    ? [
        {
          option: { id: row.tokenId, label: row.tokenLabel },
          normalizedLabel: row.tokenNormalizedLabel,
        },
      ]
    : [];
}
