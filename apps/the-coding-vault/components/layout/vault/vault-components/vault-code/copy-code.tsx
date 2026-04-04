'use client';

import { useState } from 'react';

import {
  Copy01Icon,
  HugeiconsIcon,
  Tick02Icon,
} from '@bubbles/ui/lib/hugeicons';

import { Button } from '@bubbles/ui/shadcn/button';

import { cn } from '@/lib/utils';

const CopyCode = ({
  code,
  className,
}: {
  code: string;
  className?: string;
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn('relative disabled:opacity-80', className)}
      onClick={handleCopy}
      disabled={copied}
      aria-live="polite">
      <span className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity duration-200 ease-in-out">
        <HugeiconsIcon
          icon={Copy01Icon}
          strokeWidth={2}
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
        <HugeiconsIcon
          icon={Tick02Icon}
          strokeWidth={2}
          className={cn(
            'stroke-green-600 transition-transform duration-200 ease-in-out dark:stroke-green-400',
            copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
          )}
        />
        <span className="sr-only">Code copied</span>
      </span>
    </Button>
  );
};

export default CopyCode;
