import { canContributeToBubblophyProject } from '@/lib/projects/permissions';

import { describe, expect, it } from 'vitest';

describe('Bubblophy project permissions', () => {
  it('allows contributors and keeps viewers read-only', () => {
    expect(canContributeToBubblophyProject('owner')).toBe(true);
    expect(canContributeToBubblophyProject('maintainer')).toBe(true);
    expect(canContributeToBubblophyProject('member')).toBe(true);
    expect(canContributeToBubblophyProject('viewer')).toBe(false);
    expect(canContributeToBubblophyProject('')).toBe(false);
  });
});
