import 'server-only';

import type { BubblophyMcpProject } from '@/lib/mcp/projects';

import { asc, eq } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

/**
 * Selects public project fields from the current user's membership rows.
 *
 * The query starts at project membership and never reads agent-token, user,
 * issue, run, or audit tables.
 */
export async function selectBubblophyMcpProjectsForUser(
  authUserId: string
): Promise<BubblophyMcpProject[]> {
  return db
    .select({
      id: bubblophyProjects.id,
      key: bubblophyProjects.key,
      name: bubblophyProjects.name,
      description: bubblophyProjects.description,
      role: bubblophyProjectMembers.role,
      isArchived: bubblophyProjects.isArchived,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .where(eq(bubblophyProjectMembers.authUserId, authUserId))
    .orderBy(asc(bubblophyProjects.key));
}
