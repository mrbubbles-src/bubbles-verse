import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { bubblophyAgentRuns } from '@/drizzle/db/schema';

const migrationSql = readFileSync(
  join(process.cwd(), 'drizzle/0008_add_run_page_cursor_index.sql'),
  'utf8'
)
  .replace(/\s+/g, ' ')
  .toLowerCase();
const journal = readFileSync(
  join(process.cwd(), 'drizzle/meta/_journal.json'),
  'utf8'
);

describe('run page cursor index migration', () => {
  it('indexes issue-bound run cursor columns in stable order', () => {
    expect(migrationSql).toContain(
      'create index "bubblophy_agent_runs_issue_updated_id_idx" on "bubblophy_agent_runs" using btree ("issue_id","updated_at","id")'
    );
    expect(
      getTableConfig(bubblophyAgentRuns).indexes.map(
        (indexConfig) => indexConfig.config.name
      )
    ).toContain('bubblophy_agent_runs_issue_updated_id_idx');
  });

  it('registers the cursor index migration in the Drizzle journal', () => {
    expect(journal).toContain('"tag": "0008_add_run_page_cursor_index"');
  });
});
