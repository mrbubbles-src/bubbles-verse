import type {
  AddBubblophyProjectMemberActionInput,
  AddBubblophyProjectMemberActionResult,
  CreateBubblophyAgentTokenActionInput,
  CreateBubblophyAgentTokenActionResult,
  CreateBubblophyIssueActionInput,
  CreateBubblophyIssueActionResult,
  CreateBubblophyIssueNoteActionInput,
  CreateBubblophyIssueNoteActionResult,
  CreateBubblophyIssuePlanActionInput,
  CreateBubblophyIssuePlanActionResult,
  CreateBubblophyProjectActionInput,
  CreateBubblophyProjectActionResult,
  RemoveBubblophyProjectMemberActionInput,
  RemoveBubblophyProjectMemberActionResult,
  RequestBubblophyAgentRunActionInput,
  RequestBubblophyAgentRunActionResult,
  TransitionBubblophyAgentRunActionInput,
  TransitionBubblophyAgentRunActionResult,
  TransitionBubblophyProjectArchiveActionInput,
  TransitionBubblophyProjectArchiveActionResult,
  UpdateBubblophyAgentTokenLifecycleActionInput,
  UpdateBubblophyAgentTokenLifecycleActionResult,
  UpdateBubblophyIssueAssigneeActionInput,
  UpdateBubblophyIssueAssigneeActionResult,
  UpdateBubblophyIssueContentActionInput,
  UpdateBubblophyIssueContentActionResult,
  UpdateBubblophyIssuePriorityActionInput,
  UpdateBubblophyIssuePriorityActionResult,
  UpdateBubblophyIssueStatusActionInput,
  UpdateBubblophyIssueStatusActionResult,
  UpdateBubblophyProjectContentActionInput,
  UpdateBubblophyProjectContentActionResult,
  UpdateBubblophyProjectMemberRoleActionInput,
  UpdateBubblophyProjectMemberRoleActionResult,
} from '@/app/actions';
import type { DashboardSnapshot } from '@/lib/dashboard/types';
import type React from 'react';

import { dashboardSnapshot } from '@/lib/dashboard/sample-data';
import { bubblophySidebarData } from '@/lib/sidebar';

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BubblophyDashboard } from '@/components/dashboard/bubblophy-dashboard';

const navigationMocks = {
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
  routerRefresh: vi.fn(),
  searchParams: vi.fn(() => new URLSearchParams()),
};

function getBubblophySidebarSectionIds() {
  return bubblophySidebarData.sections
    .flatMap((section) => section.items)
    .flatMap((item) => [item.navigateHref, item.href])
    .filter((href): href is string => Boolean(href?.startsWith('/#')))
    .map((href) => href.slice(2));
}

const databaseSnapshot = {
  ...dashboardSnapshot,
  projects: dashboardSnapshot.projects.map((project) => ({
    ...project,
    currentUserRole: 'owner' as const,
  })),
  meta: {
    dataSource: 'database',
    label: 'Datenbankdaten',
    description: 'Read-only Testdaten.',
  },
} satisfies DashboardSnapshot;

const databaseSnapshotWithManageableMembers = {
  ...databaseSnapshot,
  projects: databaseSnapshot.projects.map((project) =>
    project.key === 'BV'
      ? {
          ...project,
          currentUserRole: 'owner',
        }
      : project
  ),
  projectMembers: [
    {
      id: 'BV:user_owner',
      projectKey: 'BV',
      authUserId: 'user_owner',
      label: 'user_owner',
      role: 'owner',
      createdAt: '2026-06-13T10:00:00.000Z',
    },
    {
      id: 'BV:user_martin',
      projectKey: 'BV',
      authUserId: 'user_martin',
      label: 'user_martin',
      role: 'member',
      createdAt: '2026-06-13T11:00:00.000Z',
    },
    {
      id: 'BV:user_viewer',
      projectKey: 'BV',
      authUserId: 'user_viewer',
      label: 'user_viewer',
      role: 'viewer',
      createdAt: '2026-06-13T12:00:00.000Z',
    },
  ],
} satisfies DashboardSnapshot;

const databaseSnapshotWithViewerAccess = {
  ...databaseSnapshot,
  projects: databaseSnapshot.projects.map((project) => ({
    ...project,
    currentUserRole: 'viewer',
  })),
} satisfies DashboardSnapshot;

const databaseSnapshotWithIssueDescription = {
  ...databaseSnapshot,
  issues: databaseSnapshot.issues.map((issue, index) =>
    index === 0
      ? {
          ...issue,
          description: 'Beschreibung aus dem Dashboard-Snapshot.',
        }
      : issue
  ),
} satisfies DashboardSnapshot;

const databaseSnapshotWithReloadedPlan = {
  ...databaseSnapshot,
  issues: databaseSnapshot.issues.map((issue) =>
    issue.id === 'BV-12'
      ? {
          ...issue,
          planSteps: 2,
          latestPlan: {
            version: 4,
            summary: 'Reload zeigt den gespeicherten Plan.',
            steps: [
              { id: 'step_1', text: 'Persistierten Plan lesen' },
              { id: 'step_2', text: 'Detailpanel verifizieren' },
            ],
          },
        }
      : issue
  ),
} satisfies DashboardSnapshot;

const databaseSnapshotWithIssueNote = {
  ...databaseSnapshot,
  issues: databaseSnapshot.issues.map((issue) =>
    issue.id === 'BV-12'
      ? {
          ...issue,
          notes: [
            {
              id: 'event_note_existing',
              note: 'Bestehende Review-Notiz aus dem Reload.',
              actor: 'Mensch',
              createdAt: '2026-06-14T09:00:00.000Z',
            },
          ],
        }
      : issue
  ),
} satisfies DashboardSnapshot;

const databaseSnapshotWithIssueNoteActivity = {
  ...databaseSnapshotWithIssueNote,
  activity: [
    {
      id: 'event_issue_note',
      label: 'Plan-Review als Issue-Notiz festgehalten.',
      actor: 'Mensch',
      occurredAt: '2026-06-14T10:00:00.000Z',
      projectKey: 'BV',
      issueId: 'BV-12',
    },
    ...databaseSnapshot.activity,
  ],
} satisfies DashboardSnapshot;

const databaseSnapshotWithDoneIssue = {
  ...databaseSnapshot,
  issues: databaseSnapshot.issues.map((issue) =>
    issue.id === 'BV-12'
      ? {
          ...issue,
          status: 'erledigt',
        }
      : issue
  ),
} satisfies DashboardSnapshot;

const emptyDatabaseSnapshot = {
  ...databaseSnapshot,
  meta: {
    dataSource: 'empty_database',
    label: 'Leere Datenbank',
    description:
      'Datenbank erreichbar, aber für diesen User gibt es noch keine Projekte.',
  },
  projects: [],
  issues: [],
  projectMembers: [],
  agentTokens: [],
  agentRuns: [],
  activity: [],
} satisfies DashboardSnapshot;

const databaseUnavailableSnapshot = {
  ...emptyDatabaseSnapshot,
  meta: {
    dataSource: 'database_unavailable',
    label: 'Datenbank nicht bereit',
    description:
      'Bubblophy kann die Datenbank oder Tabellen gerade nicht lesen.',
    reason: 'schema_missing',
    hint: 'Die Bubblophy-Tabellen scheinen zu fehlen. Prüfe die lokale Strukturmigration.',
  },
} satisfies DashboardSnapshot;

const databaseSnapshotWithEmptyRuns = {
  ...databaseSnapshot,
  agentRuns: [],
} satisfies DashboardSnapshot;

const databaseSnapshotWithoutAgentTokens = {
  ...databaseSnapshotWithEmptyRuns,
  agentTokens: [],
} satisfies DashboardSnapshot;

const databaseSnapshotWithRunUpdateToken = {
  ...databaseSnapshot,
  agentTokens: [
    {
      id: 'token_runner',
      label: 'Codex Runner',
      projectKey: 'BV',
      scopes: ['runs:update'],
      state: 'aktiv',
      lastUsedAt: 'noch nie verwendet',
      expiresAt: 'läuft nicht automatisch ab',
    },
  ],
} satisfies DashboardSnapshot;

const databaseSnapshotWithApprovedRunUpdateToken = {
  ...databaseSnapshotWithRunUpdateToken,
  agentRuns: databaseSnapshot.agentRuns.map((run) =>
    run.id === 'run_bv_14'
      ? {
          ...run,
          state: 'freigegeben',
          lastEvent: 'Run BV-14 wurde menschlich freigegeben.',
        }
      : run
  ),
} satisfies DashboardSnapshot;

const databaseSnapshotWithReviewRun = {
  ...databaseSnapshotWithRunUpdateToken,
  agentRuns: databaseSnapshot.agentRuns.map((run) =>
    run.id === 'run_bv_14'
      ? {
          ...run,
          state: 'review',
          lastEvent: 'Agent hat Review für BV-14 angefordert.',
          resultSummary: 'Diff ist bereit für menschliche Prüfung.',
        }
      : run
  ),
} satisfies DashboardSnapshot;

const databaseSnapshotWithFailedRunResult = {
  ...databaseSnapshotWithRunUpdateToken,
  agentRuns: databaseSnapshot.agentRuns.map((run) =>
    run.id === 'run_bv_14'
      ? {
          ...run,
          state: 'fehlgeschlagen',
          lastEvent: 'Agent-Run für BV-14 ist fehlgeschlagen.',
          resultSummary: 'Checkout konnte nicht vorbereitet werden.',
        }
      : run
  ),
} satisfies DashboardSnapshot;

const databaseSnapshotWithUnresolvedRun = {
  ...databaseSnapshotWithRunUpdateToken,
  agentRuns: [
    {
      id: 'run_missing_issue',
      issueId: 'BV-404',
      agentLabel: 'codex-local-lio',
      state: 'review',
      requestedBy: 'Mensch',
      lastEvent: 'Run verweist auf ein nicht geladenes Issue.',
    },
  ],
} satisfies DashboardSnapshot;

const databaseSnapshotWithIssueReadToken = {
  ...databaseSnapshot,
  agentTokens: [
    {
      id: 'token_reader',
      label: 'Claude Reader',
      projectKey: 'BV',
      scopes: ['issues:read'],
      state: 'aktiv',
      lastUsedAt: 'noch nie verwendet',
      expiresAt: 'läuft nicht automatisch ab',
    },
  ],
} satisfies DashboardSnapshot;

const databaseSnapshotWithUnresolvedIssueReadToken = {
  ...databaseSnapshot,
  agentTokens: [
    {
      id: 'token_unknown_project',
      label: 'Reader ohne Projektauflösung',
      projectKey: 'ZZ',
      scopes: ['issues:read'],
      state: 'aktiv',
      lastUsedAt: 'noch nie verwendet',
      expiresAt: 'läuft nicht automatisch ab',
    },
  ],
} satisfies DashboardSnapshot;

const databaseSnapshotWithWriteOnlyToken = {
  ...databaseSnapshot,
  agentTokens: [
    {
      id: 'token_writer',
      label: 'Writer ohne Handoff',
      projectKey: 'BV',
      scopes: ['issues:write'],
      state: 'aktiv',
      lastUsedAt: 'noch nie verwendet',
      expiresAt: 'läuft nicht automatisch ab',
    },
  ],
} satisfies DashboardSnapshot;

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: navigationMocks.routerPush,
    replace: navigationMocks.routerReplace,
    refresh: navigationMocks.routerRefresh,
  }),
  useSearchParams: () => navigationMocks.searchParams(),
}));

vi.mock('@bubbles/ui/shadcn/badge', () => ({
  Badge: ({
    children,
    className,
  }: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) => (
    <span className={className}>{children}</span>
  ),
}));

vi.mock('@bubbles/ui/shadcn/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    size?: string;
    variant?: string;
  }) => <button {...props}>{children}</button>,
}));

vi.mock('@bubbles/ui/shadcn/card', () => ({
  Card: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { size?: string }) => (
    <section {...props}>{children}</section>
  ),
  CardAction: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} />
  ),
  CardContent: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} />
  ),
  CardDescription: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} />
  ),
  CardHeader: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} />
  ),
  CardTitle: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props} />
  ),
}));

vi.mock('@bubbles/ui/shadcn/dialog', () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (open ? <>{children}</> : null),
  DialogContent: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div role="dialog" {...props} />
  ),
  DialogDescription: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} />
  ),
  DialogFooter: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <footer {...props} />
  ),
  DialogHeader: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} />
  ),
  DialogTitle: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props} />
  ),
}));

vi.mock('@bubbles/ui/shadcn/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock('@bubbles/ui/shadcn/table', () => ({
  Table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <table {...props} />
  ),
  TableBody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody {...props} />
  ),
  TableCell: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td {...props} />
  ),
  TableHead: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th {...props} />
  ),
  TableHeader: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead {...props} />
  ),
  TableRow: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr {...props} />
  ),
}));

vi.mock('@bubbles/ui/shadcn/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
}));

function getMetricSection(label: string) {
  const heading = screen.getByRole('heading', { name: label });
  const section = heading.closest('section');

  expect(section).toBeInstanceOf(HTMLElement);

  if (!section) {
    throw new Error(`Expected metric section for ${label}.`);
  }

  return section;
}

function getMetricValue(label: string) {
  return within(getMetricSection(label)).getByText(/\d+%?$/);
}

function getMetricCaption(label: string) {
  return within(getMetricSection(label)).getByText(/bereit|lokal|Blocker/i);
}

describe('BubblophyDashboard interactions', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn(async () => undefined),
      },
    });
    navigationMocks.routerPush.mockClear();
    navigationMocks.routerReplace.mockClear();
    navigationMocks.routerRefresh.mockClear();
    navigationMocks.searchParams.mockReset();
    navigationMocks.searchParams.mockReturnValue(new URLSearchParams());
  });

  it('keeps viewer issue and run controls read-only', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithViewerAccess}
        createIssueAction={async () => ({
          status: 'invalid',
          reason: 'empty_title',
        })}
        createIssuePlanAction={async () => ({
          status: 'invalid',
          reason: 'empty_issue',
        })}
        updateIssueContentAction={async () => ({ status: 'forbidden' })}
        updateIssueStatusAction={async () => ({ status: 'forbidden' })}
        requestAgentRunAction={async () => ({ status: 'forbidden' })}
        transitionAgentRunAction={async () => ({ status: 'forbidden' })}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).queryByRole('button', { name: 'Bearbeiten' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: 'Status speichern' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: 'Run anfragen' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Freigeben' })
    ).not.toBeInTheDocument();
  });

  it('filters the issue queue when a project is selected', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    const novariProjectButton = within(projectsSection).getByRole('button', {
      name: 'Projekt Novari (NO) auswählen',
    });

    fireEvent.click(novariProjectButton);

    expect(screen.getByText('Gefiltert auf Projekt NO.')).toBeInTheDocument();
    expect(navigationMocks.routerPush).toHaveBeenCalledWith(
      '/?project=NO&issue=NO-08'
    );
    expect(novariProjectButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('NO-08');
    expect(
      screen.getByRole('button', {
        name: 'Novari-Projekte für externe Mitarbeit freigeben',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Agent-Zugriff mit projektbezogenen Tokens',
      })
    ).not.toBeInTheDocument();
  });

  it('restores project and issue selection from query parameters', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=NO&issue=NO-08')
    );

    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    expect(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Novari (NO) auswählen',
      })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Gefiltert auf Projekt NO.')).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('NO-08');
    expect(screen.getAllByText('claude-code-martin').length).toBeGreaterThan(0);
    expect(screen.queryByText('codex-local-lio')).not.toBeInTheDocument();
    expect(screen.getAllByText('NO-08').length).toBeGreaterThan(0);
    expect(screen.queryByText('BV-14')).not.toBeInTheDocument();
    expect(navigationMocks.routerReplace).not.toHaveBeenCalled();
    expect(
      screen.getByText('Novari-Run in Review verschoben')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Plan für BV-12 aktualisiert')
    ).not.toBeInTheDocument();
  });

  it('normalizes invalid deep-link selection to the rendered fallback issue', async () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=NO-08')
    );

    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    expect(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Gefiltert auf Projekt BV.')).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');
    expect(screen.queryByText('NO-08')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(navigationMocks.routerReplace).toHaveBeenCalledWith(
        '/?project=BV&issue=BV-14'
      );
    });
    expect(navigationMocks.routerPush).not.toHaveBeenCalled();
  });

  it('falls back from unknown selection params while preserving other query params', async () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=ZZ&issue=ZZ-99&tab=runs')
    );

    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    expect(
      within(projectsSection).getByRole('button', {
        name: 'Alle Projekte auswählen, 29% bereit',
      })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');

    await waitFor(() => {
      expect(navigationMocks.routerReplace).toHaveBeenCalledWith(
        '/?issue=BV-14&tab=runs'
      );
    });
    expect(navigationMocks.routerPush).not.toHaveBeenCalled();
  });

  it('keeps the default first visit URL untouched', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');
    expect(navigationMocks.routerReplace).not.toHaveBeenCalled();
    expect(navigationMocks.routerPush).not.toHaveBeenCalled();
  });

  it('filters projects from the keyboard and restores all projects', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    const yoinkProjectButton = within(projectsSection).getByRole('button', {
      name: 'Projekt Yoink (YK) auswählen',
    });

    fireEvent.keyDown(yoinkProjectButton, { key: 'Enter' });

    expect(yoinkProjectButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Gefiltert auf Projekt YK.')).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('YK-03');
    expect(
      screen.queryByRole('button', {
        name: 'Agent-Zugriff mit projektbezogenen Tokens',
      })
    ).not.toBeInTheDocument();

    const allProjectsButton = within(projectsSection).getByRole('button', {
      name: 'Alle Projekte auswählen, 29% bereit',
    });

    fireEvent.keyDown(allProjectsButton, { key: ' ' });

    expect(allProjectsButton).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByText(
        'Alle Projekte, priorisiert nach Freigabe, Planstand und Blockern.'
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');
  });

  it('shows issue details when an issue is clicked', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const issueButton = screen.getByRole('button', {
      name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
    });

    fireEvent.click(issueButton);

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(issueButton).toHaveAttribute('aria-pressed', 'true');
    expect(within(detailPanel).getByText('BV-12')).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Projekt BV · Owner mrbubbles')
    ).toBeInTheDocument();
    expect(navigationMocks.routerPush).toHaveBeenCalledWith('/?issue=BV-12');
  });

  it('selects an issue when its table row is clicked', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const issueButton = screen.getByRole('button', {
      name: 'Novari-Projekte für externe Mitarbeit freigeben',
    });
    const issueRow = issueButton.closest('tr');

    expect(issueRow).toBeInstanceOf(HTMLTableRowElement);

    if (!(issueRow instanceof HTMLTableRowElement)) {
      throw new Error('Expected issue row to render.');
    }

    fireEvent.click(issueRow);

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(issueRow).toHaveAttribute('aria-selected', 'true');
    expect(within(detailPanel).getByText('NO-08')).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Projekt NO · Owner Martin')
    ).toBeInTheDocument();
  });

  it('selects an issue from the keyboard-focused table row', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const issueButton = screen.getByRole('button', {
      name: 'Novari-Projekte für externe Mitarbeit freigeben',
    });
    const issueRow = issueButton.closest('tr');

    expect(issueRow).toBeInstanceOf(HTMLTableRowElement);

    if (!(issueRow instanceof HTMLTableRowElement)) {
      throw new Error('Expected issue row to render.');
    }

    expect(
      screen.getByRole('row', {
        name: 'Issue NO-08: Novari-Projekte für externe Mitarbeit freigeben auswählen',
      })
    ).toBe(issueRow);

    fireEvent.keyDown(issueRow, { key: 'Enter' });

    expect(issueRow).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('NO-08');

    const firstIssueRow = screen.getByRole('row', {
      name: 'Issue BV-14: Agent-Zugriff mit projektbezogenen Tokens auswählen',
    });

    fireEvent.keyDown(firstIssueRow, { key: ' ' });

    expect(firstIssueRow).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');
  });

  it('does not expose fake plan persistence for sample snapshots', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).queryByRole('button', { name: /Plan entwerfen/i })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).getByText(/Sample-Daten enthalten aktuell/i)
    ).toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: 'Status speichern' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: 'Bearbeiten' })
    ).not.toBeInTheDocument();
  });

  it('persists human issue edits and keeps the selected issue stable', async () => {
    const updateIssueContentAction = vi.fn<
      (
        input: UpdateBubblophyIssueContentActionInput
      ) => Promise<UpdateBubblophyIssueContentActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Plan-Notiz persistent nachschärfen',
        description: 'Beschreibung wurde über die Server-Action gespeichert.',
        projectKey: 'BV',
        status: 'geplant',
        priority: 'hoch',
        owner: 'mrbubbles',
        planSteps: 3,
        approvalRequired: true,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueContentAction={updateIssueContentAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Bearbeiten' })
    );
    fireEvent.change(within(detailPanel).getByLabelText('Titel'), {
      target: { value: 'Plan-Notiz persistent nachschärfen' },
    });
    fireEvent.change(within(detailPanel).getByLabelText('Beschreibung'), {
      target: {
        value: 'Beschreibung wurde über die Server-Action gespeichert.',
      },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Speichern' })
    );

    await waitFor(() => {
      expect(updateIssueContentAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        title: 'Plan-Notiz persistent nachschärfen',
        description: 'Beschreibung wurde über die Server-Action gespeichert.',
      });
    });
    expect(updateIssueContentAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(
        within(detailPanel).getByText('Plan-Notiz persistent nachschärfen')
      ).toBeInTheDocument();
    });
    expect(
      within(detailPanel).getByText(
        'Beschreibung wurde über die Server-Action gespeichert.'
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-12');
    expect(
      screen.getByRole('button', { name: 'Plan-Notiz persistent nachschärfen' })
    ).toBeInTheDocument();
  });

  it('cancels human issue edits without calling the server action', () => {
    const updateIssueContentAction =
      vi.fn<
        (
          input: UpdateBubblophyIssueContentActionInput
        ) => Promise<UpdateBubblophyIssueContentActionResult>
      >();

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithIssueDescription}
        updateIssueContentAction={updateIssueContentAction}
      />
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Bearbeiten' })
    );
    fireEvent.change(within(detailPanel).getByLabelText('Titel'), {
      target: { value: 'Nicht speichern' },
    });
    fireEvent.change(within(detailPanel).getByLabelText('Beschreibung'), {
      target: { value: 'Wird verworfen.' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Abbrechen' })
    );

    expect(updateIssueContentAction).not.toHaveBeenCalled();
    expect(
      within(detailPanel).queryByText('Nicht speichern')
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Beschreibung aus dem Dashboard-Snapshot.')
    ).toBeInTheDocument();
  });

  it('shows forbidden issue edit errors without discarding the edit state', async () => {
    const updateIssueContentAction = vi.fn<
      (
        input: UpdateBubblophyIssueContentActionInput
      ) => Promise<UpdateBubblophyIssueContentActionResult>
    >(async () => ({
      status: 'forbidden',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueContentAction={updateIssueContentAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Bearbeiten' })
    );
    fireEvent.change(within(detailPanel).getByLabelText('Titel'), {
      target: { value: 'Nicht erlaubt' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Speichern' })
    );

    await waitFor(() => {
      expect(updateIssueContentAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        title: 'Nicht erlaubt',
        description: '',
      });
    });
    expect(await within(detailPanel).findByRole('alert')).toHaveTextContent(
      'Du darfst dieses Issue nicht bearbeiten'
    );
    expect(within(detailPanel).getByLabelText('Titel')).toHaveValue(
      'Nicht erlaubt'
    );
  });

  it('shows issue edit action exceptions without discarding the edit state', async () => {
    const updateIssueContentAction = vi.fn<
      (
        input: UpdateBubblophyIssueContentActionInput
      ) => Promise<UpdateBubblophyIssueContentActionResult>
    >(async () => {
      throw new Error('server action failed');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueContentAction={updateIssueContentAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Bearbeiten' })
    );
    fireEvent.change(within(detailPanel).getByLabelText('Titel'), {
      target: { value: 'Nicht gespeichert' },
    });
    fireEvent.change(within(detailPanel).getByLabelText('Beschreibung'), {
      target: { value: 'Dieser Entwurf bleibt im Formular.' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Speichern' })
    );

    await waitFor(() => {
      expect(updateIssueContentAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        title: 'Nicht gespeichert',
        description: 'Dieser Entwurf bleibt im Formular.',
      });
    });
    expect(await within(detailPanel).findByRole('alert')).toHaveTextContent(
      'Die Änderung konnte gerade nicht gespeichert werden'
    );
    expect(within(detailPanel).getByLabelText('Titel')).toHaveValue(
      'Nicht gespeichert'
    );
    expect(within(detailPanel).getByLabelText('Beschreibung')).toHaveValue(
      'Dieser Entwurf bleibt im Formular.'
    );
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-12');
  });

  it('persists a human issue status transition and resets the target state', async () => {
    const updateIssueStatusAction = vi.fn<
      (
        input: UpdateBubblophyIssueStatusActionInput
      ) => Promise<UpdateBubblophyIssueStatusActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
        projectKey: 'BV',
        status: 'bereit',
        priority: 'hoch',
        owner: 'mrbubbles',
        planSteps: 3,
        approvalRequired: true,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueStatusAction={updateIssueStatusAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const statusSelect = within(detailPanel).getByLabelText('Neuer Status');

    expect(statusSelect).toBeInstanceOf(HTMLSelectElement);

    if (!(statusSelect instanceof HTMLSelectElement)) {
      throw new Error('Expected the status select to render.');
    }

    fireEvent.change(statusSelect, {
      target: { value: 'bereit' },
    });
    fireEvent.change(within(detailPanel).getByLabelText('Grund'), {
      target: { value: 'Plan ist bereit zur Prüfung.' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Status speichern' })
    );

    await waitFor(() => {
      expect(updateIssueStatusAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        expectedStatus: 'geplant',
        status: 'bereit',
        reason: 'Plan ist bereit zur Prüfung.',
      });
    });
    expect(updateIssueStatusAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(within(detailPanel).getByText('Bereit')).toBeInTheDocument();
    });

    const resetStatusSelect =
      within(detailPanel).getByLabelText('Neuer Status');

    expect(resetStatusSelect).toBeInstanceOf(HTMLSelectElement);

    if (!(resetStatusSelect instanceof HTMLSelectElement)) {
      throw new Error('Expected the reset status select to render.');
    }

    expect(resetStatusSelect.value).not.toBe('bereit');
    expect(getMetricValue('Offene Issues')).toHaveTextContent('24');
    expect(getMetricValue('Readiness')).toHaveTextContent('33%');
    expect(getMetricCaption('Offene Issues')).toHaveTextContent(
      '8 bereit für Freigabe'
    );
    expect(
      screen.getByRole('progressbar', { name: '5 bereit, 12 offen' })
    ).toBeInTheDocument();
  });

  it('shows a stale-write conflict without changing local issue status', async () => {
    const updateIssueStatusAction = vi.fn<
      (
        input: UpdateBubblophyIssueStatusActionInput
      ) => Promise<UpdateBubblophyIssueStatusActionResult>
    >(async () => ({ status: 'conflict' }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueStatusAction={updateIssueStatusAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    fireEvent.change(within(detailPanel).getByLabelText('Neuer Status'), {
      target: { value: 'bereit' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Status speichern' })
    );

    expect(await within(detailPanel).findByRole('alert')).toHaveTextContent(
      'zwischenzeitlich geändert'
    );
    expect(within(detailPanel).getByText('Geplant')).toBeInTheDocument();
  });

  it('does not expose unsupported issue archive or delete controls', () => {
    const updateIssueStatusAction = vi.fn<
      (
        input: UpdateBubblophyIssueStatusActionInput
      ) => Promise<UpdateBubblophyIssueStatusActionResult>
    >(async () => ({ status: 'unchanged' }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueStatusAction={updateIssueStatusAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).getByLabelText('Neuer Status')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByRole('button', { name: 'Status speichern' })
    ).toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: /archivieren/i })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', {
        name: /löschen|entfernen/i,
      })
    ).not.toBeInTheDocument();
  });

  it('persists a human issue priority update and keeps list and detail state consistent', async () => {
    const updateIssuePriorityAction = vi.fn<
      (
        input: UpdateBubblophyIssuePriorityActionInput
      ) => Promise<UpdateBubblophyIssuePriorityActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
        projectKey: 'BV',
        status: 'geplant',
        priority: 'mittel',
        owner: 'mrbubbles',
        planSteps: 3,
        approvalRequired: true,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssuePriorityAction={updateIssuePriorityAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const prioritySelect = within(detailPanel).getByLabelText('Neue Priorität');

    expect(prioritySelect).toBeInstanceOf(HTMLSelectElement);

    if (!(prioritySelect instanceof HTMLSelectElement)) {
      throw new Error('Expected the priority select to render.');
    }

    fireEvent.change(prioritySelect, {
      target: { value: 'mittel' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Priorität speichern' })
    );

    await waitFor(() => {
      expect(updateIssuePriorityAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        priority: 'mittel',
      });
    });
    expect(updateIssuePriorityAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    expect(
      await within(detailPanel).findByText('Priorität gespeichert.')
    ).toBeInTheDocument();
    expect(within(detailPanel).getByText('Mittel')).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('row', {
          name: 'Issue BV-12: Issue-Plan als strukturierte Arbeitsnotiz speichern auswählen',
        })
      ).getByText('Mittel')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-12');
  });

  it('shows priority action exceptions without changing the selected issue', async () => {
    const updateIssuePriorityAction = vi.fn<
      (
        input: UpdateBubblophyIssuePriorityActionInput
      ) => Promise<UpdateBubblophyIssuePriorityActionResult>
    >(async () => {
      throw new Error('server action failed');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssuePriorityAction={updateIssuePriorityAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.change(within(detailPanel).getByLabelText('Neue Priorität'), {
      target: { value: 'hoch' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Priorität speichern' })
    );

    expect(await within(detailPanel).findByRole('alert')).toHaveTextContent(
      'Die Priorität konnte gerade nicht gespeichert werden'
    );
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-12');
  });

  it('assigns an issue to a project member and keeps list and detail state consistent', async () => {
    const updateIssueAssigneeAction = vi.fn<
      (
        input: UpdateBubblophyIssueAssigneeActionInput
      ) => Promise<UpdateBubblophyIssueAssigneeActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
        projectKey: 'BV',
        status: 'geplant',
        priority: 'hoch',
        owner: 'user_martin',
        planSteps: 3,
        approvalRequired: true,
      },
    }));
    const requestAgentRunAction =
      vi.fn<
        (
          input: RequestBubblophyAgentRunActionInput
        ) => Promise<RequestBubblophyAgentRunActionResult>
      >();

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        updateIssueAssigneeAction={updateIssueAssigneeAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const assigneeSelect = within(detailPanel).getByLabelText('Zuständig');

    fireEvent.change(assigneeSelect, {
      target: { value: 'user_martin' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Zuweisung speichern' })
    );

    await waitFor(() => {
      expect(updateIssueAssigneeAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        assigneeAuthUserId: 'user_martin',
      });
    });
    expect(updateIssueAssigneeAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    expect(
      await within(detailPanel).findByText('Zuweisung gespeichert.')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText(/Owner user_martin/i)
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('row', {
          name: 'Issue BV-12: Issue-Plan als strukturierte Arbeitsnotiz speichern auswählen',
        })
      ).getByText('user_martin')
    ).toBeInTheDocument();
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('removes an issue assignment through the persisted assignment action', async () => {
    const assignedSnapshot = {
      ...databaseSnapshotWithManageableMembers,
      issues: databaseSnapshotWithManageableMembers.issues.map((issue) =>
        issue.id === 'BV-12'
          ? {
              ...issue,
              owner: 'user_martin',
            }
          : issue
      ),
    } satisfies DashboardSnapshot;
    const updateIssueAssigneeAction = vi.fn<
      (
        input: UpdateBubblophyIssueAssigneeActionInput
      ) => Promise<UpdateBubblophyIssueAssigneeActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
        projectKey: 'BV',
        status: 'geplant',
        priority: 'hoch',
        owner: 'Nicht zugewiesen',
        planSteps: 3,
        approvalRequired: true,
      },
    }));
    const requestAgentRunAction =
      vi.fn<
        (
          input: RequestBubblophyAgentRunActionInput
        ) => Promise<RequestBubblophyAgentRunActionResult>
      >();

    render(
      <BubblophyDashboard
        snapshot={assignedSnapshot}
        updateIssueAssigneeAction={updateIssueAssigneeAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.change(within(detailPanel).getByLabelText('Zuständig'), {
      target: { value: '' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Zuweisung speichern' })
    );

    await waitFor(() => {
      expect(updateIssueAssigneeAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        assigneeAuthUserId: null,
      });
    });
    expect(
      await within(detailPanel).findByText(/Owner Nicht zugewiesen/i)
    ).toBeInTheDocument();
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('shows assignee action failures without leaking details or discarding the selection', async () => {
    const updateIssueAssigneeAction = vi.fn<
      (
        input: UpdateBubblophyIssueAssigneeActionInput
      ) => Promise<UpdateBubblophyIssueAssigneeActionResult>
    >(async () => {
      throw new Error('internal project id or membership SQL');
    });
    const requestAgentRunAction =
      vi.fn<
        (
          input: RequestBubblophyAgentRunActionInput
        ) => Promise<RequestBubblophyAgentRunActionResult>
      >();

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        updateIssueAssigneeAction={updateIssueAssigneeAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const assigneeSelect = within(detailPanel).getByLabelText('Zuständig');

    fireEvent.change(assigneeSelect, {
      target: { value: 'user_martin' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Zuweisung speichern' })
    );

    const alert = await within(detailPanel).findByRole('alert');

    expect(alert).toHaveTextContent(
      'Die Zuweisung konnte gerade nicht gespeichert werden'
    );
    expect(alert.textContent).not.toContain('internal project id');
    expect(alert.textContent).not.toContain('membership SQL');
    expect(assigneeSelect).toHaveValue('user_martin');
    expect(
      within(detailPanel).getByText(/Owner mrbubbles/i)
    ).toBeInTheDocument();
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('shows denied assignee results without discarding the selected member', async () => {
    const updateIssueAssigneeAction = vi.fn<
      (
        input: UpdateBubblophyIssueAssigneeActionInput
      ) => Promise<UpdateBubblophyIssueAssigneeActionResult>
    >(async () => ({
      status: 'forbidden',
    }));
    const requestAgentRunAction =
      vi.fn<
        (
          input: RequestBubblophyAgentRunActionInput
        ) => Promise<RequestBubblophyAgentRunActionResult>
      >();

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        updateIssueAssigneeAction={updateIssueAssigneeAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const assigneeSelect = within(detailPanel).getByLabelText('Zuständig');

    fireEvent.change(assigneeSelect, {
      target: { value: 'user_martin' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Zuweisung speichern' })
    );

    expect(await within(detailPanel).findByRole('alert')).toHaveTextContent(
      'Du darfst dieses Issue nicht zuweisen'
    );
    expect(assigneeSelect).toHaveValue('user_martin');
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('shows status action exceptions without changing the selected issue', async () => {
    const updateIssueStatusAction = vi.fn<
      (
        input: UpdateBubblophyIssueStatusActionInput
      ) => Promise<UpdateBubblophyIssueStatusActionResult>
    >(async () => {
      throw new Error('server action failed');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueStatusAction={updateIssueStatusAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const statusSelect = within(detailPanel).getByLabelText('Neuer Status');

    fireEvent.change(statusSelect, {
      target: { value: 'erledigt' },
    });
    fireEvent.change(within(detailPanel).getByLabelText('Grund'), {
      target: { value: 'Soll abgeschlossen werden.' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Status speichern' })
    );

    await waitFor(() => {
      expect(updateIssueStatusAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        expectedStatus: 'geplant',
        status: 'erledigt',
        reason: 'Soll abgeschlossen werden.',
      });
    });
    expect(await within(detailPanel).findByRole('alert')).toHaveTextContent(
      'Der Status konnte gerade nicht gespeichert werden'
    );
    expect(statusSelect).toHaveValue('erledigt');
    expect(within(detailPanel).getByLabelText('Grund')).toHaveValue(
      'Soll abgeschlossen werden.'
    );
    expect(within(detailPanel).getByText('Geplant')).toBeInTheDocument();
    expect(getMetricValue('Offene Issues')).toHaveTextContent('24');
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-12');
  });

  it('updates project blocker metrics after a human status transition', async () => {
    const updateIssueStatusAction = vi.fn<
      (
        input: UpdateBubblophyIssueStatusActionInput
      ) => Promise<UpdateBubblophyIssueStatusActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
        projectKey: 'BV',
        status: 'blockiert',
        priority: 'hoch',
        owner: 'mrbubbles',
        planSteps: 3,
        approvalRequired: true,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueStatusAction={updateIssueStatusAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.change(within(detailPanel).getByLabelText('Neuer Status'), {
      target: { value: 'blockiert' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Status speichern' })
    );

    await waitFor(() => {
      expect(updateIssueStatusAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        expectedStatus: 'geplant',
        status: 'blockiert',
        reason: '',
      });
    });
    await waitFor(() => {
      expect(getMetricValue('Blocker')).toHaveTextContent('4');
    });
    expect(getMetricValue('Offene Issues')).toHaveTextContent('24');
    expect(
      screen.getByRole('progressbar', { name: '4 bereit, 12 offen' })
    ).toBeInTheDocument();
  });

  it('closes an issue through the persisted status action', async () => {
    const updateIssueStatusAction = vi.fn<
      (
        input: UpdateBubblophyIssueStatusActionInput
      ) => Promise<UpdateBubblophyIssueStatusActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
        projectKey: 'BV',
        status: 'erledigt',
        priority: 'hoch',
        owner: 'mrbubbles',
        planSteps: 3,
        approvalRequired: true,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueStatusAction={updateIssueStatusAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.change(within(detailPanel).getByLabelText('Neuer Status'), {
      target: { value: 'erledigt' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Status speichern' })
    );

    await waitFor(() => {
      expect(updateIssueStatusAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        expectedStatus: 'geplant',
        status: 'erledigt',
        reason: '',
      });
    });
    await waitFor(() => {
      expect(within(detailPanel).getByText('Erledigt')).toBeInTheDocument();
    });
    expect(getMetricValue('Offene Issues')).toHaveTextContent('23');
  });

  it('reopens a done issue through the persisted status action', async () => {
    const updateIssueStatusAction = vi.fn<
      (
        input: UpdateBubblophyIssueStatusActionInput
      ) => Promise<UpdateBubblophyIssueStatusActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
        projectKey: 'BV',
        status: 'triage',
        priority: 'hoch',
        owner: 'mrbubbles',
        planSteps: 3,
        approvalRequired: true,
      },
    }));
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => {
      throw new Error('Run should not be requested by status changes.');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithDoneIssue}
        updateIssueStatusAction={updateIssueStatusAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(within(detailPanel).getByText('Erledigt')).toBeInTheDocument();
    fireEvent.change(within(detailPanel).getByLabelText('Neuer Status'), {
      target: { value: 'triage' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Status speichern' })
    );

    await waitFor(() => {
      expect(updateIssueStatusAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        expectedStatus: 'erledigt',
        status: 'triage',
        reason: '',
      });
    });
    await waitFor(() => {
      expect(within(detailPanel).getByText('Triage')).toBeInTheDocument();
    });
    expect(screen.getByRole('row', { name: /BV-12/ })).toHaveTextContent(
      'Triage'
    );
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('persists a human issue plan and renders it in the detail panel', async () => {
    const createIssuePlanAction = vi.fn<
      (
        input: CreateBubblophyIssuePlanActionInput
      ) => Promise<CreateBubblophyIssuePlanActionResult>
    >(async () => ({
      status: 'created',
      plan: {
        issueId: 'BV-12',
        version: 2,
        summary: 'Kontext sichern und Review vorbereiten.',
        steps: [
          { id: 'step_1', text: 'Bestehenden Snapshot lesen' },
          { id: 'step_2', text: 'Plan-Notiz prüfen' },
        ],
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssuePlanAction={createIssuePlanAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Plan entwerfen' })
    );
    expect(screen.getByRole('dialog')).toHaveClass(
      'max-h-[min(90svh,42rem)]',
      'overflow-y-auto'
    );
    fireEvent.change(screen.getByLabelText('Plan-Zusammenfassung'), {
      target: { value: 'Kontext sichern und Review vorbereiten.' },
    });
    fireEvent.change(screen.getByLabelText('Schritt 1'), {
      target: { value: 'Bestehenden Snapshot lesen' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Schritt hinzufügen' }));
    fireEvent.change(screen.getByLabelText('Schritt 2'), {
      target: { value: 'Plan-Notiz prüfen' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plan speichern' }));

    await waitFor(() => {
      expect(createIssuePlanAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        summary: 'Kontext sichern und Review vorbereiten.',
        steps: ['Bestehenden Snapshot lesen', 'Plan-Notiz prüfen'],
      });
    });
    expect(createIssuePlanAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const updatedDetailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(updatedDetailPanel).getByText(
        'Kontext sichern und Review vorbereiten.'
      )
    ).toBeInTheDocument();
    expect(
      within(updatedDetailPanel).getByText('Bestehenden Snapshot lesen')
    ).toBeInTheDocument();
    expect(
      within(updatedDetailPanel).getByText('Plan-Notiz prüfen')
    ).toBeInTheDocument();
    expect(
      within(updatedDetailPanel).getByText(
        'Plan v2, menschlich gespeichert. Es wurde kein Agent-Run gestartet.'
      )
    ).toBeInTheDocument();
    expect(
      within(updatedDetailPanel).getByText('2 Schritte')
    ).toBeInTheDocument();
    expect(screen.getAllByText('2 Schritte').length).toBeGreaterThanOrEqual(2);
  });

  it('renders reloaded latest plan content for persisted issues', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReloadedPlan} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).getByText('Reload zeigt den gespeicherten Plan.')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Persistierten Plan lesen')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Detailpanel verifizieren')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText(
        'Plan v4, menschlich gespeichert. Es wurde kein Agent-Run gestartet.'
      )
    ).toBeInTheDocument();
    expect(
      within(detailPanel).queryByText(/Plan-Schritte sind noch nicht/i)
    ).not.toBeInTheDocument();
  });

  it('edits a reloaded latest plan as a new persisted plan version', async () => {
    const createIssuePlanAction = vi.fn<
      (
        input: CreateBubblophyIssuePlanActionInput
      ) => Promise<CreateBubblophyIssuePlanActionResult>
    >(async () => ({
      status: 'created',
      plan: {
        issueId: 'BV-12',
        version: 5,
        summary: 'Reload-Plan wurde nachgeschärft.',
        steps: [
          { id: 'step_1', text: 'Persistierten Plan lesen' },
          { id: 'step_2', text: 'Detailpanel verifizieren' },
          { id: 'step_3', text: 'Neue Planversion speichern' },
        ],
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithReloadedPlan}
        createIssuePlanAction={createIssuePlanAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Plan bearbeiten' })
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Plan-Zusammenfassung')).toHaveValue(
      'Reload zeigt den gespeicherten Plan.'
    );
    expect(screen.getByLabelText('Schritt 1')).toHaveValue(
      'Persistierten Plan lesen'
    );
    expect(screen.getByLabelText('Schritt 2')).toHaveValue(
      'Detailpanel verifizieren'
    );

    fireEvent.change(screen.getByLabelText('Plan-Zusammenfassung'), {
      target: { value: 'Reload-Plan wurde nachgeschärft.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Schritt hinzufügen' }));
    fireEvent.change(screen.getByLabelText('Schritt 3'), {
      target: { value: 'Neue Planversion speichern' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plan speichern' }));

    await waitFor(() => {
      expect(createIssuePlanAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        summary: 'Reload-Plan wurde nachgeschärft.',
        steps: [
          'Persistierten Plan lesen',
          'Detailpanel verifizieren',
          'Neue Planversion speichern',
        ],
      });
    });
    expect(createIssuePlanAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const updatedDetailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(updatedDetailPanel).getByText('Reload-Plan wurde nachgeschärft.')
    ).toBeInTheDocument();
    expect(
      within(updatedDetailPanel).getByText('Neue Planversion speichern')
    ).toBeInTheDocument();
    expect(
      within(updatedDetailPanel).getByText(
        'Plan v5, menschlich gespeichert. Es wurde kein Agent-Run gestartet.'
      )
    ).toBeInTheDocument();
    expect(
      within(updatedDetailPanel).getByText('3 Schritte')
    ).toBeInTheDocument();
    expect(screen.getAllByText('3 Schritte').length).toBeGreaterThanOrEqual(2);
  });

  it('copies issue agent briefing with persisted plan context', async () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReloadedPlan} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).getByText('Lokaler Agent-Auftrag')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText(/Startet keinen Agenten/i)
    ).toBeInTheDocument();

    fireEvent.click(
      within(detailPanel).getByRole('button', {
        name: 'Agent-Auftrag kopieren',
      })
    );

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Bubblophy lokaler Agent-Auftrag')
      );
    });

    const copiedBriefing = vi.mocked(navigator.clipboard.writeText).mock
      .calls[0]?.[0];

    expect(copiedBriefing).toContain('Projekt: BV');
    expect(copiedBriefing).toContain('Issue: BV-12');
    expect(copiedBriefing).toContain(
      'Titel: Issue-Plan als strukturierte Arbeitsnotiz speichern'
    );
    expect(copiedBriefing).toContain('Status: Geplant');
    expect(copiedBriefing).toContain('Priorität: Hoch');
    expect(copiedBriefing).toContain(
      'Summary: Reload zeigt den gespeicherten Plan.'
    );
    expect(copiedBriefing).toContain('1. Persistierten Plan lesen');
    expect(copiedBriefing).toContain('2. Detailpanel verifizieren');
    expect(copiedBriefing).toContain('Kein Agent wurde gestartet.');
    expect(copiedBriefing).toContain(
      'Der Mensch entscheidet bewusst, ob ein neuer Run angefragt wird.'
    );
  });

  it('does not expose agent briefing for local draft issues', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Lokaler Agent-Draft' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Draft anlegen/i }));

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).getByText('Lokal / nicht gespeichert')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).queryByText('Lokaler Agent-Auftrag')
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', {
        name: 'Agent-Auftrag kopieren',
      })
    ).not.toBeInTheDocument();
  });

  it('keeps agent briefing free of token secrets and autostart language', async () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReloadedPlan} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', {
        name: 'Agent-Auftrag kopieren',
      })
    );

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    const copiedBriefing = vi.mocked(navigator.clipboard.writeText).mock
      .calls[0]?.[0];

    expect(copiedBriefing).not.toMatch(/token|secret|hash/i);
    expect(copiedBriefing).not.toMatch(/supabase/i);
    expect(copiedBriefing).not.toMatch(/Agent gestartet/i);
    expect(copiedBriefing).not.toMatch(/Run wird ausgeführt/i);
    expect(copiedBriefing).not.toMatch(/automatisch fortsetzen/i);
  });

  it('keeps the plan dialog open and shows denied plan save errors', async () => {
    const createIssuePlanAction = vi.fn<
      (
        input: CreateBubblophyIssuePlanActionInput
      ) => Promise<CreateBubblophyIssuePlanActionResult>
    >(async () => ({
      status: 'forbidden',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssuePlanAction={createIssuePlanAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Plan entwerfen' })
    );
    fireEvent.change(screen.getByLabelText('Plan-Zusammenfassung'), {
      target: { value: 'Nicht erlaubter Plan.' },
    });
    fireEvent.change(screen.getByLabelText('Schritt 1'), {
      target: { value: 'Darf nicht gespeichert werden' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plan speichern' }));

    await waitFor(() => {
      expect(createIssuePlanAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        summary: 'Nicht erlaubter Plan.',
        steps: ['Darf nicht gespeichert werden'],
      });
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Du bist kein Mitglied dieses Projekts. Der Plan wurde nicht gespeichert.'
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.queryByText('Plan v2, menschlich gespeichert')
    ).not.toBeInTheDocument();
  });

  it('keeps the plan dialog open when the plan action throws', async () => {
    const createIssuePlanAction = vi.fn<
      (
        input: CreateBubblophyIssuePlanActionInput
      ) => Promise<CreateBubblophyIssuePlanActionResult>
    >(async () => {
      throw new Error('plan action failed');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithReloadedPlan}
        createIssuePlanAction={createIssuePlanAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Plan bearbeiten' })
    );
    fireEvent.change(screen.getByLabelText('Plan-Zusammenfassung'), {
      target: { value: 'Plan bleibt im Dialog.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plan speichern' }));

    await waitFor(() => {
      expect(createIssuePlanAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        summary: 'Plan bleibt im Dialog.',
        steps: ['Persistierten Plan lesen', 'Detailpanel verifizieren'],
      });
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Der Plan konnte gerade nicht gespeichert werden'
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Plan-Zusammenfassung')).toHaveValue(
      'Plan bleibt im Dialog.'
    );
  });

  it('renders reloaded issue notes in the selected issue detail', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithIssueNote} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const notesRegion = within(detailPanel).getByLabelText('Notizen für BV-12');

    expect(
      within(notesRegion).getByText('Bestehende Review-Notiz aus dem Reload.')
    ).toBeInTheDocument();
    expect(
      within(notesRegion).getByText(/Mensch · 2026-06-14/)
    ).toBeInTheDocument();
  });

  it('shows issue note events in activity without duplicating audit events as notes', () => {
    render(
      <BubblophyDashboard snapshot={databaseSnapshotWithIssueNoteActivity} />
    );

    const activitySection = document.getElementById('activity');

    expect(activitySection).toBeInstanceOf(HTMLElement);

    if (!activitySection) {
      throw new Error('Expected the activity section to render.');
    }

    expect(
      within(activitySection).getByText(
        'Plan-Review als Issue-Notiz festgehalten.'
      )
    ).toBeInTheDocument();
    expect(
      within(activitySection).getAllByText('Mensch').length
    ).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const notesRegion = within(detailPanel).getByLabelText('Notizen für BV-12');

    expect(
      within(notesRegion).getByText('Bestehende Review-Notiz aus dem Reload.')
    ).toBeInTheDocument();
    expect(
      within(notesRegion).queryByText('Plan für BV-12 aktualisiert')
    ).not.toBeInTheDocument();
  });

  it('appends a human issue note without starting an agent run', async () => {
    const createIssueNoteAction = vi.fn<
      (
        input: CreateBubblophyIssueNoteActionInput
      ) => Promise<CreateBubblophyIssueNoteActionResult>
    >(async (input) => ({
      status: 'created',
      note: {
        id: 'event_note_new',
        note: input.note,
        actor: 'Mensch',
        createdAt: '2026-06-14T10:00:00.000Z',
      },
    }));
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => {
      throw new Error('Run should not be requested by notes.');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueNoteAction={createIssueNoteAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const notesRegion = within(detailPanel).getByLabelText('Notizen für BV-12');
    const noteInput = within(notesRegion).getByLabelText('Neue Notiz');

    fireEvent.change(noteInput, {
      target: { value: '<strong>Plan bleibt menschlich.</strong>' },
    });
    fireEvent.click(
      within(notesRegion).getByRole('button', { name: 'Notiz speichern' })
    );

    await waitFor(() => {
      expect(createIssueNoteAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        note: '<strong>Plan bleibt menschlich.</strong>',
      });
    });
    expect(createIssueNoteAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(
        within(notesRegion).getByText(
          '<strong>Plan bleibt menschlich.</strong>'
        )
      ).toBeInTheDocument();
    });
    expect(notesRegion.querySelector('strong')).toBeNull();
    expect(noteInput).toHaveValue('');
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('keeps note input when the issue note action is denied', async () => {
    const createIssueNoteAction = vi.fn<
      (
        input: CreateBubblophyIssueNoteActionInput
      ) => Promise<CreateBubblophyIssueNoteActionResult>
    >(async () => ({ status: 'forbidden' }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueNoteAction={createIssueNoteAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const notesRegion = within(detailPanel).getByLabelText('Notizen für BV-12');
    const noteInput = within(notesRegion).getByLabelText('Neue Notiz');

    fireEvent.change(noteInput, {
      target: { value: 'Viewer darf nicht speichern.' },
    });
    fireEvent.click(
      within(notesRegion).getByRole('button', { name: 'Notiz speichern' })
    );

    await waitFor(() => {
      expect(createIssueNoteAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        note: 'Viewer darf nicht speichern.',
      });
    });

    expect(await within(notesRegion).findByRole('alert')).toHaveTextContent(
      'Du darfst für dieses Issue keine Notiz schreiben.'
    );
    expect(noteInput).toHaveValue('Viewer darf nicht speichern.');
    expect(
      within(notesRegion).queryByText('Notiz gespeichert.')
    ).not.toBeInTheDocument();
  });

  it('opens a local draft dialog from the new issue action', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Neues Issue als Draft')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Issue erstellen' })
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/Datenbank nicht aktiv, Draft bleibt lokal/i).length
    ).toBeGreaterThan(0);
  });

  it('creates, selects, and discards a local draft issue without persistence', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));

    const createButton = screen.getByRole('button', { name: 'Draft anlegen' });

    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Lokaler Test-Draft' },
    });
    fireEvent.change(screen.getByLabelText('Beschreibung'), {
      target: { value: 'Diese Notiz bleibt nur lokal.' },
    });
    fireEvent.change(screen.getByLabelText('Priorität'), {
      target: { value: 'hoch' },
    });
    fireEvent.click(createButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Lokaler Test-Draft' })
    ).toBeInTheDocument();

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(within(detailPanel).getByText('BV-DRAFT-01')).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Lokal / nicht gespeichert')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Diese Notiz bleibt nur lokal.')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: 'Status speichern' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: /Plan entwerfen/i })
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Draft verwerfen' })
    );

    expect(
      screen.queryByRole('button', { name: 'Lokaler Test-Draft' })
    ).not.toBeInTheDocument();
  });

  it('does not show the database project create action for sample snapshots', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    expect(
      screen.queryByRole('button', { name: 'Neues Projekt' })
    ).not.toBeInTheDocument();
  });

  it('shows a database setup state without project creation when the database is unavailable', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseUnavailableSnapshot}
        createProjectAction={async () => ({
          status: 'database_unavailable',
        })}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    expect(
      within(projectsSection).getByText('Datenbank-Setup erforderlich.')
    ).toBeInTheDocument();
    expect(
      within(projectsSection).getByText(
        /Bubblophy-Tabellen scheinen zu fehlen/i
      )
    ).toBeInTheDocument();
    expect(
      within(projectsSection).queryByRole('button', { name: 'Neues Projekt' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Agent-Token erstellen' })
    ).not.toBeInTheDocument();
  });

  it('does not expose fake agent token creation for sample snapshots', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    expect(
      screen.queryByRole('button', { name: 'Agent-Token erstellen' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Beispielhafte Agent-Token-Vorschau/i)
    ).toBeInTheDocument();
  });

  it('creates and selects a database project from the projects panel', async () => {
    const createProjectAction = vi.fn<
      (
        input: CreateBubblophyProjectActionInput
      ) => Promise<CreateBubblophyProjectActionResult>
    >(async () => ({
      status: 'created',
      project: {
        id: 'project_zen',
        name: 'Zentrum',
        key: 'ZEN',
        description: 'Neue Projektarbeit.',
        isArchived: false,
        health: 'stabil',
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
        memberCount: 1,
        agentTokenCount: 0,
        currentUserRole: 'owner',
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createProjectAction={createProjectAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    expect(
      within(projectsSection).getAllByRole('button', { name: 'Neues Projekt' })
    ).toHaveLength(1);
    fireEvent.click(
      within(projectsSection).getByRole('button', { name: 'Neues Projekt' })
    );
    expect(
      screen.getByRole('dialog', { name: 'Projekt erstellen' })
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Zentrum' },
    });
    fireEvent.change(screen.getByLabelText('Key'), {
      target: { value: 'zen' },
    });
    fireEvent.change(screen.getByLabelText('Beschreibung'), {
      target: { value: 'Neue Projektarbeit.' },
    });
    fireEvent.change(screen.getByLabelText('Repository URL'), {
      target: { value: 'https://github.com/mrbubbles/zentrum' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Projekt erstellen' }));

    await waitFor(() => {
      expect(createProjectAction).toHaveBeenCalledWith({
        name: 'Zentrum',
        key: 'zen',
        description: 'Neue Projektarbeit.',
        repositoryUrl: 'https://github.com/mrbubbles/zentrum',
      });
    });
    expect(createProjectAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const createdProject = within(projectsSection).getByRole('button', {
      name: 'Projekt Zentrum (ZEN) auswählen',
    });

    expect(createdProject).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Gefiltert auf Projekt ZEN.')).toBeInTheDocument();
    expect(
      screen.getByText('Noch keine Issues für diesen Filter.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent(
      'Kein Issue ausgewählt.'
    );
  });

  it('edits the selected project through server-backed management controls', async () => {
    const updateProjectContentAction = vi.fn<
      (
        input: UpdateBubblophyProjectContentActionInput
      ) => Promise<UpdateBubblophyProjectContentActionResult>
    >(async () => ({
      status: 'updated',
      project: {
        id: 'project_bubblesverse',
        name: 'Bubblesverse lokal',
        key: 'BV',
        description: 'Projektsteuerung geschärft.',
        isArchived: false,
        health: 'stabil',
        openIssues: 12,
        readyIssues: 4,
        blockedIssues: 2,
        memberCount: 3,
        agentTokenCount: 1,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateProjectContentAction={updateProjectContentAction}
        transitionProjectArchiveAction={async () => ({ status: 'unchanged' })}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );
    fireEvent.change(within(projectsSection).getByLabelText('Name'), {
      target: { value: 'Bubblesverse lokal' },
    });
    fireEvent.change(within(projectsSection).getByLabelText('Beschreibung'), {
      target: { value: 'Projektsteuerung geschärft.' },
    });
    fireEvent.click(
      within(projectsSection).getByRole('button', { name: 'Speichern' })
    );

    await waitFor(() => {
      expect(updateProjectContentAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        name: 'Bubblesverse lokal',
        description: 'Projektsteuerung geschärft.',
      });
    });
    expect(updateProjectContentAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );
    await waitFor(() => {
      expect(
        within(projectsSection).getByText('Bubblesverse lokal')
      ).toBeInTheDocument();
    });
    expect(
      within(projectsSection).getByText('Projektsteuerung geschärft.')
    ).toBeInTheDocument();
    expect(screen.getByText('Gefiltert auf Projekt BV.')).toBeInTheDocument();
  });

  it('requires confirmation before archiving and blocks archived project actions', async () => {
    const transitionProjectArchiveAction = vi.fn<
      (
        input: TransitionBubblophyProjectArchiveActionInput
      ) => Promise<TransitionBubblophyProjectArchiveActionResult>
    >(async () => ({
      status: 'updated',
      project: {
        id: 'project_bubblesverse',
        name: 'Bubblesverse',
        key: 'BV',
        description: 'Projektbeschreibung aus der Datenbank.',
        isArchived: true,
        health: 'stabil',
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
        memberCount: 3,
        agentTokenCount: 1,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateProjectContentAction={async () => ({ status: 'unchanged' })}
        transitionProjectArchiveAction={transitionProjectArchiveAction}
        createIssueAction={async () => ({ status: 'forbidden' })}
        createAgentTokenAction={async () => ({ status: 'forbidden' })}
        updateAgentTokenLifecycleAction={async () => ({ status: 'forbidden' })}
        transitionAgentRunAction={async () => ({ status: 'forbidden' })}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    const selectedProjectButton = within(projectsSection).getByRole('button', {
      name: 'Projekt Bubblesverse (BV) auswählen',
    });

    fireEvent.click(selectedProjectButton);
    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt archivieren',
      })
    );

    expect(transitionProjectArchiveAction).not.toHaveBeenCalled();
    expect(
      within(projectsSection).getByRole('button', {
        name: 'Endgültig archivieren',
      })
    ).toBeInTheDocument();

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Endgültig archivieren',
      })
    );

    await waitFor(() => {
      expect(transitionProjectArchiveAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        decision: 'archive',
      });
    });
    expect(
      transitionProjectArchiveAction.mock.calls[0]?.[0]
    ).not.toHaveProperty('authUserId');
    await waitFor(() => {
      expect(
        within(projectsSection).getAllByText('Archiviert').length
      ).toBeGreaterThan(0);
    });
    expect(selectedProjectButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Neues Issue/i })).toBeDisabled();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent(
      'Kein Issue ausgewählt.'
    );
    expect(
      screen.queryByRole('button', { name: 'Agent-Token erstellen' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Pausieren' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Freigeben' })
    ).not.toBeInTheDocument();
  });

  it('shows project archive action exceptions without changing archive state', async () => {
    const transitionProjectArchiveAction = vi.fn<
      (
        input: TransitionBubblophyProjectArchiveActionInput
      ) => Promise<TransitionBubblophyProjectArchiveActionResult>
    >(async () => {
      throw new Error('internal archive project trace');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateProjectContentAction={async () => ({ status: 'unchanged' })}
        transitionProjectArchiveAction={transitionProjectArchiveAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    const selectedProjectButton = within(projectsSection).getByRole('button', {
      name: 'Projekt Bubblesverse (BV) auswählen',
    });

    fireEvent.click(selectedProjectButton);
    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt archivieren',
      })
    );
    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Endgültig archivieren',
      })
    );

    await waitFor(() => {
      expect(transitionProjectArchiveAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        decision: 'archive',
      });
    });

    const alert = await within(projectsSection).findByRole('alert');

    expect(alert).toHaveTextContent(
      'Der Projektstatus konnte gerade nicht geändert werden. Versuche es erneut.'
    );
    expect(alert.textContent).not.toContain('archive project');
    expect(selectedProjectButton).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(projectsSection).getByRole('button', {
        name: 'Endgültig archivieren',
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neues Issue/i })).toBeEnabled();
  });

  it('restores an archived project without changing the selected project', async () => {
    const archivedSnapshot = {
      ...databaseSnapshot,
      projects: databaseSnapshot.projects.map((project) =>
        project.key === 'BV'
          ? {
              ...project,
              isArchived: true,
              health: 'stabil',
              openIssues: 0,
              readyIssues: 0,
              blockedIssues: 0,
            }
          : project
      ),
    } satisfies DashboardSnapshot;
    const transitionProjectArchiveAction = vi.fn<
      (
        input: TransitionBubblophyProjectArchiveActionInput
      ) => Promise<TransitionBubblophyProjectArchiveActionResult>
    >(async () => ({
      status: 'updated',
      project: {
        id: 'project_bubblesverse',
        name: 'Bubblesverse',
        key: 'BV',
        description: 'Projektbeschreibung aus der Datenbank.',
        isArchived: false,
        health: 'aufmerksam',
        openIssues: 12,
        readyIssues: 4,
        blockedIssues: 2,
        memberCount: 3,
        agentTokenCount: 1,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={archivedSnapshot}
        updateProjectContentAction={async () => ({ status: 'unchanged' })}
        transitionProjectArchiveAction={transitionProjectArchiveAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    const selectedProjectButton = within(projectsSection).getByRole('button', {
      name: 'Projekt Bubblesverse (BV) auswählen',
    });

    fireEvent.click(selectedProjectButton);
    expect(screen.getByRole('button', { name: /Neues Issue/i })).toBeDisabled();

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt wiederherstellen',
      })
    );

    await waitFor(() => {
      expect(transitionProjectArchiveAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        decision: 'restore',
      });
    });
    await waitFor(() => {
      expect(within(projectsSection).getByText('Aktiv')).toBeInTheDocument();
    });
    expect(selectedProjectButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Neues Issue/i })).toBeEnabled();
  });

  it('shows project management denials without mutating local project state', async () => {
    const updateProjectContentAction = vi.fn<
      (
        input: UpdateBubblophyProjectContentActionInput
      ) => Promise<UpdateBubblophyProjectContentActionResult>
    >(async () => ({ status: 'forbidden' }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateProjectContentAction={updateProjectContentAction}
        transitionProjectArchiveAction={async () => ({ status: 'unchanged' })}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );
    fireEvent.change(within(projectsSection).getByLabelText('Name'), {
      target: { value: 'Verbotene Änderung' },
    });
    fireEvent.click(
      within(projectsSection).getByRole('button', { name: 'Speichern' })
    );

    expect(await within(projectsSection).findByRole('alert')).toHaveTextContent(
      'Nur Owner und Maintainer können Projekte verwalten.'
    );
    expect(within(projectsSection).getByLabelText('Name')).toHaveValue(
      'Verbotene Änderung'
    );
    expect(
      within(projectsSection).queryByText('Verbotene Änderung')
    ).not.toBeInTheDocument();
  });

  it('shows project content action exceptions without mutating local project state', async () => {
    const updateProjectContentAction = vi.fn<
      (
        input: UpdateBubblophyProjectContentActionInput
      ) => Promise<UpdateBubblophyProjectContentActionResult>
    >(async () => {
      throw new Error('internal project update trace');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateProjectContentAction={updateProjectContentAction}
        transitionProjectArchiveAction={async () => ({ status: 'unchanged' })}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );
    fireEvent.change(within(projectsSection).getByLabelText('Name'), {
      target: { value: 'Bubblesverse nicht gespeichert' },
    });
    fireEvent.change(within(projectsSection).getByLabelText('Beschreibung'), {
      target: { value: 'Bleibt nur im Formular.' },
    });
    fireEvent.click(
      within(projectsSection).getByRole('button', { name: 'Speichern' })
    );

    await waitFor(() => {
      expect(updateProjectContentAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        name: 'Bubblesverse nicht gespeichert',
        description: 'Bleibt nur im Formular.',
      });
    });

    const alert = await within(projectsSection).findByRole('alert');

    expect(alert).toHaveTextContent(
      'Die Projektänderung konnte gerade nicht gespeichert werden. Versuche es erneut.'
    );
    expect(alert.textContent).not.toContain('project update');
    expect(within(projectsSection).getByLabelText('Name')).toHaveValue(
      'Bubblesverse nicht gespeichert'
    );
    expect(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    ).toBeInTheDocument();
    expect(
      within(projectsSection).queryByText('Bleibt nur im Formular.')
    ).not.toBeInTheDocument();
  });

  it('lists project members and updates non-owner roles through the server action', async () => {
    const updateProjectMemberRoleAction = vi.fn<
      (
        input: UpdateBubblophyProjectMemberRoleActionInput
      ) => Promise<UpdateBubblophyProjectMemberRoleActionResult>
    >(async () => ({
      status: 'updated',
      member: {
        id: 'BV:user_martin',
        projectKey: 'BV',
        authUserId: 'user_martin',
        label: 'user_martin',
        role: 'viewer',
        createdAt: '2026-06-13T11:00:00.000Z',
      },
      memberCount: 3,
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        updateProjectMemberRoleAction={updateProjectMemberRoleAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    expect(within(projectsSection).getByText('Mitglieder')).toBeInTheDocument();
    expect(within(projectsSection).getByText('user_owner')).toBeInTheDocument();
    expect(
      within(projectsSection).getByText('Owner geschützt')
    ).toBeInTheDocument();
    expect(
      within(projectsSection).getByText(/bekannte Auth-User-ID/)
    ).toBeInTheDocument();

    fireEvent.change(
      within(projectsSection).getByLabelText('Rolle für user_martin'),
      {
        target: { value: 'viewer' },
      }
    );

    await waitFor(() => {
      expect(updateProjectMemberRoleAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        memberAuthUserId: 'user_martin',
        role: 'viewer',
      });
    });
    expect(updateProjectMemberRoleAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );
    await waitFor(() => {
      expect(
        within(projectsSection).getAllByText('Viewer').length
      ).toBeGreaterThan(0);
    });
  });

  it('adds a project member from the members panel', async () => {
    const addProjectMemberAction = vi.fn<
      (
        input: AddBubblophyProjectMemberActionInput
      ) => Promise<AddBubblophyProjectMemberActionResult>
    >(async () => ({
      status: 'added',
      member: {
        id: 'BV:00000000-0000-0000-0000-000000000123',
        projectKey: 'BV',
        authUserId: '00000000-0000-0000-0000-000000000123',
        label: '00000000-0000-0000-0000-000000000123',
        role: 'viewer',
        createdAt: '2026-06-14T10:00:00.000Z',
      },
      memberCount: 4,
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        addProjectMemberAction={addProjectMemberAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    expect(
      within(projectsSection).getByText(
        /keine Einladung und kein Profil-Lookup/
      )
    ).toBeInTheDocument();

    fireEvent.change(within(projectsSection).getByLabelText('Auth-User-ID'), {
      target: { value: '00000000-0000-0000-0000-000000000123' },
    });
    fireEvent.change(within(projectsSection).getByLabelText('Rolle'), {
      target: { value: 'viewer' },
    });
    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Mitglied hinzufügen',
      })
    );

    await waitFor(() => {
      expect(addProjectMemberAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        memberAuthUserId: '00000000-0000-0000-0000-000000000123',
        role: 'viewer',
      });
    });
    expect(addProjectMemberAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );
    await waitFor(() => {
      expect(
        within(projectsSection).getByText(
          '00000000-0000-0000-0000-000000000123'
        )
      ).toBeInTheDocument();
    });
    expect(within(projectsSection).getByRole('status')).toHaveTextContent(
      'Mitglied wurde direkt hinzugefügt.'
    );
    expect(within(projectsSection).getByText('4 sichtbar')).toBeInTheDocument();
  });

  it('copies own auth user id for member handoff', async () => {
    render(
      <BubblophyDashboard snapshot={databaseSnapshotWithManageableMembers} />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    const handoff = within(projectsSection).getByLabelText(
      'Eigene Auth-ID für Mitglieder-Handoff'
    );

    expect(within(handoff).getByText('user_mrbubbles')).toBeInTheDocument();
    expect(
      within(handoff).getByText(/Owner oder Maintainer/)
    ).toBeInTheDocument();

    fireEvent.click(
      within(handoff).getByRole('button', {
        name: 'Eigene Auth-ID kopieren',
      })
    );

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'user_mrbubbles'
      );
    });
    expect(await within(handoff).findByRole('status')).toHaveTextContent(
      'Eigene Auth-ID wurde kopiert.'
    );
  });

  it('does not expose profile lookup or invitation language for own auth id copy', () => {
    render(
      <BubblophyDashboard snapshot={databaseSnapshotWithManageableMembers} />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    const handoff = within(projectsSection).getByLabelText(
      'Eigene Auth-ID für Mitglieder-Handoff'
    );

    expect(
      within(handoff).queryByText(/Profil-Lookup|E-Mail|Einladung/i)
    ).not.toBeInTheDocument();
    expect(
      within(handoff).queryByText(/automatische Freigabe/i)
    ).toBeInTheDocument();
  });

  it('shows duplicate add-member feedback without fake invite behavior', async () => {
    const addProjectMemberAction = vi.fn<
      (
        input: AddBubblophyProjectMemberActionInput
      ) => Promise<AddBubblophyProjectMemberActionResult>
    >(async () => ({ status: 'unchanged' }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        addProjectMemberAction={addProjectMemberAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );
    fireEvent.change(within(projectsSection).getByLabelText('Auth-User-ID'), {
      target: { value: 'user_martin' },
    });
    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Mitglied hinzufügen',
      })
    );

    await waitFor(() => {
      expect(addProjectMemberAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        memberAuthUserId: 'user_martin',
        role: 'member',
      });
    });
    expect(
      await within(projectsSection).findByRole('status')
    ).toHaveTextContent('Dieses Mitglied ist bereits im Projekt.');
    expect(
      within(projectsSection).queryByText(/Einladung wurde/)
    ).not.toBeInTheDocument();
  });

  it('shows role action exceptions without changing the member row', async () => {
    const updateProjectMemberRoleAction = vi.fn<
      (
        input: UpdateBubblophyProjectMemberRoleActionInput
      ) => Promise<UpdateBubblophyProjectMemberRoleActionResult>
    >(async () => {
      throw new Error('internal membership mutation stack');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        updateProjectMemberRoleAction={updateProjectMemberRoleAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    const martinRoleSelect = within(projectsSection).getByLabelText(
      'Rolle für user_martin'
    );

    fireEvent.change(martinRoleSelect, {
      target: { value: 'viewer' },
    });

    await waitFor(() => {
      expect(updateProjectMemberRoleAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        memberAuthUserId: 'user_martin',
        role: 'viewer',
      });
    });

    const alert = await within(projectsSection).findByRole('alert');

    expect(alert).toHaveTextContent(
      'Die Rolle konnte gerade nicht geändert werden. Versuche es erneut.'
    );
    expect(alert.textContent).not.toContain('membership mutation');
    expect(
      within(projectsSection).getByLabelText('Rolle für user_martin')
    ).toHaveValue('member');
    expect(
      within(projectsSection).getByText('user_martin')
    ).toBeInTheDocument();
  });

  it('keeps member management available after project content updates', async () => {
    const updateProjectContentAction = vi.fn<
      (
        input: UpdateBubblophyProjectContentActionInput
      ) => Promise<UpdateBubblophyProjectContentActionResult>
    >(async () => ({
      status: 'updated',
      project: {
        id: 'project_bubblesverse',
        name: 'Bubblesverse lokal',
        key: 'BV',
        description: 'Projektsteuerung geschärft.',
        isArchived: false,
        health: 'stabil',
        openIssues: 12,
        readyIssues: 4,
        blockedIssues: 2,
        memberCount: 3,
        agentTokenCount: 1,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        updateProjectContentAction={updateProjectContentAction}
        transitionProjectArchiveAction={async () => ({ status: 'unchanged' })}
        updateProjectMemberRoleAction={async () => ({ status: 'unchanged' })}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );
    expect(
      within(projectsSection).getByLabelText('Rolle für user_martin')
    ).toBeInTheDocument();

    fireEvent.change(within(projectsSection).getByLabelText('Name'), {
      target: { value: 'Bubblesverse lokal' },
    });
    fireEvent.click(
      within(projectsSection).getByRole('button', { name: 'Speichern' })
    );

    await waitFor(() => {
      expect(
        within(projectsSection).getByText('Bubblesverse lokal')
      ).toBeInTheDocument();
    });
    expect(
      within(projectsSection).getByLabelText('Rolle für user_martin')
    ).toBeInTheDocument();
  });

  it('requires confirmation before removing a project member', async () => {
    const removeProjectMemberAction = vi.fn<
      (
        input: RemoveBubblophyProjectMemberActionInput
      ) => Promise<RemoveBubblophyProjectMemberActionResult>
    >(async () => ({
      status: 'removed',
      projectKey: 'BV',
      memberAuthUserId: 'user_martin',
      memberCount: 2,
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        removeProjectMemberAction={removeProjectMemberAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    const martinRow = screen.getByText('user_martin').closest('tr');

    expect(martinRow).toBeInstanceOf(HTMLTableRowElement);

    if (!martinRow) {
      throw new Error('Expected Martin member row.');
    }

    fireEvent.click(
      within(martinRow).getByRole('button', { name: 'Entfernen' })
    );
    expect(removeProjectMemberAction).not.toHaveBeenCalled();
    fireEvent.click(
      within(martinRow).getByRole('button', {
        name: 'Endgültig entfernen',
      })
    );

    await waitFor(() => {
      expect(removeProjectMemberAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        memberAuthUserId: 'user_martin',
      });
    });
    await waitFor(() => {
      expect(screen.queryByText('user_martin')).not.toBeInTheDocument();
    });
  });

  it('shows removal action exceptions without removing the member row', async () => {
    const removeProjectMemberAction = vi.fn<
      (
        input: RemoveBubblophyProjectMemberActionInput
      ) => Promise<RemoveBubblophyProjectMemberActionResult>
    >(async () => {
      throw new Error('internal member delete trace');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        removeProjectMemberAction={removeProjectMemberAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    const martinRow = screen.getByText('user_martin').closest('tr');

    expect(martinRow).toBeInstanceOf(HTMLTableRowElement);

    if (!martinRow) {
      throw new Error('Expected Martin member row.');
    }

    fireEvent.click(
      within(martinRow).getByRole('button', { name: 'Entfernen' })
    );
    fireEvent.click(
      within(martinRow).getByRole('button', {
        name: 'Endgültig entfernen',
      })
    );

    await waitFor(() => {
      expect(removeProjectMemberAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        memberAuthUserId: 'user_martin',
      });
    });

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent(
      'Das Mitglied konnte gerade nicht entfernt werden. Versuche es erneut.'
    );
    expect(alert.textContent).not.toContain('member delete');
    expect(screen.getByText('user_martin')).toBeInTheDocument();
    expect(
      within(martinRow).getByRole('button', {
        name: 'Endgültig entfernen',
      })
    ).toBeInTheDocument();
  });

  it('shows project member forbidden and archived states without fake controls', async () => {
    const forbiddenRoleAction = vi.fn<
      (
        input: UpdateBubblophyProjectMemberRoleActionInput
      ) => Promise<UpdateBubblophyProjectMemberRoleActionResult>
    >(async () => ({ status: 'forbidden' }));

    const { unmount } = render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        updateProjectMemberRoleAction={forbiddenRoleAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    fireEvent.change(
      within(projectsSection).getByLabelText('Rolle für user_martin'),
      {
        target: { value: 'viewer' },
      }
    );

    expect(await within(projectsSection).findByRole('alert')).toHaveTextContent(
      'Nur Owner und Maintainer können Rollen verwalten.'
    );

    const archivedSnapshot = {
      ...databaseSnapshotWithManageableMembers,
      projects: databaseSnapshotWithManageableMembers.projects.map((project) =>
        project.key === 'BV'
          ? {
              ...project,
              isArchived: true,
            }
          : project
      ),
    } satisfies DashboardSnapshot;

    unmount();
    render(<BubblophyDashboard snapshot={archivedSnapshot} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    expect(
      screen.getByText('Archivierte Projekte zeigen Mitglieder nur lesend an.')
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Rolle für user_martin')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Entfernen' })
    ).not.toBeInTheDocument();
  });

  it('keeps the project dialog open and shows duplicate errors', async () => {
    const createProjectAction = vi.fn<
      (
        input: CreateBubblophyProjectActionInput
      ) => Promise<CreateBubblophyProjectActionResult>
    >(async () => ({
      status: 'duplicate',
    }));

    render(
      <BubblophyDashboard
        snapshot={emptyDatabaseSnapshot}
        createProjectAction={createProjectAction}
      />
    );

    const projectCreateButtons = screen.getAllByRole('button', {
      name: 'Neues Projekt',
    });

    expect(projectCreateButtons).toHaveLength(2);
    const projectCreateButton = projectCreateButtons[0];

    if (!projectCreateButton) {
      throw new Error('Expected a project create button.');
    }

    fireEvent.click(projectCreateButton);
    expect(
      screen.getByRole('dialog', { name: 'Projekt erstellen' })
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Doppeltes Projekt' },
    });
    fireEvent.change(screen.getByLabelText('Key'), {
      target: { value: 'DP' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Projekt erstellen' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Dieser Projekt-Key ist schon vergeben.'
    );
    expect(
      screen.getByRole('dialog', { name: 'Projekt erstellen' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Doppeltes Projekt\s+DP/i })
    ).not.toBeInTheDocument();
  });

  it('shows project create action exceptions without losing dialog input', async () => {
    const createProjectAction = vi.fn<
      (
        input: CreateBubblophyProjectActionInput
      ) => Promise<CreateBubblophyProjectActionResult>
    >(async () => {
      throw new Error('internal create project trace');
    });

    render(
      <BubblophyDashboard
        snapshot={emptyDatabaseSnapshot}
        createProjectAction={createProjectAction}
      />
    );

    const projectCreateButton = screen.getAllByRole('button', {
      name: 'Neues Projekt',
    })[0];

    if (!projectCreateButton) {
      throw new Error('Expected a project create button.');
    }

    fireEvent.click(projectCreateButton);
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Fehlerfestes Projekt' },
    });
    fireEvent.change(screen.getByLabelText('Key'), {
      target: { value: 'FF' },
    });
    fireEvent.change(screen.getByLabelText('Beschreibung'), {
      target: { value: 'Eingaben bleiben erhalten.' },
    });
    fireEvent.change(screen.getByLabelText('Repository URL'), {
      target: { value: 'https://github.com/mrbubbles/fehlerfest' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Projekt erstellen' }));

    await waitFor(() => {
      expect(createProjectAction).toHaveBeenCalledWith({
        name: 'Fehlerfestes Projekt',
        key: 'FF',
        description: 'Eingaben bleiben erhalten.',
        repositoryUrl: 'https://github.com/mrbubbles/fehlerfest',
      });
    });

    const dialog = screen.getByRole('dialog', { name: 'Projekt erstellen' });
    const alert = await within(dialog).findByRole('alert');

    expect(alert).toHaveTextContent(
      'Das Projekt konnte gerade nicht erstellt werden. Versuche es erneut.'
    );
    expect(alert.textContent).not.toContain('create project');
    expect(within(dialog).getByLabelText('Name')).toHaveValue(
      'Fehlerfestes Projekt'
    );
    expect(within(dialog).getByLabelText('Key')).toHaveValue('FF');
    expect(within(dialog).getByLabelText('Beschreibung')).toHaveValue(
      'Eingaben bleiben erhalten.'
    );
    expect(within(dialog).getByLabelText('Repository URL')).toHaveValue(
      'https://github.com/mrbubbles/fehlerfest'
    );
    expect(
      screen.queryByRole('button', { name: /^Fehlerfestes Projekt\s+FF/i })
    ).not.toBeInTheDocument();
  });

  it('guides an empty database from project creation to the first persisted issue', async () => {
    const createProjectAction = vi.fn<
      (
        input: CreateBubblophyProjectActionInput
      ) => Promise<CreateBubblophyProjectActionResult>
    >(async () => ({
      status: 'created',
      project: {
        id: 'project_zen',
        name: 'Zentrum',
        key: 'ZEN',
        description: '',
        isArchived: false,
        health: 'stabil',
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
        memberCount: 1,
        agentTokenCount: 0,
        currentUserRole: 'owner',
      },
    }));
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async () => ({
      status: 'created',
      issue: {
        id: 'ZEN-1',
        title: 'Erstes echtes Issue',
        projectKey: 'ZEN',
        status: 'triage',
        priority: 'hoch',
        owner: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
        description: 'Direkt aus dem neuen Projekt angelegt.',
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={emptyDatabaseSnapshot}
        createProjectAction={createProjectAction}
        createIssueAction={createIssueAction}
      />
    );

    expect(
      screen.queryByRole('button', { name: /Neues Issue/i })
    ).not.toBeInTheDocument();

    const projectCreateButtons = screen.getAllByRole('button', {
      name: 'Neues Projekt',
    });
    expect(projectCreateButtons).toHaveLength(2);
    const projectCreateButton = projectCreateButtons[0];

    if (!projectCreateButton) {
      throw new Error('Expected a project create button.');
    }

    fireEvent.click(projectCreateButton);
    expect(
      screen.getByRole('dialog', { name: 'Projekt erstellen' })
    ).toHaveClass('max-h-[min(90svh,42rem)]', 'overflow-y-auto');
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Zentrum' },
    });
    fireEvent.change(screen.getByLabelText('Key'), {
      target: { value: 'zen' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Projekt erstellen' }));

    await waitFor(() => {
      expect(createProjectAction).toHaveBeenCalledWith({
        name: 'Zentrum',
        key: 'zen',
        description: '',
        repositoryUrl: '',
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Gefiltert auf Projekt ZEN.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Issue für ZEN anlegen' })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Issue für ZEN anlegen' })
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('Neues Issue');
    expect(screen.getByLabelText('Projekt')).toHaveValue('ZEN');
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Erstes echtes Issue' },
    });
    fireEvent.change(screen.getByLabelText('Beschreibung'), {
      target: { value: 'Direkt aus dem neuen Projekt angelegt.' },
    });
    fireEvent.change(screen.getByLabelText('Priorität'), {
      target: { value: 'hoch' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue erstellen' }));

    await waitFor(() => {
      expect(createIssueAction).toHaveBeenCalledWith({
        projectKey: 'ZEN',
        title: 'Erstes echtes Issue',
        description: 'Direkt aus dem neuen Projekt angelegt.',
        priority: 'hoch',
      });
    });
    expect(createIssueAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(navigationMocks.routerPush).toHaveBeenLastCalledWith(
      '/?project=ZEN&issue=ZEN-1'
    );
    expect(
      screen.getByRole('button', { name: 'Erstes echtes Issue' })
    ).toHaveAttribute('aria-pressed', 'true');

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(within(detailPanel).getByText('ZEN-1')).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Erstes echtes Issue')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Direkt aus dem neuen Projekt angelegt.')
    ).toBeInTheDocument();
  });

  it('shows recent successful mutation feedback after issue creation', async () => {
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async (input) => ({
      status: 'created',
      issue: {
        id: 'BV-15',
        title: input.title,
        projectKey: input.projectKey,
        status: 'triage',
        priority: input.priority ?? 'mittel',
        owner: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
        description: input.description,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueAction={createIssueAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Feedback sichtbarer machen' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue erstellen' }));

    await waitFor(() => {
      expect(createIssueAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        title: 'Feedback sichtbarer machen',
        description: '',
        priority: 'mittel',
      });
    });

    const recentFeedback = await screen.findByRole('status', {
      name: 'Letzte bestätigte Aktion',
    });

    expect(recentFeedback).toHaveTextContent('Zuletzt lokal bestätigt:');
    expect(recentFeedback).toHaveTextContent('Issue BV-15 wurde erstellt.');
    expect(recentFeedback).toHaveTextContent(
      'Temporäres Feedback aus dieser Sitzung; gespeicherte Daten bleiben die Quelle der Wahrheit.'
    );
    expect(navigationMocks.routerRefresh).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText(/persistente Aktivität erscheint/i)
    ).not.toBeInTheDocument();

    const activitySection = document.getElementById('activity');

    expect(activitySection).toBeInstanceOf(HTMLElement);

    if (!activitySection) {
      throw new Error('Expected the activity section to render.');
    }

    expect(
      within(activitySection).queryByText(/Issue BV-15 wurde erstellt/i)
    ).not.toBeInTheDocument();
  });

  it('updates recent mutation feedback after a later successful action', async () => {
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async (input) => ({
      status: 'created',
      issue: {
        id: 'BV-15',
        title: input.title,
        projectKey: input.projectKey,
        status: 'triage',
        priority: input.priority ?? 'mittel',
        owner: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
        description: input.description,
      },
    }));
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => ({
      status: 'requested',
      run: {
        id: 'run_bv_15_requested',
        issueId: 'BV-15',
        agentLabel: 'codex-local-lio',
        state: 'wartet',
        requestedBy: 'Mensch',
        lastEvent: 'Anfrage gespeichert: Feedback-Flow prüfen.',
      },
      createdAt: '2026-07-18T12:00:00.000Z',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueAction={createIssueAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Feedback später überschreiben' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue erstellen' }));

    expect(
      await screen.findByText('Issue BV-15 wurde erstellt.')
    ).toBeInTheDocument();

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.change(within(detailPanel).getByLabelText('Agent-Token'), {
      target: { value: 'token_codex_bv' },
    });
    fireEvent.change(within(detailPanel).getByLabelText('Auftrag'), {
      target: { value: 'Bitte nur lokal prüfen.' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Run anfragen' })
    );

    await waitFor(() => {
      expect(requestAgentRunAction).toHaveBeenCalledWith({
        issueId: 'BV-15',
        agentTokenId: 'token_codex_bv',
        instructions: 'Bitte nur lokal prüfen.',
      });
    });

    const recentFeedback = await screen.findByRole('status', {
      name: 'Letzte bestätigte Aktion',
    });

    await waitFor(() => {
      expect(recentFeedback).toHaveTextContent(
        'Run run_bv_15_requested wurde angefragt.'
      );
    });
    expect(recentFeedback).not.toHaveTextContent('Issue BV-15 wurde erstellt.');
    expect(navigationMocks.routerRefresh).toHaveBeenCalledTimes(2);
  });

  it('plans a newly created title-only database issue without starting a run', async () => {
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async (input) => ({
      status: 'created',
      issue: {
        id: 'BV-15',
        title: input.title,
        projectKey: input.projectKey,
        status: 'triage',
        priority: input.priority ?? 'mittel',
        owner: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
        description: input.description,
      },
    }));
    const createIssuePlanAction = vi.fn<
      (
        input: CreateBubblophyIssuePlanActionInput
      ) => Promise<CreateBubblophyIssuePlanActionResult>
    >(async (input) => ({
      status: 'created',
      plan: {
        issueId: input.issueId,
        version: 1,
        summary: input.summary ?? '',
        steps: input.steps.map((step, index) => ({
          id: `step_${index + 1}`,
          text: step,
        })),
      },
    }));
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => ({
      status: 'token_unavailable',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueAction={createIssueAction}
        createIssuePlanAction={createIssuePlanAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));

    expect(screen.getByRole('dialog')).toHaveTextContent('Neues Issue');
    expect(screen.getByLabelText('Projekt')).toHaveValue('BV');
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Frisches Plan-Issue' },
    });
    fireEvent.change(screen.getByLabelText('Priorität'), {
      target: { value: 'hoch' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue erstellen' }));

    await waitFor(() => {
      expect(createIssueAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        title: 'Frisches Plan-Issue',
        description: '',
        priority: 'hoch',
      });
    });
    expect(createIssueAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(navigationMocks.routerPush).toHaveBeenLastCalledWith(
      '/?project=BV&issue=BV-15'
    );
    expect(
      screen.getByRole('button', { name: 'Frisches Plan-Issue' })
    ).toHaveAttribute('aria-pressed', 'true');

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(within(detailPanel).getByText('BV-15')).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Frisches Plan-Issue')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText(/Nutze „Plan entwerfen“/i)
    ).toBeInTheDocument();

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Plan entwerfen' })
    );
    fireEvent.change(screen.getByLabelText('Plan-Zusammenfassung'), {
      target: { value: 'Frisches Issue ruhig planen.' },
    });
    fireEvent.change(screen.getByLabelText('Schritt 1'), {
      target: { value: 'Kontext sammeln' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Schritt hinzufügen' }));
    fireEvent.change(screen.getByLabelText('Schritt 2'), {
      target: { value: 'Nächste menschliche Entscheidung festhalten' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plan speichern' }));

    await waitFor(() => {
      expect(createIssuePlanAction).toHaveBeenCalledWith({
        issueId: 'BV-15',
        summary: 'Frisches Issue ruhig planen.',
        steps: [
          'Kontext sammeln',
          'Nächste menschliche Entscheidung festhalten',
        ],
      });
    });
    expect(createIssuePlanAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const plannedDetailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(plannedDetailPanel).getByText('Frisches Issue ruhig planen.')
    ).toBeInTheDocument();
    expect(
      within(plannedDetailPanel).getByText('Kontext sammeln')
    ).toBeInTheDocument();
    expect(
      within(plannedDetailPanel).getByText(
        'Nächste menschliche Entscheidung festhalten'
      )
    ).toBeInTheDocument();
    expect(
      within(plannedDetailPanel).getByText(
        'Plan v1, menschlich gespeichert. Es wurde kein Agent-Run gestartet.'
      )
    ).toBeInTheDocument();
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('creates an agent token and shows the plaintext only in the dialog', async () => {
    const createAgentTokenAction = vi.fn<
      (
        input: CreateBubblophyAgentTokenActionInput
      ) => Promise<CreateBubblophyAgentTokenActionResult>
    >(async () => ({
      status: 'created',
      token: {
        id: 'token_codex_local',
        label: 'Codex lokal',
        projectKey: 'BV',
        scopes: ['projects:read', 'issues:read'],
        state: 'aktiv',
        lastUsedAt: 'noch nie verwendet',
        expiresAt: 'läuft nicht automatisch ab',
        plaintextToken: 'test_plaintext_token_once',
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createAgentTokenAction={createAgentTokenAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Agent-Token erstellen',
      })
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Codex lokal' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Token erstellen' }));

    await waitFor(() => {
      expect(createAgentTokenAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        label: 'Codex lokal',
        scopes: ['projects:read', 'issues:read'],
      });
    });
    expect(createAgentTokenAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).getByText('test_plaintext_token_once')
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /\$BUBBLOPHY_BASE_URL\/api\/agent-projects\/<project-id>\/issues/
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/später nicht wieder sichtbar/i)
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('Ablauf: läuft nicht automatisch ab')
    ).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Token kopieren' })
    );
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'test_plaintext_token_once'
      );
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Issue-Kontext kopieren' })
    );
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-projects/<project-id>/issues')
      );
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Authorization: Bearer <agent-token>')
    );
    expect(within(agentSection).getByText('Codex lokal')).toBeInTheDocument();
    expect(
      within(agentSection).queryByText('test_plaintext_token_once')
    ).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Fertig' }));

    expect(
      screen.queryByText('test_plaintext_token_once')
    ).not.toBeInTheDocument();
    expect(within(agentSection).getByText('Codex lokal')).toBeInTheDocument();
  });

  it('creates agent token with optional expiry', async () => {
    const createAgentTokenAction = vi.fn<
      (
        input: CreateBubblophyAgentTokenActionInput
      ) => Promise<CreateBubblophyAgentTokenActionResult>
    >(async () => ({
      status: 'created',
      token: {
        id: 'token_codex_expiring',
        label: 'Codex mit Ablauf',
        projectKey: 'BV',
        scopes: ['projects:read', 'issues:read'],
        state: 'aktiv',
        lastUsedAt: 'noch nie verwendet',
        expiresAt: '2026-07-01T09:30',
        plaintextToken: 'test_plaintext_token_expiring',
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createAgentTokenAction={createAgentTokenAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Agent-Token erstellen',
      })
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Codex mit Ablauf' },
    });
    fireEvent.change(screen.getByLabelText(/^Ablauf/), {
      target: { value: '2026-07-01T09:30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Token erstellen' }));

    await waitFor(() => {
      expect(createAgentTokenAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        label: 'Codex mit Ablauf',
        scopes: ['projects:read', 'issues:read'],
        expiresAt: '2026-07-01T09:30',
      });
    });
    expect(createAgentTokenAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).getByText('Ablauf: 2026-07-01T09:30')
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('test_plaintext_token_expiring')
    ).toBeInTheDocument();
  });

  it('creates agent token without expiry when expiry field is empty', async () => {
    const createAgentTokenAction = vi.fn<
      (
        input: CreateBubblophyAgentTokenActionInput
      ) => Promise<CreateBubblophyAgentTokenActionResult>
    >(async () => ({
      status: 'created',
      token: {
        id: 'token_codex_no_expiry',
        label: 'Codex ohne Ablauf',
        projectKey: 'BV',
        scopes: ['projects:read', 'issues:read'],
        state: 'aktiv',
        lastUsedAt: 'noch nie verwendet',
        expiresAt: 'läuft nicht automatisch ab',
        plaintextToken: 'test_plaintext_token_no_expiry',
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createAgentTokenAction={createAgentTokenAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Agent-Token erstellen',
      })
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Codex ohne Ablauf' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Token erstellen' }));

    await waitFor(() => {
      expect(createAgentTokenAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        label: 'Codex ohne Ablauf',
        scopes: ['projects:read', 'issues:read'],
      });
    });
    expect(createAgentTokenAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'expiresAt'
    );
  });

  it('shows invalid expiry feedback from the server action', async () => {
    const createAgentTokenAction = vi.fn<
      (
        input: CreateBubblophyAgentTokenActionInput
      ) => Promise<CreateBubblophyAgentTokenActionResult>
    >(async () => ({
      status: 'invalid',
      reason: 'invalid_expires_at',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createAgentTokenAction={createAgentTokenAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Agent-Token erstellen',
      })
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Codex mit falschem Ablauf' },
    });
    fireEvent.change(screen.getByLabelText(/^Ablauf/), {
      target: { value: '2000-01-01T00:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Token erstellen' }));

    await waitFor(() => {
      expect(createAgentTokenAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        label: 'Codex mit falschem Ablauf',
        scopes: ['projects:read', 'issues:read'],
        expiresAt: '2000-01-01T00:00',
      });
    });

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      'Das Ablaufdatum ist nicht gültig.'
    );
    expect(
      within(dialog).queryByText(/Token jetzt kopieren/i)
    ).not.toBeInTheDocument();
  });

  it('shows PATCH handoff only for active runs:update tokens', () => {
    render(
      <BubblophyDashboard snapshot={databaseSnapshotWithRunUpdateToken} />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(
      within(agentSection).getByText('Lokaler Agent-Handoff')
    ).toBeInTheDocument();
    expect(
      within(agentSection).getByText('/api/agent-runs/<run-id>')
    ).toBeInTheDocument();
    expect(
      within(agentSection).getByText(/Authorization: Bearer <agent-token>/)
    ).toBeInTheDocument();
    expect(
      within(agentSection).getByRole('button', {
        name: 'PATCH-Beispiel kopieren',
      })
    ).toBeInTheDocument();
    expect(
      within(agentSection).queryByRole('button', {
        name: 'Issue-Kontext kopieren',
      })
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).queryByText(
        /\$BUBBLOPHY_BASE_URL\/api\/agent-projects\/<project-id>\/issues/
      )
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).queryByText(/test_plaintext_token/)
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).getByText(/offene Issues eines Projekts lesen/)
    ).toBeInTheDocument();
  });

  it('shows project issue context handoff only for active issues:read tokens', () => {
    render(
      <BubblophyDashboard snapshot={databaseSnapshotWithIssueReadToken} />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(
      within(agentSection).getByRole('button', {
        name: 'Issue-Kontext kopieren',
      })
    ).toBeInTheDocument();
    expect(
      within(agentSection).getByText(
        '/api/agent-projects/project_bubblesverse/issues'
      )
    ).toBeInTheDocument();
    expect(
      within(agentSection).getByText(
        /\$BUBBLOPHY_BASE_URL\/api\/agent-projects\/project_bubblesverse\/issues/
      )
    ).toBeInTheDocument();
    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Issue-Kontext kopieren',
      })
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/api/agent-projects/project_bubblesverse/issues')
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Authorization: Bearer <agent-token>')
    );
    expect(
      within(agentSection).queryByRole('button', {
        name: 'PATCH-Beispiel kopieren',
      })
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).getByText(/kann keine Agent-Run-Statusupdates/)
    ).toBeInTheDocument();
  });

  it('keeps the project issue handoff placeholder when the token project is missing', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithUnresolvedIssueReadToken}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(
      within(agentSection).getByText('/api/agent-projects/<project-id>/issues')
    ).toBeInTheDocument();
    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Issue-Kontext kopieren',
      })
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/api/agent-projects/<project-id>/issues')
    );
    expect(
      within(agentSection).queryByText(
        '/api/agent-projects/project_bubblesverse/issues'
      )
    ).not.toBeInTheDocument();
  });

  it('does not offer examples for tokens without operative read or update scopes', () => {
    render(
      <BubblophyDashboard snapshot={databaseSnapshotWithWriteOnlyToken} />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(
      within(agentSection).getAllByText('Lokaler Agent-Handoff').length
    ).toBeGreaterThan(0);
    expect(
      within(agentSection).getAllByText(/kann keine Agent-Run-Statusupdates/)
        .length
    ).toBeGreaterThan(0);
    expect(
      within(agentSection).getAllByText(/kann keine Projekt-Issues lesen/)
        .length
    ).toBeGreaterThan(0);
    expect(
      within(agentSection).getAllByText('runs:update').length
    ).toBeGreaterThan(0);
    expect(
      within(agentSection).queryByText(/Authorization: Bearer <agent-token>/)
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).queryByRole('button', {
        name: 'Issue-Kontext kopieren',
      })
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).queryByRole('button', {
        name: 'PATCH-Beispiel kopieren',
      })
    ).not.toBeInTheDocument();
  });

  it('keeps the token dialog open on denied agent token creation', async () => {
    const createAgentTokenAction = vi.fn<
      (
        input: CreateBubblophyAgentTokenActionInput
      ) => Promise<CreateBubblophyAgentTokenActionResult>
    >(async () => ({
      status: 'forbidden',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createAgentTokenAction={createAgentTokenAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Agent-Token erstellen',
      })
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Codex lokal' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Token erstellen' }));

    await waitFor(() => {
      expect(createAgentTokenAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        label: 'Codex lokal',
        scopes: ['projects:read', 'issues:read'],
      });
    });
    expect(createAgentTokenAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      /Nur Owner und Maintainer/i
    );
    expect(
      within(dialog).queryByText(/Token jetzt kopieren/i)
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).queryByText('Codex lokal')
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/bubblophy_agent_/i)).not.toBeInTheDocument();
  });

  it('keeps token draft state when agent token creation throws', async () => {
    const createAgentTokenAction = vi.fn<
      (
        input: CreateBubblophyAgentTokenActionInput
      ) => Promise<CreateBubblophyAgentTokenActionResult>
    >(async () => {
      throw new Error('internal token_hash header leaked');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createAgentTokenAction={createAgentTokenAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Agent-Token erstellen',
      })
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Token wirft nicht speichern' },
    });
    fireEvent.click(screen.getByLabelText('runs:update'));
    fireEvent.click(screen.getByRole('button', { name: 'Token erstellen' }));

    await waitFor(() => {
      expect(createAgentTokenAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        label: 'Token wirft nicht speichern',
        scopes: ['projects:read', 'issues:read', 'runs:update'],
      });
    });

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      /konnte gerade nicht erstellt werden/i
    );
    expect(within(dialog).getByLabelText('Label')).toHaveValue(
      'Token wirft nicht speichern'
    );
    expect(within(dialog).getByLabelText('projects:read')).toBeChecked();
    expect(within(dialog).getByLabelText('issues:read')).toBeChecked();
    expect(within(dialog).getByLabelText('runs:update')).toBeChecked();
    expect(within(dialog).queryByText(/internal/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/token_hash/i)).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText(/Token jetzt kopieren/i)
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).queryByText('Token wirft nicht speichern')
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/bubblophy_agent_/i)).not.toBeInTheDocument();
  });

  it('pauses an active agent token through the lifecycle action', async () => {
    const updateAgentTokenLifecycleAction = vi.fn<
      (
        input: UpdateBubblophyAgentTokenLifecycleActionInput
      ) => Promise<UpdateBubblophyAgentTokenLifecycleActionResult>
    >(async () => ({
      status: 'updated',
      token: {
        id: 'token_codex_bv',
        label: 'codex-local-lio',
        projectKey: 'BV',
        scopes: ['issues:read', 'issues:write', 'runs:create'],
        state: 'pausiert',
        lastUsedAt: 'vor 12 Min.',
        expiresAt: 'läuft nicht automatisch ab',
      },
    }));
    const firstToken = databaseSnapshot.agentTokens[0];

    if (!firstToken) {
      throw new Error('Expected a token fixture.');
    }

    const singleTokenSnapshot = {
      ...databaseSnapshot,
      agentTokens: [firstToken],
    } satisfies DashboardSnapshot;

    render(
      <BubblophyDashboard
        snapshot={singleTokenSnapshot}
        updateAgentTokenLifecycleAction={updateAgentTokenLifecycleAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    const pauseButton = within(agentSection).getAllByRole('button', {
      name: 'Pausieren',
    })[0];

    if (!pauseButton) {
      throw new Error('Expected a pause button.');
    }

    fireEvent.click(pauseButton);

    await waitFor(() => {
      expect(updateAgentTokenLifecycleAction).toHaveBeenCalledWith({
        tokenId: 'token_codex_bv',
        decision: 'pause',
      });
    });
    expect(
      updateAgentTokenLifecycleAction.mock.calls[0]?.[0]
    ).not.toHaveProperty('authUserId');
    await waitFor(() => {
      expect(
        within(agentSection).getAllByText('Pausiert').length
      ).toBeGreaterThan(0);
    });
    expect(navigationMocks.routerRefresh).toHaveBeenCalledTimes(1);
  });

  it('resumes a paused agent token through the lifecycle action', async () => {
    const updateAgentTokenLifecycleAction = vi.fn<
      (
        input: UpdateBubblophyAgentTokenLifecycleActionInput
      ) => Promise<UpdateBubblophyAgentTokenLifecycleActionResult>
    >(async () => ({
      status: 'updated',
      token: {
        id: 'token_codex_bv',
        label: 'codex-local-lio',
        projectKey: 'BV',
        scopes: ['issues:read', 'issues:write', 'runs:create'],
        state: 'aktiv',
        lastUsedAt: 'vor 12 Min.',
        expiresAt: 'läuft nicht automatisch ab',
      },
    }));
    const firstToken = databaseSnapshot.agentTokens[0];

    if (!firstToken) {
      throw new Error('Expected a token fixture.');
    }

    const pausedTokenSnapshot = {
      ...databaseSnapshot,
      agentTokens: [
        {
          ...firstToken,
          state: 'pausiert',
        },
      ],
    } satisfies DashboardSnapshot;

    render(
      <BubblophyDashboard
        snapshot={pausedTokenSnapshot}
        updateAgentTokenLifecycleAction={updateAgentTokenLifecycleAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(within(agentSection).getByText('Pausiert')).toBeInTheDocument();
    expect(
      within(agentSection).queryByRole('button', { name: 'Pausieren' })
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(agentSection).getByRole('button', { name: 'Fortsetzen' })
    );

    await waitFor(() => {
      expect(updateAgentTokenLifecycleAction).toHaveBeenCalledWith({
        tokenId: 'token_codex_bv',
        decision: 'resume',
      });
    });
    expect(
      updateAgentTokenLifecycleAction.mock.calls[0]?.[0]
    ).not.toHaveProperty('authUserId');
    await waitFor(() => {
      expect(within(agentSection).getAllByText('Aktiv').length).toBeGreaterThan(
        0
      );
    });
  });

  it('requires explicit confirmation before revoking an agent token', async () => {
    const updateAgentTokenLifecycleAction = vi.fn<
      (
        input: UpdateBubblophyAgentTokenLifecycleActionInput
      ) => Promise<UpdateBubblophyAgentTokenLifecycleActionResult>
    >(async () => ({
      status: 'updated',
      token: {
        id: 'token_codex_bv',
        label: 'codex-local-lio',
        projectKey: 'BV',
        scopes: ['issues:read', 'issues:write', 'runs:create'],
        state: 'widerrufen',
        lastUsedAt: 'vor 12 Min.',
        expiresAt: 'läuft nicht automatisch ab',
      },
    }));
    const firstToken = databaseSnapshot.agentTokens[0];

    if (!firstToken) {
      throw new Error('Expected a token fixture.');
    }

    const singleTokenSnapshot = {
      ...databaseSnapshot,
      agentTokens: [firstToken],
    } satisfies DashboardSnapshot;

    render(
      <BubblophyDashboard
        snapshot={singleTokenSnapshot}
        updateAgentTokenLifecycleAction={updateAgentTokenLifecycleAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    const revokeButton = within(agentSection).getAllByRole('button', {
      name: 'Widerrufen',
    })[0];

    if (!revokeButton) {
      throw new Error('Expected a revoke button.');
    }

    fireEvent.click(revokeButton);

    expect(updateAgentTokenLifecycleAction).not.toHaveBeenCalled();
    expect(
      within(agentSection).getByText(/Widerruf ist endgültig/i)
    ).toBeInTheDocument();

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Endgültig widerrufen',
      })
    );

    await waitFor(() => {
      expect(updateAgentTokenLifecycleAction).toHaveBeenCalledWith({
        tokenId: 'token_codex_bv',
        decision: 'revoke',
      });
    });
    await waitFor(() => {
      expect(
        within(agentSection).getAllByText('Widerrufen').length
      ).toBeGreaterThan(0);
    });
    expect(
      within(agentSection).queryByRole('button', { name: 'Fortsetzen' })
    ).not.toBeInTheDocument();
  });

  it('does not show lifecycle actions for revoked or expired tokens', () => {
    const tokenLifecycleSnapshot = {
      ...databaseSnapshot,
      agentTokens: [
        {
          id: 'token_revoked',
          label: 'Widerrufenes Token',
          projectKey: 'BV',
          scopes: ['issues:read'],
          state: 'widerrufen',
          lastUsedAt: 'gestern',
          expiresAt: 'läuft nicht automatisch ab',
        },
        {
          id: 'token_expired',
          label: 'Abgelaufenes Token',
          projectKey: 'BV',
          scopes: ['issues:read'],
          state: 'abgelaufen',
          lastUsedAt: 'noch nie verwendet',
          expiresAt: '2000-01-01T00:00:00.000Z',
        },
      ],
    } satisfies DashboardSnapshot;

    render(
      <BubblophyDashboard
        snapshot={tokenLifecycleSnapshot}
        updateAgentTokenLifecycleAction={async () => ({
          status: 'database_unavailable',
        })}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(within(agentSection).getByText('Widerrufen')).toBeInTheDocument();
    expect(within(agentSection).getByText('Abgelaufen')).toBeInTheDocument();
    expect(
      within(agentSection).queryByRole('button', { name: 'Fortsetzen' })
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).queryByRole('button', { name: 'Widerrufen' })
    ).not.toBeInTheDocument();
  });

  it('shows forbidden lifecycle errors without changing the token state', async () => {
    const updateAgentTokenLifecycleAction = vi.fn<
      (
        input: UpdateBubblophyAgentTokenLifecycleActionInput
      ) => Promise<UpdateBubblophyAgentTokenLifecycleActionResult>
    >(async () => ({ status: 'forbidden' }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateAgentTokenLifecycleAction={updateAgentTokenLifecycleAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    const pauseButton = within(agentSection).getAllByRole('button', {
      name: 'Pausieren',
    })[0];

    if (!pauseButton) {
      throw new Error('Expected a pause button.');
    }

    fireEvent.click(pauseButton);

    expect(await within(agentSection).findByRole('alert')).toHaveTextContent(
      'Nur Owner und Maintainer können Agent-Tokens ändern.'
    );
    expect(within(agentSection).getAllByText('Aktiv').length).toBeGreaterThan(
      0
    );
  });

  it('shows lifecycle action exceptions without leaking token data', async () => {
    const updateAgentTokenLifecycleAction = vi.fn<
      (
        input: UpdateBubblophyAgentTokenLifecycleActionInput
      ) => Promise<UpdateBubblophyAgentTokenLifecycleActionResult>
    >(async () => {
      throw new Error(
        'tokenHash=<token-hash> Authorization: Bearer <agent-token>'
      );
    });
    const firstToken = databaseSnapshot.agentTokens[0];

    if (!firstToken) {
      throw new Error('Expected a token fixture.');
    }

    const singleTokenSnapshot = {
      ...databaseSnapshot,
      agentTokens: [firstToken],
    } satisfies DashboardSnapshot;

    render(
      <BubblophyDashboard
        snapshot={singleTokenSnapshot}
        updateAgentTokenLifecycleAction={updateAgentTokenLifecycleAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    const pauseButton = within(agentSection).getByRole('button', {
      name: 'Pausieren',
    });

    fireEvent.click(pauseButton);

    await waitFor(() => {
      expect(updateAgentTokenLifecycleAction).toHaveBeenCalledWith({
        tokenId: 'token_codex_bv',
        decision: 'pause',
      });
    });
    const alert = await within(agentSection).findByRole('alert');

    expect(alert).toHaveTextContent(
      'Das Agent-Token konnte gerade nicht geändert werden'
    );
    expect(within(agentSection).getAllByText('Aktiv').length).toBeGreaterThan(
      0
    );
    expect(
      within(agentSection).getByRole('button', { name: 'Pausieren' })
    ).toBeInTheDocument();
    expect(agentSection.textContent).not.toContain('<token-hash>');
    expect(alert.textContent).not.toContain('<agent-token>');
  });

  it('persists a title-only issue from the dialog when database data and an action are available', async () => {
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async (input) => ({
      status: 'created',
      issue: {
        id: 'BV-15',
        title: input.title,
        projectKey: input.projectKey,
        status: 'triage',
        priority: input.priority ?? 'mittel',
        owner: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
        description: input.description,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueAction={createIssueAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));
    expect(screen.getByRole('dialog')).toHaveClass(
      'max-h-[min(90svh,42rem)]',
      'overflow-y-auto'
    );

    expect(
      screen.getByRole('button', { name: 'Issue erstellen' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Nur lokal vormerken' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Als lokalen Draft anlegen' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /Lokale Drafts bleiben nur in dieser Oberfläche und werden nicht mit dem Projekt geteilt/i
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Planungsansicht folgt/i)
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Persistiertes Test-Issue' },
    });
    fireEvent.change(screen.getByLabelText('Priorität'), {
      target: { value: 'hoch' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue erstellen' }));

    await waitFor(() => {
      expect(createIssueAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        title: 'Persistiertes Test-Issue',
        description: '',
        priority: 'hoch',
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(navigationMocks.routerPush).toHaveBeenCalledWith(
      '/?project=BV&issue=BV-15'
    );
    expect(
      screen.getByRole('button', { name: 'Persistiertes Test-Issue' })
    ).toBeInTheDocument();

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(within(detailPanel).getByText('BV-15')).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Persistiertes Test-Issue')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).queryByText('Lokal / nicht gespeichert')
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByText(/Sample-Daten enthalten/i)
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).getByText(/Nutze „Plan entwerfen“/i)
    ).toBeInTheDocument();
  });

  it('labels local issue drafts as not persisted', async () => {
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async (input) => ({
      status: 'created',
      issue: {
        id: 'BV-LOCAL-SHOULD-NOT-PERSIST',
        title: input.title,
        projectKey: input.projectKey,
        status: 'triage',
        priority: input.priority ?? 'mittel',
        owner: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
        description: input.description,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueAction={createIssueAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));

    expect(
      screen.getByText(
        /Lokale Drafts bleiben nur in dieser Oberfläche und werden nicht mit dem Projekt geteilt/i
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Als lokalen Draft anlegen' })
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Nur lokal geprüfter Draft' },
    });
    fireEvent.change(screen.getByLabelText('Beschreibung'), {
      target: { value: 'Soll nicht an die Server Action gehen.' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Nur lokal vormerken' })
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(createIssueAction).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Nur lokal geprüfter Draft' })
    ).toBeInTheDocument();

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).getByText('Lokal / nicht gespeichert')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Soll nicht an die Server Action gehen.')
    ).toBeInTheDocument();
  });

  it('keeps the issue dialog open when the create action throws', async () => {
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async () => {
      throw new Error('database stack trace with internal details');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueAction={createIssueAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Bleibt nach Fehler erhalten' },
    });
    fireEvent.change(screen.getByLabelText('Beschreibung'), {
      target: { value: 'Beschreibung bleibt ebenfalls erhalten.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue erstellen' }));

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent(
      'Das Issue konnte gerade nicht gespeichert werden'
    );
    expect(alert.textContent).not.toContain('database stack trace');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Titel')).toHaveValue(
      'Bleibt nach Fehler erhalten'
    );
    expect(screen.getByLabelText('Beschreibung')).toHaveValue(
      'Beschreibung bleibt ebenfalls erhalten.'
    );
    expect(
      screen.queryByRole('button', { name: 'Bleibt nach Fehler erhalten' })
    ).not.toBeInTheDocument();
  });

  it('shows descriptions for existing database snapshot issues', () => {
    render(
      <BubblophyDashboard snapshot={databaseSnapshotWithIssueDescription} />
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).getByText('Beschreibung aus dem Dashboard-Snapshot.')
    ).toBeInTheDocument();
  });

  it('keeps the dialog open and shows action errors for denied database writes', async () => {
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async () => ({
      status: 'forbidden',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueAction={createIssueAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Nicht erlaubtes Issue' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue erstellen' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Du bist kein Mitglied dieses Projekts.'
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Nicht erlaubtes Issue' })
    ).not.toBeInTheDocument();
  });

  it('keeps sample and fallback snapshots on the local draft path', async () => {
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async () => ({
      status: 'database_unavailable',
    }));

    render(
      <BubblophyDashboard
        snapshot={dashboardSnapshot}
        createIssueAction={createIssueAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));

    expect(
      screen.queryByRole('button', { name: 'Issue erstellen' })
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Lokaler Fallback-Draft' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Draft anlegen' }));

    expect(createIssueAction).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Lokaler Fallback-Draft' })
    ).toBeInTheDocument();

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).queryByRole('button', { name: 'Run anfragen' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).getByText(/Lokale Drafts können keinen Agent-Run/i)
    ).toBeInTheDocument();
  });

  it('requests a human-only agent run and adds it to the run queue', async () => {
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => ({
      status: 'requested',
      run: {
        id: 'run_bv_12_requested',
        issueId: 'BV-12',
        agentLabel: 'codex-local-lio',
        state: 'wartet',
        requestedBy: 'Mensch',
        lastEvent:
          'Anfrage gespeichert: Bitte nur die Planung prüfen, nichts ausführen.',
      },
      createdAt: '2026-07-18T12:00:00.000Z',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithEmptyRuns}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).getByText(/kein Agent gestartet/i)
    ).toBeInTheDocument();
    expect(requestAgentRunAction).not.toHaveBeenCalled();
    fireEvent.change(within(detailPanel).getByLabelText('Agent-Token'), {
      target: { value: 'token_codex_bv' },
    });
    fireEvent.change(within(detailPanel).getByLabelText('Auftrag'), {
      target: {
        value: 'Bitte nur die Planung prüfen, nichts ausführen.',
      },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Run anfragen' })
    );

    await waitFor(() => {
      expect(requestAgentRunAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        agentTokenId: 'token_codex_bv',
        instructions: 'Bitte nur die Planung prüfen, nichts ausführen.',
      });
    });
    expect(requestAgentRunAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    await waitFor(() => {
      expect(within(runsSection).getByText('BV-12')).toBeInTheDocument();
    });
    expect(
      within(runsSection).getByText(/codex-local-lio · angefragt von Mensch/i)
    ).toBeInTheDocument();
    expect(within(runsSection).getByText('Wartet')).toBeInTheDocument();
    expect(
      within(runsSection).getByText(
        /Anfrage gespeichert: Bitte nur die Planung prüfen/i
      )
    ).toBeInTheDocument();
    expect(
      within(runsSection).queryByText(/gestartet/i)
    ).not.toBeInTheDocument();
    expect(
      within(runsSection).queryByText(/ausgeführt/i)
    ).not.toBeInTheDocument();
    expect(
      within(runsSection).queryByText(/Noch keine Runs/i)
    ).not.toBeInTheDocument();
  });

  it('explains every executable-token requirement after a denied run request', async () => {
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => ({ status: 'token_unavailable' }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithEmptyRuns}
        requestAgentRunAction={requestAgentRunAction}
      />
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );
    const detailPanel = screen.getByLabelText('Issue-Details');
    fireEvent.change(within(detailPanel).getByLabelText('Agent-Token'), {
      target: { value: 'token_codex_bv' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Run anfragen' })
    );

    expect(await within(detailPanel).findByRole('alert')).toHaveTextContent(
      'Prüfe Projekt, Status, Ablaufdatum sowie die Scopes issues:read und runs:update.'
    );
  });

  it('keeps the run request form usable when the action throws', async () => {
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => {
      throw new Error('internal token hash or database stack trace');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithEmptyRuns}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.change(within(detailPanel).getByLabelText('Agent-Token'), {
      target: { value: 'token_codex_bv' },
    });
    fireEvent.change(within(detailPanel).getByLabelText('Auftrag'), {
      target: {
        value: 'Bitte lokal prüfen und keine Ausführung starten.',
      },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Run anfragen' })
    );

    const alert = await within(detailPanel).findByRole('alert');

    expect(alert).toHaveTextContent(
      'Der Run konnte gerade nicht angefragt werden'
    );
    expect(alert.textContent).not.toContain('internal token hash');
    expect(alert.textContent).not.toContain('database stack trace');
    expect(within(detailPanel).getByLabelText('Auftrag')).toHaveValue(
      'Bitte lokal prüfen und keine Ausführung starten.'
    );
    expect(requestAgentRunAction).toHaveBeenCalledWith({
      issueId: 'BV-12',
      agentTokenId: 'token_codex_bv',
      instructions: 'Bitte lokal prüfen und keine Ausführung starten.',
    });

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(
      within(runsSection).getByText(/Noch keine Runs/i)
    ).toBeInTheDocument();
    expect(
      within(runsSection).queryByText('Bitte lokal prüfen')
    ).not.toBeInTheDocument();
  });

  it('does not expose human run decisions without the transition server action', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(within(runsSection).getByText('BV-14')).toBeInTheDocument();
    expect(within(runsSection).getByText('run_bv_14')).toBeInTheDocument();
    expect(
      within(runsSection).queryByRole('button', { name: 'Freigeben' })
    ).not.toBeInTheDocument();
    expect(
      within(runsSection).queryByRole('button', { name: 'Abbrechen' })
    ).not.toBeInTheDocument();
  });

  it('copies a concrete run PATCH handoff for approved runs with an active update token', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithApprovedRunUpdateToken}
      />
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(within(runsSection).getByText('run_bv_14')).toBeInTheDocument();
    expect(
      within(runsSection).getByText(
        /\$BUBBLOPHY_BASE_URL\/api\/agent-runs\/run_bv_14/
      )
    ).toBeInTheDocument();
    expect(
      within(runsSection).queryByText(
        /\$BUBBLOPHY_BASE_URL\/api\/agent-runs\/<run-id>/
      )
    ).not.toBeInTheDocument();
    expect(
      within(runsSection).getByText(/Authorization: Bearer <agent-token>/)
    ).toBeInTheDocument();
    expect(
      within(runsSection).queryByText(/test_plaintext_token/)
    ).not.toBeInTheDocument();
    expect(
      within(runsSection).queryByText(/tokenHash/)
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(runsSection).getByRole('button', {
        name: 'PATCH für run_bv_14 kopieren',
      })
    );

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/api/agent-runs/run_bv_14')
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Authorization: Bearer <agent-token>')
    );
    expect(navigator.clipboard.writeText).not.toHaveBeenCalledWith(
      expect.stringContaining('<run-id>')
    );
  });

  it('explains human review resolution for runs needing review', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReviewRun} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const runCard = within(runsSection)
      .getByText('run_bv_14')
      .closest('dl')?.parentElement;

    expect(runCard).toBeInstanceOf(HTMLElement);

    if (!runCard) {
      throw new Error('Expected the BV run card to render.');
    }

    expect(within(runCard).getByText('Review nötig')).toBeInTheDocument();
    expect(
      within(runCard).getByText(/Prüfe das Ergebnis im Issue BV-14/i)
    ).toBeInTheDocument();
    expect(
      within(runCard).getByText(/Status, Notiz oder Plan/i)
    ).toBeInTheDocument();
    expect(
      within(runCard).getByText(/bewusst einen neuen Run/i)
    ).toBeInTheDocument();
    expect(
      within(runCard).queryByRole('button', {
        name: /Review abschließen/i,
      })
    ).not.toBeInTheDocument();
    expect(
      within(runCard).queryByRole('button', { name: /Agent fortsetzen/i })
    ).not.toBeInTheDocument();
    expect(
      within(runCard).queryByRole('button', {
        name: /Automatisch weiterarbeiten/i,
      })
    ).not.toBeInTheDocument();
  });

  it('shows agent run result details for review runs', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReviewRun} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const runCard = within(runsSection)
      .getByText('run_bv_14')
      .closest('dl')?.parentElement;

    expect(runCard).toBeInstanceOf(HTMLElement);

    if (!runCard) {
      throw new Error('Expected the BV run card to render.');
    }

    expect(within(runCard).getByText('Agent-Ergebnis')).toBeInTheDocument();
    expect(
      within(runCard).getByText('Diff ist bereit für menschliche Prüfung.')
    ).toBeInTheDocument();
  });

  it('keeps agent run result summaries within responsive run cards', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReviewRun} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const runCard = within(runsSection)
      .getByText('run_bv_14')
      .closest('dl')?.parentElement;

    expect(runCard).toBeInstanceOf(HTMLElement);

    if (!runCard) {
      throw new Error('Expected the BV run card to render.');
    }

    const resultText = within(runCard).getByText(
      'Diff ist bereit für menschliche Prüfung.'
    );
    const resultBlock = resultText.closest('div');

    expect(resultBlock).toBeInstanceOf(HTMLElement);

    if (!resultBlock) {
      throw new Error('Expected the run result block to render.');
    }

    expect(runCard).toHaveClass('min-w-0');
    expect(resultBlock).toHaveClass('min-w-0');
    expect(resultText).toHaveClass('break-words');
  });

  it('shows failure run result message', () => {
    render(
      <BubblophyDashboard snapshot={databaseSnapshotWithFailedRunResult} />
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const runCard = within(runsSection)
      .getByText('run_bv_14')
      .closest('dl')?.parentElement;

    expect(runCard).toBeInstanceOf(HTMLElement);

    if (!runCard) {
      throw new Error('Expected the BV run card to render.');
    }

    expect(within(runCard).getByText('Fehlgeschlagen')).toBeInTheDocument();
    expect(within(runCard).getByText('Agent-Ergebnis')).toBeInTheDocument();
    expect(
      within(runCard).getByText('Checkout konnte nicht vorbereitet werden.')
    ).toBeInTheDocument();
  });

  it('does not render raw JSON secrets in run result details', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReviewRun} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const resultBlock = within(runsSection)
      .getByText('Diff ist bereit für menschliche Prüfung.')
      .closest('div');

    expect(resultBlock).toBeInstanceOf(HTMLElement);

    if (!resultBlock) {
      throw new Error('Expected the run result block to render.');
    }

    expect(within(resultBlock).getByText('Agent-Ergebnis')).toBeInTheDocument();
    expect(within(resultBlock).queryByText(/token/i)).not.toBeInTheDocument();
    expect(within(resultBlock).queryByText(/secret/i)).not.toBeInTheDocument();
    expect(
      within(resultBlock).queryByText(/authorization/i)
    ).not.toBeInTheDocument();
    expect(within(resultBlock).queryByText(/[{}"]/)).not.toBeInTheDocument();
  });

  it('saves agent run result as an issue review note', async () => {
    const createIssueNoteAction = vi.fn<
      (
        input: CreateBubblophyIssueNoteActionInput
      ) => Promise<CreateBubblophyIssueNoteActionResult>
    >(async (input) => ({
      status: 'created',
      note: {
        id: 'event_note_run_result',
        note: input.note,
        actor: 'Mensch',
        createdAt: '2026-06-14T11:00:00.000Z',
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithReviewRun}
        createIssueNoteAction={createIssueNoteAction}
      />
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(detailPanel).toHaveTextContent('BV-14');

    fireEvent.click(
      within(detailPanel).getByRole('button', {
        name: 'Als Notiz übernehmen',
      })
    );

    await waitFor(() => {
      expect(createIssueNoteAction).toHaveBeenCalledWith({
        issueId: 'BV-14',
        note: 'Agent-Ergebnis aus Run run_bv_14:\n\nDiff ist bereit für menschliche Prüfung.',
      });
    });

    expect(createIssueNoteAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(
        within(detailPanel).getByText(
          'Agent-Ergebnis aus Run run_bv_14 wurde als Notiz gespeichert.'
        )
      ).toBeInTheDocument();
    });

    const notesRegion = within(detailPanel).getByLabelText('Notizen für BV-14');

    expect(notesRegion).toHaveTextContent('Agent-Ergebnis aus Run run_bv_14:');
    expect(notesRegion).toHaveTextContent(
      'Diff ist bereit für menschliche Prüfung.'
    );
  });

  it('does not offer run result note persistence without note permission', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReviewRun} />);

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(detailPanel).toHaveTextContent(
      'Diff ist bereit für menschliche Prüfung.'
    );
    expect(
      within(detailPanel).queryByRole('button', {
        name: 'Als Notiz übernehmen',
      })
    ).not.toBeInTheDocument();
  });

  it('does not claim review completion when saving run result note', async () => {
    const createIssueNoteAction = vi.fn<
      (
        input: CreateBubblophyIssueNoteActionInput
      ) => Promise<CreateBubblophyIssueNoteActionResult>
    >(async (input) => ({
      status: 'created',
      note: {
        id: 'event_note_run_result',
        note: input.note,
        actor: 'Mensch',
        createdAt: '2026-06-14T11:00:00.000Z',
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithReviewRun}
        createIssueNoteAction={createIssueNoteAction}
      />
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', {
        name: 'Als Notiz übernehmen',
      })
    );

    await waitFor(() => {
      expect(createIssueNoteAction).toHaveBeenCalled();
    });

    expect(screen.queryByText(/Review abgeschlossen/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Review freigegeben/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Run freigegeben/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Agent fortsetzen/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Automatisch weiterarbeiten/i)
    ).not.toBeInTheDocument();
  });

  it('opens linked issue from run queue', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReviewRun} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const runCard = within(runsSection)
      .getByText('run_bv_14')
      .closest('dl')?.parentElement;

    expect(runCard).toBeInstanceOf(HTMLElement);

    if (!runCard) {
      throw new Error('Expected the BV run card to render.');
    }

    fireEvent.click(
      within(runCard).getByRole('button', { name: 'Issue öffnen' })
    );

    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');
    expect(navigationMocks.routerPush).toHaveBeenLastCalledWith(
      '/?issue=BV-14'
    );
  });

  it('does not render issue navigation for runs without resolvable issue', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithUnresolvedRun} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const runCard = within(runsSection)
      .getByText('run_missing_issue')
      .closest('dl')?.parentElement;

    expect(runCard).toBeInstanceOf(HTMLElement);

    if (!runCard) {
      throw new Error('Expected the unresolved run card to render.');
    }

    expect(
      within(runCard).queryByRole('button', { name: 'Issue öffnen' })
    ).not.toBeInTheDocument();
  });

  it('does not show human review resolution guidance for non-review runs', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithApprovedRunUpdateToken}
      />
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const runCard = within(runsSection)
      .getByText('run_bv_14')
      .closest('dl')?.parentElement;

    expect(runCard).toBeInstanceOf(HTMLElement);

    if (!runCard) {
      throw new Error('Expected the BV run card to render.');
    }

    expect(within(runCard).queryByText('Review nötig')).not.toBeInTheDocument();
  });

  it('keeps agent handoff commands horizontally scrollable', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithApprovedRunUpdateToken}
      />
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const commandText = within(runsSection).getByText(
      /\$BUBBLOPHY_BASE_URL\/api\/agent-runs\/run_bv_14/
    );
    const commandBlock = commandText.closest('pre');

    expect(commandBlock).toBeInstanceOf(HTMLElement);
    expect(commandBlock).toHaveClass('min-w-0', 'overflow-x-auto');
    expect(commandBlock?.parentElement).toHaveClass('min-w-0');
  });

  it('does not show concrete run PATCH handoff without a matching active update token', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(within(runsSection).getByText('run_no_08')).toBeInTheDocument();
    expect(
      within(runsSection).queryByRole('button', {
        name: 'PATCH für run_no_08 kopieren',
      })
    ).not.toBeInTheDocument();
    expect(
      within(runsSection).queryByText(
        /\$BUBBLOPHY_BASE_URL\/api\/agent-runs\/run_no_08/
      )
    ).not.toBeInTheDocument();
  });

  it('approves a requested run through a real server action', async () => {
    const transitionAgentRunAction = vi.fn<
      (
        input: TransitionBubblophyAgentRunActionInput
      ) => Promise<TransitionBubblophyAgentRunActionResult>
    >(async () => ({
      status: 'updated',
      run: {
        id: 'run_bv_14',
        issueId: 'BV-14',
        agentLabel: 'codex-local-lio',
        state: 'freigegeben',
        requestedBy: 'Mensch',
        lastEvent: 'Run BV-14 wurde menschlich freigegeben.',
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        transitionAgentRunAction={transitionAgentRunAction}
      />
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    fireEvent.click(
      within(runsSection).getByRole('button', { name: 'Freigeben' })
    );

    await waitFor(() => {
      expect(transitionAgentRunAction).toHaveBeenCalledWith({
        runId: 'run_bv_14',
        decision: 'approve',
      });
    });
    expect(transitionAgentRunAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(within(runsSection).getByText('Freigegeben')).toBeInTheDocument();
    });
    expect(
      within(runsSection).getByText('Run BV-14 wurde menschlich freigegeben.')
    ).toBeInTheDocument();
    expect(
      within(runsSection).queryByRole('button', { name: 'Freigeben' })
    ).not.toBeInTheDocument();
  });

  it('keeps run decision buttons visible and shows denied membership errors', async () => {
    const transitionAgentRunAction = vi.fn<
      (
        input: TransitionBubblophyAgentRunActionInput
      ) => Promise<TransitionBubblophyAgentRunActionResult>
    >(async () => ({
      status: 'forbidden',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        transitionAgentRunAction={transitionAgentRunAction}
      />
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    fireEvent.click(
      within(runsSection).getByRole('button', { name: 'Abbrechen' })
    );

    await waitFor(() => {
      expect(transitionAgentRunAction).toHaveBeenCalledWith({
        runId: 'run_bv_14',
        decision: 'cancel',
      });
    });
    expect(await within(runsSection).findByRole('alert')).toHaveTextContent(
      'Du bist kein Mitglied dieses Projekts.'
    );
    await waitFor(() => {
      expect(
        within(runsSection).getByRole('button', { name: 'Freigeben' })
      ).toBeInTheDocument();
    });
  });

  it('keeps run decision buttons visible when the transition action throws', async () => {
    const transitionAgentRunAction = vi.fn<
      (
        input: TransitionBubblophyAgentRunActionInput
      ) => Promise<TransitionBubblophyAgentRunActionResult>
    >(async () => {
      throw new Error('run transition failed');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        transitionAgentRunAction={transitionAgentRunAction}
      />
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    fireEvent.click(
      within(runsSection).getByRole('button', { name: 'Freigeben' })
    );

    await waitFor(() => {
      expect(transitionAgentRunAction).toHaveBeenCalledWith({
        runId: 'run_bv_14',
        decision: 'approve',
      });
    });
    expect(await within(runsSection).findByRole('alert')).toHaveTextContent(
      'Die Run-Entscheidung konnte gerade nicht gespeichert werden'
    );
    expect(
      within(runsSection).getByRole('button', { name: 'Freigeben' })
    ).toBeInTheDocument();
    expect(
      within(runsSection).getByRole('button', { name: 'Abbrechen' })
    ).toBeInTheDocument();
  });

  it('blocks run requests for database issues without active project tokens', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithoutAgentTokens}
        requestAgentRunAction={async () => ({
          status: 'database_unavailable',
        })}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).queryByRole('button', { name: 'Run anfragen' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).getByText(/kein aktives Agent-Token verfügbar/i)
    ).toBeInTheDocument();
  });

  it('does not expose persistent run requests when the database is unavailable', () => {
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => ({
      status: 'database_unavailable',
    }));
    const unavailableWithIssueAndToken = {
      ...databaseUnavailableSnapshot,
      projects: databaseSnapshot.projects,
      issues: databaseSnapshot.issues,
      agentTokens: databaseSnapshot.agentTokens,
    } satisfies DashboardSnapshot;

    render(
      <BubblophyDashboard
        snapshot={unavailableWithIssueAndToken}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).queryByRole('button', { name: 'Run anfragen' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).getByText(/Datenbank ist nicht bereit/i)
    ).toBeInTheDocument();
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('does not expose operative run actions for sample snapshots', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(
      screen.queryByRole('button', { name: /Run-Queue öffnen/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Run prüfen|Run starten/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Run anfragen' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Sample-Daten erlauben keine Run-Anfrage/i)
    ).toBeInTheDocument();
    expect(
      within(runsSection).getByText(/Sample\/Fallback zeigt keine operative/i)
    ).toBeInTheDocument();
    expect(
      within(runsSection).queryByText('Plan wartet auf Freigabe')
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Beispielhafte Audit-Vorschau/i)
    ).toBeInTheDocument();
  });

  it('shows an honest empty run state for database snapshots without runs', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithEmptyRuns} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(
      within(runsSection).getByText(/Noch keine Runs/i)
    ).toBeInTheDocument();
    expect(
      within(runsSection).getByText(/explizite menschliche Freigabe/i)
    ).toBeInTheDocument();
  });

  it('passes real section links into the shared sidebar shell', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const navigation = screen.getByLabelText('Bubblophy Navigation');

    expect(
      within(navigation).getByRole('link', { name: 'Projekte' })
    ).toHaveAttribute('href', '/#projects');
    expect(
      within(navigation).getByRole('link', { name: 'Issues' })
    ).toHaveAttribute('href', '/#issues');
    expect(
      within(navigation).getByRole('link', { name: 'Agent-Tokens' })
    ).toHaveAttribute('href', '/#agents');
    expect(
      within(navigation).getByRole('link', { name: 'Runs' })
    ).toHaveAttribute('href', '/#runs');
    expect(
      within(navigation).getByRole('link', { name: 'Audit' })
    ).toHaveAttribute('href', '/#activity');
  });

  it('points shared sidebar links at rendered dashboard sections', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const sectionIds = getBubblophySidebarSectionIds();

    expect(sectionIds).toEqual([
      'overview',
      'projects',
      'issues',
      'agents',
      'runs',
      'activity',
    ]);

    for (const sectionId of sectionIds) {
      expect(document.getElementById(sectionId)).toBeInstanceOf(HTMLElement);
    }
  });
});
