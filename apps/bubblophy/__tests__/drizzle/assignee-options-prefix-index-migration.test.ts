import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { bubblophyProjectMembers } from '@/drizzle/db/schema';

const migrationSql = readFileSync(
  join(process.cwd(), 'drizzle/0011_useful_eternity.sql'),
  'utf8'
)
  .replace(/\s+/g, ' ')
  .toLowerCase();
const journal = readFileSync(
  join(process.cwd(), 'drizzle/meta/_journal.json'),
  'utf8'
);

describe('assignee options prefix index migration', () => {
  it('indexes the project-bound case-insensitive Auth user ID prefix', () => {
    expect(migrationSql).toContain(
      'create index "bubblophy_project_members_project_auth_user_prefix_idx" on "bubblophy_project_members" using btree ("project_id",lower("auth_user_id") text_pattern_ops,"auth_user_id")'
    );
    const memberIndex = getTableConfig(bubblophyProjectMembers).indexes.find(
      (candidate) =>
        candidate.config.name ===
        'bubblophy_project_members_project_auth_user_prefix_idx'
    );
    expect(memberIndex?.config.method).toBe('btree');
    expect(memberIndex?.config.columns).toHaveLength(3);
  });

  it('registers the prefix indexes in the Drizzle journal', () => {
    expect(journal).toContain('"tag": "0011_useful_eternity"');
  });
});
