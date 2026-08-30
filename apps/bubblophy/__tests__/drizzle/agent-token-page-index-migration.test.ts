import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { bubblophyAgentTokens } from '@/drizzle/db/schema';

const migrationSql = readFileSync(
  join(process.cwd(), 'drizzle/0013_steady_starfox.sql'),
  'utf8'
)
  .replace(/\s+/g, ' ')
  .toLowerCase();
const journal = readFileSync(
  join(process.cwd(), 'drizzle/meta/_journal.json'),
  'utf8'
);

describe('agent-token page cursor index migration', () => {
  it('indexes the project and stable label cursor', () => {
    expect(migrationSql).toContain(
      'create index "bubblophy_agent_tokens_project_label_idx" on "bubblophy_agent_tokens" using btree ("project_id",lower("label"),"id")'
    );

    const indexConfig = getTableConfig(bubblophyAgentTokens).indexes.find(
      (candidate) =>
        candidate.config.name === 'bubblophy_agent_tokens_project_label_idx'
    );

    expect(indexConfig?.config.method).toBe('btree');
    expect(indexConfig?.config.columns).toHaveLength(3);
  });

  it('registers the token-page migration in the Drizzle journal', () => {
    expect(journal).toContain('"tag": "0013_steady_starfox"');
  });
});
