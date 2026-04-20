import type { IconSvgElement } from '@hugeicons/react';
import type { ReactNode } from 'react';

/**
 * Controls how a sidebar item matches the current pathname.
 */
export type BubblesSidebarMatch = 'exact' | 'prefix';

/**
 * Defines one logo asset used by the shared sidebar brand block.
 */
export type BubblesSidebarBrandAsset = {
  src: string;
  alt: string;
};

/**
 * Describes the shared sidebar brand link and both logo states.
 */
export type BubblesSidebarBrand = {
  href: string;
  compactLogo: BubblesSidebarBrandAsset;
  fullLogo: BubblesSidebarBrandAsset;
};

/**
 * Represents one recursive sidebar navigation entry.
 */
export type BubblesSidebarItem = {
  id: string;
  title: string;
  href?: string;
  icon?: IconSvgElement;
  match?: BubblesSidebarMatch;
  action?: BubblesSidebarItemAction;
  children?: BubblesSidebarItem[];
};

/**
 * Describes one optional trailing action attached to a sidebar item.
 */
export type BubblesSidebarItemAction = {
  ariaLabel: string;
  icon: IconSvgElement;
  onSelect?: () => boolean | void;
  href?: string;
  navigateOnItemActiveOnly?: boolean;
  showOnHover?: boolean;
  confirm?: BubblesSidebarItemActionConfirm;
};

/**
 * Describes the optional confirmation dialog for one trailing sidebar action.
 */
export type BubblesSidebarItemActionConfirm = {
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  size?: 'default' | 'sm';
  secondStep?: BubblesSidebarItemActionConfirmSecondStep;
};

/**
 * Describes the optional second confirmation step for one sidebar action.
 */
export type BubblesSidebarItemActionConfirmSecondStep = {
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
};

/**
 * Groups sidebar items under one shared section label.
 */
export type BubblesSidebarSection = {
  id: string;
  title: string;
  items: BubblesSidebarItem[];
};

/**
 * Defines the top-level shared sidebar data contract.
 */
export type BubblesSidebarData = {
  brand: BubblesSidebarBrand;
  sections: BubblesSidebarSection[];
};

/**
 * Describes one breadcrumb segment in the shared header.
 */
export type BubblesBreadcrumb = {
  label: string;
  href?: string;
};

/**
 * Defines the optional authenticated user footer menu.
 */
export type BubblesSidebarUser = {
  name: string;
  email: string;
  avatarSrc?: string;
  dashboardHref: string;
  settingsHref: string;
  logoutHref: string;
};

/**
 * Defines override class hooks for the shared sidebar layout shell.
 */
export type BubblesSidebarLayoutClassNames = {
  root?: string;
  sidebar?: string;
  sidebarHeader?: string;
  sidebarContent?: string;
  sidebarFooter?: string;
  sidebarInset?: string;
  content?: string;
};

/**
 * Defines override class hooks for the shared injected app header.
 */
export type BubblesAppHeaderClassNames = {
  root?: string;
  inner?: string;
  leading?: string;
  triggerGroup?: string;
  meta?: string;
  breadcrumbs?: string;
  subtitleRow?: string;
  subtitle?: string;
  subtitleAction?: string;
  mobileTopActions?: string;
  actions?: string;
};

/**
 * Defines the public props contract for the injected shared app header.
 */
export type BubblesAppHeaderProps = {
  breadcrumbs?: BubblesBreadcrumb[];
  subtitle?: ReactNode;
  subtitleAction?: ReactNode;
  mobileTopActions?: ReactNode;
  actions?: ReactNode;
  classNames?: BubblesAppHeaderClassNames;
};

/**
 * Checks whether a pathname matches one sidebar href using the configured rule.
 *
 * Prefix matching treats `/foo` as active for `/foo` and `/foo/bar`, but not
 * for unrelated siblings such as `/foobar`.
 */
export function matchesBubblesSidebarPath(
  pathname: string,
  href: string,
  match: BubblesSidebarMatch = 'exact'
): boolean {
  if (match === 'exact') {
    return pathname === href;
  }

  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Returns `true` when any descendant of an item matches the current pathname.
 */
export function bubblesSidebarHasActiveDescendant(
  pathname: string,
  item: BubblesSidebarItem
): boolean {
  return (
    item.children?.some((child) =>
      isBubblesSidebarItemActive(pathname, child)
    ) ?? false
  );
}

/**
 * Returns `true` when an item itself or one of its descendants is active.
 */
export function isBubblesSidebarItemActive(
  pathname: string,
  item: BubblesSidebarItem
): boolean {
  const matchesSelf = item.href
    ? matchesBubblesSidebarPath(pathname, item.href, item.match)
    : false;

  return matchesSelf || bubblesSidebarHasActiveDescendant(pathname, item);
}

/**
 * Returns `true` when a collapsible item should open for the current pathname.
 */
export function isBubblesSidebarItemExpanded(
  pathname: string,
  item: BubblesSidebarItem
): boolean {
  if (!item.children?.length) {
    return false;
  }

  return isBubblesSidebarItemActive(pathname, item);
}
