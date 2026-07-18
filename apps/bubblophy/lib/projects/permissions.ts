import type { ProjectMemberRole } from '@/lib/dashboard/types';

const bubblophyContributorRoles: ProjectMemberRole[] = [
  'owner',
  'maintainer',
  'member',
];

/**
 * Checks whether a project role may change issue and run workflow data.
 *
 * @param role Current project membership role, or an empty missing value.
 * @returns `true` for contributors and `false` for read-only viewers.
 */
export function canContributeToBubblophyProject(
  role: ProjectMemberRole | '' | null | undefined
): role is Exclude<ProjectMemberRole, 'viewer'> {
  return role ? bubblophyContributorRoles.includes(role) : false;
}
