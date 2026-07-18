import 'server-only';

import type { BubblophyProjectRole } from '@/drizzle/db/schema';
import type { ManageableProjectMemberRole } from '@/lib/projects/members';

export type BubblophyProjectInvitationManagerRole = Extract<
  BubblophyProjectRole,
  'owner' | 'maintainer'
>;

export type BubblophyProjectInvitationState =
  | 'pending'
  | 'expired'
  | 'accepted'
  | 'revoked';

export interface BubblophyProjectInvitationManagerSummary {
  id: string;
  email: string;
  role: ManageableProjectMemberRole;
  state: BubblophyProjectInvitationState;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  updatedAt: string;
}

export interface BubblophyProjectInvitationManagerSnapshot {
  projectKey: string;
  managerRole: BubblophyProjectInvitationManagerRole;
  isArchived: boolean;
  invitations: BubblophyProjectInvitationManagerSummary[];
}

export interface BubblophyProjectInvitationManagerPersistenceRow {
  projectKey: string;
  managerRole: BubblophyProjectRole;
  isArchived: boolean;
  invitationId: string | null;
  normalizedEmail: string | null;
  invitationRole: BubblophyProjectRole | null;
  createdAt: string | null;
  expiresAt: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
  updatedAt: string | null;
}

export type BubblophyProjectInvitationManagerReader = (
  authUserId: string,
  projectKey: string
) => Promise<BubblophyProjectInvitationManagerPersistenceRow[]>;

export type ReadBubblophyProjectInvitationManagerSnapshotResult =
  | {
      status: 'found';
      snapshot: BubblophyProjectInvitationManagerSnapshot;
    }
  | { status: 'not_found' }
  | {
      status: 'invalid';
      reason: 'empty_project' | 'invalid_project_key';
    }
  | { status: 'database_unavailable' };

export interface ReadBubblophyProjectInvitationManagerSnapshotOptions {
  readRows?: BubblophyProjectInvitationManagerReader;
  now?: () => Date;
}

const projectKeyPattern = /^[A-Z0-9]{2,8}$/;

/**
 * Reads a redacted invitation snapshot for one current project manager.
 *
 * The reader binds manager membership and invitations in one statement. Its
 * rows intentionally contain no token hash or inviter/acceptor/revoker IDs.
 *
 * @param input Authenticated human user and project key.
 * @param options Optional reader and clock for tests.
 * @returns Manager snapshot, hidden not-found, or safe setup status.
 */
export async function readBubblophyProjectInvitationManagerSnapshot(
  input: { authUserId: string; projectKey: string },
  options: ReadBubblophyProjectInvitationManagerSnapshotOptions = {}
): Promise<ReadBubblophyProjectInvitationManagerSnapshotResult> {
  const projectKey = input.projectKey.trim().toUpperCase();

  if (!projectKey) {
    return { status: 'invalid', reason: 'empty_project' };
  }

  if (!projectKeyPattern.test(projectKey)) {
    return { status: 'invalid', reason: 'invalid_project_key' };
  }

  const readRows = options.readRows ?? (await getDefaultInvitationReader());

  if (!readRows) {
    return { status: 'database_unavailable' };
  }

  try {
    const rows = await readRows(input.authUserId, projectKey);
    const firstRow = rows[0];

    if (!firstRow || !isInvitationManagerRole(firstRow.managerRole)) {
      return { status: 'not_found' };
    }

    const now = options.now?.() ?? new Date();

    return {
      status: 'found',
      snapshot: {
        projectKey: firstRow.projectKey,
        managerRole: firstRow.managerRole,
        isArchived: firstRow.isArchived,
        invitations: rows.flatMap((row) => mapInvitationManagerRow(row, now)),
      },
    };
  } catch {
    return { status: 'database_unavailable' };
  }
}

/** Maps one nullable left-join row into zero or one redacted invitation. */
function mapInvitationManagerRow(
  row: BubblophyProjectInvitationManagerPersistenceRow,
  now: Date
): BubblophyProjectInvitationManagerSummary[] {
  if (
    !row.invitationId ||
    !row.normalizedEmail ||
    !row.invitationRole ||
    !row.createdAt ||
    !row.expiresAt ||
    !row.updatedAt ||
    row.invitationRole === 'owner'
  ) {
    return [];
  }

  return [
    {
      id: row.invitationId,
      email: row.normalizedEmail,
      role: row.invitationRole,
      state: deriveInvitationState(row, now),
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      acceptedAt: row.acceptedAt,
      revokedAt: row.revokedAt,
      updatedAt: row.updatedAt,
    },
  ];
}

/** Derives the public lifecycle state with terminal states taking precedence. */
function deriveInvitationState(
  row: Pick<
    BubblophyProjectInvitationManagerPersistenceRow,
    'acceptedAt' | 'revokedAt' | 'expiresAt'
  >,
  now: Date
): BubblophyProjectInvitationState {
  if (row.revokedAt) {
    return 'revoked';
  }

  if (row.acceptedAt) {
    return 'accepted';
  }

  const expiresAt = row.expiresAt
    ? parsePersistenceTimestamp(row.expiresAt)
    : Number.NaN;
  return Number.isFinite(expiresAt) && expiresAt > now.getTime()
    ? 'pending'
    : 'expired';
}

/** Parses UTC values returned from Postgres `timestamp without time zone`. */
function parsePersistenceTimestamp(value: string) {
  const timestamp = value.trim();
  const hasTimezone = /(?:z|[+-]\d{2}(?::?\d{2})?)$/i.test(timestamp);
  const normalized = hasTimezone
    ? timestamp
    : `${timestamp.replace(' ', 'T')}Z`;

  return Date.parse(normalized);
}

/** Narrows a persisted project role to invitation manager roles. */
function isInvitationManagerRole(
  role: BubblophyProjectRole
): role is BubblophyProjectInvitationManagerRole {
  return role === 'owner' || role === 'maintainer';
}

/** Loads the server-only Drizzle reader when database access is configured. */
async function getDefaultInvitationReader(): Promise<BubblophyProjectInvitationManagerReader | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { selectBubblophyProjectInvitationManagerRows } =
    await import('@/lib/projects/invitation-snapshot-database-read');

  return selectBubblophyProjectInvitationManagerRows;
}
