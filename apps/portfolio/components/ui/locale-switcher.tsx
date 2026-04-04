'use client';

import type { Locale } from '@/i18n-config';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { GlobeIcon, HugeiconsIcon } from '@bubbles/ui/lib/hugeicons';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bubbles/ui/shadcn/dropdown-menu';

import { i18n } from '@/i18n-config';

export default function LocaleSwitcher({
  dictionary,
}: {
  dictionary: {
    de: string;
    en: string;
    screenreaderTitle: string;
    triggerTitle: string;
    contentTitle: string;
  };
}) {
  const pathname = usePathname();
  const redirectedPathname = (locale: Locale) => {
    if (!pathname) return '/';
    const segments = pathname.split('/');
    segments[1] = locale;
    return segments.join('/');
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton
        title={dictionary.triggerTitle}
        render={
          <Button
            variant="outline"
            size={'icon'}
            className="hover:text-primary transition-all duration-300 ease-in-out dark:shadow-popover-foreground/5"
          />
        }>
        <span className="sr-only">{dictionary.screenreaderTitle}</span>
        <HugeiconsIcon
          icon={GlobeIcon}
          strokeWidth={2}
          className="size-[1.2rem]"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        title={dictionary.contentTitle}
        className="p-0">
        {i18n.locales.map((locale) => {
          return (
            <DropdownMenuItem key={locale} className="p-0">
              <Link
                href={redirectedPathname(locale)}
                className="cursor-pointer p-4 w-full flex justify-center">
                {locale === 'de' ? dictionary.de : dictionary.en}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
