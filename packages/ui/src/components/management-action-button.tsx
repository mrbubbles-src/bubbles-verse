'use client';

import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@bubbles/ui/lib/utils';
import { Button } from '@bubbles/ui/shadcn/button';
import { cva } from 'class-variance-authority';

const managementActionButtonVariants = cva('', {
  variants: {
    tone: {
      edit: 'text-ctp-latte-blue hover:bg-ctp-latte-blue/15 hover:text-ctp-latte-blue dark:text-ctp-mocha-blue dark:hover:bg-ctp-mocha-blue/15 dark:hover:text-ctp-mocha-blue',
      create:
        'text-ctp-latte-green hover:bg-ctp-latte-green/15 hover:text-ctp-latte-green dark:text-ctp-mocha-green dark:hover:bg-ctp-mocha-green/15 dark:hover:text-ctp-mocha-green',
      preview:
        'text-ctp-latte-lavender hover:bg-ctp-latte-lavender/15 hover:text-ctp-latte-lavender dark:text-ctp-mocha-lavender dark:hover:bg-ctp-mocha-lavender/15 dark:hover:text-ctp-mocha-lavender',
      delete:
        'text-ctp-latte-red hover:bg-ctp-latte-red/15 hover:text-ctp-latte-red dark:text-ctp-mocha-red dark:hover:bg-ctp-mocha-red/15 dark:hover:text-ctp-mocha-red',
    },
  },
  defaultVariants: {
    tone: 'edit',
  },
});

type ManagementActionButtonProps = ComponentProps<typeof Button> &
  VariantProps<typeof managementActionButtonVariants>;

/**
 * Renders a standard icon button for management-table row actions.
 *
 * Use it inside action columns with a semantic `tone` so edit, create, preview,
 * and delete affordances keep consistent Catppuccin token colors.
 *
 * @param props Button props plus the semantic action tone.
 * @returns A shared icon-sized action button.
 */
export function ManagementActionButton({
  className,
  tone,
  size = 'icon-lg',
  variant = 'ghost',
  ...props
}: ManagementActionButtonProps) {
  return (
    <Button
      className={cn(
        'size-10 [&_svg:not([class*="size-"])]:size-5',
        managementActionButtonVariants({ tone }),
        className
      )}
      size={size}
      variant={variant}
      {...props}
    />
  );
}
