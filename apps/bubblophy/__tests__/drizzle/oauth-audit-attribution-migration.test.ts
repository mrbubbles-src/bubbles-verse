import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const migrationPath = join(
  process.cwd(),
  'drizzle/0005_add_oauth_audit_attribution.sql'
);
const migrationSql = existsSync(migrationPath)
  ? readFileSync(migrationPath, 'utf8').replace(/\s+/g, ' ').toLowerCase()
  : '';
const journalSql = readFileSync(
  join(process.cwd(), 'drizzle/meta/_journal.json'),
  'utf8'
);

describe('OAuth audit attribution migration', () => {
  it('adds nullable OAuth client attribution to plans and audit events', () => {
    expect(migrationSql).toContain(
      'alter table "bubblophy_issue_plans" add column "created_by_oauth_client_id" text'
    );
    expect(migrationSql).toContain(
      'alter table "bubblophy_issue_events" add column "actor_oauth_client_id" text'
    );
    expect(migrationSql).toContain(
      'alter table "bubblophy_project_events" add column "actor_oauth_client_id" text'
    );
  });

  it('registers the attribution migration in the Drizzle journal', () => {
    expect(journalSql).toContain('"tag": "0005_add_oauth_audit_attribution"');
  });
});
