import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const contributorProtectedStores = [
  'lib/issues/database-write.ts',
  'lib/agent-runs/human-transition-database-write.ts',
] as const;

const sharedContributorContextStores = [
  'lib/issues/plan-database-write.ts',
  'lib/issues/notes-database-write.ts',
  'lib/issues/status-database-write.ts',
  'lib/issues/edit-database-write.ts',
  'lib/issues/priority-database-write.ts',
  'lib/issues/assignment-database-write.ts',
  'lib/agent-runs/request-database-write.ts',
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
        /canContributeToBubblophyProject\([^)]*(?:memberRole|(?:actorM|m)embership\?\.role)\)/
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
      /canContributeToBubblophyProject\([^)]*actorMembership\?\.role\)/
    );
    expect(source).toContain(".for('no key update')");
  });

  it('locks assignment actors and targets together through the shared context', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'lib/issues/assignment-database-write.ts'),
      'utf8'
    );

    expect(source).toContain('relatedAuthUserIds: input.assigneeAuthUserId');
    expect(source).toContain('writeContext.memberships.some');
  });
});
