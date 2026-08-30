import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { bubblophyAgentTokens } from '@/drizzle/db/schema';

const migrationSql = readFileSync(
  join(process.cwd(), 'drizzle/0012_melodic_mulholland_black.sql'),
  'utf8'
)
  .replace(/\s+/g, ' ')
  .toLowerCase();
const journal = readFileSync(
  join(process.cwd(), 'drizzle/meta/_journal.json'),
  'utf8'
);

describe('run-target label index migration', () => {
  it('indexes the executable-token ordering inside one project', () => {
    expect(migrationSql).toContain(
      'create index "bubblophy_agent_tokens_project_state_label_idx" on "bubblophy_agent_tokens" using btree ("project_id","state",lower("label"),"id")'
    );
    const tokenIndex = getTableConfig(bubblophyAgentTokens).indexes.find(
      (candidate) =>
        candidate.config.name ===
        'bubblophy_agent_tokens_project_state_label_idx'
    );
    expect(tokenIndex?.config.method).toBe('btree');
    expect(tokenIndex?.config.columns).toHaveLength(4);
  });

  it('adds a text-pattern operator class for literal prefix search', () => {
    expect(migrationSql).toContain(
      'create index "bubblophy_agent_tokens_project_state_label_prefix_idx" on "bubblophy_agent_tokens" using btree ("project_id","state",lower("label") text_pattern_ops,"id")'
    );
    const prefixIndex = getTableConfig(bubblophyAgentTokens).indexes.find(
      (candidate) =>
        candidate.config.name ===
        'bubblophy_agent_tokens_project_state_label_prefix_idx'
    );
    expect(prefixIndex?.config.method).toBe('btree');
    expect(prefixIndex?.config.columns).toHaveLength(4);
  });

  it('registers the run-target index in the Drizzle journal', () => {
    expect(journal).toContain('"tag": "0012_melodic_mulholland_black"');
  });
});
