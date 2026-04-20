export type RoutePath =
  | '/'
  | '/profile'
  | '/account'
  | '/vault'
  | '/vault/categories'
  | '/vault/entries'
  | '/vault/entries/new'
  | '/vault/entries/[id]'
  | '/vault/preview/new'
  | '/vault/preview/[id]';

export type DashboardPageInfo = {
  title: string;
  description?: string;
};

/**
 * Normalizes a concrete pathname to the closest typed dashboard route key.
 *
 * Dynamic Vault-entry edit routes share one metadata definition so the shell
 * can keep breadcrumbs and copy consistent without every page duplicating it.
 *
 * @param pathname - Current dashboard pathname from the app shell.
 * @returns Matching typed route key used by the shell metadata helpers.
 */
export function getDashboardRoutePath(pathname: string): RoutePath {
  if (pathname === '/vault/preview/new') {
    return '/vault/preview/new';
  }

  if (pathname.startsWith('/vault/preview/')) {
    return '/vault/preview/[id]';
  }

  if (pathname === '/vault/entries/new') {
    return '/vault/entries/new';
  }

  if (pathname.startsWith('/vault/entries/')) {
    return '/vault/entries/[id]';
  }

  return (pathname as RoutePath) in ROUTE_PAGE_META_BY_PATH
    ? (pathname as RoutePath)
    : '/';
}

/**
 * Route-level copy used by the shared dashboard shell header.
 *
 * Keep this map small and explicit so app sections stay easy to scan while the
 * dashboard grows.
 */
export const ROUTE_PAGE_META_BY_PATH: Record<RoutePath, DashboardPageInfo> = {
  '/': {
    title: 'Dashboard',
    description: 'Dein Arbeitsbereich für Inhalte und Redaktion.',
  },
  '/account': {
    title: 'Zugangsverwaltung',
    description: 'Freigaben, Rollen und Hinweise für Dashboard-Zugänge.',
  },
  '/profile': {
    title: 'Autorenprofil',
    description: 'Pflege die Daten für Autorenansicht, Bio und Links.',
  },
  '/vault': {
    title: 'Coding Vault',
    description: 'Arbeite direkt an Entwürfen und zuletzt geänderten Inhalten.',
  },
  '/vault/categories': {
    title: 'Kategorien',
    description: 'Strukturiere Ober- und Unterkategorien für den Vault.',
  },
  '/vault/entries': {
    title: 'Einträge',
    description:
      'Suche, filtere und verwalte alle Vault-Einträge an einem Ort.',
  },
  '/vault/entries/new': {
    title: 'Neuer Eintrag',
  },
  '/vault/entries/[id]': {
    title: 'Eintrag bearbeiten',
  },
  '/vault/preview/new': {
    title: 'Vorschau',
  },
  '/vault/preview/[id]': {
    title: 'Vorschau',
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
  return ROUTE_PAGE_META_BY_PATH[getDashboardRoutePath(pathname)];
}
