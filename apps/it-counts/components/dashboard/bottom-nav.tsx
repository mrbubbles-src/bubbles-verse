'use client'

import Link from 'next/link'

import {
  HugeiconsIcon,
  Home01Icon,
  Add01Icon,
  Notebook01Icon,
} from '@bubbles/ui/lib/hugeicons'

/**
 * Bottom navigation: Dashboard, Log (+), History.
 * Sits at the bottom of the flex shell — no fixed positioning needed.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Main navigation"
      className="sticky bottom-0 border-t border-border bg-background">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        <Link
          href="/"
          className="touch-hitbox flex flex-col items-center gap-1 text-xs font-medium text-foreground">
          <HugeiconsIcon icon={Home01Icon} className="size-5" />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/log"
          className="touch-hitbox flex flex-col items-center gap-1 text-xs font-medium text-muted-foreground">
          <HugeiconsIcon icon={Add01Icon} className="size-6" />
          <span className="sr-only">Log activity</span>
        </Link>
        <Link
          href="/history"
          className="touch-hitbox flex flex-col items-center gap-1 text-xs font-medium text-muted-foreground">
          <HugeiconsIcon icon={Notebook01Icon} className="size-5" />
          <span>History</span>
        </Link>
      </div>
    </nav>
  )
}
