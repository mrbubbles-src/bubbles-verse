import { SidebarTrigger } from '@bubbles/ui/shadcn/sidebar';

import { ThemeToggle } from '@/components/ui/theme-toggle';

const Navbar = () => {
  return (
    <nav className="bg-sidebar sticky top-2 z-50 flex w-full items-center justify-between rounded-md px-2 py-4 shadow-md">
      <aside className="flex items-center space-x-4">
        <SidebarTrigger />
      </aside>
      <aside className="flex items-center space-x-4">
        <ThemeToggle />
      </aside>
    </nav>
  );
};

export default Navbar;
