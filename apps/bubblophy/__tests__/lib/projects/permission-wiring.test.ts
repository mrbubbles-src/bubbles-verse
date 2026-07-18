import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const contributorProtectedStores = [
  'lib/issues/database-write.ts',
  'lib/issues/status-database-write.ts',
  'lib/agent-runs/request-database-write.ts',
  'lib/agent-runs/human-transition-database-write.ts',
] as const;

const sharedContributorContextStores = [
  'lib/issues/plan-database-write.ts',
  'lib/issues/notes-database-write.ts',
] as const;

describe('contributor permission wiring', () => {
  it.each(contributorProtectedStores)(
    'keeps viewer denial inside %s',
    (relativePath) => {
      const source = readFileSync(resolve(process.cwd(), relativePath), 'utf8');

      expect(source).toContain(
        "import { canContributeToBubblophyProject } from '@/lib/projects/permissions';"
      );
      expect(source).toMatch(
        /canContributeToBubblophyProject\([^)]*memberRole\)/
      );
    }
  );

  it.each(sharedContributorContextStores)(
    'uses the locked shared contributor context inside %s',
    (relativePath) => {
      const source = readFileSync(resolve(process.cwd(), relativePath), 'utf8');

      expect(source).toContain(
        "from '@/lib/issues/contributor-write-context-database';"
      );
      expect(source).toContain('lockBubblophyIssueContributorWriteContext(tx');
    }
  );

  it('keeps centralized viewer denial inside the locked write context', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'lib/issues/contributor-write-context-database.ts'
      ),
      'utf8'
    );

    expect(source).toContain(
      "import { canContributeToBubblophyProject } from '@/lib/projects/permissions';"
    );
    expect(source).toMatch(
      /canContributeToBubblophyProject\([^)]*membership\?\.role\)/
    );
  });
});
