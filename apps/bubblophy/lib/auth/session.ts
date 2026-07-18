import 'server-only';

import type { User } from '@supabase/supabase-js';

import { getBubblophyDbAccessForUser } from '@/lib/auth/access';
import {
  buildBubblophyLoginPath,
  buildBubblophyLogoutPath,
} from '@/lib/auth/redirects';
import { BUBBLOPHY_PROJECT_INVITATION_ACCEPT_PATH } from '@/lib/projects/invitation-links';
import { createBubblophyServerSupabaseClient } from '@/lib/supabase/server';

import { cache } from 'react';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { hasSupabaseAuthSessionCookie } from '@bubbles/supabase-access/auth';

export type BubblophySession = {
  user: User;
  authUserId: string;
  email: string;
};

export type BubblophySessionResult =
  | {
      status: 'allowed';
      session: BubblophySession;
    }
  | {
      status: 'anonymous';
    }
  | {
      status: 'denied';
      user: User;
    };

/**
 * Checks the DB-backed Bubblophy access rules for a Supabase user.
 *
 * @param user Signed-in Supabase Auth user.
 * @returns Authorized Bubblophy session data or `null` when access is denied.
 */
export async function getAllowedBubblophySessionForUser(
  user: User | null
): Promise<BubblophySession | null> {
  const access = await getBubblophyDbAccessForUser(user);

  if (!user || !access) {
    return null;
  }

  return {
    user,
    authUserId: access.authUserId,
    email: access.email,
  };
}

/**
 * Type guard for denied Bubblophy session checks.
 *
 * @param result Optional session result from the current request.
 * @returns `true` when a signed-in user lacks Bubblophy access.
 */
export function isDeniedBubblophySessionResult(
  result: BubblophySessionResult
): result is Extract<BubblophySessionResult, { status: 'denied' }> {
  return result.status === 'denied';
}

/**
 * Resolves the current human Bubblophy session without redirecting.
 *
 * Use this on routes like `/login`, where the UI must avoid flashing the login
 * screen for already-authorized users while still rendering for anonymous ones.
 *
 * @returns Allowed, anonymous, or denied session state.
 */
async function loadOptionalBubblophySession(): Promise<BubblophySessionResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { status: 'anonymous' };
  }

  const session = await getAllowedBubblophySessionForUser(user);

  if (!session) {
    return {
      status: 'denied',
      user,
    };
  }

  return {
    status: 'allowed',
    session,
  };
}

/** Reads the current Supabase user without applying Bubblophy access rules. */
async function loadAuthenticatedBubblophyUser(): Promise<User | null> {
  const cookieStore = await cookies();

  if (!hasSupabaseAuthSessionCookie(cookieStore.getAll())) {
    return null;
  }

  const supabase = await createBubblophyServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

const getOptionalSession = cache(loadOptionalBubblophySession);
const getAuthenticatedUser = cache(loadAuthenticatedBubblophyUser);

/**
 * Loads and authorizes the current human Bubblophy session.
 *
 * This is the DB-backed human session gate. Agent tokens are intentionally not
 * accepted by browser routes.
 *
 * @param options.nextPath Protected path to return to after login.
 * @returns Authorized human Bubblophy session.
 */
async function loadBubblophySession({
  nextPath = '/',
}: {
  nextPath?: string;
} = {}): Promise<BubblophySession> {
  const sessionResult = await loadOptionalBubblophySession();

  if (sessionResult.status === 'anonymous') {
    redirect(buildBubblophyLoginPath(nextPath));
    throw new Error('Missing Bubblophy session.');
  }

  if (sessionResult.status === 'denied') {
    redirect(buildBubblophyLogoutPath('/login?error=access_denied'));
    throw new Error('Bubblophy access denied.');
  }

  return sessionResult.session;
}

const getBubblophySession = cache(loadBubblophySession);

/**
 * Requires an authorized human Bubblophy session for protected server routes.
 *
 * @param options.nextPath Protected path to return to after login.
 * @returns Authorized human Bubblophy session.
 */
export async function requireBubblophySession(options?: { nextPath?: string }) {
  return getBubblophySession(options);
}

/**
 * Returns the current Bubblophy session state without redirecting.
 *
 * @returns Allowed, anonymous, or denied session state for this request.
 */
export async function getOptionalBubblophySession() {
  return getOptionalSession();
}

/**
 * Requires a real Supabase user without requiring existing project access.
 *
 * This narrow gate exists for invitation acceptance only. Normal dashboard and
 * server-action routes must continue to call `requireBubblophySession()`.
 *
 * @returns Authenticated Supabase user, including verified session email.
 */
export async function requireAuthenticatedBubblophyUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect(buildBubblophyLoginPath(BUBBLOPHY_PROJECT_INVITATION_ACCEPT_PATH));
    throw new Error('Missing authenticated Bubblophy user.');
  }

  return user;
}
