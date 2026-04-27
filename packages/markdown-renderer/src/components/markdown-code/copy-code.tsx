'use client';

import { useState } from 'react';

import {
  Copy01Icon,
  HugeiconsIcon,
  Tick02Icon,
} from '@bubbles/ui/lib/hugeicons';
import { cn } from '@bubbles/ui/lib/utils';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@bubbles/ui/shadcn/tooltip';

type CopyCodeProps = {
  code: string;
  className?: string;
};

/**
 * Render the reference copy action used on highlighted code blocks.
 *
 * @param props - Raw code plus optional positioning classes.
 * @returns Icon-only button with clipboard and success feedback states.
 */
export function CopyCode({ code, className }: CopyCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';

        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              'touch-hitbox relative text-foreground hover:text-secondary disabled:opacity-80',
              className
            )}
            onClick={handleCopy}
            disabled={copied}
            aria-live="polite"
            aria-label="Kopiere Code">
            <span className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity duration-200 ease-in-out">
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className={cn(
                  'transition-transform duration-200 ease-in-out',
                  copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                )}
              />
              <span className="sr-only">Copy Code</span>
            </span>
            <span
              className={cn(
                'absolute inset-0 flex items-center justify-center transition-opacity duration-200 ease-in-out',
                copied ? 'opacity-100' : 'opacity-0'
              )}>
              <HugeiconsIcon
                icon={Tick02Icon}
                strokeWidth={2}
                className={cn(
                  'stroke-green-600 transition-transform duration-200 ease-in-out dark:stroke-green-400',
                  copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                )}
              />
              <span className="sr-only">Code copied</span>
            </span>
          </Button>
        }
      />
      <TooltipContent side="left">
        {copied ? 'Code kopiert' : 'Code kopieren'}
      </TooltipContent>
    </Tooltip>
  );
}
