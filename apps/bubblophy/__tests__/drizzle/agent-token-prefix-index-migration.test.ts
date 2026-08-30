import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { bubblophyAgentTokens } from '@/drizzle/db/schema';

const migrationSql = readFileSync(
  join(process.cwd(), 'drizzle/0014_plain_smiling_tiger.sql'),
  'utf8'
)
  .replace(/\s+/g, ' ')
  .toLowerCase();
const journal = readFileSync(
  join(process.cwd(), 'drizzle/meta/_journal.json'),
  'utf8'
);

describe('agent-token label-prefix index migration', () => {
  it('adds the management prefix index without replacing cursor ordering', () => {
    expect(migrationSql).toContain(
      'create index "bubblophy_agent_tokens_project_label_prefix_idx" on "bubblophy_agent_tokens" using btree ("project_id",lower("label") text_pattern_ops,"id")'
    );
    const indexes = getTableConfig(bubblophyAgentTokens).indexes;
    const prefixIndex = indexes.find(
      (candidate) =>
        candidate.config.name ===
        'bubblophy_agent_tokens_project_label_prefix_idx'
    );
    const orderingIndex = indexes.find(
      (candidate) =>
        candidate.config.name === 'bubblophy_agent_tokens_project_label_idx'
    );

    expect(prefixIndex?.config.method).toBe('btree');
    expect(prefixIndex?.config.columns).toHaveLength(3);
    expect(orderingIndex?.config.columns).toHaveLength(3);
  });

  it('registers the prefix migration in the Drizzle journal', () => {
    expect(journal).toContain('"tag": "0014_plain_smiling_tiger"');
  });
});
