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

/**
 * Checks whether a project role may manage settings, people, and tokens.
 *
 * @param role Current project membership role, or an empty missing value.
 * @returns `true` for owner and maintainer roles only.
 */
export function canManageBubblophyProject(
  role: ProjectMemberRole | '' | null | undefined
): role is Extract<ProjectMemberRole, 'owner' | 'maintainer'> {
  return role === 'owner' || role === 'maintainer';
}
