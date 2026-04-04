import Icon from '@/public/images/icon.svg';
import Logo from '@/public/images/sidebarlogo.svg';
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  BookOpen01Icon,
  HugeiconsIcon,
  Notebook01Icon,
  User02Icon,
  UserGroupIcon,
} from '@bubbles/ui/lib/hugeicons';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bubbles/ui/shadcn/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@bubbles/ui/shadcn/collapsible';
import { LogoutButton } from '@/components/ui/user-logout';
import { getCurrentUser } from '@/lib/auth';
import {
  canDeleteEntry,
  canManageUsers,
  canSubmitEntry,
  canViewEntries,
} from '@/lib/roles';
import { Route } from 'next';

const AdminSidebar = async () => {
  const result = await getCurrentUser();
  if ('error' in result) return null;
  const loggedInUser = result.user;

  return (
    <Sidebar collapsible="icon" variant="floating">
      {/* ? Header Start */}
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link href={'/admin/dashboard' as Route} prefetch={false} />
              }>
              <Image src={Icon} alt="vaulty-icon" width={45} height={45} />
              <Image
                src={Logo}
                alt="the-coding-vault-logo"
                width={210}
                height={45}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {/* ? Header End */}
      <SidebarSeparator />
      {/* ? Content Start */}
      <SidebarContent>
        {/* ? Group 1 Start */}
        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                icon={BookOpen01Icon}
                strokeWidth={2}
                className="ml-[0.4rem] h-5 w-5 shrink-0"
              />
              <SidebarGroupLabel
                render={
                  <CollapsibleTrigger className="group-data-[state=open]/collapsible:text-primary flex flex-1 cursor-pointer place-items-center items-center gap-2 text-lg font-semibold transition-colors" />
                }>
                <span className="text-lg font-semibold">Vault Entries</span>
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  strokeWidth={2}
                  className="mr-2 ml-auto transition-transform duration-500 group-data-[state=open]/collapsible:-rotate-z-90"
                />
              </SidebarGroupLabel>
            </div>
            <CollapsibleContent className="group-data-[state=open]/collapsible:animate-collapsible-down animate-collapsible-up transition-all duration-500 ease-in-out">
              {loggedInUser && canViewEntries(loggedInUser.role) && (
                <>
                  <SidebarGroupContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton
                          className="transition-all duration-200 ease-in-out group-data-[state=open]/collapsible:opacity-100"
                          render={
                            <Link
                              href={'/admin/dashboard/entries/all' as Route}
                              prefetch={false}
                            />
                          }>
                          <span>All Entries</span>
                        </SidebarMenuButton>
                        <SidebarMenuBadge className="text-sm">
                          (3)
                        </SidebarMenuBadge>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarGroupContent>
                  <SidebarGroupContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton
                          render={
                            <Link
                              href={'/admin/dashboard/entries/published' as Route}
                              prefetch={false}
                            />
                          }>
                          <span>Published Entries</span>
                        </SidebarMenuButton>
                        <SidebarMenuBadge className="text-sm">
                          (3)
                        </SidebarMenuBadge>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarGroupContent>
                  <SidebarGroupContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton
                          render={
                            <Link
                              href={
                                '/admin/dashboard/entries/unpublished' as Route
                              }
                              prefetch={false}
                            />
                          }>
                          <span>Unpublished Entries</span>
                          <SidebarMenuBadge className="text-sm">
                            (3)
                          </SidebarMenuBadge>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarGroupContent>
                </>
              )}
              {loggedInUser && canDeleteEntry(loggedInUser.role) && (
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton
                        render={
                          <Link
                            href={'/admin/dashboard/entries/delete' as Route}
                            prefetch={false}
                          />
                        }>
                        <span>Delete Entry</span>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarGroupContent>
              )}
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        {/* ? Group 1 End */}
        {/* ? Group 2 Start */}
        {loggedInUser && canSubmitEntry(loggedInUser.role) && (
          <Collapsible className="group/collapsible">
            <SidebarGroup>
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={Notebook01Icon}
                  strokeWidth={2}
                  className="ml-[0.4rem] h-5 w-5 shrink-0"
                />
                <SidebarGroupLabel
                  render={
                    <CollapsibleTrigger className="flex flex-1 items-center gap-2" />
                  }>
                  <span className="text-lg font-semibold">New Entries</span>
                  <HugeiconsIcon
                    icon={ArrowLeft01Icon}
                    strokeWidth={2}
                    className="mr-2 ml-auto transition-transform duration-500 group-data-[state=open]/collapsible:-rotate-z-90"
                  />
                </SidebarGroupLabel>
              </div>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton
                        render={
                          <Link
                            href={'/admin/dashboard/entries/submit' as Route}
                            prefetch={false}
                          />
                        }>
                        <span>Submit Entry</span>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
        {/* ? Group 2 End */}
        {/* ? Group 3 Start */}
        {loggedInUser && canManageUsers(loggedInUser.role) && (
          <Collapsible className="group/collapsible">
            <SidebarGroup>
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={UserGroupIcon}
                  strokeWidth={2}
                  className="ml-[0.4rem] h-5 w-5 shrink-0"
                />
                <SidebarGroupLabel
                  render={
                    <CollapsibleTrigger className="flex flex-1 items-center gap-2" />
                  }>
                  <span className="text-lg font-semibold">User Management</span>
                  <HugeiconsIcon
                    icon={ArrowLeft01Icon}
                    strokeWidth={2}
                    className="mr-2 ml-auto transition-transform duration-500 group-data-[state=open]/collapsible:-rotate-z-90"
                  />
                </SidebarGroupLabel>
              </div>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton
                        render={
                          <Link
                            href={'/admin/dashboard/users/all' as Route}
                            prefetch={false}
                          />
                        }>
                        <span>All Users</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge className="text-sm">
                        (3)
                      </SidebarMenuBadge>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarGroupContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton
                        render={
                          <Link
                            href={'/admin/dashboard/users/create' as Route}
                            prefetch={false}
                          />
                        }>
                        <span>Create New User</span>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarGroupContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton
                        render={
                          <Link
                            href={'/admin/dashboard/users/delete' as Route}
                            prefetch={false}
                          />
                        }>
                        <span>Delete User</span>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
        {/* ? Group 3 End */}
      </SidebarContent>
      {/* ? Content End */}
      <SidebarSeparator />
      {/* ? Footer Start */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<SidebarMenuButton className="group" />}>
                <HugeiconsIcon icon={User02Icon} strokeWidth={2} />{' '}
                {loggedInUser.username}
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  strokeWidth={2}
                  className="ml-auto transition-transform duration-500 ease-in-out group-data-[state=open]:rotate-180"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href={'/'} prefetch={false}>
                    Vault
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive">
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      {/* ? Footer End */}
    </Sidebar>
  );
};

export default AdminSidebar;
