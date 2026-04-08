'use client';

import { startVt } from './view-transition';

import { HugeiconsIcon, Moon02Icon, SunIcon } from '@bubbles/ui/lib/hugeicons';
import { cn } from '@bubbles/ui/lib/utils';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@bubbles/ui/shadcn/tooltip';

import { useTheme } from './use-theme';

/**
 * Renders a theme toggle button with view-transition animation support.
 * Uses resolved theme state and updates the app theme on click.
 */
const ThemeToggle = () => {
  const { resolvedTheme, theme, setTheme, isHydrated } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const buttonLabel = isHydrated
    ? isDark
      ? 'Switch to light theme'
      : 'Switch to dark theme'
    : 'Toggle theme';

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              id="theme-toggle"
              variant="ghost"
              size="icon"
              aria-label={buttonLabel}
              className="shadow-none hover:bg-transparent focus:bg-transparent active:bg-transparent active:*:drop-shadow-none dark:hover:bg-transparent dark:focus:bg-transparent dark:active:bg-transparent"
              onClick={(e) => {
                const next =
                  (resolvedTheme ?? theme) === 'dark' ? 'light' : 'dark';
                startVt(() => setTheme(next), e.nativeEvent);
              }}>
              <HugeiconsIcon
                icon={Moon02Icon}
                size={24}
                strokeWidth={2}
                className={cn(
                  'absolute size-6 text-primary drop-shadow-secondary drop-shadow-xs transition-all duration-300 ease-in-out',
                  isHydrated && isDark
                    ? 'scale-100 rotate-0 opacity-100'
                    : 'scale-0 -rotate-90 opacity-0',
                )}
                aria-hidden="true"
              />
              <HugeiconsIcon
                icon={SunIcon}
                size={24}
                strokeWidth={2}
                className={cn(
                  'absolute size-6 text-secondary drop-shadow-primary drop-shadow-xs transition-all duration-300 ease-in-out',
                  isHydrated && !isDark
                    ? 'scale-100 rotate-0 opacity-100'
                    : 'scale-0 rotate-90 opacity-0',
                )}
                aria-hidden="true"
              />
              <span className="sr-only">{buttonLabel}</span>
            </Button>
          }
        />
        <TooltipContent side="right">
          <span className="font-bold text-lg">{buttonLabel}</span>
        </TooltipContent>
      </Tooltip>
    </>
  );
};

export default ThemeToggle;
