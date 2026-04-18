import { getDashboardLoginErrorMessage } from '@/lib/auth/login-feedback';

import { describe, expect, it } from 'vitest';

describe('getDashboardLoginErrorMessage', () => {
  it('maps hash-based access denials to the neutral dashboard message', () => {
    expect(
      getDashboardLoginErrorMessage(
        '#error=access_denied&error_description=GitHub-Konto+nicht+erlaubt.'
      )
    ).toBe(
      'Dieser User ist nicht autorisiert, das Dashboard zu betreten. Wenn du denkst, das ist ein Fehler, melde dich bitte beim Admin.'
    );
  });

  it('maps query-based callback failures to the generic retry message', () => {
    expect(getDashboardLoginErrorMessage('?error=server_error')).toBe(
      'Die Anmeldung konnte gerade nicht abgeschlossen werden. Bitte versuche es noch einmal.'
    );
  });
});
