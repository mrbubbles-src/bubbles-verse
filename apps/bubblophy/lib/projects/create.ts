import 'server-only';

import type { ProjectSummary } from '@/lib/dashboard/types';

export interface CreateBubblophyProjectInput {
  authUserId: string;
  name: string;
  key: string;
  description?: string;
  repositoryUrl?: string;
}

export interface BubblophyProjectCreateStoreInput {
  authUserId: string;
  name: string;
  slug: string;
  key: string;
  description: string;
  repositoryUrl: string | null;
}

export interface BubblophyProjectCreateStore {
  createProjectWithOwnerMembership(
    input: BubblophyProjectCreateStoreInput
  ): Promise<
    | {
        status: 'created';
        project: {
          id: string;
          name: string;
          key: string;
        };
      }
    | {
        status: 'duplicate';
      }
  >;
}

export type CreateBubblophyProjectResult =
  | {
      status: 'created';
      project: ProjectSummary;
    }
  | {
      status: 'invalid';
      reason:
        | 'empty_name'
        | 'empty_key'
        | 'invalid_key'
        | 'invalid_repository_url';
    }
  | {
      status: 'duplicate';
    }
  | {
      status: 'database_unavailable';
    };

export interface CreateBubblophyProjectOptions {
  store?: BubblophyProjectCreateStore;
}

const validProjectKeyPattern = /^[A-Z0-9]{2,8}$/;

/**
 * Creates a human-owned Bubblophy project after validating client input.
 *
 * The default store is loaded only when `DATABASE_URL` exists. Tests can inject
 * a store so project creation is validated without touching a real database.
 * Creating a project writes only the project and owner membership.
 *
 * @param input Human user and project draft fields.
 * @param options Optional store override for tests or future route handlers.
 * @returns Structured result with a dashboard-ready project summary on success.
 */
export async function createBubblophyProject(
  input: CreateBubblophyProjectInput,
  options: CreateBubblophyProjectOptions = {}
): Promise<CreateBubblophyProjectResult> {
  const normalized = normalizeCreateProjectInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultCreateStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const created = await store.createProjectWithOwnerMembership(
    normalized.input
  );

  if (created.status === 'duplicate') {
    return { status: 'duplicate' };
  }

  return {
    status: 'created',
    project: mapCreatedProjectToSummary(created.project),
  };
}

/**
 * Normalizes a Bubblophy project key for persistence.
 *
 * @param key Raw user-entered project key.
 * @returns Uppercase project key with surrounding whitespace removed.
 */
export function normalizeBubblophyProjectKey(key: string) {
  return key.trim().toUpperCase();
}

/**
 * Builds the stable project slug used by the project table.
 *
 * The MVP uses the normalized project key as slug so duplicate key and duplicate
 * slug conflicts collapse into the same user-facing duplicate result.
 *
 * @param key Normalized project key.
 * @returns Lowercase project slug.
 */
export function buildBubblophyProjectSlug(key: string) {
  return key.toLowerCase();
}

/**
 * Converts a persisted project row into the dashboard project DTO.
 *
 * @param project Created project row returned by a store.
 * @returns Project summary with empty project counters.
 */
export function mapCreatedProjectToSummary(project: {
  id: string;
  name: string;
  key: string;
  description?: string;
  isArchived?: boolean;
}): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    key: project.key,
    description: project.description ?? '',
    isArchived: project.isArchived ?? false,
    health: 'stabil',
    openIssues: 0,
    readyIssues: 0,
    blockedIssues: 0,
    memberCount: 1,
    agentTokenCount: 0,
  };
}

/**
 * Converts raw project input into persistence-safe values.
 *
 * @param input Raw create input from a server action or test.
 * @returns Validated store input or a structured validation error.
 */
function normalizeCreateProjectInput(input: CreateBubblophyProjectInput):
  | {
      status: 'valid';
      input: BubblophyProjectCreateStoreInput;
    }
  | Extract<CreateBubblophyProjectResult, { status: 'invalid' }> {
  const name = input.name.trim();
  const key = normalizeBubblophyProjectKey(input.key);
  const repositoryUrl = normalizeRepositoryUrl(input.repositoryUrl);

  if (!name) {
    return { status: 'invalid', reason: 'empty_name' };
  }

  if (!key) {
    return { status: 'invalid', reason: 'empty_key' };
  }

  if (!validProjectKeyPattern.test(key)) {
    return { status: 'invalid', reason: 'invalid_key' };
  }

  if (repositoryUrl === false) {
    return { status: 'invalid', reason: 'invalid_repository_url' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      name,
      key,
      slug: buildBubblophyProjectSlug(key),
      description: input.description?.trim() ?? '',
      repositoryUrl,
    },
  };
}

/**
 * Normalizes optional repository URLs for storage.
 *
 * @param value Raw repository URL from the project dialog.
 * @returns HTTPS URL string, `null` for empty input, or `false` for invalid.
 */
function normalizeRepositoryUrl(value: string | undefined) {
  const trimmedValue = value?.trim() ?? '';

  if (!trimmedValue) {
    return null;
  }

  try {
    const url = new URL(trimmedValue);

    if (url.protocol !== 'https:') {
      return false;
    }

    return url.toString();
  } catch {
    return false;
  }
}

/**
 * Loads the Drizzle-backed project store only when a database URL exists.
 *
 * @returns Server-only create store, or `null` in sample/fallback mode.
 */
async function getDefaultCreateStore(): Promise<BubblophyProjectCreateStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyProjectCreateStore } =
    await import('@/lib/projects/database-write');

  return createDrizzleBubblophyProjectCreateStore();
}
