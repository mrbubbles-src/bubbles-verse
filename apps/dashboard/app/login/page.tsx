'use client';

import { getPublicDashboardEnv } from '@/lib/env';
import { createDashboardBrowserSupabaseClient } from '@/lib/supabase/client';

import { useState } from 'react';

import { Button } from '@bubbles/ui/shadcn/button';

/**
 * Renders the owner-only dashboard login entry for GitHub OAuth.
 *
 * Use this page to start the Supabase GitHub sign-in flow against the local
 * dashboard URL configured for this app.
 */
export default function LoginPage() {
  const [isPending, setIsPending] = useState(false);

  /**
   * Starts the GitHub OAuth flow for the private dashboard.
   *
   * It validates the public Supabase config first and resets the pending state
   * if the flow cannot be started in the browser.
   */
  async function handleGithubLogin() {
    setIsPending(true);

    try {
      const supabase = createDashboardBrowserSupabaseClient();
      const env = getPublicDashboardEnv();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${env.NEXT_PUBLIC_APP_URL}/`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to start dashboard GitHub login.', error);
      setIsPending(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-sm font-medium tracking-[0.3em] text-muted-foreground uppercase">
            Bubbles Verse
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Dashboard Login
          </h1>
          <p className="mx-auto max-w-md text-sm text-pretty text-muted-foreground sm:text-base">
            Melde dich mit GitHub an, um dein Dashboard zu öffnen.
          </p>
        </div>
        <Button disabled={isPending} onClick={() => void handleGithubLogin()}>
          {isPending ? (
            'Weiterleitung...'
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                data-icon="inline-start"
                fill="currentColor">
                <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-1.95c-3.2.7-3.88-1.36-3.88-1.36-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.72-1.55-2.56-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.28 1.18-3.08-.12-.29-.5-1.47.11-3.06 0 0 .97-.31 3.17 1.18a10.94 10.94 0 0 1 5.78 0c2.2-1.5 3.17-1.18 3.17-1.18.62 1.6.23 2.77.11 3.06.74.8 1.18 1.82 1.18 3.08 0 4.43-2.68 5.4-5.25 5.68.41.36.77 1.05.77 2.13v3.15c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
              </svg>
              <span>Mit GitHub anmelden</span>
            </>
          )}
        </Button>
      </div>
    </main>
  );
}
