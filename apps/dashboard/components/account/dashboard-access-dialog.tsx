'use client';

import type {
  DashboardAccessEntry,
  DashboardAccessRole,
} from '@/lib/account/dashboard-access.shared';

import {
  DASHBOARD_ACCESS_ROLE_VALUES,
  formatDashboardAccessRoleLabel,
  toDashboardAccessRole,
} from '@/lib/account/dashboard-access.shared';

import { useState } from 'react';

import { Button } from '@bubbles/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bubbles/ui/shadcn/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@bubbles/ui/shadcn/field';
import { Input } from '@bubbles/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bubbles/ui/shadcn/select';
import { Textarea } from '@bubbles/ui/shadcn/textarea';
import { useFormStatus } from 'react-dom';

import {
  createDashboardAccessEntryAction,
  updateDashboardAccessEntryAction,
} from '@/app/(dashboard)/account/actions';

type DashboardAccessDialogProps =
  | {
      mode: 'create';
    }
  | {
      mode: 'edit';
      entry: DashboardAccessEntry;
    };

/**
 * Renders the pending-aware submit button for create and edit access dialogs.
 *
 * @param props Button label for the current mutation.
 * @returns A disabled button while the dialog form is submitting.
 */
function DashboardAccessSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Speichern …' : label}
    </Button>
  );
}

/**
 * Renders the shared mutable access fields used in create and edit dialogs.
 *
 * @param props Current default values for role, access state, and note.
 * @returns Shared dashboard access form controls.
 */
function DashboardAccessMutableFields({
  idPrefix,
  note,
  dashboardAccess,
  userRole,
}: {
  idPrefix: string;
  note: string;
  dashboardAccess: boolean;
  userRole: DashboardAccessRole;
}) {
  return (
    <FieldGroup className="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-role`}>Rolle</FieldLabel>
        <FieldContent>
          <Select defaultValue={userRole} name="userRole">
            <SelectTrigger id={`${idPrefix}-role`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                {DASHBOARD_ACCESS_ROLE_VALUES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {formatDashboardAccessRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-status`}>Status</FieldLabel>
        <FieldContent>
          <Select
            defaultValue={dashboardAccess ? 'true' : 'false'}
            name="dashboardAccess">
            <SelectTrigger id={`${idPrefix}-status`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                <SelectItem value="true">Aktiv</SelectItem>
                <SelectItem value="false">Gesperrt</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </FieldContent>
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={`${idPrefix}-note`}>Notiz</FieldLabel>
        <FieldContent>
          <Textarea
            id={`${idPrefix}-note`}
            name="note"
            defaultValue={note}
            placeholder="Optionaler Kontext für dich oder andere Owner."
            rows={4}
            className="min-h-28"
          />
          <FieldDescription>
            Praktisch für redaktionelle Rollen, befristete Zugänge oder interne
            Hinweise.
          </FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  );
}

/**
 * Opens either the create or edit dialog for dashboard access rows.
 *
 * @param props Determines whether a new row is created or an existing one is edited.
 * @returns The action trigger plus the corresponding modal dialog.
 */
export function DashboardAccessDialog(props: DashboardAccessDialogProps) {
  const [open, setOpen] = useState(false);
  const isCreateDialog = props.mode === 'create';
  const editEntry = props.mode === 'edit' ? props.entry : undefined;
  const submitLabel = isCreateDialog
    ? 'Zugang freigeben'
    : 'Änderungen speichern';
  const idPrefix = isCreateDialog
    ? 'dashboard-access-create'
    : `dashboard-access-${editEntry?.githubUsername ?? 'edit'}-${(
        editEntry?.email ?? 'entry'
      ).replace(/[^a-z0-9]/gi, '-')}`;

  return (
    <>
      {isCreateDialog ? (
        <Button type="button" onClick={() => setOpen(true)}>
          Zugang freigeben
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}>
          Bearbeiten
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-1.5rem)] gap-6 p-5 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isCreateDialog ? 'Zugang freigeben' : 'Zugang bearbeiten'}
            </DialogTitle>
            <DialogDescription>
              {isCreateDialog
                ? 'Lege genau die GitHub-Identität an, die Supabase beim Login liefern soll.'
                : 'GitHub-Name und E-Mail bleiben stabil. Rolle, Status und Notiz kannst du hier anpassen.'}
            </DialogDescription>
          </DialogHeader>

          <form
            action={
              isCreateDialog
                ? createDashboardAccessEntryAction
                : updateDashboardAccessEntryAction
            }
            className="flex flex-col gap-6">
            {isCreateDialog ? (
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`${idPrefix}-github-username`}>
                    GitHub-Name
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id={`${idPrefix}-github-username`}
                      name="githubUsername"
                      placeholder="mrbubbles-src"
                      autoComplete="off"
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor={`${idPrefix}-email`}>E-Mail</FieldLabel>
                  <FieldContent>
                    <Input
                      id={`${idPrefix}-email`}
                      type="email"
                      name="email"
                      placeholder="name@example.com"
                      autoComplete="off"
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            ) : (
              <>
                <input
                  type="hidden"
                  name="githubUsername"
                  value={editEntry?.githubUsername ?? ''}
                />
                <input
                  type="hidden"
                  name="email"
                  value={editEntry?.email ?? ''}
                />

                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                      GitHub-Name
                    </dt>
                    <dd className="font-medium">
                      @{editEntry?.githubUsername ?? ''}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                      E-Mail
                    </dt>
                    <dd className="truncate">{editEntry?.email ?? ''}</dd>
                  </div>
                </dl>
              </>
            )}

            <DashboardAccessMutableFields
              idPrefix={idPrefix}
              note={editEntry?.note ?? ''}
              dashboardAccess={editEntry?.dashboardAccess ?? true}
              userRole={toDashboardAccessRole(editEntry?.userRole ?? 'editor')}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}>
                Abbrechen
              </Button>
              <DashboardAccessSubmitButton label={submitLabel} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
