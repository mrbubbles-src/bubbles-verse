import Link from 'next/link';

/**
 * Placeholder for the activity logging page.
 * Will be replaced by the inline bottom-sheet flow in Story 2.2.
 */
export default function LogPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center px-4">
      <h1 className="mb-4">Log Activity</h1>
      <p className="text-muted-foreground">Coming soon — Story 2.2</p>
      <Link href="/" className="touch-hitbox mt-6 text-primary underline">
        Back to Dashboard
      </Link>
    </main>
  );
}
