import { and, asc, count, desc, eq } from 'drizzle-orm';
import * as z from 'zod';

import { db } from '@/drizzle/db';
import { dashboardGithubAllowlist } from '@/drizzle/db/schema';

export const DASHBOARD_ACCESS_ROLE_VALUES = [
  'owner',
  'editor',
  'guest_author',
] as const;

export type DashboardAccessRole = (typeof DASHBOARD_ACCESS_ROLE_VALUES)[number];
export type DashboardAccessEntry = typeof dashboardGithubAllowlist.$inferSelect;

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

const dashboardAccessRoleOrder: Record<DashboardAccessRole, number> = {
  owner: 0,
  editor: 1,
  guest_author: 2,
};

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
 * Lists all dashboard access rows in owner-first order.
 *
 * The account page uses this to render a stable, mobile-friendly access list
 * where active Owner entries stay visible at the top.
 *
 * @returns The complete allowlist, sorted for the dashboard UI.
 */
export async function listDashboardAccessEntries() {
  const entries = await db
    .select()
    .from(dashboardGithubAllowlist)
    .orderBy(
      desc(dashboardGithubAllowlist.dashboardAccess),
      asc(dashboardGithubAllowlist.githubUsername),
      asc(dashboardGithubAllowlist.email)
    );

  return entries.sort((left, right) => {
    const roleDifference =
      dashboardAccessRoleOrder[left.userRole as DashboardAccessRole] -
      dashboardAccessRoleOrder[right.userRole as DashboardAccessRole];

    if (roleDifference !== 0) {
      return roleDifference;
    }

    return left.githubUsername.localeCompare(right.githubUsername, 'de');
  });
}

/**
 * Loads one dashboard access row by its composite GitHub identity key.
 *
 * Access rows are keyed by lowercase GitHub username plus email so Supabase
 * hook decisions and dashboard-side checks rely on the same identity pair.
 *
 * @param identity The normalized username and email to look up.
 * @returns The matching access row or `null`.
 */
export async function getDashboardAccessEntryByIdentity(identity: {
  githubUsername: string;
  email: string;
}) {
  const [entry] = await db
    .select()
    .from(dashboardGithubAllowlist)
    .where(
      and(
        eq(dashboardGithubAllowlist.githubUsername, identity.githubUsername),
        eq(dashboardGithubAllowlist.email, identity.email)
      )
    )
    .limit(1);

  return entry ?? null;
}

/**
 * Counts active Owner rows that still have dashboard access enabled.
 *
 * Mutations use this guard to prevent locking everyone out of the dashboard by
 * downgrading or deleting the final Owner entry.
 *
 * @returns Number of active Owner rows.
 */
export async function countActiveDashboardOwners() {
  const [result] = await db
    .select({ total: count() })
    .from(dashboardGithubAllowlist)
    .where(
      and(
        eq(dashboardGithubAllowlist.userRole, 'owner'),
        eq(dashboardGithubAllowlist.dashboardAccess, true)
      )
    );

  return result?.total ?? 0;
}

/**
 * Parses and validates a new dashboard access row from form data.
 *
 * Keep the normalization rules next to the DB model so both the UI and auth
 * layer rely on one canonical identity format.
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
 * Server Actions use this helper after validation so the DB layer only sees
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
