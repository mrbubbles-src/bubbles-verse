// @vitest-environment node

import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

describe('notification run index migration', () => {
  it('adds the partial newest-first index for live notification states', async () => {
    const sql = await readFile(
      new URL('../../drizzle/0015_material_ma_gnuci.sql', import.meta.url),
      'utf8'
    );

    expect(sql).toContain('"bubblophy_agent_runs_notification_updated_id_idx"');
    expect(sql).toContain('("updated_at","id")');
    expect(sql).toContain(
      "WHERE \"bubblophy_agent_runs\".\"state\" in ('requested', 'needs_review', 'failed')"
    );
  });
});
