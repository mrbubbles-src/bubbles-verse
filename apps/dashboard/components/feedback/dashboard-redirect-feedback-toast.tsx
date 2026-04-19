'use client';

import type { RedirectFeedbackConfig } from '@/lib/feedback/redirect-feedback';

import { DASHBOARD_ACCESS_FEEDBACK_CONFIG } from '@/lib/account/access-feedback';
import {
  getRedirectFeedbackMessage,
  stripRedirectFeedbackParam,
} from '@/lib/feedback/redirect-feedback';
import { DASHBOARD_PROFILE_FEEDBACK_CONFIG } from '@/lib/profile/profile-feedback';
import { VAULT_CATEGORY_FEEDBACK_CONFIG } from '@/lib/vault/category-feedback';
import { VAULT_ENTRY_FEEDBACK_CONFIG } from '@/lib/vault/entry-feedback';

import { useEffect } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

import { toast } from '@bubbles/ui/lib/sonner';

const DASHBOARD_REDIRECT_FEEDBACK_CONFIGS: ReadonlyArray<
  RedirectFeedbackConfig<string>
> = [
  DASHBOARD_ACCESS_FEEDBACK_CONFIG,
  DASHBOARD_PROFILE_FEEDBACK_CONFIG,
  VAULT_ENTRY_FEEDBACK_CONFIG,
  VAULT_CATEGORY_FEEDBACK_CONFIG,
] as const;

function getRedirectFeedbackConfig(pathname: string) {
  return (
    DASHBOARD_REDIRECT_FEEDBACK_CONFIGS.find(
      (config) => config.pathname === pathname
    ) ?? null
  );
}

/**
 * Shows one Sonner toast for redirect-based dashboard mutations.
 *
 * The dashboard keeps several owner/editor flows server-first and redirects
 * back with compact feedback params. This bridge resolves the current route's
 * feedback config, shows the matching toast once, and removes only the handled
 * feedback param from the browser URL.
 *
 * @returns `null` because the component only coordinates a client effect.
 */
export function DashboardRedirectFeedbackToast() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const config = getRedirectFeedbackConfig(pathname);

    if (!config) {
      return;
    }

    const feedbackMessage = getRedirectFeedbackMessage(
      window.location.search,
      config
    );

    if (!feedbackMessage) {
      return;
    }

    toast(feedbackMessage);

    const nextSearch = stripRedirectFeedbackParam(
      window.location.search,
      config
    );
    const nextHref = nextSearch
      ? `${window.location.pathname}?${nextSearch}`
      : window.location.pathname;

    window.history.replaceState(null, '', nextHref);
  }, [pathname, searchParams]);

  return null;
}
