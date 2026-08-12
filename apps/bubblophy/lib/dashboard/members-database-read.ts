import 'server-only';

import type { BubblophyProjectRole } from '@/drizzle/db/schema';
import type {
  DashboardMemberPage,
  DashboardMemberPageReadInput,
} from '@/lib/dashboard/members';

import { DASHBOARD_MEMBER_PAGE_SIZE } from '@/lib/dashboard/members';
import { formatBubblophyProjectMemberId } from '@/lib/issues/repository';

import { and, asc, eq, gt, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '@/drizzle/db';
import {
  bubblophyProjectMembers,
  bubblophyProjects,
  bubblophyUserProfiles,
} from '@/drizzle/db/schema';

interface DashboardMemberProjectRow {
  projectId: string;
  projectKey: string;
  projectName: string;
  projectIsArchived: boolean;
  currentUserRole: BubblophyProjectRole;
}

interface DashboardMemberPageRow {
  projectId: string;
  projectKey: string;
  authUserId: string;
  displayName: string | null;
  normalizedEmail: string | null;
  role: BubblophyProjectRole;
  createdAt: string;
}

/**
 * Selects one oldest-first member page through current project membership.
 *
 * Names are visible to every project role. E-mail is selected only for the
 * current user or a current manager, then redacted again after the final role
 * check so a concurrent demotion cannot retain manager visibility.
 *
 * @param input Normalized actor, concrete project key, and optional cursor.
 * @returns Public member page or null when final project access is lost.
 */
export async function selectDashboardMemberPageForUser(
  input: DashboardMemberPageReadInput
): Promise<DashboardMemberPage | null> {
  const candidateProject = await selectMemberProject(
    input.authUserId,
    input.projectKey
  );

  if (!candidateProject) {
    return null;
  }

  const actorMemberships = alias(
    bubblophyProjectMembers,
    'bubblophy_member_page_actor_memberships'
  );
  const cursorCondition = input.after
    ? or(
        gt(bubblophyProjectMembers.createdAt, input.after.createdAt),
        and(
          eq(bubblophyProjectMembers.createdAt, input.after.createdAt),
          gt(bubblophyProjectMembers.authUserId, input.after.authUserId)
        )
      )
    : undefined;
  const rows = (await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      authUserId: bubblophyProjectMembers.authUserId,
      displayName: bubblophyUserProfiles.displayName,
      normalizedEmail: sql<string | null>`case
        when ${actorMemberships.role} in ('owner', 'maintainer')
          or ${bubblophyProjectMembers.authUserId} = ${input.authUserId}
        then ${bubblophyUserProfiles.normalizedEmail}
        else null
      end`,
      role: bubblophyProjectMembers.role,
      createdAt: bubblophyProjectMembers.createdAt,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .innerJoin(
      actorMemberships,
      and(
        eq(actorMemberships.projectId, bubblophyProjects.id),
        eq(actorMemberships.authUserId, input.authUserId)
      )
    )
    .leftJoin(
      bubblophyUserProfiles,
      eq(bubblophyUserProfiles.authUserId, bubblophyProjectMembers.authUserId)
    )
    .where(
      and(
        eq(bubblophyProjects.id, candidateProject.projectId),
        eq(bubblophyProjects.key, candidateProject.projectKey),
        cursorCondition
      )
    )
    .orderBy(
      asc(bubblophyProjectMembers.createdAt),
      asc(bubblophyProjectMembers.authUserId)
    )
    .limit(DASHBOARD_MEMBER_PAGE_SIZE + 1)) as DashboardMemberPageRow[];

  const currentProject = await selectMemberProject(
    input.authUserId,
    candidateProject.projectKey
  );

  if (
    !currentProject ||
    currentProject.projectId !== candidateProject.projectId ||
    currentProject.projectKey !== input.projectKey
  ) {
    return null;
  }

  const visibleRows = rows.slice(0, DASHBOARD_MEMBER_PAGE_SIZE);
  const lastRow = visibleRows.at(-1);

  return {
    project: {
      key: currentProject.projectKey,
      name: currentProject.projectName,
      isArchived: currentProject.projectIsArchived,
      currentUserRole: currentProject.currentUserRole,
    },
    items: visibleRows.flatMap((row) => {
      if (
        row.projectId !== currentProject.projectId ||
        row.projectKey !== currentProject.projectKey
      ) {
        return [];
      }

      const canReadEmail =
        currentProject.currentUserRole === 'owner' ||
        currentProject.currentUserRole === 'maintainer' ||
        row.authUserId === input.authUserId;
      const email = canReadEmail ? row.normalizedEmail : null;

      return [
        {
          id: formatBubblophyProjectMemberId(
            currentProject.projectKey,
            row.authUserId
          ),
          projectKey: currentProject.projectKey,
          authUserId: row.authUserId,
          label: row.displayName ?? email ?? row.authUserId,
          email,
          role: row.role,
          createdAt: row.createdAt,
        },
      ];
    }),
    nextAfter:
      rows.length > DASHBOARD_MEMBER_PAGE_SIZE && lastRow
        ? { createdAt: lastRow.createdAt, authUserId: lastRow.authUserId }
        : null,
  };
}

/** Reads current project identity, metadata, and actor role. */
async function selectMemberProject(
  authUserId: string,
  projectKey: string
): Promise<DashboardMemberProjectRow | null> {
  const [row] = (await db
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
    .limit(1)) as DashboardMemberProjectRow[];

  return row ?? null;
}
