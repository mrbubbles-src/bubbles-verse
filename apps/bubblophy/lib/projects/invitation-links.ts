import 'server-only';

export const BUBBLOPHY_PROJECT_INVITATION_COOKIE =
  'bubblophy_project_invitation';
export const BUBBLOPHY_PROJECT_INVITATION_ACCEPT_PATH = '/invitations/accept';
export const BUBBLOPHY_PROJECT_INVITATION_COOKIE_PATH =
  BUBBLOPHY_PROJECT_INVITATION_ACCEPT_PATH;
export const BUBBLOPHY_PROJECT_INVITATION_COOKIE_MAX_AGE_SECONDS = 30 * 60;

const invitationTokenPattern = /^bubblophy_invite_[A-Za-z0-9_-]{43}$/;

/** Validates the exact high-entropy token format produced by Bubblophy. */
export function isBubblophyProjectInvitationToken(value: string) {
  return invitationTokenPattern.test(value);
}

/** Restricts the temporary auth-gate bypass to the exact acceptance page. */
export function isBubblophyProjectInvitationAcceptancePath(value: string) {
  return value === BUBBLOPHY_PROJECT_INVITATION_ACCEPT_PATH;
}

/** Builds the public entry path for one valid plaintext invitation token. */
export function buildBubblophyProjectInvitationEntryPath(token: string) {
  if (!isBubblophyProjectInvitationToken(token)) {
    throw new Error('Invalid Bubblophy project invitation token.');
  }

  return `/invite/${encodeURIComponent(token)}`;
}
