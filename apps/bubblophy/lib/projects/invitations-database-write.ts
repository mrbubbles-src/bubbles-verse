import 'server-only';

import type { JsonObject } from '@/drizzle/db/schema';
import type { BubblophyHumanWriteTransaction } from '@/lib/projects/human-write-locks-database';
import type {
  BubblophyProjectInvitationCreateStoreInput,
  BubblophyProjectInvitationCreateStoreResult,
  BubblophyProjectInvitationMutationStore,
  BubblophyProjectInvitationReinviteStoreInput,
  BubblophyProjectInvitationReinviteStoreResult,
  BubblophyProjectInvitationRevokeStoreResult,
  BubblophyProjectInvitationTransitionStoreInput,
} from '@/lib/projects/invitations';

import {
  lockBubblophyProjectForHumanWrite,
  lockBubblophyProjectMembersForHumanWrite,
} from '@/lib/projects/human-write-locks-database';
import {
  canManageBubblophyProjectMembers,
  isManageableBubblophyProjectMemberRole,
} from '@/lib/projects/members';

import { and, eq, isNull, sql } from 'drizzle-orm';

import {
  bubblophyProjectEvents,
  bubblophyProjectInvitations,
} from '@/drizzle/db/schema';

type BubblophyProjectInvitationAction = 'created' | 'reinvited' | 'revoked';

export interface BubblophyProjectInvitationEventInsert {
  projectId: string;
  eventType: 'project_updated';
  actorAuthUserId: string;
  actorOauthClientId: null;
  actorAgentTokenId: null;
  agentRunId: null;
  summary: string;
  payload: JsonObject;
}

/**
 * Creates the Drizzle store for manager-controlled project invitations.
 *
 * @returns Transactional create, reinvite, and revoke operations.
 */
export function createDrizzleBubblophyProjectInvitationMutationStore(): BubblophyProjectInvitationMutationStore {
  return {
    createProjectInvitationWithEvent,
    reinviteProjectInvitationWithEvent,
    revokeProjectInvitationWithEvent,
  };
}

/** Persists one authorized invitation and its safe audit event atomically. */
async function createProjectInvitationWithEvent(
  input: BubblophyProjectInvitationCreateStoreInput
): Promise<BubblophyProjectInvitationCreateStoreResult> {
  const { db } = await import('@/drizzle/db');

  try {
    return await db.transaction(async (tx) => {
      const context = await lockManagerProjectContext(tx, {
        authUserId: input.authUserId,
        project: { key: input.projectKey },
      });

      if (context.status !== 'authorized') {
        return context;
      }

      const [existingInvitation] = await tx
        .select({ id: bubblophyProjectInvitations.id })
        .from(bubblophyProjectInvitations)
        .where(
          and(
            eq(bubblophyProjectInvitations.projectId, context.project.id),
            eq(
              bubblophyProjectInvitations.normalizedEmail,
              input.normalizedEmail
            ),
            isNull(bubblophyProjectInvitations.acceptedAt),
            isNull(bubblophyProjectInvitations.revokedAt)
          )
        )
        .limit(1)
        .for('update');

      if (existingInvitation) {
        return { status: 'already_open' };
      }

      const [invitation] = await tx
        .insert(bubblophyProjectInvitations)
        .values({
          projectId: context.project.id,
          normalizedEmail: input.normalizedEmail,
          role: input.role,
          tokenHash: input.tokenHash,
          invitedByAuthUserId: input.authUserId,
          expiresAt: input.expiresAt,
          createdAt: input.now,
          updatedAt: input.now,
        })
        .returning(invitationReturningFields);

      if (!invitation) {
        throw new Error('Bubblophy invitation insert did not return a row.');
      }

      await insertInvitationEvent(tx, {
        action: 'created',
        projectId: context.project.id,
        projectKey: context.project.key,
        authUserId: input.authUserId,
        invitationId: invitation.id,
        role: input.role,
      });

      return {
        status: 'created',
        invitation: mapInvitationResult(context.project.key, invitation),
      };
    });
  } catch (error) {
    if (hasPostgresErrorCode(error, '23505')) {
      return { status: 'conflict' };
    }

    throw error;
  }
}

/** Rotates one open invitation under manager and stale-write locks. */
async function reinviteProjectInvitationWithEvent(
  input: BubblophyProjectInvitationReinviteStoreInput
): Promise<BubblophyProjectInvitationReinviteStoreResult> {
  const { db } = await import('@/drizzle/db');

  try {
    return await db.transaction(async (tx) => {
      const context = await lockInvitationManagerContext(tx, input);

      if (context.status !== 'authorized') {
        return context;
      }

      if (isTerminalInvitation(context.invitation)) {
        return { status: 'terminal' };
      }

      if (!isManageableBubblophyProjectMemberRole(context.invitation.role)) {
        return { status: 'forbidden' };
      }

      const [invitation] = await tx
        .update(bubblophyProjectInvitations)
        .set({
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          updatedAt: buildNextInvitationUpdatedAt(input.now),
        })
        .where(
          and(
            eq(bubblophyProjectInvitations.id, input.invitationId),
            eq(bubblophyProjectInvitations.projectId, context.project.id),
            eq(bubblophyProjectInvitations.updatedAt, input.expectedUpdatedAt),
            isNull(bubblophyProjectInvitations.acceptedAt),
            isNull(bubblophyProjectInvitations.revokedAt)
          )
        )
        .returning(invitationReturningFields);

      if (!invitation) {
        return { status: 'conflict' };
      }

      await insertInvitationEvent(tx, {
        action: 'reinvited',
        projectId: context.project.id,
        projectKey: context.project.key,
        authUserId: input.authUserId,
        invitationId: invitation.id,
        role: context.invitation.role,
      });

      return {
        status: 'reinvited',
        invitation: mapInvitationResult(context.project.key, invitation),
      };
    });
  } catch (error) {
    if (hasPostgresErrorCode(error, '23505')) {
      return { status: 'conflict' };
    }

    throw error;
  }
}

/** Revokes one open invitation under manager and stale-write locks. */
async function revokeProjectInvitationWithEvent(
  input: BubblophyProjectInvitationTransitionStoreInput
): Promise<BubblophyProjectInvitationRevokeStoreResult> {
  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const context = await lockInvitationManagerContext(tx, input);

    if (context.status !== 'authorized') {
      return context;
    }

    if (isTerminalInvitation(context.invitation)) {
      return { status: 'terminal' };
    }

    if (!isManageableBubblophyProjectMemberRole(context.invitation.role)) {
      return { status: 'forbidden' };
    }

    const [invitation] = await tx
      .update(bubblophyProjectInvitations)
      .set({
        revokedAt: input.now,
        revokedByAuthUserId: input.authUserId,
        updatedAt: buildNextInvitationUpdatedAt(input.now),
      })
      .where(
        and(
          eq(bubblophyProjectInvitations.id, input.invitationId),
          eq(bubblophyProjectInvitations.projectId, context.project.id),
          eq(bubblophyProjectInvitations.updatedAt, input.expectedUpdatedAt),
          isNull(bubblophyProjectInvitations.acceptedAt),
          isNull(bubblophyProjectInvitations.revokedAt)
        )
      )
      .returning({
        id: bubblophyProjectInvitations.id,
        updatedAt: bubblophyProjectInvitations.updatedAt,
      });

    if (!invitation) {
      return { status: 'conflict' };
    }

    await insertInvitationEvent(tx, {
      action: 'revoked',
      projectId: context.project.id,
      projectKey: context.project.key,
      authUserId: input.authUserId,
      invitationId: invitation.id,
      role: context.invitation.role,
    });

    return {
      status: 'revoked',
      invitationId: invitation.id,
      projectKey: context.project.key,
      updatedAt: invitation.updatedAt,
    };
  });
}

/** Locks a project and its acting manager membership in canonical order. */
async function lockManagerProjectContext(
  tx: BubblophyHumanWriteTransaction,
  input: {
    authUserId: string;
    project: { id: string } | { key: string };
  }
) {
  const project = await lockBubblophyProjectForHumanWrite(tx, {
    project: input.project,
    lockMode: 'share',
  });

  if (!project) {
    return { status: 'not_found' as const };
  }

  const memberships = await lockBubblophyProjectMembersForHumanWrite(tx, {
    projectId: project.id,
    authUserIds: [input.authUserId],
  });
  const actorRole = memberships.find(
    (membership) => membership.authUserId === input.authUserId
  )?.role;

  if (!canManageBubblophyProjectMembers(actorRole ?? '')) {
    return { status: 'forbidden' as const };
  }

  if (project.isArchived) {
    return { status: 'archived_project' as const };
  }

  return { status: 'authorized' as const, project };
}

/** Resolves an invitation, authorizes its manager, then locks the invite row. */
async function lockInvitationManagerContext(
  tx: BubblophyHumanWriteTransaction,
  input: { authUserId: string; invitationId: string }
) {
  const [reference] = await tx
    .select({ projectId: bubblophyProjectInvitations.projectId })
    .from(bubblophyProjectInvitations)
    .where(eq(bubblophyProjectInvitations.id, input.invitationId))
    .limit(1);

  if (!reference) {
    return { status: 'not_found' as const };
  }

  const projectContext = await lockManagerProjectContext(tx, {
    authUserId: input.authUserId,
    project: { id: reference.projectId },
  });

  if (projectContext.status !== 'authorized') {
    return projectContext.status === 'forbidden'
      ? { status: 'not_found' as const }
      : projectContext;
  }

  const [invitation] = await tx
    .select({
      id: bubblophyProjectInvitations.id,
      projectId: bubblophyProjectInvitations.projectId,
      role: bubblophyProjectInvitations.role,
      normalizedEmail: bubblophyProjectInvitations.normalizedEmail,
      expiresAt: bubblophyProjectInvitations.expiresAt,
      acceptedAt: bubblophyProjectInvitations.acceptedAt,
      revokedAt: bubblophyProjectInvitations.revokedAt,
      updatedAt: bubblophyProjectInvitations.updatedAt,
    })
    .from(bubblophyProjectInvitations)
    .where(
      and(
        eq(bubblophyProjectInvitations.id, input.invitationId),
        eq(bubblophyProjectInvitations.projectId, projectContext.project.id)
      )
    )
    .limit(1)
    .for('update');

  if (!invitation) {
    return { status: 'not_found' as const };
  }

  return {
    status: 'authorized' as const,
    project: projectContext.project,
    invitation,
  };
}

const invitationReturningFields = {
  id: bubblophyProjectInvitations.id,
  normalizedEmail: bubblophyProjectInvitations.normalizedEmail,
  role: bubblophyProjectInvitations.role,
  expiresAt: bubblophyProjectInvitations.expiresAt,
  updatedAt: bubblophyProjectInvitations.updatedAt,
};

/**
 * Advances invitation `updated_at` even when clocks repeat or move backwards.
 *
 * @param requestedNow Application wall-clock timestamp for this transition.
 * @returns SQL expression strictly newer than the locked invitation version.
 */
export function buildNextInvitationUpdatedAt(requestedNow: string) {
  return sql<string>`greatest(
    ${requestedNow}::timestamp,
    ${bubblophyProjectInvitations.updatedAt} + interval '1 millisecond'
  )`;
}

/** Maps a private invitation row into manager-visible public metadata. */
function mapInvitationResult(
  projectKey: string,
  invitation: {
    id: string;
    normalizedEmail: string;
    role: 'owner' | 'maintainer' | 'member' | 'viewer';
    expiresAt: string;
    updatedAt: string;
  }
) {
  if (!isManageableBubblophyProjectMemberRole(invitation.role)) {
    throw new Error('Bubblophy invitation contains an owner role.');
  }

  return {
    id: invitation.id,
    projectKey,
    email: invitation.normalizedEmail,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    updatedAt: invitation.updatedAt,
  };
}

/** Reports whether an invitation has already reached a persisted end state. */
function isTerminalInvitation(invitation: {
  acceptedAt: string | null;
  revokedAt: string | null;
}) {
  return invitation.acceptedAt !== null || invitation.revokedAt !== null;
}

/** Inserts one project invitation lifecycle event in the active transaction. */
async function insertInvitationEvent(
  tx: BubblophyHumanWriteTransaction,
  input: {
    action: BubblophyProjectInvitationAction;
    projectId: string;
    projectKey: string;
    authUserId: string;
    invitationId: string;
    role: 'maintainer' | 'member' | 'viewer';
  }
) {
  await tx
    .insert(bubblophyProjectEvents)
    .values(buildBubblophyProjectInvitationEventInsert(input));
}

/**
 * Builds an email- and token-free project invitation audit event.
 *
 * @param input Project, actor, invitation, role, and lifecycle action.
 * @returns Safe project event insert values.
 */
export function buildBubblophyProjectInvitationEventInsert(input: {
  action: BubblophyProjectInvitationAction;
  projectId: string;
  projectKey: string;
  authUserId: string;
  invitationId: string;
  role: 'maintainer' | 'member' | 'viewer';
}): BubblophyProjectInvitationEventInsert {
  const actionLabels = {
    created: 'erstellt',
    reinvited: 'erneuert',
    revoked: 'widerrufen',
  } satisfies Record<BubblophyProjectInvitationAction, string>;
  const changedFields = {
    created: ['invitation'],
    reinvited: ['expiresAt'],
    revoked: ['revokedAt'],
  } satisfies Record<BubblophyProjectInvitationAction, string[]>;

  return {
    projectId: input.projectId,
    eventType: 'project_updated',
    actorAuthUserId: input.authUserId,
    actorOauthClientId: null,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: `Einladung für ${input.projectKey} ${actionLabels[input.action]}.`,
    payload: {
      source: 'human',
      entity: 'project_invitation',
      action: input.action,
      projectKey: input.projectKey,
      invitationId: input.invitationId,
      role: input.role,
      changedFields: changedFields[input.action],
    },
  };
}

/** Detects a requested Postgres error code without assuming an error class. */
function hasPostgresErrorCode(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code === code
  );
}
