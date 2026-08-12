import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { bubblophyProjectMembers } from '@/drizzle/db/schema';

const migrationSql = readFileSync(
  join(process.cwd(), 'drizzle/0010_giant_cannonball.sql'),
  'utf8'
)
  .replace(/\s+/g, ' ')
  .toLowerCase();
const journal = readFileSync(
  join(process.cwd(), 'drizzle/meta/_journal.json'),
  'utf8'
);

describe('member page cursor index migration', () => {
  it('indexes the concrete project and stable oldest-first cursor', () => {
    expect(migrationSql).toContain(
      'create index "bubblophy_project_members_project_created_auth_user_idx" on "bubblophy_project_members" using btree ("project_id","created_at","auth_user_id")'
    );

    const indexConfig = getTableConfig(bubblophyProjectMembers).indexes.find(
      (candidate) =>
        candidate.config.name ===
        'bubblophy_project_members_project_created_auth_user_idx'
    );

    expect(indexConfig?.config.columns).toHaveLength(3);
  });

  it('registers the member cursor migration in the Drizzle journal', () => {
    expect(journal).toContain('"tag": "0010_giant_cannonball"');
  });
});
