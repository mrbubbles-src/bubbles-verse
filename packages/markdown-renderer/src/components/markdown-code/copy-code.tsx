'use client';

import { useState } from 'react';

import { CheckIcon, CopyIcon } from 'lucide-react';

import { Button } from '@bubbles/ui/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@bubbles/ui/shadcn/tooltip';
import { cn } from '@bubbles/ui/lib/utils';

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
          <span className={cn('inline-flex', className)}>
            <Button
              variant="outline"
              size="icon"
              className="text-foreground hover:text-secondary touch-hitbox relative disabled:opacity-80"
              onClick={handleCopy}
              disabled={copied}
              aria-live="polite"
              aria-label="Kopiere Code">
              <span className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity duration-200 ease-in-out">
                <CopyIcon
                  className={cn(
                    'transition-transform duration-200 ease-in-out',
                    copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
                  )}
                />
                <span className="sr-only">Copy Code</span>
              </span>
              <span
                className={cn(
                  'absolute inset-0 flex items-center justify-center transition-opacity duration-200 ease-in-out',
                  copied ? 'opacity-100' : 'opacity-0',
                )}>
                <CheckIcon
                  className={cn(
                    'stroke-green-600 transition-transform duration-200 ease-in-out dark:stroke-green-400',
                    copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
                  )}
                />
                <span className="sr-only">Code copied</span>
              </span>
            </Button>
          </span>
        }
      />
      <TooltipContent side="left">
        {copied ? 'Code kopiert' : 'Code kopieren'}
      </TooltipContent>
    </Tooltip>
  );
}
