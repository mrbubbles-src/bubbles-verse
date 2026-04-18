'use client';

import { getVaultEntryFeedbackMessage } from '@/lib/vault/entry-feedback';

import { useEffect } from 'react';

import { toast } from '@bubbles/ui/lib/sonner';

/**
 * Shows a one-time toast after redirects from Vault entry mutations.
 *
 * @returns `null` because the component only performs a client-side effect.
 */
export function EntryFeedbackToast() {
  useEffect(() => {
    const feedbackMessage = getVaultEntryFeedbackMessage(
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
