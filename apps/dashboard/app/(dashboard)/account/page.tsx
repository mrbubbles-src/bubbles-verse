import {
  DASHBOARD_ACCESS_ROLE_VALUES,
  listDashboardAccessEntries,
} from '@/lib/account/dashboard-access';
import { requireOwnerSession } from '@/lib/auth/session';

import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';
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
import { Separator } from '@bubbles/ui/shadcn/separator';
import { Textarea } from '@bubbles/ui/shadcn/textarea';

import {
  createDashboardAccessEntryAction,
  deleteDashboardAccessEntryAction,
  updateDashboardAccessEntryAction,
} from '@/app/(dashboard)/account/actions';
import { AccountFeedbackToast } from '@/components/account/account-feedback-toast';

/**
 * Renders the owner-only account page for dashboard access management.
 *
 * The first V1 account slice keeps profile editing out of scope and focuses on
 * the operational job that matters right now: deciding who may enter the
 * private dashboard and with which role.
 */
export default async function AccountPage() {
  const { accessEntry } = await requireOwnerSession();
  const accessEntries = await listDashboardAccessEntries();

  return (
    <>
      <AccountFeedbackToast />
      <section className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
        <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
          Account
        </p>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Dashboard-Zugänge verwalten
          </h1>
          <p className="max-w-3xl text-sm text-pretty text-muted-foreground sm:text-base">
            Hier pflegst du die private Supabase-Allowlist, aus der auch
            `dashboard_access` und `user_role` für neue JWTs gebaut werden.
            GitHub-Identität und E-Mail bleiben pro Eintrag bewusst unverändert.
            Wenn sich eine Identität ändert, legst du sie neu an.
          </p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Freigegebene Accounts
            </p>
            <p className="text-sm text-pretty text-muted-foreground">
              Jeder Eintrag entspricht genau einer GitHub-Kombination aus
              Username und verifizierter E-Mail in Supabase.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {accessEntries.map((entry) => {
              const isCurrentOwner =
                entry.githubUsername === accessEntry.githubUsername &&
                entry.email === accessEntry.email;

              return (
                <article
                  key={`${entry.githubUsername}:${entry.email}`}
                  className="rounded-[1.5rem] border border-border/50 bg-background/70 p-4 shadow-sm shadow-black/5">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold tracking-tight">
                            @{entry.githubUsername}
                          </h2>
                          {isCurrentOwner ? (
                            <Badge variant="secondary">Du</Badge>
                          ) : null}
                          <Badge
                            variant={
                              entry.dashboardAccess ? 'default' : 'outline'
                            }>
                            {entry.dashboardAccess ? 'Aktiv' : 'Gesperrt'}
                          </Badge>
                          <Badge variant="outline">
                            {entry.userRole.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {entry.email}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Seit{' '}
                        {new Intl.DateTimeFormat('de-DE', {
                          dateStyle: 'medium',
                        }).format(new Date(entry.createdAt))}
                      </p>
                    </div>

                    <form
                      action={updateDashboardAccessEntryAction}
                      className="flex flex-col gap-4">
                      <input
                        type="hidden"
                        name="githubUsername"
                        value={entry.githubUsername}
                      />
                      <input type="hidden" name="email" value={entry.email} />

                      <FieldGroup className="grid gap-4 lg:grid-cols-[minmax(0,12rem)_minmax(0,12rem)_minmax(0,1fr)]">
                        <Field>
                          <FieldLabel htmlFor={`role-${entry.githubUsername}`}>
                            Rolle
                          </FieldLabel>
                          <FieldContent>
                            <Select
                              defaultValue={entry.userRole}
                              disabled={isCurrentOwner}
                              name="userRole">
                              <SelectTrigger
                                id={`role-${entry.githubUsername}`}
                                className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent align="start">
                                <SelectGroup>
                                  {DASHBOARD_ACCESS_ROLE_VALUES.map((role) => (
                                    <SelectItem key={role} value={role}>
                                      {role.replace('_', ' ')}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FieldContent>
                        </Field>

                        <Field>
                          <FieldLabel
                            htmlFor={`access-${entry.githubUsername}`}>
                            Dashboard-Zugang
                          </FieldLabel>
                          <FieldContent>
                            <Select
                              defaultValue={
                                entry.dashboardAccess ? 'true' : 'false'
                              }
                              disabled={isCurrentOwner}
                              name="dashboardAccess">
                              <SelectTrigger
                                id={`access-${entry.githubUsername}`}
                                className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent align="start">
                                <SelectGroup>
                                  <SelectItem value="true">Aktiv</SelectItem>
                                  <SelectItem value="false">
                                    Gesperrt
                                  </SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FieldContent>
                        </Field>

                        <Field>
                          <FieldLabel htmlFor={`note-${entry.githubUsername}`}>
                            Notiz
                          </FieldLabel>
                          <FieldContent>
                            <Textarea
                              id={`note-${entry.githubUsername}`}
                              name="note"
                              defaultValue={entry.note ?? ''}
                              placeholder="z. B. Redaktion, temporärer Zugang, Backup-Owner"
                              rows={2}
                              disabled={isCurrentOwner}
                              className="min-h-20"
                            />
                          </FieldContent>
                        </Field>
                      </FieldGroup>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                          {isCurrentOwner
                            ? 'Deinen eigenen Owner-Zugang schützt das Dashboard aktuell vor direkten Änderungen.'
                            : 'Rolle, Status und Notiz greifen für neue JWTs nach dem nächsten Token-Refresh oder Login.'}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            type="submit"
                            variant="outline"
                            disabled={isCurrentOwner}>
                            Speichern
                          </Button>
                          <Button
                            type="submit"
                            variant="destructive"
                            formAction={deleteDashboardAccessEntryAction}
                            disabled={isCurrentOwner}>
                            Entfernen
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Neuen Zugang freigeben
            </p>
            <p className="text-sm text-pretty text-muted-foreground">
              Lege genau die GitHub-Kombination an, die Supabase beim Login
              liefern soll. Das landet direkt in der privaten Allowlist.
            </p>
          </div>

          <Separator />

          <form
            action={createDashboardAccessEntryAction}
            className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="dashboard-access-github-username">
                  GitHub-Username
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="dashboard-access-github-username"
                    name="githubUsername"
                    placeholder="mrbubbles-src"
                    autoComplete="off"
                  />
                  <FieldDescription>
                    Muss exakt dem GitHub-Account entsprechen, den Supabase im
                    Hook prüft.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="dashboard-access-email">
                  Verifizierte E-Mail
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="dashboard-access-email"
                    type="email"
                    name="email"
                    placeholder="name@mrbubbles-src.dev"
                    autoComplete="off"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="dashboard-access-role">Rolle</FieldLabel>
                <FieldContent>
                  <Select defaultValue="editor" name="userRole">
                    <SelectTrigger
                      id="dashboard-access-role"
                      className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectGroup>
                        {DASHBOARD_ACCESS_ROLE_VALUES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="dashboard-access-status">
                  Dashboard-Zugang
                </FieldLabel>
                <FieldContent>
                  <Select defaultValue="true" name="dashboardAccess">
                    <SelectTrigger
                      id="dashboard-access-status"
                      className="w-full">
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

              <Field>
                <FieldLabel htmlFor="dashboard-access-note">Notiz</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="dashboard-access-note"
                    name="note"
                    placeholder="Optionaler Kontext für dich oder andere Owner."
                    rows={3}
                    className="min-h-24"
                  />
                  <FieldDescription>
                    Praktisch für redaktionelle Rollen, befristete Zugänge oder
                    spätere Erinnerungen.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>

            <Button type="submit">Zugang freigeben</Button>
          </form>
        </aside>
      </div>
    </>
  );
}
