import Link from 'next/link';

/**
 * Keeps the legacy `/log` route friendly while dashboard logging now happens
 * inline through the Story 2.2 bottom-sheet flow.
 */
export default function LogPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center px-4">
      <h1 className="mb-4">Log Activity</h1>
      <p className="text-center text-muted-foreground">
        Duration logging now opens directly from the dashboard.
      </p>
      <Link href="/" className="touch-hitbox mt-6 text-primary underline">
        Back to dashboard
      </Link>
    </main>
  );
}
