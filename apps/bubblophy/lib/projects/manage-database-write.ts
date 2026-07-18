import 'server-only';

import type { db as bubblophyDb } from '@/drizzle/db';
import type { JsonObject } from '@/drizzle/db/schema';
import type {
  BubblophyProjectArchiveStoreInput,
  BubblophyProjectContentStoreInput,
  BubblophyProjectManagementStore,
  BubblophyProjectManagementStoreResult,
} from '@/lib/projects/manage';

import {
  lockBubblophyProjectForHumanWrite,
  lockBubblophyProjectMembersForHumanWrite,
} from '@/lib/projects/human-write-locks-database';
import { canManageBubblophyProject } from '@/lib/projects/manage';

import { and, eq, sql } from 'drizzle-orm';

import {
  bubblophyAgentTokens,
  bubblophyIssues,
  bubblophyProjectEvents,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

type ProjectChangedField = 'name' | 'description';
type ProjectAuditAction = 'updated' | 'archived' | 'restored';
type BubblophyProjectManagementTx = Parameters<
  Parameters<typeof bubblophyDb.transaction>[0]
>[0];

export interface BubblophyProjectUpdatedEventInsert {
  projectId: string;
  eventType: 'project_updated';
  actorAuthUserId: string;
  actorAgentTokenId: null;
  agentRunId: null;
  summary: string;
  payload: JsonObject;
}

/**
 * Creates the Drizzle-backed store for project settings and archive changes.
 *
 * @returns Store implementation for server actions.
 */
export function createDrizzleBubblophyProjectManagementStore(): BubblophyProjectManagementStore {
  return {
    updateProjectContentWithEvent,
    transitionProjectArchiveWithEvent,
  };
}

async function updateProjectContentWithEvent(
  input: BubblophyProjectContentStoreInput
): ReturnType<
  BubblophyProjectManagementStore['updateProjectContentWithEvent']
> {
  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const context = await lockProjectManagerMutationContext(tx, input);

    if (context.status !== 'ready') {
      return context;
    }

    const currentProject = context.project;

    const changedFields = getChangedBubblophyProjectContentFields({
      current: currentProject,
      next: input,
    });

    if (changedFields.length === 0) {
      return { status: 'unchanged' };
    }

    const [updatedProject] = await tx
      .update(bubblophyProjects)
      .set({
        name: input.name,
        description: input.description,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(bubblophyProjects.id, currentProject.id))
      .returning({
        id: bubblophyProjects.id,
        key: bubblophyProjects.key,
        name: bubblophyProjects.name,
        description: bubblophyProjects.description,
        isArchived: bubblophyProjects.isArchived,
      });

    if (!updatedProject) {
      throw new Error('Bubblophy project update did not return a row.');
    }

    await tx.insert(bubblophyProjectEvents).values(
      buildBubblophyProjectUpdatedEventInsert({
        projectId: currentProject.id,
        projectKey: currentProject.key,
        authUserId: input.authUserId,
        action: 'updated',
        changedFields,
      })
    );

    return {
      status: 'updated',
      project: await addProjectCounters(tx, updatedProject),
    };
  });
}

async function transitionProjectArchiveWithEvent(
  input: BubblophyProjectArchiveStoreInput
): ReturnType<
  BubblophyProjectManagementStore['transitionProjectArchiveWithEvent']
> {
  const { db } = await import('@/drizzle/db');

  return db.transaction(async (tx) => {
    const context = await lockProjectManagerMutationContext(tx, input);

    if (context.status !== 'ready') {
      return context;
    }

    const currentProject = context.project;

    const nextArchived = input.decision === 'archive';

    if (currentProject.isArchived === nextArchived) {
      return { status: 'unchanged' };
    }

    const [updatedProject] = await tx
      .update(bubblophyProjects)
      .set({
        isArchived: nextArchived,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(bubblophyProjects.id, currentProject.id))
      .returning({
        id: bubblophyProjects.id,
        key: bubblophyProjects.key,
        name: bubblophyProjects.name,
        description: bubblophyProjects.description,
        isArchived: bubblophyProjects.isArchived,
      });

    if (!updatedProject) {
      throw new Error('Bubblophy project archive update did not return a row.');
    }

    await tx.insert(bubblophyProjectEvents).values(
      buildBubblophyProjectUpdatedEventInsert({
        projectId: currentProject.id,
        projectKey: currentProject.key,
        authUserId: input.authUserId,
        action: nextArchived ? 'archived' : 'restored',
        changedFields: [],
      })
    );

    return {
      status: 'updated',
      project: await addProjectCounters(tx, updatedProject),
    };
  });
}

/**
 * Returns the project content fields changed by an edit request.
 *
 * @param input Current and next project content.
 * @returns Stable changed field list for audit payloads.
 */
export function getChangedBubblophyProjectContentFields(input: {
  current: {
    name: string;
    description: string;
  };
  next: {
    name: string;
    description: string;
  };
}): ProjectChangedField[] {
  return [
    input.current.name === input.next.name ? null : 'name',
    input.current.description === input.next.description ? null : 'description',
  ].filter((field): field is ProjectChangedField => field !== null);
}

/**
 * Builds a project-level audit event without duplicating edited content.
 *
 * @param input Project, actor, action, and optional changed fields.
 * @returns Insert values for `bubblophy_project_events`.
 */
export function buildBubblophyProjectUpdatedEventInsert(input: {
  projectId: string;
  projectKey: string;
  authUserId: string;
  action: ProjectAuditAction;
  changedFields: ProjectChangedField[];
}): BubblophyProjectUpdatedEventInsert {
  return {
    projectId: input.projectId,
    eventType: 'project_updated',
    actorAuthUserId: input.authUserId,
    actorAgentTokenId: null,
    agentRunId: null,
    summary: `Projekt ${input.projectKey}: ${input.action}.`,
    payload: {
      source: 'human',
      entity: 'project',
      action: input.action,
      projectId: input.projectId,
      projectKey: input.projectKey,
      changedFields: input.changedFields,
    },
  };
}

/**
 * Locks project and actor membership before a manager mutation.
 *
 * @param tx Active project management transaction.
 * @param input Authenticated actor and project key.
 * @returns Locked current project or a structured authorization failure.
 */
export async function lockProjectManagerMutationContext(
  tx: BubblophyProjectManagementTx,
  input: {
    authUserId: string;
    projectKey: string;
  }
) {
  const lockedProject = await lockBubblophyProjectForHumanWrite(tx, {
    project: { key: input.projectKey },
    lockMode: 'no key update',
  });

  if (!lockedProject) {
    return { status: 'not_found' } as const;
  }

  const memberships = await lockBubblophyProjectMembersForHumanWrite(tx, {
    projectId: lockedProject.id,
    authUserIds: [input.authUserId],
  });
  const actorRole = memberships.find(
    (membership) => membership.authUserId === input.authUserId
  )?.role;

  if (!canManageBubblophyProject(actorRole ?? '')) {
    return { status: 'forbidden' } as const;
  }

  const [project] = await tx
    .select({
      id: bubblophyProjects.id,
      key: bubblophyProjects.key,
      name: bubblophyProjects.name,
      description: bubblophyProjects.description,
      isArchived: bubblophyProjects.isArchived,
    })
    .from(bubblophyProjects)
    .where(eq(bubblophyProjects.id, lockedProject.id))
    .limit(1);

  if (!project) {
    throw new Error('Locked Bubblophy project could not be reloaded.');
  }

  return { status: 'ready', project } as const;
}

async function addProjectCounters(
  tx: BubblophyProjectManagementTx,
  project: Pick<
    BubblophyProjectManagementStoreResult,
    'id' | 'key' | 'name' | 'description' | 'isArchived'
  >
): Promise<BubblophyProjectManagementStoreResult> {
  const [memberCount, tokenCount, issueCounts] = await Promise.all([
    tx
      .select({ count: sql<number>`count(*)::int` })
      .from(bubblophyProjectMembers)
      .where(eq(bubblophyProjectMembers.projectId, project.id)),
    tx
      .select({ count: sql<number>`count(*)::int` })
      .from(bubblophyAgentTokens)
      .where(
        and(
          eq(bubblophyAgentTokens.projectId, project.id),
          eq(bubblophyAgentTokens.state, 'active')
        )
      ),
    tx
      .select({
        openIssues: sql<number>`count(*) filter (where ${bubblophyIssues.status} in ('triage', 'planned', 'ready', 'in_progress', 'review', 'blocked'))::int`,
        readyIssues: sql<number>`count(*) filter (where ${bubblophyIssues.status} = 'ready')::int`,
        blockedIssues: sql<number>`count(*) filter (where ${bubblophyIssues.status} = 'blocked')::int`,
      })
      .from(bubblophyIssues)
      .where(eq(bubblophyIssues.projectId, project.id)),
  ]);

  return {
    ...project,
    openIssues: issueCounts[0]?.openIssues ?? 0,
    readyIssues: issueCounts[0]?.readyIssues ?? 0,
    blockedIssues: issueCounts[0]?.blockedIssues ?? 0,
    memberCount: memberCount[0]?.count ?? 0,
    agentTokenCount: tokenCount[0]?.count ?? 0,
  };
}
