import 'server-only';

import type { BubblophyProjectRole } from '@/drizzle/db/schema';

import { normalizeBubblophyAuthEmail } from '@/lib/auth/access';
import { isBubblophyProjectInvitationToken } from '@/lib/projects/invitation-links';
import { hashBubblophyProjectInvitationToken } from '@/lib/projects/invitations';

export interface AcceptBubblophyProjectInvitationInput {
  authUserId: string;
  email: string | null | undefined;
  plaintextToken: string;
}

export interface BubblophyProjectInvitationAcceptStoreInput {
  authUserId: string;
  normalizedEmail: string;
  tokenHash: string;
  now: string;
}

export type BubblophyProjectInvitationAcceptStoreResult =
  | {
      status: 'accepted';
      projectKey: string;
      role: BubblophyProjectRole;
      membershipCreated: boolean;
    }
  | {
      status: 'already_accepted';
      projectKey: string;
      role: BubblophyProjectRole;
    }
  | {
      status:
        | 'archived_project'
        | 'conflict'
        | 'email_mismatch'
        | 'expired'
        | 'unavailable';
    };

export interface BubblophyProjectInvitationAcceptStore {
  acceptProjectInvitationWithMembership(
    input: BubblophyProjectInvitationAcceptStoreInput
  ): Promise<BubblophyProjectInvitationAcceptStoreResult>;
}

export type AcceptBubblophyProjectInvitationResult =
  | BubblophyProjectInvitationAcceptStoreResult
  | {
      status: 'invalid';
      reason: 'invalid_token' | 'missing_email';
    }
  | { status: 'database_unavailable' };

export interface AcceptBubblophyProjectInvitationOptions {
  store?: BubblophyProjectInvitationAcceptStore;
  now?: () => Date;
}

/**
 * Accepts one invitation for the matching authenticated Supabase identity.
 *
 * @param input Auth user ID, verified session email, and staged plaintext token.
 * @param options Optional transactional store and clock for tests.
 * @returns Membership result or a non-secret lifecycle status.
 */
export async function acceptBubblophyProjectInvitation(
  input: AcceptBubblophyProjectInvitationInput,
  options: AcceptBubblophyProjectInvitationOptions = {}
): Promise<AcceptBubblophyProjectInvitationResult> {
  if (!isBubblophyProjectInvitationToken(input.plaintextToken)) {
    return { status: 'invalid', reason: 'invalid_token' };
  }

  const normalizedEmail = normalizeBubblophyAuthEmail(input.email);

  if (!normalizedEmail) {
    return { status: 'invalid', reason: 'missing_email' };
  }

  const store = options.store ?? (await getDefaultInvitationAcceptStore());

  if (!store) {
    return { status: 'database_unavailable' };
  }

  return store.acceptProjectInvitationWithMembership({
    authUserId: input.authUserId,
    normalizedEmail,
    tokenHash: hashBubblophyProjectInvitationToken(input.plaintextToken),
    now: (options.now?.() ?? new Date()).toISOString(),
  });
}

/** Loads the server-only acceptance store when a database is configured. */
async function getDefaultInvitationAcceptStore(): Promise<BubblophyProjectInvitationAcceptStore | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { createDrizzleBubblophyProjectInvitationAcceptStore } =
    await import('@/lib/projects/accept-invitation-database-write');

  return createDrizzleBubblophyProjectInvitationAcceptStore();
}
