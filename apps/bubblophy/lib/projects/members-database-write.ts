import 'server-only';

import type { db as bubblophyDb } from '@/drizzle/db';
import type { JsonObject } from '@/drizzle/db/schema';
import type { ProjectMemberSummary } from '@/lib/dashboard/types';
import type {
  BubblophyProjectMemberExpectedRoleStoreInput,
  BubblophyProjectMemberMutationStore,
  BubblophyProjectMemberMutationStoreInput,
  BubblophyProjectMemberRoleStoreInput,
  BubblophyProjectMemberUpdateRoleStoreInput,
  ManageableProjectMemberRole,
} from '@/lib/projects/members';

import { formatBubblophyProjectMemberId } from '@/lib/issues/repository';
import {
  canManageBubblophyProjectMembers,
  isManageableBubblophyProjectMemberRole,
} from '@/lib/projects/members';

import { and, asc, eq, inArray, sql } from 'drizzle-orm';

import {
  bubblophyProjectEvents,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

type BubblophyProjectMemberMutationTx = Parameters<
  Parameters<typeof bubblophyDb.transaction>[0]
>[0];

type ProjectMemberAuditAction = 'added' | 'role_changed' | 'removed';

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
    addProjectMemberWithEvent,
    updateProjectMemberRoleWithEvent,
    removeProjectMemberWithEvent,
  };
}

async function addProjectMemberWithEvent(
  input: BubblophyProjectMemberRoleStoreInput
): ReturnType<
  BubblophyProjectMemberMutationStore['addProjectMemberWithEvent']
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

    if (context.targetMember) {
      return { status: 'unchanged' };
    }

    const [addedMember] = await tx
      .insert(bubblophyProjectMembers)
      .values({
        projectId: context.project.id,
        authUserId: input.memberAuthUserId,
        role: input.role,
      })
      .onConflictDoNothing({
        target: [
          bubblophyProjectMembers.projectId,
          bubblophyProjectMembers.authUserId,
        ],
      })
      .returning({
        authUserId: bubblophyProjectMembers.authUserId,
        role: bubblophyProjectMembers.role,
        createdAt: bubblophyProjectMembers.createdAt,
      });

    if (!addedMember) {
      return { status: 'unchanged' };
    }

    await tx.insert(bubblophyProjectEvents).values(
      buildBubblophyProjectMemberEventInsert({
        projectId: context.project.id,
        projectKey: context.project.key,
        actorAuthUserId: input.authUserId,
        memberAuthUserId: input.memberAuthUserId,
        action: 'added',
        changedFields: ['membership'],
        previousRole: null,
        nextRole: input.role,
      })
    );

    return {
      status: 'added',
      member: mapProjectMemberRowToSummary({
        projectKey: context.project.key,
        authUserId: addedMember.authUserId,
        role: addedMember.role,
        createdAt: addedMember.createdAt,
      }),
      memberCount: await countProjectMembers(tx, context.project.id),
    };
  });
}

async function updateProjectMemberRoleWithEvent(
  input: BubblophyProjectMemberUpdateRoleStoreInput
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

    if (context.targetMember.role !== input.expectedRole) {
      return { status: 'conflict' };
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
          eq(bubblophyProjectMembers.authUserId, input.memberAuthUserId),
          eq(bubblophyProjectMembers.role, input.expectedRole)
        )
      )
      .returning({
        authUserId: bubblophyProjectMembers.authUserId,
        role: bubblophyProjectMembers.role,
        createdAt: bubblophyProjectMembers.createdAt,
      });

    if (!updatedMember) {
      return { status: 'conflict' };
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
  input: BubblophyProjectMemberExpectedRoleStoreInput
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

    if (context.targetMember.role !== input.expectedRole) {
      return { status: 'conflict' };
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
          eq(bubblophyProjectMembers.authUserId, input.memberAuthUserId),
          eq(bubblophyProjectMembers.role, input.expectedRole)
        )
      )
      .returning({
        authUserId: bubblophyProjectMembers.authUserId,
      });

    if (!removedMember) {
      return { status: 'conflict' };
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

/**
 * Locks the project and involved memberships before authorization decisions.
 *
 * Project SHARE conflicts with archive/content updates while allowing unrelated
 * member mutations. Membership rows use one sorted UPDATE lock query so two
 * concurrent manager actions cannot deadlock by locking actor and target in
 * opposite order.
 *
 * @param tx Active membership mutation transaction.
 * @param input Actor, project, and target member identifiers.
 * @returns Locked project, actor role, and optional target member.
 */
export async function selectProjectMemberMutationContext(
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
    .limit(1)
    .for('share');

  if (!project) {
    return {
      project: null,
      actorRole: null,
      targetMember: null,
    };
  }

  const lockedMembers = await tx
    .select({
      authUserId: bubblophyProjectMembers.authUserId,
      role: bubblophyProjectMembers.role,
      createdAt: bubblophyProjectMembers.createdAt,
    })
    .from(bubblophyProjectMembers)
    .where(
      and(
        eq(bubblophyProjectMembers.projectId, project.id),
        inArray(bubblophyProjectMembers.authUserId, [
          input.authUserId,
          input.memberAuthUserId,
        ])
      )
    )
    .orderBy(asc(bubblophyProjectMembers.authUserId))
    .for('update');
  const actorMember = lockedMembers.find(
    (member) => member.authUserId === input.authUserId
  );
  const targetMember = lockedMembers.find(
    (member) => member.authUserId === input.memberAuthUserId
  );

  return {
    project,
    actorRole: actorMember?.role ?? null,
    targetMember: targetMember ?? null,
  };
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
