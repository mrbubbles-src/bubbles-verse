import type {
  CreateBubblophyAgentTokenActionInput,
  CreateBubblophyAgentTokenActionResult,
  CreateBubblophyIssueActionInput,
  CreateBubblophyIssueActionResult,
  CreateBubblophyIssuePlanActionInput,
  CreateBubblophyIssuePlanActionResult,
  CreateBubblophyProjectActionInput,
  CreateBubblophyProjectActionResult,
  UpdateBubblophyIssueStatusActionInput,
  UpdateBubblophyIssueStatusActionResult,
} from '@/app/actions';
import type { DashboardSnapshot } from '@/lib/dashboard/types';
import type React from 'react';

import { dashboardSnapshot } from '@/lib/dashboard/sample-data';

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BubblophyDashboard } from '@/components/dashboard/bubblophy-dashboard';

const databaseSnapshot = {
  ...dashboardSnapshot,
  meta: {
    dataSource: 'database',
    label: 'Datenbankdaten',
    description: 'Read-only Testdaten.',
  },
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

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
  }),
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
  });

  it('filters the issue queue when a project is selected', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    const novariProjectButton = within(projectsSection).getByRole('button', {
      name: /^Novari\s+NO\s+Stabil/i,
    });

    fireEvent.click(novariProjectButton);

    expect(screen.getByText('Gefiltert auf Projekt NO.')).toBeInTheDocument();
    expect(novariProjectButton).toHaveAttribute('aria-pressed', 'true');
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
  });

  it('opens a local draft dialog from the new issue action', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Neues Issue als Draft')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'In Datenbank speichern' })
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
        health: 'stabil',
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
        memberCount: 1,
        agentTokenCount: 0,
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
      name: /^Zentrum\s+ZEN\s+Stabil/i,
    });

    expect(createdProject).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Gefiltert auf Projekt ZEN.')).toBeInTheDocument();
    expect(
      screen.getByText('Noch keine Issues für diesen Filter.')
    ).toBeInTheDocument();
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
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Doppeltes Projekt\s+DP/i })
    ).not.toBeInTheDocument();
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
        plaintextToken: 'bubblophy_agent_plaintext_once',
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
      within(dialog).getByText('bubblophy_agent_plaintext_once')
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/später nicht wieder sichtbar/i)
    ).toBeInTheDocument();
    expect(within(agentSection).getByText('Codex lokal')).toBeInTheDocument();
    expect(
      within(agentSection).queryByText('bubblophy_agent_plaintext_once')
    ).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Fertig' }));

    expect(
      screen.queryByText('bubblophy_agent_plaintext_once')
    ).not.toBeInTheDocument();
    expect(within(agentSection).getByText('Codex lokal')).toBeInTheDocument();
  });

  it('persists an issue from the dialog when database data and an action are available', async () => {
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async () => ({
      status: 'created',
      issue: {
        id: 'BV-15',
        title: 'Persistiertes Test-Issue',
        projectKey: 'BV',
        status: 'triage',
        priority: 'hoch',
        owner: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
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
      screen.getByRole('button', { name: 'In Datenbank speichern' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Nur lokal anlegen' })
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Persistiertes Test-Issue' },
    });
    fireEvent.change(screen.getByLabelText('Beschreibung'), {
      target: { value: 'Dieses Issue kommt aus der Server Action.' },
    });
    fireEvent.change(screen.getByLabelText('Priorität'), {
      target: { value: 'hoch' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'In Datenbank speichern' })
    );

    await waitFor(() => {
      expect(createIssueAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        title: 'Persistiertes Test-Issue',
        description: 'Dieses Issue kommt aus der Server Action.',
        priority: 'hoch',
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: 'Persistiertes Test-Issue' })
    ).toBeInTheDocument();

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(within(detailPanel).getByText('BV-15')).toBeInTheDocument();
    expect(
      within(detailPanel).queryByText('Lokal / nicht gespeichert')
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByText(/Sample-Daten enthalten/i)
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).getByText(
        /Plan-Schritte sind noch nicht ausformuliert/i
      )
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
    fireEvent.click(
      screen.getByRole('button', { name: 'In Datenbank speichern' })
    );

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
      screen.queryByRole('button', { name: 'In Datenbank speichern' })
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Lokaler Fallback-Draft' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Draft anlegen' }));

    expect(createIssueAction).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Lokaler Fallback-Draft' })
    ).toBeInTheDocument();
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
});
