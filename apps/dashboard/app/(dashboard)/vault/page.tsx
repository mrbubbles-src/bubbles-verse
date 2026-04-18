/**
 * Renders the initial Coding Vault overview placeholder.
 *
 * This route marks the first app-specific section of the dashboard while the
 * real category and entry management flows are still being implemented.
 */
export default function VaultPage() {
  return (
    <section className="flex max-w-4xl flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
        Coding Vault
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        Vault-Übersicht folgt als nächster Slice.
      </h1>
      <p className="text-sm text-pretty text-muted-foreground sm:text-base">
        Hier landen als Nächstes die Eintragslisten, Kategorien und die direkten
        Wege in den Markdown-Editor.
      </p>
    </section>
  );
}
