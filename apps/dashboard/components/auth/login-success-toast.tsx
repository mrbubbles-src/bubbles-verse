'use client';

import { DASHBOARD_LOGIN_ATTEMPT_STORAGE_KEY } from '@/lib/auth/login-feedback';

import { useEffect } from 'react';

import { toast } from '@bubbles/ui/lib/sonner';

/**
 * Shows a one-time success toast after a real dashboard login round-trip.
 *
 * The login page sets a short-lived browser flag before redirecting to GitHub.
 * After the protected dashboard layout mounts, this component consumes that
 * flag once and confirms the successful sign-in to the owner.
 *
 * @returns `null` because the component only coordinates side effects.
 */
export function LoginSuccessToast() {
  useEffect(() => {
    const hasLoginAttempt = window.localStorage.getItem(
      DASHBOARD_LOGIN_ATTEMPT_STORAGE_KEY
    );

    if (!hasLoginAttempt) {
      return;
    }

    window.localStorage.removeItem(DASHBOARD_LOGIN_ATTEMPT_STORAGE_KEY);
    toast.success('Erfolgreich angemeldet.');
  }, []);

  return null;
}
