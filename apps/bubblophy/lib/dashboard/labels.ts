import type {
  AgentRunState,
  AgentTokenState,
  IssuePriority,
  IssueStatus,
  ProjectHealth,
} from '@/lib/dashboard/types';

export const issueStatusLabels = {
  triage: 'Triage',
  geplant: 'Geplant',
  bereit: 'Bereit',
  in_arbeit: 'In Arbeit',
  review: 'Review',
  blockiert: 'Blockiert',
  erledigt: 'Erledigt',
} satisfies Record<IssueStatus, string>;

export const issuePriorityLabels = {
  niedrig: 'Niedrig',
  mittel: 'Mittel',
  hoch: 'Hoch',
} satisfies Record<IssuePriority, string>;

export const projectHealthLabels = {
  stabil: 'Stabil',
  aufmerksam: 'Aufmerksam',
  blockiert: 'Blockiert',
} satisfies Record<ProjectHealth, string>;

export const agentTokenStateLabels = {
  aktiv: 'Aktiv',
  pausiert: 'Pausiert',
  widerrufen: 'Widerrufen',
  abgelaufen: 'Abgelaufen',
} satisfies Record<AgentTokenState, string>;

export const agentRunStateLabels = {
  wartet: 'Wartet',
  freigegeben: 'Freigegeben',
  läuft: 'Läuft',
  review: 'Review',
  abgeschlossen: 'Abgeschlossen',
  abgebrochen: 'Abgebrochen',
  fehlgeschlagen: 'Fehlgeschlagen',
} satisfies Record<AgentRunState, string>;
