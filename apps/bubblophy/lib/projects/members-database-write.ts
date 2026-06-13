import 'server-only';

import type { db as bubblophyDb } from '@/drizzle/db';
import type { JsonObject } from '@/drizzle/db/schema';
import type { ProjectMemberSummary } from '@/lib/dashboard/types';
import type {
  BubblophyProjectMemberMutationStore,
  BubblophyProjectMemberMutationStoreInput,
  BubblophyProjectMemberRoleStoreInput,
  ManageableProjectMemberRole,
} from '@/lib/projects/members';

import { formatBubblophyProjectMemberId } from '@/lib/issues/repository';
import {
  canManageBubblophyProjectMembers,
  isManageableBubblophyProjectMemberRole,
} from '@/lib/projects/members';

import { and, eq, sql } from 'drizzle-orm';

import {
  bubblophyProjectEvents,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

type BubblophyProjectMemberMutationTx = Parameters<
  Parameters<typeof bubblophyDb.transaction>[0]
>[0];

type ProjectMemberAuditAction = 'role_changed' | 'removed';

export interface BubblophyProjectMemberEventInsert {
  projectId: string;
  eventType: 'project_updated';
  actorAuthUserId: string;
  actorAgentTokenId: null;
  agentRunId: null;
  summary: string;
  payload: JsonObject;
}

/**
 * Creates the Drizzle-backed store for project membership changes.
 *
 * @returns Store implementation for server actions.
 */
export function createDrizzleBubblophyProjectMemberMutationStore(): BubblophyProjectMemberMutationStore {
  return {
    updateProjectMemberRoleWithEvent,
    removeProjectMemberWithEvent,
  };
}

async function updateProjectMemberRoleWithEvent(
  input: BubblophyProjectMemberRoleStoreInput
): ReturnType<
  BubblophyProjectMemberMutationStore['updateProjectMemberRoleWithEvent']
> {
  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const context = await selectProjectMemberMutationContext(tx, input);

    if (!context.project) {
      return { status: 'not_found' };
    }

    if (!canManageBubblophyProjectMembers(context.actorRole ?? '')) {
      return { status: 'forbidden' };
    }

    if (context.project.isArchived) {
      return { status: 'archived_project' };
    }

    if (!context.targetMember) {
      return { status: 'not_found' };
    }

    if (!isManageableBubblophyProjectMemberRole(context.targetMember.role)) {
      return { status: 'owner_protected' };
    }

    if (context.targetMember.role === input.role) {
      return { status: 'unchanged' };
    }

    const [updatedMember] = await tx
      .update(bubblophyProjectMembers)
      .set({ role: input.role })
      .where(
        and(
          eq(bubblophyProjectMembers.projectId, context.project.id),
          eq(bubblophyProjectMembers.authUserId, input.memberAuthUserId)
        )
      )
      .returning({
        authUserId: bubblophyProjectMembers.authUserId,
        role: bubblophyProjectMembers.role,
        createdAt: bubblophyProjectMembers.createdAt,
      });

    if (!updatedMember) {
      throw new Error('Bubblophy member role update did not return a row.');
    }

    await tx.insert(bubblophyProjectEvents).values(
      buildBubblophyProjectMemberEventInsert({
        projectId: context.project.id,
        projectKey: context.project.key,
        actorAuthUserId: input.authUserId,
        memberAuthUserId: input.memberAuthUserId,
        action: 'role_changed',
        changedFields: ['role'],
        previousRole: context.targetMember.role,
        nextRole: input.role,
      })
    );

    return {
      status: 'updated',
      member: mapProjectMemberRowToSummary({
        projectKey: context.project.key,
        authUserId: updatedMember.authUserId,
        role: updatedMember.role,
        createdAt: updatedMember.createdAt,
      }),
      memberCount: await countProjectMembers(tx, context.project.id),
    };
  });
}

async function removeProjectMemberWithEvent(
  input: BubblophyProjectMemberMutationStoreInput
): ReturnType<
  BubblophyProjectMemberMutationStore['removeProjectMemberWithEvent']
> {
  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const context = await selectProjectMemberMutationContext(tx, input);

    if (!context.project) {
      return { status: 'not_found' };
    }

    if (!canManageBubblophyProjectMembers(context.actorRole ?? '')) {
      return { status: 'forbidden' };
    }

    if (context.project.isArchived) {
      return { status: 'archived_project' };
    }

    if (!context.targetMember) {
      return { status: 'not_found' };
    }

    if (input.memberAuthUserId === input.authUserId) {
      return { status: 'self_removal' };
    }

    if (!isManageableBubblophyProjectMemberRole(context.targetMember.role)) {
      return { status: 'owner_protected' };
    }

    const [removedMember] = await tx
      .delete(bubblophyProjectMembers)
      .where(
        and(
          eq(bubblophyProjectMembers.projectId, context.project.id),
          eq(bubblophyProjectMembers.authUserId, input.memberAuthUserId)
        )
      )
      .returning({
        authUserId: bubblophyProjectMembers.authUserId,
      });

    if (!removedMember) {
      throw new Error('Bubblophy member removal did not return a row.');
    }

    await tx.insert(bubblophyProjectEvents).values(
      buildBubblophyProjectMemberEventInsert({
        projectId: context.project.id,
        projectKey: context.project.key,
        actorAuthUserId: input.authUserId,
        memberAuthUserId: input.memberAuthUserId,
        action: 'removed',
        changedFields: [],
        previousRole: context.targetMember.role,
        nextRole: null,
      })
    );

    return {
      status: 'removed',
      projectKey: context.project.key,
      memberAuthUserId: removedMember.authUserId,
      memberCount: await countProjectMembers(tx, context.project.id),
    };
  });
}

/**
 * Builds a project-level audit event for a membership mutation.
 *
 * @param input Project, actor, member, action, and changed fields.
 * @returns Insert values for `bubblophy_project_events`.
 */
export function buildBubblophyProjectMemberEventInsert(input: {
  projectId: string;
  projectKey: string;
  actorAuthUserId: string;
  memberAuthUserId: string;
  action: ProjectMemberAuditAction;
  changedFields: ('role' | 'membership')[];
  previousRole: string | null;
  nextRole: ManageableProjectMemberRole | null;
}): BubblophyProjectMemberEventInsert {
  return {
    projectId: input.projectId,
    eventType: 'project_updated',
    actorAuthUserId: input.actorAuthUserId,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: `Projekt ${input.projectKey}: Mitglied ${input.action}.`,
    payload: {
      source: 'human',
      entity: 'project_member',
      action: input.action,
      projectId: input.projectId,
      projectKey: input.projectKey,
      memberUserId: input.memberAuthUserId,
      changedFields: input.changedFields,
      previousRole: input.previousRole,
      nextRole: input.nextRole,
    },
  };
}

async function selectProjectMemberMutationContext(
  tx: BubblophyProjectMemberMutationTx,
  input: BubblophyProjectMemberMutationStoreInput
) {
  const [project] = await tx
    .select({
      id: bubblophyProjects.id,
      key: bubblophyProjects.key,
      isArchived: bubblophyProjects.isArchived,
    })
    .from(bubblophyProjects)
    .where(eq(bubblophyProjects.key, input.projectKey))
    .limit(1);

  if (!project) {
    return {
      project: null,
      actorRole: null,
      targetMember: null,
    };
  }

  const [actorMember, targetMember] = await Promise.all([
    selectProjectMember(tx, {
      projectId: project.id,
      authUserId: input.authUserId,
    }),
    selectProjectMember(tx, {
      projectId: project.id,
      authUserId: input.memberAuthUserId,
    }),
  ]);

  return {
    project,
    actorRole: actorMember?.role ?? null,
    targetMember,
  };
}

async function selectProjectMember(
  tx: BubblophyProjectMemberMutationTx,
  input: {
    projectId: string;
    authUserId: string;
  }
) {
  const [member] = await tx
    .select({
      authUserId: bubblophyProjectMembers.authUserId,
      role: bubblophyProjectMembers.role,
      createdAt: bubblophyProjectMembers.createdAt,
    })
    .from(bubblophyProjectMembers)
    .where(
      and(
        eq(bubblophyProjectMembers.projectId, input.projectId),
        eq(bubblophyProjectMembers.authUserId, input.authUserId)
      )
    )
    .limit(1);

  return member ?? null;
}

async function countProjectMembers(
  tx: BubblophyProjectMemberMutationTx,
  projectId: string
) {
  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(bubblophyProjectMembers)
    .where(eq(bubblophyProjectMembers.projectId, projectId));

  return row?.count ?? 0;
}

function mapProjectMemberRowToSummary(input: {
  projectKey: string;
  authUserId: string;
  role: ProjectMemberSummary['role'];
  createdAt: string;
}): ProjectMemberSummary {
  return {
    id: formatBubblophyProjectMemberId(input.projectKey, input.authUserId),
    projectKey: input.projectKey,
    authUserId: input.authUserId,
    label: input.authUserId,
    role: input.role,
    createdAt: input.createdAt,
  };
}
