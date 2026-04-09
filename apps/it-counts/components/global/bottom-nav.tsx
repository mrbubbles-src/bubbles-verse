'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@bubbles/ui/components/shadcn/button';
import {
  Add01Icon,
  Home01Icon,
  HugeiconsIcon,
  Notebook01Icon,
} from '@bubbles/ui/lib/hugeicons';
import { cn } from '@bubbles/ui/lib/utils';

import { useUiStore } from '@/hooks/use-ui-store';

/**
 * Bottom navigation: Dashboard, Log (+), History.
 * The center "+" is a floating action button that triggers the log entry sheet.
 */
export function BottomNav() {
  const pathname = usePathname();
  const setLogSheetOpen = useUiStore((s) => s.setLogSheetOpen);

  return (
    <nav
      aria-label="Main navigation"
      className="sticky bottom-0 border-t border-border bg-background w-full max-w-md mx-auto">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        <Button
          variant="link"
          size="icon"
          aria-label="Dashboard"
          className={cn(
            'no-underline!',
            pathname === '/' ? 'text-primary' : 'text-muted-foreground',
            'my-2'
          )}
          nativeButton={false}
          render={
            <Link
              href="/"
              className="flex flex-col items-center gap-1 text-xs font-medium ">
              <HugeiconsIcon icon={Home01Icon} className="size-5" />
              <span>Dashboard</span>
            </Link>
          }
        />

        <Button
          variant="default"
          size="icon"
          onClick={() => setLogSheetOpen(true)}
          className="-mt-7 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 motion-safe:transition-transform"
          aria-label="Log activity"
          nativeButton={false}
          render={<HugeiconsIcon icon={Add01Icon} />}
        />

        <Button
          variant="link"
          size="icon"
          aria-label="History"
          className={cn(
            'no-underline!',
            pathname === '/history' ? 'text-primary' : 'text-muted-foreground',
            'my-2'
          )}
          nativeButton={false}
          render={
            <Link
              href="/history"
              className="flex flex-col items-center gap-1 text-xs font-medium text-muted-foreground">
              <HugeiconsIcon icon={Notebook01Icon} className="size-5" />
              <span>History</span>
            </Link>
          }
        />
      </div>
    </nav>
  );
}
