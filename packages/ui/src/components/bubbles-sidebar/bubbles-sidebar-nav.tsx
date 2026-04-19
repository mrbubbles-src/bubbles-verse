'use client';

import type {
  BubblesSidebarItem,
  BubblesSidebarSection,
} from '@bubbles/ui/lib/bubbles-sidebar';

import * as React from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  bubblesSidebarHasActiveDescendant,
  isBubblesSidebarItemActive,
  isBubblesSidebarItemExpanded,
} from '@bubbles/ui/lib/bubbles-sidebar';
import { ArrowRight01Icon, HugeiconsIcon } from '@bubbles/ui/lib/hugeicons';
import { cn } from '@bubbles/ui/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@bubbles/ui/shadcn/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@bubbles/ui/shadcn/sidebar';

type BubblesSidebarNavProps = {
  sections: BubblesSidebarSection[];
};

type BubblesSidebarNavItemProps = {
  item: BubblesSidebarItem;
  depth?: number;
  pathname: string;
};

function BubblesSidebarLeaf({
  item,
  depth,
  isActive,
}: {
  item: BubblesSidebarItem;
  depth: number;
  isActive: boolean;
}) {
  if (depth === 0) {
    return (
      <SidebarMenuButton
        render={
          item.href ? (
            <Link href={item.href} />
          ) : (
            <button type="button" aria-disabled="true" />
          )
        }
        isActive={isActive}
        tooltip={item.title}
        className="h-11 rounded-xl px-3 text-[15px] font-medium group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0! md:h-12 md:text-base group-data-[collapsible=icon]:[&>span]:hidden [&>svg]:size-5">
        {item.icon ? <HugeiconsIcon icon={item.icon} strokeWidth={2} /> : null}
        <span>{item.title}</span>
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuSubButton
      render={
        item.href ? (
          <Link href={item.href} />
        ) : (
          <button type="button" aria-disabled="true" />
        )
      }
      isActive={isActive}
      className="min-h-8 rounded-lg px-2.5 text-sm font-medium md:min-h-9 md:text-[15px] [&>svg]:size-4">
      {item.icon ? <HugeiconsIcon icon={item.icon} strokeWidth={2} /> : null}
      <span>{item.title}</span>
    </SidebarMenuSubButton>
  );
}

function BubblesSidebarGroupItem({
  item,
  depth = 0,
  pathname,
}: BubblesSidebarNavItemProps) {
  const isActive = isBubblesSidebarItemActive(pathname, item);
  const shouldOpen = isBubblesSidebarItemExpanded(pathname, item);
  const [open, setOpen] = React.useState(shouldOpen);

  React.useEffect(() => {
    if (shouldOpen) {
      setOpen(true);
    }
  }, [shouldOpen]);

  const trigger =
    depth === 0 ? (
      <SidebarMenuButton
        isActive={isActive}
        tooltip={item.title}
        className="h-11 rounded-xl px-3 text-[15px] font-medium group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0! md:h-12 md:text-base group-data-[collapsible=icon]:[&>span]:hidden [&>svg]:size-5">
        {item.icon ? <HugeiconsIcon icon={item.icon} strokeWidth={2} /> : null}
        <span>{item.title}</span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className="ml-auto size-4 transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90"
        />
      </SidebarMenuButton>
    ) : (
      <SidebarMenuSubButton
        render={<button type="button" />}
        isActive={isActive}
        className="min-h-8 rounded-lg px-2.5 text-sm font-medium md:min-h-9 md:text-[15px] [&>svg]:size-4">
        {item.icon ? <HugeiconsIcon icon={item.icon} strokeWidth={2} /> : null}
        <span>{item.title}</span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
        />
      </SidebarMenuSubButton>
    );

  const children = item.children ?? [];

  if (depth === 0) {
    return (
      <SidebarMenuItem>
        <Collapsible
          open={open}
          onOpenChange={setOpen}
          className="group/collapsible">
          <CollapsibleTrigger render={trigger} />
          <CollapsibleContent
            className={cn(
              'overflow-hidden transition-all duration-200 ease-linear',
              'group-data-[state=closed]/collapsible:animate-collapsible-up',
              'group-data-[state=open]/collapsible:animate-collapsible-down'
            )}>
            <SidebarMenuSub>
              {children.map((child) => (
                <BubblesSidebarNavItem
                  key={child.id}
                  item={child}
                  depth={depth + 1}
                  pathname={pathname}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="group/collapsible">
        <CollapsibleTrigger render={trigger} />
        <CollapsibleContent
          className={cn(
            'overflow-hidden transition-all duration-200 ease-linear',
            'group-data-[state=closed]/collapsible:animate-collapsible-up',
            'group-data-[state=open]/collapsible:animate-collapsible-down'
          )}>
          <SidebarMenuSub>
            {children.map((child) => (
              <BubblesSidebarNavItem
                key={child.id}
                item={child}
                depth={depth + 1}
                pathname={pathname}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuSubItem>
  );
}

function BubblesSidebarNavItem({
  item,
  depth = 0,
  pathname,
}: BubblesSidebarNavItemProps) {
  const router = useRouter();
  const hasChildren = (item.children?.length ?? 0) > 0;
  const isActive = isBubblesSidebarItemActive(pathname, item);
  const action = item.action;

  const handleActionClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();
    event.stopPropagation();

    action?.onSelect?.();

    if (!action?.href) {
      return;
    }

    if (action.navigateOnItemActiveOnly && pathname !== item.href) {
      return;
    }

    router.push(action.href);
  };

  if (hasChildren) {
    return (
      <BubblesSidebarGroupItem item={item} depth={depth} pathname={pathname} />
    );
  }

  if (depth === 0) {
    return (
      <SidebarMenuItem
        data-has-active-descendant={bubblesSidebarHasActiveDescendant(
          pathname,
          item
        )}>
        <BubblesSidebarLeaf item={item} depth={depth} isActive={isActive} />
        {action ? (
          <SidebarMenuAction
            type="button"
            aria-label={action.ariaLabel}
            showOnHover={action.showOnHover}
            onClick={handleActionClick}>
            <HugeiconsIcon icon={action.icon} strokeWidth={2} />
          </SidebarMenuAction>
        ) : null}
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuSubItem
      data-has-active-descendant={bubblesSidebarHasActiveDescendant(
        pathname,
        item
      )}>
      <BubblesSidebarLeaf item={item} depth={depth} isActive={isActive} />
      {action ? (
        <SidebarMenuAction
          type="button"
          aria-label={action.ariaLabel}
          showOnHover={action.showOnHover ?? true}
          onClick={handleActionClick}>
          <HugeiconsIcon icon={action.icon} strokeWidth={2} />
        </SidebarMenuAction>
      ) : null}
    </SidebarMenuSubItem>
  );
}

/**
 * Renders the shared recursive sidebar navigation from typed section data.
 */
export function BubblesSidebarNav({ sections }: BubblesSidebarNavProps) {
  const pathname = usePathname();

  return (
    <>
      {sections.map((section) => {
        if (!section.items.length) {
          return null;
        }

        return (
          <SidebarGroup key={section.id} className="px-3 py-2">
            {section.title ? (
              <SidebarGroupLabel className="px-1 text-xs font-semibold tracking-[0.18em] text-sidebar-foreground/55 uppercase">
                {section.title}
              </SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent className="pt-1 text-sm">
              <SidebarMenu className="gap-1.5">
                {section.items.map((item) => (
                  <BubblesSidebarNavItem
                    key={item.id}
                    item={item}
                    pathname={pathname}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}
