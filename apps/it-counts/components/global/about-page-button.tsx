'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@bubbles/ui/components/shadcn/button';
import { HelpCircleIcon, HugeiconsIcon } from '@bubbles/ui/lib/hugeicons';
import { cn } from '@bubbles/ui/lib/utils';

const AboutPageButton = () => {
  const pathname = usePathname();
  return (
    <Button
      variant="link"
      size="icon"
      nativeButton={false}
      aria-label="About"
      className={cn(
        'no-underline!',
        pathname === '/about' ? 'text-primary' : 'text-muted-foreground'
      )}
      render={
        <Link href="/about">
          <HugeiconsIcon icon={HelpCircleIcon} className="size-6" />
        </Link>
      }
    />
  );
};

export default AboutPageButton;
