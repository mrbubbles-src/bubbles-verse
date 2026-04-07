import Link from 'next/link';

/**
 * Placeholder for the activity history page.
 * Will be implemented in Story 4.1.
 */
export default function HistoryPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center px-4">
      <h1 className="mb-4">History</h1>
      <p className="text-muted-foreground">Coming soon — Story 4.1</p>
      <Link href="/" className="touch-hitbox mt-6 text-primary underline">
        Back to Dashboard
      </Link>
    </main>
  );
}
