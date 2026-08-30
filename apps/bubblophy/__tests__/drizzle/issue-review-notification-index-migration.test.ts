// @vitest-environment node

import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

describe('issue-review notification index migration', () => {
  it('adds the literal partial review index for newest-first reads', async () => {
    const migration = await readFile(
      new URL('../../drizzle/0016_boring_nuke.sql', import.meta.url),
      'utf8'
    );

    expect(migration.trim()).toBe(
      'CREATE INDEX "bubblophy_issues_review_updated_project_number_idx" ON "bubblophy_issues" USING btree ("project_id","updated_at" DESC NULLS LAST,"issue_number" DESC NULLS LAST) WHERE "bubblophy_issues"."status" = \'review\';'
    );
  });
});
