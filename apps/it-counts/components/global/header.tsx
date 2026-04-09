import Image from 'next/image';
import Link from 'next/link';

import { ThemeToggle } from '@bubbles/theme';

import Logo from '@/public/images/it-counts-logo.webp';
import AboutPageButton from './about-page-button';

const Header = () => {
  return (
    <header className="flex items-center justify-between px-4 py-3 w-full max-w-md mx-auto">
      <Link href="/" className="w-30 h-8">
        <Image
          src={Logo}
          alt="It Counts Logo"
          width={1415}
          height={396}
          loading="eager"
        />
      </Link>
      <AboutPageButton />
      <ThemeToggle />
    </header>
  );
};

export default Header;
