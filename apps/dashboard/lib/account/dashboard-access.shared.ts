import * as z from 'zod';

export const DASHBOARD_ACCESS_ROLE_VALUES = [
  'owner',
  'editor',
  'guest_author',
] as const;

export type DashboardAccessRole = (typeof DASHBOARD_ACCESS_ROLE_VALUES)[number];
export type DashboardAccessSummary = {
  total: number;
  active: number;
  owners: number;
};

/**
 * Describes one allowlist row as it is used across server and client code.
 *
 * The dashboard UI only needs the stable identity, role, note, access flag,
 * and creation timestamp, so this shared shape stays independent from the DB
 * module and can safely cross the client boundary.
 */
export type DashboardAccessEntry = {
  githubUsername: string;
  email: string;
  note: string | null;
  userRole: string;
  dashboardAccess: boolean;
  createdAt: string;
};

const githubUsernameSchema = z
  .string()
  .trim()
  .min(1, 'Bitte gib einen GitHub-Usernamen ein.')
  .max(39, 'GitHub-Usernamen dürfen höchstens 39 Zeichen lang sein.')
  .regex(
    /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i,
    'Bitte gib einen gültigen GitHub-Usernamen ein.'
  )
  .transform((value) => value.toLowerCase());

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Bitte gib eine E-Mail-Adresse ein.')
  .email('Bitte gib eine gültige E-Mail-Adresse ein.')
  .transform((value) => value.toLowerCase());

const userRoleSchema = z.enum(DASHBOARD_ACCESS_ROLE_VALUES, {
  error: 'Bitte wähle eine gültige Rolle.',
});

const dashboardAccessSchema = z.enum(['true', 'false'], {
  error: 'Bitte wähle einen gültigen Zugangsstatus.',
});

const noteSchema = z
  .string()
  .trim()
  .max(160, 'Notizen dürfen höchstens 160 Zeichen lang sein.')
  .transform((value) => (value.length > 0 ? value : null));

const createDashboardAccessEntrySchema = z.object({
  githubUsername: githubUsernameSchema,
  email: emailSchema,
  userRole: userRoleSchema,
  dashboardAccess: dashboardAccessSchema,
  note: noteSchema,
});

const updateDashboardAccessEntrySchema = z.object({
  githubUsername: githubUsernameSchema,
  email: emailSchema,
  userRole: userRoleSchema,
  dashboardAccess: dashboardAccessSchema,
  note: noteSchema,
});

/**
 * Narrows raw allowlist role strings to the supported dashboard role union.
 *
 * @param role Role value stored in the private allowlist row.
 * @returns A safe role value for typed UI helpers and form defaults.
 */
export function toDashboardAccessRole(role: string): DashboardAccessRole {
  if (role === 'owner' || role === 'editor' || role === 'guest_author') {
    return role;
  }

  return 'guest_author';
}

/**
 * Formats the persisted role value for human-facing dashboard labels.
 *
 * @param role Raw role value from the allowlist row.
 * @returns A readable German label for tables, badges, and dialogs.
 */
export function formatDashboardAccessRoleLabel(role: string) {
  switch (toDashboardAccessRole(role)) {
    case 'guest_author':
      return 'Gastautor';
    case 'owner':
      return 'Owner';
    default:
      return 'Editor';
  }
}

/**
 * Summarizes the current allowlist for the owner-facing status line.
 *
 * @param entries Already loaded dashboard access rows.
 * @returns Flat counts for total, active, and owner rows.
 */
export function summarizeDashboardAccessEntries(
  entries: DashboardAccessEntry[]
): DashboardAccessSummary {
  return entries.reduce<DashboardAccessSummary>(
    (summary, entry) => ({
      total: summary.total + 1,
      active: summary.active + Number(entry.dashboardAccess),
      owners:
        summary.owners +
        Number(toDashboardAccessRole(entry.userRole) === 'owner'),
    }),
    {
      total: 0,
      active: 0,
      owners: 0,
    }
  );
}

/**
 * Normalizes a GitHub username for stable DB comparisons.
 *
 * Dashboard access rows are stored lowercase so sign-in checks and form
 * mutations can compare identities without case drift between providers.
 *
 * @param value GitHub username from Supabase or a form submission.
 * @returns The normalized username or `null` when it is missing.
 */
export function normalizeGithubUsername(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.trim().toLowerCase();
}

/**
 * Normalizes an email address for stable DB comparisons.
 *
 * Access checks compare the signed-in identity against the private allowlist by
 * exact email and username, so casing and stray spaces are removed first.
 *
 * @param value Email from Supabase or a form submission.
 * @returns The normalized email or `null` when it is missing.
 */
export function normalizeDashboardEmail(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.trim().toLowerCase();
}

/**
 * Parses and validates a new dashboard access row from form data.
 *
 * Keep the normalization rules next to the shared schema so both the UI and
 * server actions rely on one canonical identity format.
 *
 * @param formData Submitted account form payload.
 * @returns A safe parse result with normalized values.
 */
export function parseCreateDashboardAccessEntry(formData: FormData) {
  return createDashboardAccessEntrySchema.safeParse({
    githubUsername: formData.get('githubUsername'),
    email: formData.get('email'),
    userRole: formData.get('userRole'),
    dashboardAccess: formData.get('dashboardAccess'),
    note: formData.get('note') ?? '',
  });
}

/**
 * Parses and validates an existing dashboard access row update.
 *
 * The identity keys stay immutable in V1, so the update payload only covers
 * mutable fields while still validating the row identity from hidden inputs.
 *
 * @param formData Submitted account form payload.
 * @returns A safe parse result with normalized values.
 */
export function parseUpdateDashboardAccessEntry(formData: FormData) {
  return updateDashboardAccessEntrySchema.safeParse({
    githubUsername: formData.get('githubUsername'),
    email: formData.get('email'),
    userRole: formData.get('userRole'),
    dashboardAccess: formData.get('dashboardAccess'),
    note: formData.get('note') ?? '',
  });
}

/**
 * Converts the string-based form payload into the DB insert shape.
 *
 * Server actions use this helper after validation so the DB layer only sees
 * correctly typed values.
 *
 * @param input Validated create/update payload.
 * @returns Insert-ready access row data.
 */
export function toDashboardAccessInsertValues(
  input: z.infer<typeof createDashboardAccessEntrySchema>
) {
  return {
    githubUsername: input.githubUsername,
    email: input.email,
    userRole: input.userRole,
    dashboardAccess: input.dashboardAccess === 'true',
    note: input.note,
  };
}
