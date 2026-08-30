import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const memberPageReadSource = readFileSync(
  resolve(process.cwd(), 'lib/dashboard/members-database-read.ts'),
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
    expect(memberPageReadSource).toContain(
      "alias(\n    bubblophyProjectMembers,\n    'bubblophy_member_page_actor_memberships'"
    );
    expect(memberPageReadSource).toMatch(
      /\.innerJoin\(\s*actorMemberships,[\s\S]*?actorMemberships\.authUserId,\s*input\.authUserId[\s\S]*?\.leftJoin\(\s*bubblophyUserProfiles/
    );
  });

  it('limits profile e-mail to managers and the current user', () => {
    expect(memberPageReadSource).toContain(
      "when ${actorMemberships.role} in ('owner', 'maintainer')"
    );
    expect(memberPageReadSource).toContain(
      'or ${bubblophyProjectMembers.authUserId} = ${input.authUserId}'
    );
  });

  it('does not use profiles for access or invitation acceptance', () => {
    expect(accessSource).not.toContain('bubblophyUserProfiles');
    expect(invitationAcceptanceSource).not.toContain('bubblophyUserProfiles');
  });
});
