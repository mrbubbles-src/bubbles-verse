import { requireOwnerSession } from '@/lib/auth/session'

/**
 * Protects dashboard routes behind the owner-only Supabase session gate.
 *
 * Any route placed inside the `(dashboard)` group must have an authenticated
 * allowlisted GitHub identity before its UI is rendered.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireOwnerSession()

  return children
}
