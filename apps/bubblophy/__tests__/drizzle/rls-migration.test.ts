import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const rlsMigrationPath = join(
  process.cwd(),
  'drizzle/0002_bubblophy_rls_baseline.sql'
);
const rlsMigrationSql = readFileSync(rlsMigrationPath, 'utf8');
const normalizedRlsMigrationSql = normalizeSql(rlsMigrationSql);
const drizzleJournalSql = readFileSync(
  join(process.cwd(), 'drizzle/meta/_journal.json'),
  'utf8'
);

const rlsProtectedTables = [
  'bubblophy_projects',
  'bubblophy_project_members',
  'bubblophy_issues',
  'bubblophy_issue_plans',
  'bubblophy_issue_events',
  'bubblophy_project_events',
  'bubblophy_agent_tokens',
  'bubblophy_agent_runs',
] as const;

/**
 * Collapses generated SQL formatting so policy tests stay focused on the
 * access contract instead of whitespace or statement wrapping.
 */
function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Extracts policy statements for focused RLS checks without parsing the full
 * PostgreSQL grammar.
 */
function getPolicyStatements(sql: string): string[] {
  return sql
    .split('--> statement-breakpoint')
    .map((statement) => normalizeSql(statement))
    .filter((statement) => statement.startsWith('create policy'));
}

describe('bubblophy RLS migration', () => {
  it('keeps the RLS baseline in the Drizzle migration journal', () => {
    expect(drizzleJournalSql).toContain('"tag": "0002_bubblophy_rls_baseline"');
  });

  it('enables row level security on every Bubblophy table', () => {
    for (const tableName of rlsProtectedTables) {
      expect(normalizedRlsMigrationSql).toContain(
        `alter table "public"."${tableName}" enable row level security`
      );
    }
  });

  it('revokes inherited direct grants before adding narrow read policies', () => {
    for (const tableName of rlsProtectedTables) {
      expect(normalizedRlsMigrationSql).toContain(
        `revoke all on table "public"."${tableName}" from public, anon, authenticated`
      );
    }
  });

  it('does not add broad authenticated allow-all policies', () => {
    const authenticatedPolicies = getPolicyStatements(rlsMigrationSql).filter(
      (statement) => statement.includes(' to authenticated ')
    );

    expect(authenticatedPolicies.length).toBeGreaterThan(0);

    for (const policy of authenticatedPolicies) {
      expect(policy).not.toMatch(/using\s*\(\s*true\s*\)/);
      expect(policy).not.toMatch(/with check\s*\(\s*true\s*\)/);
    }
  });

  it('keeps direct authenticated access to agent token hashes closed', () => {
    expect(normalizedRlsMigrationSql).toContain(
      'revoke all on table "public"."bubblophy_agent_tokens" from public, anon, authenticated'
    );
    expect(normalizedRlsMigrationSql).not.toContain(
      'grant select on table "public"."bubblophy_agent_tokens" to authenticated'
    );

    const agentTokenPolicies = getPolicyStatements(rlsMigrationSql).filter(
      (statement) =>
        statement.includes(' on "public"."bubblophy_agent_tokens" ')
    );

    expect(agentTokenPolicies).toEqual([]);
  });

  it('limits direct authenticated reads to project membership boundaries', () => {
    expect(normalizedRlsMigrationSql).toContain(
      'create or replace function "private"."bubblophy_is_project_member"'
    );
    expect(normalizedRlsMigrationSql).toContain(
      'create or replace function "private"."bubblophy_can_read_issue"'
    );

    for (const tableName of [
      'bubblophy_projects',
      'bubblophy_project_members',
      'bubblophy_issues',
      'bubblophy_issue_plans',
      'bubblophy_issue_events',
      'bubblophy_project_events',
      'bubblophy_agent_runs',
    ]) {
      expect(normalizedRlsMigrationSql).toContain(
        `on "public"."${tableName}" for select to authenticated`
      );
    }
  });
});
