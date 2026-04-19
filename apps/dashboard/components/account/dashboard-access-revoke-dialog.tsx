'use client';

import type { DashboardAccessEntry } from '@/lib/account/dashboard-access.shared';

import { StagedConfirmDialog } from '@bubbles/ui/components/staged-confirm-dialog';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from '@bubbles/ui/shadcn/alert-dialog';
import { Button } from '@bubbles/ui/shadcn/button';
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
 * Renders the shared two-step revocation flow for one dashboard access row.
 *
 * @param props Access row that may be removed from the allowlist.
 * @returns A row action with a staged destructive confirmation flow.
 */
export function DashboardAccessRevokeDialog({
  entry,
}: DashboardAccessRevokeDialogProps) {
  return (
    <StagedConfirmDialog
      trigger={
        <Button type="button" variant="destructive" size="sm">
          Zugang entziehen
        </Button>
      }
      firstStep={{
        kind: 'dialog',
        dialogSize: 'sm',
        title: 'Zugang entziehen?',
        description: (
          <>
            @{entry.githubUsername} verliert den Dashboard-Zugang für{' '}
            {entry.email}. Die Identität bleibt nur erhalten, wenn du sie später
            erneut freigibst.
          </>
        ),
        confirmLabel: 'Weiter',
      }}
      secondStep={{
        title: 'Bist du dir wirklich sicher?',
        description:
          'Dieser Schritt entfernt die freigegebene Identität aus der Allowlist. Bereits bestehende Sessions laufen erst mit dem nächsten Login oder Token-Refresh aus.',
        children: (
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
        ),
      }}
    />
  );
}
