'use client';

import { getDashboardProfileFeedbackMessage } from '@/lib/profile/profile-feedback';

import { useEffect } from 'react';

import { toast } from '@bubbles/ui/lib/sonner';

/**
 * Shows one profile-management toast after a redirect-based Server Action.
 *
 * @returns `null` because the component only coordinates side effects.
 */
export function ProfileFeedbackToast() {
  useEffect(() => {
    const feedbackMessage = getDashboardProfileFeedbackMessage(
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
