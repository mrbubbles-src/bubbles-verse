import 'server-only';

import type { ManageableProjectMemberRole } from '@/lib/projects/members';

import { createHash, randomBytes } from 'node:crypto';

export interface CreateBubblophyProjectInvitationInput {
  authUserId: string;
  projectKey: string;
  email: string;
  role: ManageableProjectMemberRole;
}

export interface ReinviteBubblophyProjectInvitationInput {
  authUserId: string;
  invitationId: string;
  expectedUpdatedAt: string;
}

export interface RevokeBubblophyProjectInvitationInput {
  authUserId: string;
  invitationId: string;
  expectedUpdatedAt: string;
}

export interface BubblophyProjectInvitationSummary {
  id: string;
  projectKey: string;
  email: string;
  role: ManageableProjectMemberRole;
  expiresAt: string;
  updatedAt: string;
}

export interface BubblophyProjectInvitationCreateStoreInput {
  authUserId: string;
  projectKey: string;
  normalizedEmail: string;
  role: ManageableProjectMemberRole;
  tokenHash: string;
  now: string;
  expiresAt: string;
}

export interface BubblophyProjectInvitationTransitionStoreInput {
  authUserId: string;
  invitationId: string;
  expectedUpdatedAt: string;
  now: string;
}

export interface BubblophyProjectInvitationReinviteStoreInput extends BubblophyProjectInvitationTransitionStoreInput {
  tokenHash: string;
  expiresAt: string;
}

type BubblophyProjectInvitationFailureStatus =
  | 'archived_project'
  | 'conflict'
  | 'forbidden'
  | 'not_found'
  | 'terminal';

type BubblophyProjectInvitationFailureResult = {
  [Status in BubblophyProjectInvitationFailureStatus]: { status: Status };
}[BubblophyProjectInvitationFailureStatus];

export type BubblophyProjectInvitationCreateStoreResult =
  | {
      status: 'created';
      invitation: BubblophyProjectInvitationSummary;
    }
  | { status: 'already_open' }
  | BubblophyProjectInvitationFailureResult;

export type BubblophyProjectInvitationReinviteStoreResult =
  | {
      status: 'reinvited';
      invitation: BubblophyProjectInvitationSummary;
    }
  | BubblophyProjectInvitationFailureResult;

export type BubblophyProjectInvitationRevokeStoreResult =
  | {
      status: 'revoked';
      invitationId: string;
      projectKey: string;
      updatedAt: string;
    }
  | BubblophyProjectInvitationFailureResult;

export type BubblophyProjectInvitationStoreResult =
  | BubblophyProjectInvitationCreateStoreResult
  | BubblophyProjectInvitationReinviteStoreResult
  | BubblophyProjectInvitationRevokeStoreResult;

export interface BubblophyProjectInvitationMutationStore {
  createProjectInvitationWithEvent(
    input: BubblophyProjectInvitationCreateStoreInput
  ): Promise<BubblophyProjectInvitationCreateStoreResult>;
  reinviteProjectInvitationWithEvent(
    input: BubblophyProjectInvitationReinviteStoreInput
  ): Promise<BubblophyProjectInvitationReinviteStoreResult>;
  revokeProjectInvitationWithEvent(
    input: BubblophyProjectInvitationTransitionStoreInput
  ): Promise<BubblophyProjectInvitationRevokeStoreResult>;
}

type BubblophyProjectInvitationInvalidReason =
  | 'empty_email'
  | 'empty_invitation'
  | 'empty_project'
  | 'invalid_email'
  | 'invalid_expected_updated_at'
  | 'invalid_project_key'
  | 'invalid_role';

export type CreateBubblophyProjectInvitationResult =
  | {
      status: 'created';
      invitation: BubblophyProjectInvitationSummary & {
        plaintextToken: string;
      };
    }
  | Exclude<BubblophyProjectInvitationCreateStoreResult, { status: 'created' }>
  | {
      status: 'invalid';
      reason: BubblophyProjectInvitationInvalidReason;
    }
  | { status: 'database_unavailable' };

export type ReinviteBubblophyProjectInvitationResult =
  | {
      status: 'reinvited';
      invitation: BubblophyProjectInvitationSummary & {
        plaintextToken: string;
      };
    }
  | Exclude<
      BubblophyProjectInvitationReinviteStoreResult,
      { status: 'reinvited' }
    >
  | {
      status: 'invalid';
      reason: BubblophyProjectInvitationInvalidReason;
    }
  | { status: 'database_unavailable' };

export type RevokeBubblophyProjectInvitationResult =
  | BubblophyProjectInvitationRevokeStoreResult
  | {
      status: 'invalid';
      reason: BubblophyProjectInvitationInvalidReason;
    }
  | { status: 'database_unavailable' };

export interface BubblophyProjectInvitationMutationOptions {
  store?: BubblophyProjectInvitationMutationStore;
  tokenFactory?: () => string;
  now?: () => Date;
}

export const BUBBLOPHY_PROJECT_INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

const manageableRoles = new Set<ManageableProjectMemberRole>([
  'maintainer',
  'member',
  'viewer',
]);
const projectKeyPattern = /^[A-Z0-9]{2,8}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxEmailLength = 320;

/**
 * Creates a pending project invitation for a manager-selected email address.
 *
 * @param input Authenticated manager, project, email address, and invited role.
 * @param options Optional store, token factory, and clock for tests.
 * @returns Created invitation with one-time plaintext token or a safe status.
 */
export async function createBubblophyProjectInvitation(
  input: CreateBubblophyProjectInvitationInput,
  options: BubblophyProjectInvitationMutationOptions = {}
): Promise<CreateBubblophyProjectInvitationResult> {
  const normalized = normalizeCreateInvitationInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultInvitationMutationStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const plaintextToken = createPlaintextInvitationToken(options);
  const now = (options.now?.() ?? new Date()).toISOString();
  const expiresAt = new Date(
    Date.parse(now) + BUBBLOPHY_PROJECT_INVITATION_LIFETIME_MS
  ).toISOString();
  const result = await store.createProjectInvitationWithEvent({
    ...normalized.input,
    tokenHash: hashBubblophyProjectInvitationToken(plaintextToken),
    now,
    expiresAt,
  });

  if (result.status !== 'created') {
    return result;
  }

  return {
    status: 'created',
    invitation: {
      ...result.invitation,
      plaintextToken,
    },
  };
}

/**
 * Rotates the secret and expiry of an existing open project invitation.
 *
 * @param input Authenticated manager, invitation ID, and stale-write guard.
 * @param options Optional store, token factory, and clock for tests.
 * @returns Updated invitation with one-time plaintext token or a safe status.
 */
export async function reinviteBubblophyProjectInvitation(
  input: ReinviteBubblophyProjectInvitationInput,
  options: BubblophyProjectInvitationMutationOptions = {}
): Promise<ReinviteBubblophyProjectInvitationResult> {
  const normalized = normalizeInvitationTransitionInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultInvitationMutationStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const plaintextToken = createPlaintextInvitationToken(options);
  const now = (options.now?.() ?? new Date()).toISOString();
  const expiresAt = new Date(
    Date.parse(now) + BUBBLOPHY_PROJECT_INVITATION_LIFETIME_MS
  ).toISOString();
  const result = await store.reinviteProjectInvitationWithEvent({
    ...normalized.input,
    tokenHash: hashBubblophyProjectInvitationToken(plaintextToken),
    now,
    expiresAt,
  });

  if (result.status !== 'reinvited') {
    return result;
  }

  return {
    status: 'reinvited',
    invitation: {
      ...result.invitation,
      plaintextToken,
    },
  };
}

/**
 * Revokes an existing open project invitation after a stale-write check.
 *
 * @param input Authenticated manager, invitation ID, and expected update time.
 * @param options Optional store and clock for tests.
 * @returns Revoked invitation reference or a safe status.
 */
export async function revokeBubblophyProjectInvitation(
  input: RevokeBubblophyProjectInvitationInput,
  options: BubblophyProjectInvitationMutationOptions = {}
): Promise<RevokeBubblophyProjectInvitationResult> {
  const normalized = normalizeInvitationTransitionInput(input);

  if (normalized.status === 'invalid') {
    return normalized;
  }

  const store = options.store ?? (await getDefaultInvitationMutationStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  const result = await store.revokeProjectInvitationWithEvent({
    ...normalized.input,
    now: (options.now?.() ?? new Date()).toISOString(),
  });

  return result;
}

/**
 * Generates a high-entropy project invitation token for one-time display.
 *
 * @returns Prefixed URL-safe invitation secret.
 */
export function generateBubblophyProjectInvitationToken() {
  return `bubblophy_invite_${randomBytes(32).toString('base64url')}`;
}

/**
 * Hashes a project invitation secret before persistence and lookup.
 *
 * @param plaintextToken One-time invitation token.
 * @returns Versioned SHA-256 token hash.
 */
export function hashBubblophyProjectInvitationToken(plaintextToken: string) {
  return `sha256:${createHash('sha256').update(plaintextToken).digest('hex')}`;
}

/** Produces an invitation secret through the production or injected factory. */
function createPlaintextInvitationToken(
  options: BubblophyProjectInvitationMutationOptions
) {
  return options.tokenFactory?.() ?? generateBubblophyProjectInvitationToken();
}

/** Validates and normalizes manager-provided invitation fields. */
function normalizeCreateInvitationInput(
  input: CreateBubblophyProjectInvitationInput
):
  | {
      status: 'valid';
      input: Omit<
        BubblophyProjectInvitationCreateStoreInput,
        'tokenHash' | 'now' | 'expiresAt'
      >;
    }
  | Extract<CreateBubblophyProjectInvitationResult, { status: 'invalid' }> {
  const projectKey = input.projectKey.trim().toUpperCase();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!projectKey) {
    return { status: 'invalid', reason: 'empty_project' };
  }

  if (!projectKeyPattern.test(projectKey)) {
    return { status: 'invalid', reason: 'invalid_project_key' };
  }

  if (!normalizedEmail) {
    return { status: 'invalid', reason: 'empty_email' };
  }

  if (
    normalizedEmail.length > maxEmailLength ||
    !emailPattern.test(normalizedEmail)
  ) {
    return { status: 'invalid', reason: 'invalid_email' };
  }

  if (!manageableRoles.has(input.role)) {
    return { status: 'invalid', reason: 'invalid_role' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      projectKey,
      normalizedEmail,
      role: input.role,
    },
  };
}

/** Validates and normalizes an ID-based invitation transition request. */
function normalizeInvitationTransitionInput(input: {
  authUserId: string;
  invitationId: string;
  expectedUpdatedAt: string;
}):
  | {
      status: 'valid';
      input: Omit<BubblophyProjectInvitationTransitionStoreInput, 'now'>;
    }
  | Extract<ReinviteBubblophyProjectInvitationResult, { status: 'invalid' }> {
  const invitationId = input.invitationId.trim();

  if (!invitationId) {
    return { status: 'invalid', reason: 'empty_invitation' };
  }

  const expectedUpdatedAt = normalizeExpectedTimestamp(input.expectedUpdatedAt);

  if (!expectedUpdatedAt) {
    return { status: 'invalid', reason: 'invalid_expected_updated_at' };
  }

  return {
    status: 'valid',
    input: {
      authUserId: input.authUserId,
      invitationId,
      expectedUpdatedAt,
    },
  };
}

/** Validates a stale-write timestamp while preserving its database format. */
function normalizeExpectedTimestamp(value: string) {
  const timestamp = value.trim();
  return timestamp && Number.isFinite(Date.parse(timestamp)) ? timestamp : null;
}

/** Loads the production store only when a database is configured. */
async function getDefaultInvitationMutationStore(): Promise<BubblophyProjectInvitationMutationStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyProjectInvitationMutationStore } =
    await import('@/lib/projects/invitations-database-write');

  return createDrizzleBubblophyProjectInvitationMutationStore();
}
