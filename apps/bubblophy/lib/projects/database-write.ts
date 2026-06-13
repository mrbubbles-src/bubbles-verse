import 'server-only';

import type {
  BubblophyProjectCreateStore,
  BubblophyProjectCreateStoreInput,
} from '@/lib/projects/create';

import {
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

/**
 * Creates the Drizzle-backed store for human-owned Bubblophy projects.
 *
 * Project and owner membership are written in one transaction. Duplicate key or
 * slug conflicts are returned as structured results for the dialog.
 *
 * @returns Store implementation for server actions.
 */
export function createDrizzleBubblophyProjectCreateStore(): BubblophyProjectCreateStore {
  return {
    createProjectWithOwnerMembership,
  };
}

/**
 * Creates one project and assigns the creator as owner.
 *
 * @param input Authenticated human user and normalized project fields.
 * @returns Created project row or a duplicate result.
 */
async function createProjectWithOwnerMembership(
  input: BubblophyProjectCreateStoreInput
): ReturnType<BubblophyProjectCreateStore['createProjectWithOwnerMembership']> {
  const { db } = await import('@/drizzle/db');

  try {
    const project = await db.transaction(async (tx) => {
      const [createdProject] = await tx
        .insert(bubblophyProjects)
        .values({
          slug: input.slug,
          key: input.key,
          name: input.name,
          description: input.description,
          repositoryUrl: input.repositoryUrl,
          createdByAuthUserId: input.authUserId,
        })
        .returning({
          id: bubblophyProjects.id,
          key: bubblophyProjects.key,
          name: bubblophyProjects.name,
        });

      if (!createdProject) {
        throw new Error('Bubblophy project insert did not return a row.');
      }

      await tx.insert(bubblophyProjectMembers).values({
        projectId: createdProject.id,
        authUserId: input.authUserId,
        role: 'owner',
      });

      return createdProject;
    });

    return {
      status: 'created',
      project,
    };
  } catch (error) {
    if (hasPostgresErrorCode(error, '23505')) {
      return { status: 'duplicate' };
    }

    throw error;
  }
}

/**
 * Detects a Postgres error code on thrown DB errors.
 *
 * @param error Thrown DB error from the current mutation.
 * @param code Postgres error code to match.
 * @returns `true` when the error exposes the requested code.
 */
function hasPostgresErrorCode(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code === code
  );
}
