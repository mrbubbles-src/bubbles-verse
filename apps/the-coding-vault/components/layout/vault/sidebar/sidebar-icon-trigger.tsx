'use client';

import type { IconProp } from '@fortawesome/fontawesome-svg-core';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '@bubbles/ui/shadcn/button';
import { useSidebar } from '@bubbles/ui/shadcn/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@bubbles/ui/shadcn/tooltip';

import { cn } from '@/lib/utils';

type SidebarIconTriggerProps = React.ComponentProps<typeof Button> & {
  categoryName: string;
  iconToUse: IconProp;
};

type SidebarButtonClickEvent = Parameters<
  NonNullable<React.ComponentProps<typeof Button>['onClick']>
>[0];

export function SidebarIconTrigger({
  className,
  onClick,
  categoryName,
  iconToUse,
  ...props
}: SidebarIconTriggerProps) {
  const { toggleSidebar, state } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            data-sidebar="trigger"
            data-slot="sidebar-trigger"
            variant="ghost"
            size="icon"
            className={cn(
              'size-7 cursor-pointer',
              state === 'expanded' ? 'ml-4 size-8' : '',
              className
            )}
            onClick={(event: SidebarButtonClickEvent) => {
              onClick?.(event);
              toggleSidebar();
            }}
            {...props}>
            <FontAwesomeIcon icon={iconToUse} size="2xl" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        }
      />
      <TooltipContent
        side={state === 'collapsed' ? 'right' : 'top'}
        className="z-[1001] max-w-[20rem] font-bold text-pretty md:max-w-full">
        {categoryName}
      </TooltipContent>
    </Tooltip>
  );
}
