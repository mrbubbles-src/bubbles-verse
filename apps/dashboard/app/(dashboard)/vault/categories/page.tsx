/**
 * Renders the initial placeholder for Vault category management.
 *
 * The real CRUD flow for Ober- und Unterkategorien is added in the next task.
 */
export default function VaultCategoriesPage() {
  return (
    <section className="flex max-w-4xl flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
        Coding Vault
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        Kategorienverwaltung kommt direkt als Nächstes.
      </h1>
      <p className="text-sm text-pretty text-muted-foreground sm:text-base">
        Die Seite steht schon im Shell-Kontext bereit, damit wir die eigentliche
        Baum- und Formlogik ohne Routing-Umbauten ergänzen können.
      </p>
    </section>
  );
}
