import 'server-only';

import type { BubblophyProjectRole, JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyProjectInvitationAcceptStore,
  BubblophyProjectInvitationAcceptStoreInput,
  BubblophyProjectInvitationAcceptStoreResult,
} from '@/lib/projects/accept-invitation';
import type { BubblophyHumanWriteTransaction } from '@/lib/projects/human-write-locks-database';

import {
  lockBubblophyProjectForHumanWrite,
  lockBubblophyProjectMembersForHumanWrite,
} from '@/lib/projects/human-write-locks-database';
import { buildNextInvitationUpdatedAt } from '@/lib/projects/invitations-database-write';
import { isManageableBubblophyProjectMemberRole } from '@/lib/projects/members';

import { and, eq, gt, isNull } from 'drizzle-orm';

import {
  bubblophyProjectEvents,
  bubblophyProjectInvitations,
  bubblophyProjectMembers,
} from '@/drizzle/db/schema';

export interface BubblophyProjectInvitationAcceptedEventInsert {
  projectId: string;
  eventType: 'project_updated';
  actorAuthUserId: string;
  actorOauthClientId: null;
  actorAgentTokenId: null;
  agentRunId: null;
  summary: string;
  payload: JsonObject;
}

/** Creates the transactional Drizzle invitation acceptance store. */
export function createDrizzleBubblophyProjectInvitationAcceptStore(): BubblophyProjectInvitationAcceptStore {
  return { acceptProjectInvitationWithMembership };
}

/** Accepts an invitation, creates membership if needed, and audits atomically. */
async function acceptProjectInvitationWithMembership(
  input: BubblophyProjectInvitationAcceptStoreInput
): Promise<BubblophyProjectInvitationAcceptStoreResult> {
  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const [reference] = await tx
      .select({ projectId: bubblophyProjectInvitations.projectId })
      .from(bubblophyProjectInvitations)
      .where(eq(bubblophyProjectInvitations.tokenHash, input.tokenHash))
      .limit(1);

    if (!reference) {
      return { status: 'unavailable' };
    }

    const project = await lockBubblophyProjectForHumanWrite(tx, {
      project: { id: reference.projectId },
      lockMode: 'share',
    });

    if (!project) {
      return { status: 'unavailable' };
    }

    const memberships = await lockBubblophyProjectMembersForHumanWrite(tx, {
      projectId: project.id,
      authUserIds: [input.authUserId],
    });
    const existingMembership = memberships.find(
      (membership) => membership.authUserId === input.authUserId
    );
    const [invitation] = await tx
      .select({
        id: bubblophyProjectInvitations.id,
        projectId: bubblophyProjectInvitations.projectId,
        normalizedEmail: bubblophyProjectInvitations.normalizedEmail,
        role: bubblophyProjectInvitations.role,
        tokenHash: bubblophyProjectInvitations.tokenHash,
        expiresAt: bubblophyProjectInvitations.expiresAt,
        acceptedAt: bubblophyProjectInvitations.acceptedAt,
        acceptedByAuthUserId: bubblophyProjectInvitations.acceptedByAuthUserId,
        revokedAt: bubblophyProjectInvitations.revokedAt,
      })
      .from(bubblophyProjectInvitations)
      .where(
        and(
          eq(bubblophyProjectInvitations.tokenHash, input.tokenHash),
          eq(bubblophyProjectInvitations.projectId, project.id)
        )
      )
      .limit(1)
      .for('update');

    if (!invitation || invitation.normalizedEmail !== input.normalizedEmail) {
      return invitation
        ? { status: 'email_mismatch' }
        : { status: 'unavailable' };
    }

    if (project.isArchived) {
      return { status: 'archived_project' };
    }

    if (invitation.revokedAt) {
      return { status: 'unavailable' };
    }

    if (invitation.acceptedAt) {
      const acceptedMembership =
        existingMembership ??
        (await readInvitationMembership(tx, {
          projectId: project.id,
          authUserId: input.authUserId,
        }));

      return invitation.acceptedByAuthUserId === input.authUserId &&
        acceptedMembership
        ? {
            status: 'already_accepted',
            projectKey: project.key,
            role: acceptedMembership.role,
          }
        : { status: 'unavailable' };
    }

    if (!isManageableBubblophyProjectMemberRole(invitation.role)) {
      return { status: 'unavailable' };
    }

    if (
      parseInvitationTimestamp(invitation.expiresAt) <= Date.parse(input.now)
    ) {
      return { status: 'expired' };
    }

    const [acceptedInvitation] = await tx
      .update(bubblophyProjectInvitations)
      .set({
        acceptedAt: input.now,
        acceptedByAuthUserId: input.authUserId,
        updatedAt: buildNextInvitationUpdatedAt(input.now),
      })
      .where(
        and(
          eq(bubblophyProjectInvitations.id, invitation.id),
          eq(bubblophyProjectInvitations.projectId, project.id),
          eq(bubblophyProjectInvitations.tokenHash, input.tokenHash),
          gt(bubblophyProjectInvitations.expiresAt, input.now),
          isNull(bubblophyProjectInvitations.acceptedAt),
          isNull(bubblophyProjectInvitations.revokedAt)
        )
      )
      .returning({ id: bubblophyProjectInvitations.id });

    if (!acceptedInvitation) {
      return { status: 'conflict' };
    }

    const membership = existingMembership
      ? { role: existingMembership.role, created: false }
      : await insertOrReadInvitationMembership(tx, {
          projectId: project.id,
          authUserId: input.authUserId,
          role: invitation.role,
        });

    if (!membership) {
      throw new Error('Accepted invitation has no project membership.');
    }

    await tx.insert(bubblophyProjectEvents).values(
      buildBubblophyProjectInvitationAcceptedEventInsert({
        projectId: project.id,
        projectKey: project.key,
        authUserId: input.authUserId,
        invitationId: invitation.id,
        invitedRole: invitation.role,
        membershipRole: membership.role,
        membershipCreated: membership.created,
      })
    );

    return {
      status: 'accepted',
      projectKey: project.key,
      role: membership.role,
      membershipCreated: membership.created,
    };
  });
}

/** Inserts the invited membership or reads a concurrently created membership. */
async function insertOrReadInvitationMembership(
  tx: BubblophyHumanWriteTransaction,
  input: {
    projectId: string;
    authUserId: string;
    role: 'maintainer' | 'member' | 'viewer';
  }
) {
  const [inserted] = await tx
    .insert(bubblophyProjectMembers)
    .values(input)
    .onConflictDoNothing({
      target: [
        bubblophyProjectMembers.projectId,
        bubblophyProjectMembers.authUserId,
      ],
    })
    .returning({ role: bubblophyProjectMembers.role });

  if (inserted) {
    return { role: inserted.role, created: true };
  }

  const existing = await readInvitationMembership(tx, input);

  return existing ? { role: existing.role, created: false } : null;
}

/** Reads the current membership after a waited invitation lock or insert race. */
async function readInvitationMembership(
  tx: BubblophyHumanWriteTransaction,
  input: { projectId: string; authUserId: string }
) {
  const [existing] = await tx
    .select({ role: bubblophyProjectMembers.role })
    .from(bubblophyProjectMembers)
    .where(
      and(
        eq(bubblophyProjectMembers.projectId, input.projectId),
        eq(bubblophyProjectMembers.authUserId, input.authUserId)
      )
    )
    .limit(1);

  return existing ?? null;
}

/** Parses UTC-naive invitation timestamps returned by the current schema. */
function parseInvitationTimestamp(value: string) {
  const timestamp = value.trim();
  const hasTimezone = /(?:z|[+-]\d{2}(?::?\d{2})?)$/i.test(timestamp);
  return Date.parse(
    hasTimezone ? timestamp : `${timestamp.replace(' ', 'T')}Z`
  );
}

/** Builds the email- and token-free acceptance audit event. */
export function buildBubblophyProjectInvitationAcceptedEventInsert(input: {
  projectId: string;
  projectKey: string;
  authUserId: string;
  invitationId: string;
  invitedRole: 'maintainer' | 'member' | 'viewer';
  membershipRole: BubblophyProjectRole;
  membershipCreated: boolean;
}): BubblophyProjectInvitationAcceptedEventInsert {
  return {
    projectId: input.projectId,
    eventType: 'project_updated',
    actorAuthUserId: input.authUserId,
    actorOauthClientId: null,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: `Einladung für ${input.projectKey} angenommen.`,
    payload: {
      source: 'human',
      entity: 'project_invitation',
      action: 'accepted',
      projectKey: input.projectKey,
      invitationId: input.invitationId,
      invitedRole: input.invitedRole,
      membershipRole: input.membershipRole,
      membershipCreated: input.membershipCreated,
      changedFields: input.membershipCreated
        ? ['acceptedAt', 'membership']
        : ['acceptedAt'],
    },
  };
}
