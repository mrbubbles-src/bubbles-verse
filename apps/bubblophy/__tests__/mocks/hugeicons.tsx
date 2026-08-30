import type { SVGProps } from 'react';

export const Add01Icon = 'Add01Icon';
export const Alert01Icon = 'Alert01Icon';
export const AlertCircleIcon = 'AlertCircleIcon';
export const CheckListIcon = 'CheckListIcon';
export const DashboardSquare01Icon = 'DashboardSquare01Icon';
export const FlashIcon = 'FlashIcon';
export const Folder01Icon = 'Folder01Icon';
export const PlayCircle02Icon = 'PlayCircle02Icon';
export const UserGroupIcon = 'UserGroupIcon';

/**
 * Renders a minimal SVG stand-in for Hugeicons during component tests.
 *
 * @param props SVG props passed by UI components.
 * @returns Test-safe icon placeholder.
 */
export function HugeiconsIcon({
  icon,
  ...props
}: SVGProps<SVGSVGElement> & { icon?: string }) {
  return <svg aria-hidden data-icon-name={icon} {...props} />;
}
