/**
 * Renders the initial owner account placeholder page.
 *
 * Keep this route simple for V1 until profile editing and richer account
 * settings land in the dashboard.
 */
export default function AccountPage() {
  return (
    <section className="flex max-w-3xl flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
        Account
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        Dein Dashboard-Zugang
      </h1>
      <p className="text-sm text-pretty text-muted-foreground sm:text-base">
        Hier bündeln wir später Profilpflege, erlaubte Login-Identitäten und
        weitere Zugangseinstellungen. Für V1 bleibt der Bereich bewusst schlank.
      </p>
    </section>
  );
}
