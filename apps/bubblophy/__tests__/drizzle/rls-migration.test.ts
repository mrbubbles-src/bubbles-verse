import { existsSync, readdirSync, readFileSync } from 'node:fs';
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
const invitationMigrationPath = join(
  process.cwd(),
  'drizzle/0006_add_project_invitations.sql'
);
const invitationMigrationSql = existsSync(invitationMigrationPath)
  ? normalizeSql(readFileSync(invitationMigrationPath, 'utf8'))
  : '';
const profileMigrationPath = join(
  process.cwd(),
  'drizzle/0007_add_bubblophy_user_profiles.sql'
);
const profileMigrationSql = existsSync(profileMigrationPath)
  ? normalizeSql(readFileSync(profileMigrationPath, 'utf8'))
  : '';
const allMigrationSql = readdirSync(join(process.cwd(), 'drizzle'))
  .filter((fileName) => /^\d{4}_.+\.sql$/.test(fileName))
  .sort()
  .map((fileName) =>
    readFileSync(join(process.cwd(), 'drizzle', fileName), 'utf8')
  );
const normalizedAllMigrationSql = normalizeSql(allMigrationSql.join('\n'));
const invitationPolicyPattern =
  /\bcreate\s+policy\b[^;]*\bon\s+(?:(?:"public"|public)\.)?(?:"bubblophy_project_invitations"|bubblophy_project_invitations)(?=\s|;|$)/;

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

/** Splits SQL into normalized semicolon-delimited statements. */
function getSqlStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((statement) => normalizeSql(statement))
    .filter(Boolean);
}

/** Detects grants that expose the invitation table directly or schema-wide. */
function grantsDirectInvitationAccess(statement: string): boolean {
  if (!/\bgrant\b/.test(statement)) {
    return false;
  }

  return (
    /(?:"bubblophy_project_invitations"|\bbubblophy_project_invitations\b)/.test(
      statement
    ) ||
    /\bon\s+all\s+tables\s+in\s+schema\s+(?:"public"|public)(?=\s|,|$)/.test(
      statement
    )
  );
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

  it('keeps invitation identities and token hashes behind server-only access', () => {
    expect(drizzleJournalSql).toContain(
      '"tag": "0006_add_project_invitations"'
    );
    expect(invitationMigrationSql).toContain(
      'alter table "public"."bubblophy_project_invitations" enable row level security'
    );
    expect(invitationMigrationSql).toContain(
      'revoke all on table "public"."bubblophy_project_invitations" from public, anon, authenticated'
    );
    expect(invitationMigrationSql).toContain(
      '"bubblophy_project_invitations"."accepted_at" < "bubblophy_project_invitations"."expires_at"'
    );
    expect(
      allMigrationSql
        .flatMap(getSqlStatements)
        .filter(grantsDirectInvitationAccess)
    ).toEqual([]);
    expect(normalizedAllMigrationSql).not.toMatch(invitationPolicyPattern);
  });

  it('keeps display profiles behind the membership-scoped server read', () => {
    expect(drizzleJournalSql).toContain(
      '"tag": "0007_add_bubblophy_user_profiles"'
    );
    expect(profileMigrationSql).toContain(
      'alter table "public"."bubblophy_user_profiles" enable row level security'
    );
    expect(profileMigrationSql).toContain(
      'revoke all on table "public"."bubblophy_user_profiles" from public, anon, authenticated'
    );
    expect(profileMigrationSql).not.toContain('grant ');
    expect(profileMigrationSql).not.toContain('create policy');
  });

  it('detects future invitation grants and policies across SQL variants', () => {
    for (const statement of [
      'GRANT SELECT ON "public"."bubblophy_project_invitations" TO authenticated',
      'GRANT ALL ON TABLE public.bubblophy_project_invitations TO authenticated',
      'GRANT SELECT ON TABLE public.foo, public.bubblophy_project_invitations TO authenticated',
      'GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated',
    ]) {
      expect(grantsDirectInvitationAccess(normalizeSql(statement))).toBe(true);
    }
    expect(
      normalizeSql(
        'SET search_path = public; CREATE POLICY invite_read ON bubblophy_project_invitations FOR SELECT USING (true);'
      )
    ).toMatch(invitationPolicyPattern);
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
