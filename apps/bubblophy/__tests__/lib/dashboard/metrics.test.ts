import { getIssueReadinessPercent } from '@/lib/dashboard/metrics';

import { describe, expect, it } from 'vitest';

describe('getIssueReadinessPercent', () => {
  it('rounds ready issues over open issues', () => {
    expect(getIssueReadinessPercent({ readyIssues: 2, openIssues: 7 })).toBe(
      29
    );
  });

  it('treats an empty issue queue as fully ready', () => {
    expect(getIssueReadinessPercent({ readyIssues: 0, openIssues: 0 })).toBe(
      100
    );
  });
});
