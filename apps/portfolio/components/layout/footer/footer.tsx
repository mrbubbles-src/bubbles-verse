import Link from 'next/link';

import { Button } from '@bubbles/ui/shadcn/button';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import LocaleSwitcher from '@/components/ui/locale-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { getDictionary } from '@/get-digtionary';

const Footer = ({
  dictionary,
}: {
  dictionary: Awaited<ReturnType<typeof getDictionary>>['footer'];
}) => (
  <footer className="py-6 border-t flex flex-col items-center gap-4 text-center lg:grid lg:grid-cols-3 lg:grid-rows-3">
    <aside className="flex gap-3 items-center justify-center hover:text-primary transition-all duration-300 ease-in-out hover:underline underline-offset-4 lg:col-1 lg:row-start-1">
      <LocaleSwitcher dictionary={dictionary.language} />
      <span>{dictionary.language.screenreaderTitle}</span>
    </aside>
    <aside className="flex gap-3 items-center justify-center hover:text-primary transition-all duration-300 ease-in-out hover:underline underline-offset-4 lg:col-3 lg:row-start-1">
      <ThemeToggle dictionary={dictionary.themeToggle} />
      <span>{dictionary.themeToggle.footerText}</span>
    </aside>
    <aside className="flex gap-3 items-center justify-center lg:col-2 lg:row-start-1">
      <Button
        variant={'outline'}
        size={'sm'}
        className="dark:shadow-popover-foreground/5"
        render={
          <a
            href="https://github.com/mrbubbles-src"
            aria-label="GitHub"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-all duration-300 ease-in-out active:scale-95 flex gap-3 items-center justify-center"
          />
        }>
        <span aria-hidden="true">
          <FontAwesomeIcon icon={faGithub} />
        </span>
        <span className="sr-only">github.com/mrbubbles-src</span>
        <span>GitHub</span>
      </Button>
      <span> | </span>
      <Button
        variant={'outline'}
        size={'sm'}
        className="dark:shadow-popover-foreground/5"
        render={
          <a
            href="https://linkedin.com/in/manuel-fahrenholz"
            aria-label="LinkedIn"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-all duration-300 ease-in-out active:scale-95 flex items-center justify-center gap-3"
          />
        }>
        <span aria-hidden="true">
          <FontAwesomeIcon icon={faLinkedin} aria-hidden="true" />
        </span>
        <span className="sr-only">linkedin.com/in/manuel-fahrenholz</span>
        <span>LinkedIn</span>
      </Button>
    </aside>
    <aside className="flex gap-3 items-center justify-center lg:col-span-3 lg:row-start-2 lg:justify-self-center">
      <Link
        href="/impressum"
        className="hover:text-primary focus-visible:underline transition-all duration-300 ease-in-out hover:underline underline-offset-4">
        {dictionary.legal}
      </Link>
      <span> | </span>
      <Link
        href="/datenschutz"
        className="hover:text-primary focus-visible:underline transition-all duration-300 ease-in-out hover:underline underline-offset-4">
        {dictionary.privacy}
      </Link>
    </aside>
    <p className="lg:col-span-3 lg:row-start-3 lg:text-center">
      &copy; {new Date().getFullYear()} Manuel Fahrenholz
    </p>
  </footer>
);
export default Footer;
