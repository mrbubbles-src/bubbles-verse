import {
  getDashboardAccessFeedbackHref,
  getDashboardAccessFeedbackMessage,
} from '@/lib/account/access-feedback';
import {
  normalizeDashboardEmail,
  normalizeGithubUsername,
  parseCreateDashboardAccessEntry,
  toDashboardAccessInsertValues,
} from '@/lib/account/dashboard-access';

import { describe, expect, it } from 'vitest';

describe('dashboard access helpers', () => {
  it('normalizes GitHub usernames and emails before DB checks', () => {
    expect(normalizeGithubUsername('  MrBubbles-Src  ')).toBe('mrbubbles-src');
    expect(normalizeDashboardEmail('  OWNER@MRBUBBLES-SRC.DEV  ')).toBe(
      'owner@mrbubbles-src.dev'
    );
  });

  it('parses and converts a create form payload into DB values', () => {
    const formData = new FormData();
    formData.set('githubUsername', 'MrBubbles-Src');
    formData.set('email', 'Owner@MrBubbles-Src.dev');
    formData.set('userRole', 'editor');
    formData.set('dashboardAccess', 'true');
    formData.set('note', '  Redaktion  ');

    const parsedEntry = parseCreateDashboardAccessEntry(formData);

    expect(parsedEntry.success).toBe(true);

    if (!parsedEntry.success) {
      throw new Error('Expected the payload to parse successfully.');
    }

    expect(toDashboardAccessInsertValues(parsedEntry.data)).toEqual({
      githubUsername: 'mrbubbles-src',
      email: 'owner@mrbubbles-src.dev',
      userRole: 'editor',
      dashboardAccess: true,
      note: 'Redaktion',
    });
  });

  it('rejects invalid dashboard access payloads early', () => {
    const formData = new FormData();
    formData.set('githubUsername', 'no spaces allowed');
    formData.set('email', 'not-an-email');
    formData.set('userRole', 'stranger');
    formData.set('dashboardAccess', 'maybe');

    expect(parseCreateDashboardAccessEntry(formData).success).toBe(false);
  });
});

describe('dashboard access feedback', () => {
  it('maps supported account feedback codes to user-facing copy', () => {
    expect(getDashboardAccessFeedbackMessage('?access=protected')).toBe(
      'Den letzten aktiven Owner-Zugang kannst du hier nicht sperren oder entfernen.'
    );
    expect(getDashboardAccessFeedbackMessage('?access=missing')).toBeNull();
    expect(getDashboardAccessFeedbackHref('created')).toBe(
      '/account?access=created'
    );
  });
});
