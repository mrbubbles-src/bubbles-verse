import 'server-only';

import type {
  BubblophyMcpRunTargetReadInput,
  BubblophyMcpRunTargetReadResult,
} from '@/lib/mcp/run-targets';

import { and, asc, eq, inArray } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyAgentTokens,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

/**
 * Reads run-target candidates through one current project membership.
 *
 * Only fields needed to evaluate executability are selected. Secret hashes,
 * creators, revocation metadata, and usage timestamps never enter the result.
 *
 * @param input Authenticated user and exact project ID.
 * @returns Membership, project, and candidate rows, or `null` when hidden.
 */
export async function selectBubblophyMcpRunTargetsForUser(
  input: BubblophyMcpRunTargetReadInput
): Promise<BubblophyMcpRunTargetReadResult | null> {
  const rows = await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      projectIsArchived: bubblophyProjects.isArchived,
      memberRole: bubblophyProjectMembers.role,
      tokenId: bubblophyAgentTokens.id,
      tokenLabel: bubblophyAgentTokens.label,
      tokenState: bubblophyAgentTokens.state,
      tokenScopes: bubblophyAgentTokens.scopes,
      tokenExpiresAt: bubblophyAgentTokens.expiresAt,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .leftJoin(
      bubblophyAgentTokens,
      eq(bubblophyAgentTokens.projectId, bubblophyProjects.id)
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        eq(bubblophyProjects.id, input.projectId),
        eq(bubblophyProjects.isArchived, false),
        inArray(bubblophyProjectMembers.role, ['owner', 'maintainer', 'member'])
      )
    )
    .orderBy(asc(bubblophyAgentTokens.label));

  const firstRow = rows[0];

  if (!firstRow) {
    return null;
  }

  return {
    project: {
      id: firstRow.projectId,
      key: firstRow.projectKey,
      isArchived: firstRow.projectIsArchived,
      role: firstRow.memberRole,
    },
    candidates: rows.flatMap((row) =>
      row.tokenId && row.tokenLabel && row.tokenState && row.tokenScopes
        ? [
            {
              id: row.tokenId,
              label: row.tokenLabel,
              state: row.tokenState,
              scopes: row.tokenScopes,
              expiresAt: row.tokenExpiresAt,
            },
          ]
        : []
    ),
  };
}
