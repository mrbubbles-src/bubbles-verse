import 'server-only';

import type { User } from '@supabase/supabase-js';

import {
  getBubblophyAllowedAuthEmails,
  isBubblophyAuthEmailAllowed,
  normalizeBubblophyAuthEmail,
} from '@/lib/auth/allowed-emails';
import {
  buildBubblophyLoginPath,
  buildBubblophyLogoutPath,
} from '@/lib/auth/redirects';
import { createBubblophyServerSupabaseClient } from '@/lib/supabase/server';

import { hasSupabaseAuthSessionCookie } from '@bubbles/supabase-access/auth';
import { cache } from 'react';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

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
 * Checks the temporary Bubblophy server-only email allowlist for a Supabase user.
 *
 * @param user Signed-in Supabase Auth user.
 * @returns Authorized Bubblophy session data or `null` when access is denied.
 */
export function getAllowedBubblophySessionForUser(
  user: User | null
): BubblophySession | null {
  const email = normalizeBubblophyAuthEmail(user?.email);

  if (
    !user ||
    !email ||
    !isBubblophyAuthEmailAllowed({
      email,
      allowlist: getBubblophyAllowedAuthEmails(),
    })
  ) {
    return null;
  }

  return {
    user,
    authUserId: user.id,
    email,
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
  const cookieStore = await cookies();

  if (!hasSupabaseAuthSessionCookie(cookieStore.getAll())) {
    return { status: 'anonymous' };
  }

  const supabase = await createBubblophyServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: 'anonymous' };
  }

  const session = getAllowedBubblophySessionForUser(user);

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

const getOptionalSession = cache(loadOptionalBubblophySession);

/**
 * Loads and authorizes the current human Bubblophy session.
 *
 * This is a temporary fail-closed gate until project membership and RLS replace
 * `BUBBLOPHY_ALLOWED_AUTH_EMAILS`. Agent tokens are intentionally not accepted.
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
