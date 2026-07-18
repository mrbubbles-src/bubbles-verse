import 'server-only';

export type BubblophyMcpProjectRole =
  | 'owner'
  | 'maintainer'
  | 'member'
  | 'viewer';

export interface BubblophyMcpProject {
  id: string;
  key: string;
  name: string;
  description: string;
  role: BubblophyMcpProjectRole;
  isArchived: boolean;
}

export type BubblophyMcpProjectReader = (
  authUserId: string
) => Promise<BubblophyMcpProject[]>;

export interface ListBubblophyMcpProjectsOptions {
  readProjects?: BubblophyMcpProjectReader;
}

export type ListBubblophyMcpProjectsResult =
  | { status: 'success'; projects: BubblophyMcpProject[] }
  | { status: 'invalid'; reason: 'empty_auth_user' }
  | { status: 'database_unavailable' };

/**
 * Lists the projects currently visible to one authenticated OAuth user.
 *
 * Membership is re-read for every call so role changes and removals take
 * effect without waiting for the OAuth token to expire.
 */
export async function listBubblophyMcpProjects(
  authUserId: string,
  options: ListBubblophyMcpProjectsOptions = {}
): Promise<ListBubblophyMcpProjectsResult> {
  const normalizedAuthUserId = authUserId.trim();

  if (!normalizedAuthUserId) {
    return { status: 'invalid', reason: 'empty_auth_user' };
  }

  const readProjects =
    options.readProjects ?? (await getDefaultBubblophyMcpProjectReader());

  if (!readProjects) {
    return { status: 'database_unavailable' };
  }

  try {
    return {
      status: 'success',
      projects: await readProjects(normalizedAuthUserId),
    };
  } catch {
    return { status: 'database_unavailable' };
  }
}

/** Loads the server-only Drizzle reader when database access is configured. */
async function getDefaultBubblophyMcpProjectReader(): Promise<BubblophyMcpProjectReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectBubblophyMcpProjectsForUser } =
    await import('@/lib/mcp/projects-database-read');

  return selectBubblophyMcpProjectsForUser;
}
