import type { StaticImageData } from 'next/image';

import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@bubbles/ui/lib/utils';

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterProps = {
  /** Optional logo or app image displayed above the credits. */
  image?: {
    src: string | StaticImageData;
    alt: string;
    width?: number;
    height?: number;
  };
  /** Author name shown in the copyright line. */
  author?: string;
  /** URL the author name links to. */
  authorHref?: string;
  /** Navigation links rendered as a row (e.g. Impressum, Datenschutz). */
  links?: FooterLink[];
  /** Hide the default Catppuccin color theme credit. */
  hideCatppuccinCredit?: boolean;
  /** Optional class name for the footer. */
  className?: string;
  /** Extra content rendered after the footer text. */
  children?: React.ReactNode;
};

/**
 * Shared footer for all bubbles-verse apps.
 * Renders an optional image, copyright line, children, and legal links.
 */
export function Footer({
  image,
  author = 'mrbubbles-src',
  authorHref = 'https://mrbubbles-src.dev',
  links = [],
  hideCatppuccinCredit = false,
  className,
  children,
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('border-t border-border/40', className)}>
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-4 py-4 text-[11px] text-muted-foreground/50">
        {image && (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width ?? 200}
            height={image.height ?? 80}
            className="h-auto w-auto max-w-[12rem] opacity-50"
          />
        )}

        <p className="text-center">
          &copy; {currentYear}{' '}
          <Link
            href={authorHref}
            target="_blank"
            rel="noreferrer"
            className="touch-hitbox text-primary hover:text-primary/70">
            {author}
          </Link>
          {links.length > 0 && (
            <>
              {' · '}
              {links.map((link, i) => (
                <span key={link.href}>
                  {i > 0 && ' · '}
                  <Link
                    href={link.href}
                    target={link.external !== false ? '_blank' : undefined}
                    rel={link.external !== false ? 'noreferrer' : undefined}
                    className="touch-hitbox text-primary hover:text-primary/70">
                    {link.label}
                  </Link>
                </span>
              ))}
            </>
          )}
        </p>

        {!hideCatppuccinCredit && (
          <p className="text-center">
            Color theme based on{' '}
            <Link
              href="https://github.com/catppuccin/catppuccin"
              target="_blank"
              rel="noreferrer"
              className="touch-hitbox text-primary hover:text-primary/70">
              Catppuccin
            </Link>
          </p>
        )}

        {children}
      </div>
    </footer>
  );
}
