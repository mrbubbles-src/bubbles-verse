'use client';

import type { ReactElement, ReactNode } from 'react';

import { useState } from 'react';

import { cn } from '@bubbles/ui/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@bubbles/ui/shadcn/alert-dialog';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@bubbles/ui/shadcn/dialog';

type DialogSurface = 'dialog' | 'alert';
type DialogSize = 'sm' | 'md' | 'lg';
type AlertSize = 'default' | 'sm';

type StagedConfirmDialogStep = {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
};

type StagedConfirmDialogFirstStep = StagedConfirmDialogStep & {
  kind?: DialogSurface;
  dialogSize?: DialogSize;
  alertSize?: AlertSize;
  cancelLabel?: ReactNode;
  confirmLabel: ReactNode;
  confirmVariant?: React.ComponentProps<typeof Button>['variant'];
};

type StagedConfirmDialogSecondStep = StagedConfirmDialogStep & {
  kind?: DialogSurface;
  dialogSize?: DialogSize;
  alertSize?: AlertSize;
};

export type StagedConfirmDialogProps = {
  trigger: ReactElement;
  firstStep: StagedConfirmDialogFirstStep;
  secondStep: StagedConfirmDialogSecondStep;
};

const DIALOG_SIZE_CLASSES: Record<DialogSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-xl',
};

/**
 * Renders a shared two-step confirmation flow for destructive actions.
 *
 * The first step gives users one explicit pause before the second step shows
 * the irreversible action body, such as a server form submit or async delete
 * control.
 *
 * @param props Trigger plus both confirmation-step definitions.
 * @returns A shared staged confirmation dialog flow.
 */
export function StagedConfirmDialog({
  trigger,
  firstStep,
  secondStep,
}: StagedConfirmDialogProps) {
  const [firstOpen, setFirstOpen] = useState(false);
  const [secondOpen, setSecondOpen] = useState(false);

  function closeAll() {
    setFirstOpen(false);
    setSecondOpen(false);
  }

  const firstKind = firstStep.kind ?? 'alert';
  const secondKind = secondStep.kind ?? 'alert';

  return (
    <>
      {firstKind === 'dialog' ? (
        <Dialog
          open={firstOpen}
          onOpenChange={(open) => {
            setFirstOpen(open);

            if (!open) {
              setSecondOpen(false);
            }
          }}>
          <DialogTrigger render={trigger} />
          <DialogContent
            className={cn(
              'max-w-[calc(100%-1.5rem)] gap-5 p-5 text-lg',
              DIALOG_SIZE_CLASSES[firstStep.dialogSize ?? 'sm'],
              firstStep.className
            )}>
            <DialogHeader>
              <DialogTitle>{firstStep.title}</DialogTitle>
              {firstStep.description ? (
                <DialogDescription>{firstStep.description}</DialogDescription>
              ) : null}
            </DialogHeader>

            {firstStep.children}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeAll}>
                {firstStep.cancelLabel ?? 'Abbrechen'}
              </Button>
              <Button
                type="button"
                variant={firstStep.confirmVariant ?? 'destructive'}
                onClick={() => {
                  setFirstOpen(false);
                  setSecondOpen(true);
                }}>
                {firstStep.confirmLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <AlertDialog
          open={firstOpen}
          onOpenChange={(open) => {
            setFirstOpen(open);

            if (!open && !secondOpen) {
              closeAll();
            }
          }}>
          <AlertDialogTrigger render={trigger} />
          <AlertDialogContent
            size={firstStep.alertSize ?? 'sm'}
            className={cn('text-lg', firstStep.className)}>
            <AlertDialogHeader>
              <AlertDialogTitle>{firstStep.title}</AlertDialogTitle>
              {firstStep.description ? (
                <AlertDialogDescription>
                  {firstStep.description}
                </AlertDialogDescription>
              ) : null}
            </AlertDialogHeader>

            {firstStep.children}

            <AlertDialogFooter>
              <AlertDialogCancel>
                {firstStep.cancelLabel ?? 'Abbrechen'}
              </AlertDialogCancel>
              <AlertDialogAction
                type="button"
                variant={firstStep.confirmVariant ?? 'destructive'}
                onClick={() => {
                  setFirstOpen(false);
                  setSecondOpen(true);
                }}>
                {firstStep.confirmLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {secondKind === 'dialog' ? (
        <Dialog
          open={secondOpen}
          onOpenChange={(open) => {
            setSecondOpen(open);

            if (!open) {
              closeAll();
            }
          }}>
          <DialogContent
            className={cn(
              'max-w-[calc(100%-1.5rem)] gap-5 p-5 text-lg',
              DIALOG_SIZE_CLASSES[secondStep.dialogSize ?? 'sm'],
              secondStep.className
            )}>
            <DialogHeader>
              <DialogTitle>{secondStep.title}</DialogTitle>
              {secondStep.description ? (
                <DialogDescription>{secondStep.description}</DialogDescription>
              ) : null}
            </DialogHeader>

            {secondStep.children}
          </DialogContent>
        </Dialog>
      ) : (
        <AlertDialog
          open={secondOpen}
          onOpenChange={(open) => {
            setSecondOpen(open);

            if (!open) {
              closeAll();
            }
          }}>
          <AlertDialogContent
            size={secondStep.alertSize ?? 'default'}
            className={cn('text-lg', secondStep.className)}>
            <AlertDialogHeader>
              <AlertDialogTitle>{secondStep.title}</AlertDialogTitle>
              {secondStep.description ? (
                <AlertDialogDescription>
                  {secondStep.description}
                </AlertDialogDescription>
              ) : null}
            </AlertDialogHeader>

            {secondStep.children}
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
