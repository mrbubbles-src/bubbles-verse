'use client'

import { useState } from 'react'

import { Button } from '@bubbles/ui/shadcn/button'

import { getPublicDashboardEnv } from '@/lib/env'
import { createDashboardBrowserSupabaseClient } from '@/lib/supabase/client'

/**
 * Renders the owner-only dashboard login entry for GitHub OAuth.
 *
 * Use this page to start the Supabase GitHub sign-in flow against the local
 * dashboard URL configured for this app.
 */
export default function LoginPage() {
  const [isPending, setIsPending] = useState(false)

  async function handleGithubLogin() {
    setIsPending(true)

    const supabase = createDashboardBrowserSupabaseClient()
    const env = getPublicDashboardEnv()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${env.NEXT_PUBLIC_APP_URL}/`,
      },
    })

    if (error) {
      setIsPending(false)
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
            This dashboard is private. Continue with the allowlisted GitHub
            account.
          </p>
        </div>
        <Button disabled={isPending} onClick={() => void handleGithubLogin()}>
          {isPending ? 'Weiterleitung...' : 'Mit GitHub anmelden'}
        </Button>
      </div>
    </main>
  )
}
