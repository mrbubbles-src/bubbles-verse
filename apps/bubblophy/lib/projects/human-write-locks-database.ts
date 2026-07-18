import 'server-only';

import type { db as bubblophyDb } from '@/drizzle/db';

import { and, asc, eq, inArray } from 'drizzle-orm';

import {
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

export type BubblophyHumanWriteTransaction = Parameters<
  Parameters<typeof bubblophyDb.transaction>[0]
>[0];

type BubblophyHumanWriteProjectReference = { id: string } | { key: string };

/**
 * Locks one project before a related human mutation.
 *
 * Callers choose `no key update` when changing the project row and `share`
 * when they only need archive state to remain stable. Role policy stays in the
 * caller.
 *
 * @param tx Active Drizzle transaction that will perform the mutation.
 * @param input Project reference and required row-lock strength.
 * @returns Minimal locked project context or `null` when it does not exist.
 */
export async function lockBubblophyProjectForHumanWrite(
  tx: BubblophyHumanWriteTransaction,
  input: {
    project: BubblophyHumanWriteProjectReference;
    lockMode: 'share' | 'no key update';
  }
) {
  const [project] = await tx
    .select({
      id: bubblophyProjects.id,
      key: bubblophyProjects.key,
      isArchived: bubblophyProjects.isArchived,
    })
    .from(bubblophyProjects)
    .where(
      'id' in input.project
        ? eq(bubblophyProjects.id, input.project.id)
        : eq(bubblophyProjects.key, input.project.key)
    )
    .limit(1)
    .for(input.lockMode);

  return project ?? null;
}

/**
 * Locks project memberships in one stable order for a human mutation.
 *
 * IDs are trimmed, deduplicated, and sorted before one UPDATE-lock query. This
 * prevents actor/target lock inversion when two transactions touch the same
 * memberships in different semantic roles.
 *
 * @param tx Active Drizzle transaction that already locked the project.
 * @param input Project ID and actor/target auth user IDs to lock.
 * @returns Existing locked membership rows in auth-user-ID order.
 */
export async function lockBubblophyProjectMembersForHumanWrite(
  tx: BubblophyHumanWriteTransaction,
  input: {
    projectId: string;
    authUserIds: string[];
  }
) {
  const authUserIds = normalizeBubblophyHumanWriteAuthUserIds(
    input.authUserIds
  );

  if (authUserIds.length === 0) {
    return [];
  }

  return tx
    .select({
      authUserId: bubblophyProjectMembers.authUserId,
      role: bubblophyProjectMembers.role,
    })
    .from(bubblophyProjectMembers)
    .where(
      and(
        eq(bubblophyProjectMembers.projectId, input.projectId),
        inArray(bubblophyProjectMembers.authUserId, authUserIds)
      )
    )
    .orderBy(asc(bubblophyProjectMembers.authUserId))
    .for('update');
}

/**
 * Produces the canonical lock order for human auth user IDs.
 *
 * @param authUserIds Raw actor and target IDs from a write context.
 * @returns Non-empty unique IDs in lexicographic order.
 */
export function normalizeBubblophyHumanWriteAuthUserIds(authUserIds: string[]) {
  return [...new Set(authUserIds.map((id) => id.trim()).filter(Boolean))].sort();
}
