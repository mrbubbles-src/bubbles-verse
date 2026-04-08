import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';

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
  /** Extra content rendered between copyright and links. */
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
  children,
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40">
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
            className="touch-hitbox hover:text-muted-foreground">
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
                    className="touch-hitbox hover:text-muted-foreground">
                    {link.label}
                  </Link>
                </span>
              ))}
            </>
          )}
        </p>

        {children}
      </div>
    </footer>
  );
}
