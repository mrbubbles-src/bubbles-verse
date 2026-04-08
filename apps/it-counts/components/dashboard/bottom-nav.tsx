'use client'

import Link from 'next/link'

import {
  HugeiconsIcon,
  Home01Icon,
  Add01Icon,
  Notebook01Icon,
} from '@bubbles/ui/lib/hugeicons'

import { useUiStore } from '@/hooks/use-ui-store'

/**
 * Bottom navigation: Dashboard, Log (+), History.
 * The center "+" is a floating action button that triggers the log entry sheet.
 */
export function BottomNav() {
  const setLogSheetOpen = useUiStore((s) => s.setLogSheetOpen)

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
        <button
          type="button"
          onClick={() => setLogSheetOpen(true)}
          className="touch-hitbox -mt-7 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 motion-safe:transition-transform"
          aria-label="Log activity">
          <HugeiconsIcon icon={Add01Icon} className="size-7" />
        </button>
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
