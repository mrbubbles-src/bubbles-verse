import {
  BUBBLOPHY_PROJECT_INVITATION_ACCEPT_PATH,
  buildBubblophyProjectInvitationEntryPath,
  isBubblophyProjectInvitationAcceptancePath,
  isBubblophyProjectInvitationToken,
} from '@/lib/projects/invitation-links';

import { describe, expect, it } from 'vitest';

const token = `bubblophy_invite_${'a'.repeat(43)}`;

describe('project invitation links', () => {
  it('accepts only the exact generated token shape', () => {
    expect(isBubblophyProjectInvitationToken(token)).toBe(true);
    expect(isBubblophyProjectInvitationToken('bubblophy_invite_short')).toBe(
      false
    );
    expect(
      isBubblophyProjectInvitationToken(`bubblophy_agent_${'a'.repeat(43)}`)
    ).toBe(false);
    expect(
      isBubblophyProjectInvitationToken(`bubblophy_invite_${'a'.repeat(42)}!`)
    ).toBe(false);
  });

  it('builds a public entry path without widening the auth bypass', () => {
    expect(buildBubblophyProjectInvitationEntryPath(token)).toBe(
      `/invite/${token}`
    );
    expect(
      isBubblophyProjectInvitationAcceptancePath(
        BUBBLOPHY_PROJECT_INVITATION_ACCEPT_PATH
      )
    ).toBe(true);
    expect(
      isBubblophyProjectInvitationAcceptancePath(
        `${BUBBLOPHY_PROJECT_INVITATION_ACCEPT_PATH}?token=${token}`
      )
    ).toBe(false);
    expect(
      isBubblophyProjectInvitationAcceptancePath('/invitations/accept/extra')
    ).toBe(false);
  });

  it('refuses to build entry paths for invalid tokens', () => {
    expect(() => buildBubblophyProjectInvitationEntryPath('invalid')).toThrow(
      'Invalid Bubblophy project invitation token.'
    );
  });
});
