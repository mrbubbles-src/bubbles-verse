import {
  isBubblophyAuthEmailAllowed,
  normalizeBubblophyAuthEmail,
  parseBubblophyAllowedAuthEmails,
} from '@/lib/auth/allowed-emails';

import { describe, expect, it } from 'vitest';

describe('Bubblophy allowed auth emails', () => {
  it('normalizes auth emails before comparison', () => {
    expect(normalizeBubblophyAuthEmail('  MISTER@EXAMPLE.TEST ')).toBe(
      'mister@example.test'
    );
    expect(normalizeBubblophyAuthEmail('   ')).toBeNull();
  });

  it('parses comma-separated allowlist values without empty entries', () => {
    expect(
      parseBubblophyAllowedAuthEmails(
        'owner@example.test, , Editor@Example.Test'
      )
    ).toEqual(['owner@example.test', 'editor@example.test']);
  });

  it('fails closed when no matching email is present', () => {
    expect(
      isBubblophyAuthEmailAllowed({
        email: 'stranger@example.test',
        allowlist: ['owner@example.test'],
      })
    ).toBe(false);
  });

  it('allows exact email matches case-insensitively', () => {
    expect(
      isBubblophyAuthEmailAllowed({
        email: 'Owner@Example.Test',
        allowlist: ['owner@example.test'],
      })
    ).toBe(true);
  });
});
