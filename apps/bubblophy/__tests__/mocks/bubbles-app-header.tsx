import type { ReactNode } from 'react';

/**
 * Renders a compact app-header test double with visible actions.
 *
 * @param props Header content used by Bubblophy tests.
 * @returns Header markup without pulling the shared sidebar package into Vitest.
 */
export function BubblesAppHeader({
  actions,
  subtitle,
}: {
  actions?: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <header>
      {subtitle ? <p>{subtitle}</p> : null}
      {actions}
    </header>
  );
}
