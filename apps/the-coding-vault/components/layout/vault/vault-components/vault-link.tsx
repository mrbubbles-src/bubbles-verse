import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@bubbles/ui/shadcn/tooltip';
import { Route } from 'next';
import Link from 'next/link';
import { ComponentPropsWithoutRef } from 'react';

type AnchorProps = ComponentPropsWithoutRef<'a'>;

const VaultLink = ({ href, children, ...props }: AnchorProps) => {
  const className =
    'text-primary hover:text-primary/80 inline-block cursor-pointer font-bold underline underline-offset-4 transition-all duration-300 ease-in-out active:scale-95';
  if (href?.startsWith('/')) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Link href={href as Route} className={className} {...props}>
              {children}
            </Link>
          }
        />
        <TooltipContent className="TooltipContent z-[1001] max-w-[20rem] font-bold text-pretty md:max-w-full">
          {href === '/' ? 'Zum Vault-Eingang' : `Navigiere zu ${href}`}
        </TooltipContent>
      </Tooltip>
    );
  }
  if (href?.startsWith('#')) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <a href={href} className={className} {...props}>
              {children}
            </a>
          }
        />
        <TooltipContent className="TooltipContent z-[1001] max-w-[20rem] font-bold text-pretty md:max-w-full">
          {`Scroll zur ${href} Sektion`}
        </TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            {...props}>
            {children}
          </a>
        }
      />
      <TooltipContent className="TooltipContent z-[1001] max-w-[20rem] font-bold text-pretty md:max-w-full">{`Öffne '${href}' in einem neuen Tab`}</TooltipContent>
    </Tooltip>
  );
};

export default VaultLink;
