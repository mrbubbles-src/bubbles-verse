/**
 * Renders the temporary landing page for the dashboard app scaffold.
 *
 * Keep this page minimal until the first dashboard slice is implemented. It
 * provides a stable route while the monorepo wiring is being finalized.
 *
 * @returns A placeholder page confirming the app is mounted.
 */
export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="space-y-3 text-center">
        <p className="text-sm font-medium tracking-[0.3em] text-muted-foreground uppercase">
          Bubbles Verse
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Dashboard scaffold is ready
        </h1>
        <p className="mx-auto max-w-xl text-sm text-pretty text-muted-foreground sm:text-base">
          The app is wired into the monorepo and ready for the first real
          dashboard feature slice.
        </p>
      </div>
    </main>
  );
}
