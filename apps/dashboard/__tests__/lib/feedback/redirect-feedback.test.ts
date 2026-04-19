import {
  createRedirectFeedbackConfig,
  getRedirectFeedbackHref,
  getRedirectFeedbackMessage,
  stripRedirectFeedbackParam,
} from '@/lib/feedback/redirect-feedback';

import { describe, expect, it } from 'vitest';

const TEST_FEEDBACK_CONFIG = createRedirectFeedbackConfig({
  pathname: '/test',
  param: 'status',
  messages: {
    saved: 'Gespeichert.',
    failed: 'Fehlgeschlagen.',
  },
});

describe('redirect feedback helpers', () => {
  it('maps known status params back to their user-facing message', () => {
    expect(
      getRedirectFeedbackMessage('?status=saved', TEST_FEEDBACK_CONFIG)
    ).toBe('Gespeichert.');
    expect(
      getRedirectFeedbackMessage('?status=unknown', TEST_FEEDBACK_CONFIG)
    ).toBeNull();
  });

  it('builds redirect hrefs and strips only the handled query param', () => {
    expect(getRedirectFeedbackHref('failed', TEST_FEEDBACK_CONFIG)).toBe(
      '/test?status=failed'
    );
    expect(
      stripRedirectFeedbackParam(
        '?status=saved&tab=details',
        TEST_FEEDBACK_CONFIG
      )
    ).toBe('tab=details');
  });
});
