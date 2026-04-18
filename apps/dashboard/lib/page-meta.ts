export type RoutePath =
  | '/'
  | '/account'
  | '/vault'
  | '/vault/categories'
  | '/vault/entries'
  | '/vault/entries/new'
  | '/vault/entries/[id]';

export type DashboardPageInfo = {
  title: string;
  description: string;
};

/**
 * Route-level copy used by the shared dashboard shell header.
 *
 * Keep this map small and explicit so app sections stay easy to scan while the
 * dashboard grows.
 */
export const ROUTE_PAGE_META_BY_PATH: Record<RoutePath, DashboardPageInfo> = {
  '/': {
    title: 'Dashboard',
    description:
      'Dein privater Arbeitsbereich für Inhalte in allen Bubbles-Apps.',
  },
  '/account': {
    title: 'Account',
    description:
      'Dein Login, deine erlaubte Identität und dein Zugang zum Dashboard.',
  },
  '/vault': {
    title: 'Coding Vault',
    description:
      'Übersicht für deine Vault-Inhalte, Kategorien und offenen Entwürfe.',
  },
  '/vault/categories': {
    title: 'Vault Kategorien',
    description:
      'Pflege Ober- und Unterkategorien für die Struktur des Coding Vaults.',
  },
  '/vault/entries': {
    title: 'Vault Einträge',
    description:
      'Alle Coding-Vault-Einträge an einem Ort, inklusive Drafts und Veröffentlichungen.',
  },
  '/vault/entries/new': {
    title: 'Neuer Vault-Eintrag',
    description:
      'Starte einen neuen Eintrag direkt aus dem zentralen Dashboard.',
  },
  '/vault/entries/[id]': {
    title: 'Vault-Eintrag bearbeiten',
    description:
      'Bearbeite einen bestehenden Coding-Vault-Eintrag direkt im Dashboard.',
  },
};

/**
 * Returns page metadata for the current dashboard pathname.
 *
 * Unknown paths fall back to the global dashboard copy so the shell stays
 * stable while more routes are added incrementally.
 */
export function getDashboardPageInfoByPath(
  pathname: string
): DashboardPageInfo {
  if (pathname.startsWith('/vault/entries/')) {
    return ROUTE_PAGE_META_BY_PATH['/vault/entries/[id]'];
  }

  return (
    ROUTE_PAGE_META_BY_PATH[pathname as RoutePath] ??
    ROUTE_PAGE_META_BY_PATH['/']
  );
}
