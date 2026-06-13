import 'server-only';

import type {
  ProjectMemberRole,
  ProjectMemberSummary,
} from '@/lib/dashboard/types';

export type ManageableProjectMemberRole = Exclude<ProjectMemberRole, 'owner'>;

export interface UpdateBubblophyProjectMemberRoleInput {
  authUserId: string;
  projectKey: string;
  memberAuthUserId: string;
  role: ManageableProjectMemberRole;
}

export interface RemoveBubblophyProjectMemberInput {
  authUserId: string;
  projectKey: string;
  memberAuthUserId: string;
}

export interface BubblophyProjectMemberMutationStoreInput {
  authUserId: string;
  projectKey: string;
  memberAuthUserId: string;
}

export interface BubblophyProjectMemberRoleStoreInput extends BubblophyProjectMemberMutationStoreInput {
  role: ManageableProjectMemberRole;
}

export type BubblophyProjectMemberMutationStoreResult =
  | {
      status: 'updated';
      member: ProjectMemberSummary;
      memberCount: number;
    }
  | {
      status: 'removed';
      projectKey: string;
      memberAuthUserId: string;
      memberCount: number;
    }
  | {
      status: 'unchanged';
    }
  | {
      status: 'not_found';
    }
  | {
      status: 'forbidden';
    }
  | {
      status: 'archived_project';
    }
  | {
      status: 'owner_protected';
    }
  | {
      status: 'self_removal';
    };

export interface BubblophyProjectMemberMutationStore {
  updateProjectMemberRoleWithEvent(
    input: BubblophyProjectMemberRoleStoreInput
  ): Promise<BubblophyProjectMemberMutationStoreResult>;
  removeProjectMemberWithEvent(
    input: BubblophyProjectMemberMutationStoreInput
  ): Promise<BubblophyProjectMemberMutationStoreResult>;
}

export type UpdateBubblophyProjectMemberRoleResult =
  | {
      status: 'updated';
      member: ProjectMemberSummary;
      memberCount: number;
    }
  | {
      status: 'unchanged';
    }
  | {
      status: 'invalid';
      reason: 'empty_project' | 'empty_member' | 'invalid_role';
    }
  | {
      status: 'not_found';
    }
  | {
      status: 'forbidden';
    }
  | {
      status: 'archived_project';
    }
  | {
      status: 'owner_protected';
    }
  | {
      status: 'database_unavailable';
    };

export type RemoveBubblophyProjectMemberResult =
  | {
      status: 'removed';
      projectKey: string;
      memberAuthUserId: string;
      memberCount: number;
    }
  | {
      status: 'invalid';
      reason: 'empty_project' | 'empty_member';
    }
  | {
      status: 'not_found';
    }
  | {
      status: 'forbidden';
    }
  | {
      status: 'archived_project';
    }
  | {
      status: 'owner_protected';
    }
  | {
      status: 'self_removal';
    }
  | {
      status: 'database_unavailable';
    };

export interface BubblophyProjectMemberMutationOptions {
  store?: BubblophyProjectMemberMutationStore;
}

const manageableRoles = new Set<ProjectMemberRole>([
  'maintainer',
  'member',
  'viewer',
]);

/**
 * Updates a non-owner project member role after server-side authorization.
 *
 * @param input Authenticated user, project key, target member, and next role.
 * @param options Optional store override for tests.
 * @returns Structured role update result for server actions.
 */
export async function updateBubblophyProjectMemberRole(
  input: UpdateBubblophyProjectMemberRoleInput,
  options: BubblophyProjectMemberMutationOptions = {}
): Promise<UpdateBubblophyProjectMemberRoleResult> {
  const normalized = normalizeProjectMemberRoleInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultProjectMemberMutationStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const result = await store.updateProjectMemberRoleWithEvent(normalized.input);

  if (result.status === 'removed' || result.status === 'self_removal') {
    return { status: 'forbidden' };
  }

  return result;
}

/**
 * Removes a non-owner project member after server-side authorization.
 *
 * The current schema has no soft-disable flag, so this performs a hard member
 * row deletion in the store and reports it as removal.
 *
 * @param input Authenticated user, project key, and target member ID.
 * @param options Optional store override for tests.
 * @returns Structured removal result for server actions.
 */
export async function removeBubblophyProjectMember(
  input: RemoveBubblophyProjectMemberInput,
  options: BubblophyProjectMemberMutationOptions = {}
): Promise<RemoveBubblophyProjectMemberResult> {
  const normalized = normalizeProjectMemberMutationInput(input);

  if (normalized.status === 'invalid') {
    return {
      status: 'invalid',
      reason:
        normalized.reason === 'empty_project'
          ? 'empty_project'
          : 'empty_member',
    };
  }

  const store = options.store ?? (await getDefaultProjectMemberMutationStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const result = await store.removeProjectMemberWithEvent(normalized.input);

  if (result.status === 'updated' || result.status === 'unchanged') {
    return { status: 'forbidden' };
  }

  return result;
}

/**
 * Checks whether a project role may manage project membership.
 *
 * @param role Project membership role from persistence.
 * @returns True for owner/maintainer roles.
 */
export function canManageBubblophyProjectMembers(role: string) {
  return role === 'owner' || role === 'maintainer';
}

/**
 * Checks whether the target role is mutable in this MVP.
 *
 * @param role Project member role from persistence or UI.
 * @returns True when the role is non-owner and supported.
 */
export function isManageableBubblophyProjectMemberRole(
  role: ProjectMemberRole
): role is ManageableProjectMemberRole {
  return manageableRoles.has(role);
}

function normalizeProjectMemberRoleInput(
  input: UpdateBubblophyProjectMemberRoleInput
):
  | {
      status: 'valid';
      input: BubblophyProjectMemberRoleStoreInput;
    }
  | Extract<UpdateBubblophyProjectMemberRoleResult, { status: 'invalid' }> {
  const normalized = normalizeProjectMemberMutationInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  if (!manageableRoles.has(input.role)) {
    return { status: 'invalid', reason: 'invalid_role' };
  }

  return {
    status: 'valid',
    input: {
      ...normalized.input,
      role: input.role,
    },
  };
}

function normalizeProjectMemberMutationInput(
  input: RemoveBubblophyProjectMemberInput
):
  | {
      status: 'valid';
      input: BubblophyProjectMemberMutationStoreInput;
    }
  | Extract<
      | RemoveBubblophyProjectMemberResult
      | UpdateBubblophyProjectMemberRoleResult,
      { status: 'invalid' }
    > {
  const projectKey = input.projectKey.trim().toUpperCase();
  const memberAuthUserId = input.memberAuthUserId.trim();

  if (!projectKey) {
    return { status: 'invalid', reason: 'empty_project' };
  }

  if (!memberAuthUserId) {
    return { status: 'invalid', reason: 'empty_member' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      projectKey,
      memberAuthUserId,
    },
  };
}

async function getDefaultProjectMemberMutationStore(): Promise<BubblophyProjectMemberMutationStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyProjectMemberMutationStore } =
    await import('@/lib/projects/members-database-write');

  return createDrizzleBubblophyProjectMemberMutationStore();
}
