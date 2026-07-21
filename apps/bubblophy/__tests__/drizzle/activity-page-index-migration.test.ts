import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import {
  bubblophyIssueEvents,
  bubblophyProjectEvents,
} from '@/drizzle/db/schema';

const migrationSql = readFileSync(
  join(process.cwd(), 'drizzle/0009_normal_monster_badoon.sql'),
  'utf8'
)
  .replace(/\s+/g, ' ')
  .toLowerCase();
const journal = readFileSync(
  join(process.cwd(), 'drizzle/meta/_journal.json'),
  'utf8'
);

describe('activity page cursor index migration', () => {
  it('extends both source indexes with the deterministic event ID tie-breaker', () => {
    expect(migrationSql).toContain(
      'create index "bubblophy_issue_events_issue_created_idx" on "bubblophy_issue_events" using btree ("issue_id","created_at","id")'
    );
    expect(migrationSql).toContain(
      'create index "bubblophy_project_events_project_created_idx" on "bubblophy_project_events" using btree ("project_id","created_at","id")'
    );

    const issueIndex = getTableConfig(bubblophyIssueEvents).indexes.find(
      (indexConfig) =>
        indexConfig.config.name === 'bubblophy_issue_events_issue_created_idx'
    );
    const projectIndex = getTableConfig(bubblophyProjectEvents).indexes.find(
      (indexConfig) =>
        indexConfig.config.name ===
        'bubblophy_project_events_project_created_idx'
    );

    expect(issueIndex?.config.columns).toHaveLength(3);
    expect(projectIndex?.config.columns).toHaveLength(3);
  });

  it('registers the activity cursor migration in the Drizzle journal', () => {
    expect(journal).toContain('"tag": "0009_normal_monster_badoon"');
  });
});
