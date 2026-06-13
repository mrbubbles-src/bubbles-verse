import { getBubblophyLoginErrorMessage } from '@/lib/auth/login-feedback';

import { describe, expect, it } from 'vitest';

describe('bubblophy login feedback', () => {
  it('maps access denied errors to an authorization message', () => {
    expect(getBubblophyLoginErrorMessage('#error=access_denied')).toContain(
      'nicht autorisiert'
    );
  });

  it('maps server errors to a retry message', () => {
    expect(getBubblophyLoginErrorMessage('?error=server_error')).toContain(
      'nicht abgeschlossen'
    );
  });

  it('ignores unknown or empty errors', () => {
    expect(getBubblophyLoginErrorMessage('')).toBeNull();
    expect(getBubblophyLoginErrorMessage('?error=other')).toBeNull();
  });
});
