import { existsSync, readFileSync } from 'node:fs';
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
const sensitiveReadHardeningPath = join(
  process.cwd(),
  'drizzle/0003_close_sensitive_direct_reads.sql'
);
const sensitiveReadHardeningSql = existsSync(sensitiveReadHardeningPath)
  ? normalizeSql(readFileSync(sensitiveReadHardeningPath, 'utf8'))
  : '';
const oauthDirectReadHardeningPath = join(
  process.cwd(),
  'drizzle/0004_close_oauth_direct_reads.sql'
);
const oauthDirectReadHardeningSql = existsSync(oauthDirectReadHardeningPath)
  ? normalizeSql(readFileSync(oauthDirectReadHardeningPath, 'utf8'))
  : '';

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

  it('closes direct authenticated reads of raw agent results and events', () => {
    expect(drizzleJournalSql).toContain(
      '"tag": "0003_close_sensitive_direct_reads"'
    );
    expect(sensitiveReadHardeningSql).toContain(
      'revoke select on table "public"."bubblophy_agent_runs" from authenticated'
    );
    expect(sensitiveReadHardeningSql).toContain(
      'revoke select on table "public"."bubblophy_issue_events" from authenticated'
    );
    expect(sensitiveReadHardeningSql).toContain(
      'drop policy if exists "bubblophy project members read agent runs" on "public"."bubblophy_agent_runs"'
    );
    expect(sensitiveReadHardeningSql).toContain(
      'drop policy if exists "bubblophy project members read issue events" on "public"."bubblophy_issue_events"'
    );
  });

  it('blocks OAuth client JWTs from every direct Bubblophy table operation', () => {
    expect(drizzleJournalSql).toContain(
      '"tag": "0004_close_oauth_direct_reads"'
    );

    for (const tableName of rlsProtectedTables) {
      expect(oauthDirectReadHardeningSql).toContain(
        `create policy "bubblophy direct sessions exclude oauth clients" on "public"."${tableName}" as restrictive for all to authenticated`
      );
    }

    const policies = getPolicyStatements(oauthDirectReadHardeningSql);

    expect(policies).toHaveLength(rlsProtectedTables.length);

    for (const policy of policies) {
      expect(policy).toContain(
        `using (((select auth.jwt()) ->> 'client_id') is null)`
      );
      expect(policy).toContain(
        `with check (((select auth.jwt()) ->> 'client_id') is null)`
      );
    }
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
