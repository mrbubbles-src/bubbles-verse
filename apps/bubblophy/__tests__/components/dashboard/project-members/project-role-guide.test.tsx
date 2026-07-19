import {
  projectMemberRoleDescriptions,
  projectMemberRoleLabels,
} from '@/lib/projects/role-presentation';

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProjectRoleGuide } from '@/components/dashboard/project-members/project-role-guide';

describe('ProjectRoleGuide', () => {
  it.each(['owner', 'maintainer', 'member', 'viewer'] as const)(
    'shows the current %s role before expanding the comparison',
    (currentRole) => {
      render(<ProjectRoleGuide currentRole={currentRole} isArchived={false} />);

      expect(screen.getByText('Deine Rolle')).toBeInTheDocument();
      expect(
        screen.getByText(projectMemberRoleLabels[currentRole])
      ).toBeInTheDocument();
      expect(
        screen.getByText(projectMemberRoleDescriptions[currentRole])
      ).toBeInTheDocument();
    }
  );

  it('expands a compact comparison of all four roles', () => {
    render(<ProjectRoleGuide currentRole="member" isArchived={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Rollen vergleichen' }));

    const comparison = screen.getByText('Aktuell').closest('[class*="grid"]');

    if (!(comparison instanceof HTMLElement)) {
      throw new Error('Expected the expanded role comparison.');
    }

    for (const role of ['owner', 'maintainer', 'member', 'viewer'] as const) {
      expect(
        screen.getAllByText(projectMemberRoleLabels[role]).length
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText(projectMemberRoleDescriptions[role]).length
      ).toBeGreaterThan(0);
    }

    expect(within(comparison).getByText('Member')).toBeInTheDocument();
    expect(within(comparison).getByText('Aktuell')).toBeInTheDocument();
  });

  it('explains that archived projects are read-only', () => {
    render(<ProjectRoleGuide currentRole="owner" isArchived />);

    expect(screen.getByText('Archiviert')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Operative Daten sind nur lesbar; Owner und Maintainer können das Projekt wiederherstellen.'
      )
    ).toBeInTheDocument();
  });
});
