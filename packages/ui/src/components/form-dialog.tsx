'use client';

import type { ReactElement, ReactNode } from 'react';

import { cn } from '@bubbles/ui/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@bubbles/ui/shadcn/dialog';

type FormDialogSize = 'sm' | 'md' | 'lg' | 'xl';

export type FormDialogProps = {
  children: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  trigger?: ReactElement;
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: FormDialogSize;
  className?: string;
};

const FORM_DIALOG_SIZE_CLASSES: Record<FormDialogSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-xl',
  xl: 'sm:max-w-2xl',
};

/**
 * Renders a reusable dialog shell for create/edit flows.
 *
 * Use this when an app only needs to provide trigger, copy, and form/body
 * content while the shared package keeps header, spacing, and modal framing
 * consistent across dashboards.
 *
 * @param props Trigger, content, and optional controlled-open state.
 * @returns A shared dialog wrapper for form-like workflows.
 */
export function FormDialog({
  children,
  title,
  description,
  trigger,
  footer,
  open,
  onOpenChange,
  size = 'md',
  className,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent
        className={cn(
          'max-w-[calc(100%-1.5rem)] gap-6 p-5',
          FORM_DIALOG_SIZE_CLASSES[size],
          className
        )}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        {children}

        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
