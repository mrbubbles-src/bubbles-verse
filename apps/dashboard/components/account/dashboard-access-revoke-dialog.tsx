'use client';

import type { DashboardAccessEntry } from '@/lib/account/dashboard-access.shared';

import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@bubbles/ui/shadcn/alert-dialog';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bubbles/ui/shadcn/dialog';
import { useFormStatus } from 'react-dom';

import { deleteDashboardAccessEntryAction } from '@/app/(dashboard)/account/actions';

type DashboardAccessRevokeDialogProps = {
  entry: DashboardAccessEntry;
};

/**
 * Renders the pending-aware destructive submit action for access revocation.
 *
 * @returns The destructive confirm button inside the final confirmation step.
 */
function DashboardAccessRevokeSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <AlertDialogAction type="submit" variant="destructive" disabled={pending}>
      {pending ? 'Entziehe …' : 'Jetzt entziehen'}
    </AlertDialogAction>
  );
}

/**
 * Renders the two-step revocation flow for an existing dashboard access row.
 *
 * @param props Access row that may be removed from the allowlist.
 * @returns A direct row action plus the required double-confirmation dialogs.
 */
export function DashboardAccessRevokeDialog({
  entry,
}: DashboardAccessRevokeDialogProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [finalConfirmOpen, setFinalConfirmOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setConfirmOpen(true)}>
        Zugang entziehen
      </Button>

      <Dialog
        open={confirmOpen}
        onOpenChange={(nextOpen) => {
          setConfirmOpen(nextOpen);

          if (!nextOpen) {
            setFinalConfirmOpen(false);
          }
        }}>
        <DialogContent className="max-w-[calc(100%-1.5rem)] gap-5 p-5 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Zugang entziehen?</DialogTitle>
            <DialogDescription>
              @{entry.githubUsername} verliert den Dashboard-Zugang für{' '}
              {entry.email}. Die Identität bleibt nur erhalten, wenn du sie
              später erneut freigibst.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}>
              Abbrechen
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false);
                setFinalConfirmOpen(true);
              }}>
              Weiter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={finalConfirmOpen} onOpenChange={setFinalConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bist du dir wirklich sicher?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Schritt entfernt die freigegebene Identität aus der
              Allowlist. Bereits bestehende Sessions laufen erst mit dem
              nächsten Login oder Token-Refresh aus.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form action={deleteDashboardAccessEntryAction}>
            <input
              type="hidden"
              name="githubUsername"
              value={entry.githubUsername}
            />
            <input type="hidden" name="email" value={entry.email} />

            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <DashboardAccessRevokeSubmitButton />
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
