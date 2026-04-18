'use client';

import { useEffect } from 'react';

import { getVaultCategoryFeedbackMessage } from '@/lib/vault/category-feedback';

import { toast } from '@bubbles/ui/lib/sonner';

/**
 * Shows one toast after a redirect-based Vault category mutation.
 *
 * @returns `null` because the component only performs a side effect.
 */
export function CategoryFeedbackToast() {
  useEffect(() => {
    const feedbackMessage = getVaultCategoryFeedbackMessage(
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
