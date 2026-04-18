'use client';

import { getDashboardAccessFeedbackMessage } from '@/lib/account/access-feedback';

import { useEffect } from 'react';

import { toast } from '@bubbles/ui/lib/sonner';

/**
 * Shows one account-management toast after a redirect-based Server Action.
 *
 * The owner flows on `/account` currently stay server-first. This component
 * translates the short feedback query parameter back into a toast and cleans
 * the URL once the message has been displayed.
 *
 * @returns `null` because the component only coordinates side effects.
 */
export function AccountFeedbackToast() {
  useEffect(() => {
    const feedbackMessage = getDashboardAccessFeedbackMessage(
      window.location.search
    );

    if (!feedbackMessage) {
      return;
    }

    toast(feedbackMessage);
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  return null;
}
