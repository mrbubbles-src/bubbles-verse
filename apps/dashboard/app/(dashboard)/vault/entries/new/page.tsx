/**
 * Renders the initial placeholder for creating a new Vault entry.
 *
 * The real `@bubbles/markdown-editor` integration lands in the dedicated entry
 * task once the shell and routing baseline are in place.
 */
export default function NewVaultEntryPage() {
  return (
    <section className="flex max-w-4xl flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
        Coding Vault
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        Neuer Vault-Eintrag
      </h1>
      <p className="text-sm text-pretty text-muted-foreground sm:text-base">
        Der Editor-Slot steht bereit. Im nächsten Schritt binden wir den
        Markdown-Editor und die ersten Speicherwege daran an.
      </p>
    </section>
  );
}
