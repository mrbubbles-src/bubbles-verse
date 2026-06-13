export type ProjectHealth = 'stabil' | 'aufmerksam' | 'blockiert';

export type IssueStatus =
  | 'triage'
  | 'geplant'
  | 'bereit'
  | 'in_arbeit'
  | 'review'
  | 'blockiert';

export type IssuePriority = 'niedrig' | 'mittel' | 'hoch';

export type AgentRunState = 'wartet' | 'freigegeben' | 'läuft' | 'review';

export type AgentTokenState = 'aktiv' | 'pausiert';

export interface ProjectSummary {
  id: string;
  name: string;
  key: string;
  health: ProjectHealth;
  openIssues: number;
  readyIssues: number;
  blockedIssues: number;
  memberCount: number;
  agentTokenCount: number;
}

export interface IssueSummary {
  id: string;
  title: string;
  description?: string;
  projectKey: string;
  status: IssueStatus;
  priority: IssuePriority;
  owner: string;
  planSteps: number;
  approvalRequired: boolean;
}

export interface AgentTokenSummary {
  id: string;
  label: string;
  projectKey: string;
  scopes: string[];
  state: AgentTokenState;
  lastUsedAt: string;
}

export interface AgentRunSummary {
  id: string;
  issueId: string;
  agentLabel: string;
  state: AgentRunState;
  requestedBy: string;
  lastEvent: string;
}

export interface ActivityEvent {
  id: string;
  label: string;
  actor: string;
  occurredAt: string;
}

export type DashboardDataSource =
  | 'sample'
  | 'database'
  | 'empty_database'
  | 'database_unavailable';

export type DashboardUnavailableReason =
  | 'not_configured'
  | 'schema_missing'
  | 'connection_failed'
  | 'unknown';

export interface DashboardSnapshotMeta {
  dataSource: DashboardDataSource;
  label: string;
  description: string;
  reason?: DashboardUnavailableReason;
  hint?: string;
}

export interface DashboardSnapshot {
  meta: DashboardSnapshotMeta;
  projects: ProjectSummary[];
  issues: IssueSummary[];
  agentTokens: AgentTokenSummary[];
  agentRuns: AgentRunSummary[];
  activity: ActivityEvent[];
}
