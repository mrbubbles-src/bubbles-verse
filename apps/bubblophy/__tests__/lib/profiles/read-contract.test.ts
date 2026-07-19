import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const dashboardReadSource = readFileSync(
  resolve(process.cwd(), 'lib/issues/database.ts'),
  'utf8'
);
const accessSource = readFileSync(
  resolve(process.cwd(), 'lib/auth/access.ts'),
  'utf8'
);
const invitationAcceptanceSource = readFileSync(
  resolve(process.cwd(), 'lib/projects/accept-invitation.ts'),
  'utf8'
);

describe('Bubblophy profile read contract', () => {
  it('rechecks actor membership in the same statement as profile reads', () => {
    expect(dashboardReadSource).toContain(
      "alias(\n    bubblophyProjectMembers,\n    'bubblophy_actor_memberships'"
    );
    expect(dashboardReadSource).toMatch(
      /\.innerJoin\(\s*actorMemberships,[\s\S]*?actorMemberships\.authUserId,\s*authUserId[\s\S]*?\.leftJoin\(\s*bubblophyUserProfiles/
    );
  });

  it('limits profile e-mail to managers and the current user', () => {
    expect(dashboardReadSource).toContain(
      "when ${actorMemberships.role} in ('owner', 'maintainer')"
    );
    expect(dashboardReadSource).toContain(
      'or ${bubblophyProjectMembers.authUserId} = ${authUserId}'
    );
  });

  it('does not use profiles for access or invitation acceptance', () => {
    expect(accessSource).not.toContain('bubblophyUserProfiles');
    expect(invitationAcceptanceSource).not.toContain('bubblophyUserProfiles');
  });
});
