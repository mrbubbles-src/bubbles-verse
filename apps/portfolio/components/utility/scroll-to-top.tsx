'use client';

import { handleScroll } from '@/lib/utils';

import { useEffect, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { ArrowUp01Icon, HugeiconsIcon } from '@bubbles/ui/lib/hugeicons';
import { Button } from '@bubbles/ui/shadcn/button';

import { Locale } from '@/i18n-config';

const ScrollToTop = ({ lang }: { lang: Locale }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldBounce, setShouldBounce] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const handleNavigateToTop = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (pathname === `/${lang}`) {
      e.preventDefault();
      if (window.location.hash) {
        router.replace(`/${lang}`, { scroll: false });
      }
    }
    handleScroll();
  };

  useEffect(() => {
    const startObserver = () => {
      const sentinel = document.querySelector('#scroll‑sentinel');
      if (!sentinel) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              setIsVisible(true);
              setShouldBounce(true);
            } else {
              setIsVisible(false);
            }
          });
        },
        {
          root: null,
          threshold: 0,
          rootMargin: '400px 0px 0px 0px',
        }
      );

      const delay = window.location.hash.length > 1 ? 500 : 100;
      const timerId = setTimeout(() => observer.observe(sentinel), delay);

      return () => {
        clearTimeout(timerId);
        observer.disconnect();
      };
    };

    const cleanup = startObserver();

    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [pathname]);

  useEffect(() => {
    if (shouldBounce) {
      const bounceTimer = setTimeout(() => setShouldBounce(false), 2511);
      return () => clearTimeout(bounceTimer);
    }
  }, [shouldBounce]);

  if (!isVisible) return null;

  return (
    <Button
      id="scroll-to-top"
      aria-label="Scroll to top"
      title="Scroll to top"
      variant={'default'}
      size={'icon'}
      className={`fixed bottom-4 right-4 z-50 rounded-full transition-all duration-300 ease-in-out bg-primary/50 hover:bg-primary p-6 ${shouldBounce ? 'animate-bounce shadow-md shadow-destructive' : 'shadow-md dark:shadow-popover-foreground/5'} ${
        isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
      onClick={handleNavigateToTop}>
      <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-8" />
    </Button>
  );
};

export default ScrollToTop;
