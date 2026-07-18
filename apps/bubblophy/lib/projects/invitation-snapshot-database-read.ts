import 'server-only';

import type { BubblophyProjectInvitationManagerPersistenceRow } from '@/lib/projects/invitation-snapshot';

import { and, desc, eq, inArray } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyProjectInvitations,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

/**
 * Selects one manager-authorized project and its redacted invitation rows.
 *
 * Authorization and invitation data share one statement. The projection
 * excludes token hashes and every invitation actor user ID by construction.
 *
 * @param authUserId Current Supabase Auth user ID.
 * @param projectKey Normalized project key.
 * @returns One left-join row per invitation, or one nullable row when empty.
 */
export async function selectBubblophyProjectInvitationManagerRows(
  authUserId: string,
  projectKey: string
): Promise<BubblophyProjectInvitationManagerPersistenceRow[]> {
  return db
    .select({
      projectKey: bubblophyProjects.key,
      managerRole: bubblophyProjectMembers.role,
      isArchived: bubblophyProjects.isArchived,
      invitationId: bubblophyProjectInvitations.id,
      normalizedEmail: bubblophyProjectInvitations.normalizedEmail,
      invitationRole: bubblophyProjectInvitations.role,
      createdAt: bubblophyProjectInvitations.createdAt,
      expiresAt: bubblophyProjectInvitations.expiresAt,
      acceptedAt: bubblophyProjectInvitations.acceptedAt,
      revokedAt: bubblophyProjectInvitations.revokedAt,
      updatedAt: bubblophyProjectInvitations.updatedAt,
    })
    .from(bubblophyProjects)
    .innerJoin(
      bubblophyProjectMembers,
      and(
        eq(bubblophyProjectMembers.projectId, bubblophyProjects.id),
        eq(bubblophyProjectMembers.authUserId, authUserId),
        inArray(bubblophyProjectMembers.role, ['owner', 'maintainer'])
      )
    )
    .leftJoin(
      bubblophyProjectInvitations,
      eq(bubblophyProjectInvitations.projectId, bubblophyProjects.id)
    )
    .where(eq(bubblophyProjects.key, projectKey))
    .orderBy(desc(bubblophyProjectInvitations.createdAt));
}
