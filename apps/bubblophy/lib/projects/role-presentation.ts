import type { ProjectMemberRole } from '@/lib/dashboard/types';

export const projectMemberRoleLabels = {
  owner: 'Owner',
  maintainer: 'Maintainer',
  member: 'Member',
  viewer: 'Viewer',
} satisfies Record<ProjectMemberRole, string>;

export const projectMemberRoleDescriptions = {
  owner:
    'Verwaltet Projekt, Team, Einladungen und Tokens und arbeitet an Issues und Runs.',
  maintainer:
    'Verwaltet Projekt, Team, Einladungen und Tokens und arbeitet an Issues und Runs; Owner bleiben geschützt.',
  member:
    'Bearbeitet Issues, Pläne, Notizen und Zuweisungen und trifft Run-Entscheidungen.',
  viewer:
    'Liest Projekt, Team, Issues, Runs und öffentliche Token-Metadaten, ohne Änderungen vorzunehmen.',
} satisfies Record<ProjectMemberRole, string>;
