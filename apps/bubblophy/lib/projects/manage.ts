import 'server-only';

import type { ProjectSummary } from '@/lib/dashboard/types';

import { deriveBubblophyProjectHealth } from '@/lib/issues/repository';

export { canManageBubblophyProject } from '@/lib/projects/permissions';

export interface UpdateBubblophyProjectContentInput {
  authUserId: string;
  projectKey: string;
  name: string;
  description?: string;
}

export interface TransitionBubblophyProjectArchiveInput {
  authUserId: string;
  projectKey: string;
  decision: 'archive' | 'restore';
}

export interface BubblophyProjectManagementStoreInput {
  authUserId: string;
  projectKey: string;
}

export interface BubblophyProjectContentStoreInput extends BubblophyProjectManagementStoreInput {
  name: string;
  description: string;
}

export interface BubblophyProjectArchiveStoreInput extends BubblophyProjectManagementStoreInput {
  decision: 'archive' | 'restore';
}

export interface BubblophyProjectManagementStoreResult {
  id: string;
  key: string;
  name: string;
  description: string;
  isArchived: boolean;
  openIssues: number;
  readyIssues: number;
  blockedIssues: number;
  memberCount: number;
  agentTokenCount: number;
}

export interface BubblophyProjectManagementStore {
  updateProjectContentWithEvent(
    input: BubblophyProjectContentStoreInput
  ): Promise<
    | {
        status: 'updated';
        project: BubblophyProjectManagementStoreResult;
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
  >;
  transitionProjectArchiveWithEvent(
    input: BubblophyProjectArchiveStoreInput
  ): Promise<
    | {
        status: 'updated';
        project: BubblophyProjectManagementStoreResult;
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
  >;
}

export type UpdateBubblophyProjectContentResult =
  | {
      status: 'updated';
      project: ProjectSummary;
    }
  | {
      status: 'unchanged';
    }
  | {
      status: 'invalid';
      reason:
        | 'empty_project'
        | 'empty_name'
        | 'name_too_long'
        | 'description_too_long';
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
      status: 'database_unavailable';
    };

export type TransitionBubblophyProjectArchiveResult =
  | {
      status: 'updated';
      project: ProjectSummary;
    }
  | {
      status: 'unchanged';
    }
  | {
      status: 'invalid';
      reason: 'empty_project' | 'invalid_decision';
    }
  | {
      status: 'not_found';
    }
  | {
      status: 'forbidden';
    }
  | {
      status: 'database_unavailable';
    };

export interface BubblophyProjectManagementOptions {
  store?: BubblophyProjectManagementStore;
}

const maxProjectNameLength = 160;
const maxProjectDescriptionLength = 2_000;

/**
 * Updates a project name and description after owner/maintainer checks.
 *
 * @param input Authenticated user, project key, and content fields.
 * @param options Optional store override for tests.
 * @returns Structured project update result for server actions.
 */
export async function updateBubblophyProjectContent(
  input: UpdateBubblophyProjectContentInput,
  options: BubblophyProjectManagementOptions = {}
): Promise<UpdateBubblophyProjectContentResult> {
  const normalized = normalizeProjectContentInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultProjectManagementStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const result = await store.updateProjectContentWithEvent(normalized.input);

  if (result.status !== 'updated') {
    return result;
  }

  return {
    status: 'updated',
    project: mapManagedProjectToSummary(result.project),
  };
}

/**
 * Archives or restores a project after owner/maintainer checks.
 *
 * @param input Authenticated user, project key, and lifecycle decision.
 * @param options Optional store override for tests.
 * @returns Structured project lifecycle result for server actions.
 */
export async function transitionBubblophyProjectArchive(
  input: TransitionBubblophyProjectArchiveInput,
  options: BubblophyProjectManagementOptions = {}
): Promise<TransitionBubblophyProjectArchiveResult> {
  const normalized = normalizeProjectArchiveInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultProjectManagementStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const result = await store.transitionProjectArchiveWithEvent(
    normalized.input
  );

  if (result.status !== 'updated') {
    return result;
  }

  return {
    status: 'updated',
    project: mapManagedProjectToSummary(result.project),
  };
}

/**
 * Maps managed project persistence data into the dashboard summary DTO.
 *
 * @param project Project row plus aggregate counters.
 * @returns Dashboard project summary.
 */
export function mapManagedProjectToSummary(
  project: BubblophyProjectManagementStoreResult
): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    key: project.key,
    description: project.description,
    isArchived: project.isArchived,
    health: project.isArchived
      ? 'stabil'
      : deriveBubblophyProjectHealth(project),
    openIssues: project.isArchived ? 0 : project.openIssues,
    readyIssues: project.isArchived ? 0 : project.readyIssues,
    blockedIssues: project.isArchived ? 0 : project.blockedIssues,
    memberCount: project.memberCount,
    agentTokenCount: project.agentTokenCount,
  };
}

function normalizeProjectContentInput(
  input: UpdateBubblophyProjectContentInput
):
  | {
      status: 'valid';
      input: BubblophyProjectContentStoreInput;
    }
  | Extract<UpdateBubblophyProjectContentResult, { status: 'invalid' }> {
  const projectKey = input.projectKey.trim().toUpperCase();
  const name = input.name.trim();
  const description = input.description?.trim() ?? '';

  if (!projectKey) {
    return { status: 'invalid', reason: 'empty_project' };
  }

  if (!name) {
    return { status: 'invalid', reason: 'empty_name' };
  }

  if (name.length > maxProjectNameLength) {
    return { status: 'invalid', reason: 'name_too_long' };
  }

  if (description.length > maxProjectDescriptionLength) {
    return { status: 'invalid', reason: 'description_too_long' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      projectKey,
      name,
      description,
    },
  };
}

function normalizeProjectArchiveInput(
  input: TransitionBubblophyProjectArchiveInput
):
  | {
      status: 'valid';
      input: BubblophyProjectArchiveStoreInput;
    }
  | Extract<TransitionBubblophyProjectArchiveResult, { status: 'invalid' }> {
  const projectKey = input.projectKey.trim().toUpperCase();

  if (!projectKey) {
    return { status: 'invalid', reason: 'empty_project' };
  }

  if (input.decision !== 'archive' && input.decision !== 'restore') {
    return { status: 'invalid', reason: 'invalid_decision' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      projectKey,
      decision: input.decision,
    },
  };
}

async function getDefaultProjectManagementStore(): Promise<BubblophyProjectManagementStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyProjectManagementStore } =
    await import('@/lib/projects/manage-database-write');

  return createDrizzleBubblophyProjectManagementStore();
}
