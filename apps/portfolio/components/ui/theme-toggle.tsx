'use client';

import * as React from 'react';

import { HugeiconsIcon, Moon02Icon, SunIcon } from '@bubbles/ui/lib/hugeicons';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bubbles/ui/shadcn/dropdown-menu';
import { useTheme } from 'next-themes';

export function ThemeToggle({
  dictionary,
}: {
  dictionary: {
    screenreaderTitle: string;
    triggerTitle: string;
    contentTitle: string;
  };
}) {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton
        title={dictionary.triggerTitle}
        render={
          <Button
            variant="outline"
            size="icon"
            className="hover:text-primary transition-all duration-300 ease-in-out dark:shadow-popover-foreground/5"
          />
        }>
        <HugeiconsIcon
          icon={SunIcon}
          strokeWidth={2}
          className="size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        />
        <HugeiconsIcon
          icon={Moon02Icon}
          strokeWidth={2}
          className="absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        />
        <span className="sr-only">{dictionary.screenreaderTitle}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        title={dictionary.contentTitle}
        className="p-0">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="cursor-pointer p-4 w-full flex justify-center">
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="cursor-pointer p-4 w-full flex justify-center">
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="cursor-pointer p-4 w-full flex justify-center">
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
