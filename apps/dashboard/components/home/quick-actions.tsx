import Link from 'next/link';

import { Badge } from '@bubbles/ui/components/shadcn/badge';
import {
  ArrowRight01Icon,
  File01Icon,
  Folder01Icon,
  HugeiconsIcon,
  PencilEdit01Icon,
  Upload01Icon,
  UserAdd01Icon,
} from '@bubbles/ui/lib/hugeicons';
import { Separator } from '@bubbles/ui/shadcn/separator';

type QuickAction = {
  label: string;
  href: string;
  description: string;
};

type QuickActionsProps = {
  actions: QuickAction[];
  variant?: 'rail' | 'strip';
};

/**
 * Picks the closest available icon for a dashboard quick action.
 *
 * @param action Quick action containing the target path and label.
 * @returns Hugeicons glyph used in the mockup-like action strip.
 */
function getQuickActionIcon(action: QuickAction) {
  if (action.href.includes('/entries/new')) {
    return PencilEdit01Icon;
  }

  if (action.href.includes('/entries')) {
    return File01Icon;
  }

  if (action.href.includes('/categories')) {
    return Folder01Icon;
  }

  if (action.href.includes('/account')) {
    return UserAdd01Icon;
  }

  return Upload01Icon;
}

/**
 * Shortens action copy for the compact dashboard strip.
 *
 * @param action Quick action containing the target path and original text.
 * @returns One-line description that keeps icon tiles visually balanced.
 */
function getQuickActionStripDescription(action: QuickAction) {
  if (action.href.includes('/entries/new')) {
    return 'Neuen Inhalt schreiben.';
  }

  if (action.href.includes('/entries')) {
    return 'Entwürfe prüfen.';
  }

  if (action.href.includes('/categories')) {
    return 'Struktur pflegen.';
  }

  if (action.href.includes('/account')) {
    return 'Rollen verwalten.';
  }

  return action.description;
}

/**
 * Renders quick links either as a rail list or a horizontal action strip.
 *
 * Use `strip` near the dashboard title for primary creation paths and `rail`
 * for narrower side panels where stacked links scan better.
 *
 * @param props Quick action links and the visual variant to render.
 * @returns Navigation surface for starting common dashboard workflows.
 */
export function QuickActions({ actions, variant = 'rail' }: QuickActionsProps) {
  if (variant === 'strip') {
    return (
      <nav aria-label="Schnellstart" className="dashboard-action-strip">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="dashboard-action-tile group">
            <span className="dashboard-action-icon">
              <HugeiconsIcon
                icon={getQuickActionIcon(action)}
                strokeWidth={2}
              />
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-base font-semibold tracking-normal text-foreground">
                {action.label}
              </span>
              <span className="truncate text-sm/relaxed text-muted-foreground">
                {getQuickActionStripDescription(action)}
              </span>
            </span>
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <section className="dashboard-studio-panel-flat flex flex-col gap-4 px-4 py-5 sm:px-5">
      <div>
        <p className="dashboard-kicker">Schnellstart</p>
        <h2 className="dashboard-section-title mt-2 text-lg sm:text-xl">
          Nächste Aktionen
        </h2>
      </div>

      <div className="flex flex-col">
        {actions.map((action, index) => (
          <div key={action.href}>
            {index > 0 ? <Separator /> : null}
            <Link
              href={action.href}
              className="dashboard-soft-row group flex items-start justify-between gap-4 py-3.5">
              <span className="flex min-w-0 flex-col gap-1.5">
                <span className="text-base font-semibold tracking-tight sm:text-lg">
                  {action.label}
                </span>
                <span className="text-base text-muted-foreground">
                  {action.description}
                </span>
              </span>
              <Badge
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors group-hover:border-foreground/20 group-hover:text-foreground"
                variant="outline">
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Badge>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
