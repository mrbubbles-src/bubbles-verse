import 'server-only';

import type {
  BubblophyMcpRunTarget,
  BubblophyMcpRunTargetReadInput,
  BubblophyMcpRunTargetReadResult,
} from '@/lib/mcp/run-targets';

import { BUBBLOPHY_MCP_RUN_TARGET_PAGE_SIZE } from '@/lib/mcp/run-targets';

import { and, asc, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '@/drizzle/db';
import {
  bubblophyAgentTokens,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

interface PublicRunTargetRow {
  projectId: string;
  projectKey: string;
  projectIsArchived: boolean;
  memberRole: 'owner' | 'maintainer' | 'member';
  tokenId: string | null;
  tokenLabel: string | null;
  tokenNormalizedLabel: string | null;
}

interface PublicRunTargetPageRow {
  target: BubblophyMcpRunTarget;
  normalizedLabel: string;
}

/**
 * Selects one executable-target page through the current project membership.
 *
 * Executability predicates stay in the token left join so an authorized empty
 * project remains distinguishable from a hidden project. Only public token
 * fields enter the result.
 *
 * @param input Normalized actor, project, prefix, cursor, and clock.
 * @returns One public page or `null` for hidden and inaccessible projects.
 */
export async function selectBubblophyMcpRunTargetsForUser(
  input: BubblophyMcpRunTargetReadInput
): Promise<BubblophyMcpRunTargetReadResult | null> {
  const candidateTokens = alias(
    bubblophyAgentTokens,
    'bubblophy_mcp_run_target_candidates'
  );
  const normalizedLabel = sql`lower(${candidateTokens.label})`;
  const rows = (await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      projectIsArchived: bubblophyProjects.isArchived,
      memberRole: bubblophyProjectMembers.role,
      tokenId: candidateTokens.id,
      tokenLabel: candidateTokens.label,
      tokenNormalizedLabel: normalizedLabel,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .leftJoin(
      candidateTokens,
      and(
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
          : undefined,
        input.after
          ? or(
              gt(normalizedLabel, input.after.normalizedLabel),
              and(
                eq(normalizedLabel, input.after.normalizedLabel),
                gt(candidateTokens.id, input.after.id)
              )
            )
          : undefined
      )
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        eq(bubblophyProjects.id, input.projectId),
        eq(bubblophyProjects.isArchived, false),
        inArray(bubblophyProjectMembers.role, ['owner', 'maintainer', 'member'])
      )
    )
    .orderBy(asc(normalizedLabel), asc(candidateTokens.id))
    .limit(BUBBLOPHY_MCP_RUN_TARGET_PAGE_SIZE + 1)) as PublicRunTargetRow[];
  const firstRow = rows[0];

  if (!firstRow) {
    return null;
  }

  const targetRows = rows.flatMap(mapPublicRunTargetRow);
  const visibleRows = targetRows.slice(0, BUBBLOPHY_MCP_RUN_TARGET_PAGE_SIZE);
  const lastRow = visibleRows.at(-1);

  return {
    project: {
      id: firstRow.projectId,
      key: firstRow.projectKey,
      isArchived: firstRow.projectIsArchived,
      role: firstRow.memberRole,
    },
    targets: visibleRows.map((row) => row.target),
    nextAfter:
      targetRows.length > BUBBLOPHY_MCP_RUN_TARGET_PAGE_SIZE && lastRow
        ? {
            normalizedLabel: lastRow.normalizedLabel,
            id: lastRow.target.id,
          }
        : null,
  };
}

/** Builds a literal case-insensitive label prefix. */
function buildLiteralLabelPrefix(query: string) {
  return `${escapeLikePattern(query.toLowerCase())}%`;
}

/** Escapes PostgreSQL LIKE wildcard characters in a user prefix. */
function escapeLikePattern(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
}

/** Maps one complete public token row while preserving authorized emptiness. */
function mapPublicRunTargetRow(
  row: PublicRunTargetRow
): PublicRunTargetPageRow[] {
  return row.tokenId !== null &&
    row.tokenLabel !== null &&
    row.tokenNormalizedLabel !== null
    ? [
        {
          target: { id: row.tokenId, label: row.tokenLabel },
          normalizedLabel: row.tokenNormalizedLabel,
        },
      ]
    : [];
}
