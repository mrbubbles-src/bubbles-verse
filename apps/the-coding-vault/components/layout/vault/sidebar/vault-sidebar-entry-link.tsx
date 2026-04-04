'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { SidebarMenuButton } from '@bubbles/ui/shadcn/sidebar';
import { Route } from 'next';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@bubbles/ui/shadcn/tooltip';

interface VaultSidebarEntryLinkProps {
  slug: string;
  title: string;
}

const VaultSidebarEntryLink = ({ slug, title }: VaultSidebarEntryLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname.toLowerCase() === `/vault/${slug}`.toLowerCase();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <SidebarMenuButton
            variant="outline"
            className={`opacity-0 transition-all duration-300 ease-in-out group-data-[state=open]/collapsible:opacity-100 ${isActive ? 'scale-105' : ''}`}
            render={
              <Link href={`/vault/${slug}` as Route} prefetch={false}>
                <span className={isActive ? 'font-bold' : ''}>{title}</span>
              </Link>
            }
            isActive={isActive}
          />
        }
      />
      <TooltipContent
        side="right"
        className="TooltipContent z-[1001] max-w-[20rem] font-bold text-pretty md:max-w-full">
        {title}
      </TooltipContent>
    </Tooltip>
  );
};

export default VaultSidebarEntryLink;
