import {
  getVaultEntryFeedbackHref,
  getVaultEntryFeedbackMessage,
} from '@/lib/vault/entry-feedback';

import { describe, expect, it } from 'vitest';

describe('vault entry feedback helpers', () => {
  it('returns the deleted feedback copy for query-string redirects', () => {
    expect(getVaultEntryFeedbackMessage('?entry=deleted')).toBe(
      'Vault-Eintrag gelöscht.'
    );
  });

  it('builds the redirect href for deleted entries', () => {
    expect(getVaultEntryFeedbackHref('deleted')).toBe(
      '/vault/entries?entry=deleted'
    );
  });
});
