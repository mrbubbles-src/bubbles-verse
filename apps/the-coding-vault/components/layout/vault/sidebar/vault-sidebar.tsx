import Icon from '@/public/images/icon.svg';
import Logo from '@/public/images/sidebarlogo.svg';
import { iconMap } from '@/lib/icon-map';
import { ArrowLeft01Icon, HugeiconsIcon } from '@bubbles/ui/lib/hugeicons';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@bubbles/ui/shadcn/sidebar';
import Link from 'next/link';
import Image from 'next/image';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@bubbles/ui/shadcn/collapsible';
import { ICategories } from '@/types/types';
import VaultSidebarEntryLink from '@/components/layout/vault/sidebar/vault-sidebar-entry-link';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@bubbles/ui/shadcn/tooltip';
import { SidebarIconTrigger } from './sidebar-icon-trigger';
import VaultSidebarFooter from './vault-sidebar-footer';

const VaultSidebar = async ({
  categories,
}: {
  categories: Array<ICategories>;
}) => {
  return (
    <Sidebar collapsible="icon" variant="floating">
      {/* ? Header Start */}
      <Tooltip>
        <TooltipTrigger
          render={
            <SidebarHeader className="py-4">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    render={
                      <Link
                        href="/"
                        prefetch={false}
                        className="cursor-pointer"
                      />
                    }>
                    <Image
                      src={Icon}
                      alt="vaulty-icon"
                      className="cursor-pointer"
                      width={45}
                      height={45}
                      priority
                    />

                    <Image
                      src={Logo}
                      alt="the-coding-vault-logo"
                      className="cursor-pointer"
                      width={210}
                      height={45}
                      priority
                    />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>
          }
        />
        <TooltipContent
          side="right"
          className="TooltipContent z-[1001] max-w-[20rem] font-bold text-pretty md:max-w-full">
          Zurück zum Vault-Eingang
        </TooltipContent>
      </Tooltip>
      {/* ? Header End */}
      <SidebarSeparator />
      {/* ? Content Start */}
      <SidebarContent>
        {/* ? Group Start */}
        {categories &&
          categories
            .filter(
              (category) =>
                category.vaultEntries && category.vaultEntries.length > 0,
            )
            .map((category) => (
              <Collapsible key={category.name} className="group/collapsible">
                <SidebarGroup>
                  <div className="flex items-center gap-2">
                    <SidebarIconTrigger
                      categoryName={category.name}
                      iconToUse={iconMap[category.iconKey]}
                    />
                    <SidebarGroupLabel
                      render={
                        <CollapsibleTrigger className="group-data-[state=open]/collapsible:text-primary flex flex-1 cursor-pointer place-items-center items-center gap-2 text-lg font-semibold transition-colors" />
                      }>
                      <span className="text-lg font-semibold">
                        {category.name}
                      </span>
                      <aside className="flex items-center justify-end">
                        <SidebarMenuBadge className="text-sm">
                          (
                          {category?.vaultEntries?.filter(
                            (entry) => entry.published,
                          ).length || 0}
                          )
                          <HugeiconsIcon
                            icon={ArrowLeft01Icon}
                            strokeWidth={2}
                            className="mr-2 ml-auto transition-transform duration-500 group-data-[state=open]/collapsible:-rotate-z-90"
                          />
                        </SidebarMenuBadge>
                      </aside>
                    </SidebarGroupLabel>
                  </div>
                  <CollapsibleContent className="group-data-[state=open]/collapsible:animate-collapsible-down animate-collapsible-up transition-all duration-300 ease-in-out">
                    <SidebarGroupContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem
                          className="flex flex-col gap-1.5"
                          key={category.name}>
                          {category.vaultEntries &&
                            category.vaultEntries.map(
                              (entry) =>
                                entry.published && (
                                  <VaultSidebarEntryLink
                                    key={entry.slug}
                                    slug={entry.slug}
                                    title={entry.title}
                                  />
                                ),
                            )}
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            ))}
        {/* ? Group End */}
      </SidebarContent>
      {/* ? Content End */}
      <SidebarSeparator />
      {/* ? Footer Start */}
      <VaultSidebarFooter />
      {/* ? Footer End */}
    </Sidebar>
  );
};

export default VaultSidebar;
