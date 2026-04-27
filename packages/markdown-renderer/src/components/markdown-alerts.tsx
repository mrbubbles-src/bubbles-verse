import type { ReactNode } from 'react';

import Image from 'next/image';

import { Separator } from '@bubbles/ui/components/shadcn/separator';
import {
  Alert02Icon,
  AlertCircleIcon,
  HugeiconsIcon,
  SkullIcon,
  SmileIcon,
} from '@bubbles/ui/lib/hugeicons';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@bubbles/ui/shadcn/card';

import RocketIcon from '../assets/rocket-icon.png';

export type MarkdownAlertsProps = {
  type?: 'info' | 'success' | 'warning' | 'danger';
  children: ReactNode;
};

/**
 * Render the reference alert card variants used inside stored MDX content.
 *
 * @param props - Alert styling and body content.
 * @returns Styled alert card with title, body, and footer signature.
 */
export function MarkdownAlerts({
  type = 'info',
  children,
}: MarkdownAlertsProps) {
  const alertStyles = {
    info: 'dark:bg-ctp-mocha-blue/15 dark:border-ctp-mocha-blue/30 dark:text-ctp-mocha-blue bg-ctp-latte-blue/15 border-ctp-latte-blue/30 border-2 text-ctp-latte-blue shadow-md shadow-ctp-latte-blue/40 dark:shadow-ctp-mocha-blue/40',
    success:
      'dark:bg-ctp-mocha-green/15 dark:border-ctp-mocha-green/30 dark:text-ctp-mocha-green bg-ctp-latte-green/15 border-ctp-latte-green/30 border-2 text-ctp-latte-green shadow-md shadow-ctp-latte-green/40 dark:shadow-ctp-mocha-green/40',
    warning:
      'dark:bg-ctp-mocha-yellow/15 dark:border-ctp-mocha-yellow/30 dark:text-ctp-mocha-yellow bg-ctp-latte-yellow/15 border-ctp-latte-yellow/30 border-2 text-ctp-latte-yellow shadow-md shadow-ctp-latte-yellow/40 dark:shadow-ctp-mocha-yellow/40',
    danger:
      'dark:bg-ctp-mocha-red/15 dark:border-ctp-mocha-red/30 dark:text-ctp-mocha-red bg-ctp-latte-red/15 border-ctp-latte-red/30 border-2 text-ctp-latte-red shadow-md shadow-ctp-latte-red/40 dark:shadow-ctp-mocha-red/40',
  };
  const alertTitles = {
    info: (
      <>
        <HugeiconsIcon
          icon={AlertCircleIcon}
          strokeWidth={2}
          className="size-6"
        />
        <Separator
          orientation="vertical"
          className="bg-ctp-latte-blue/35 dark:bg-ctp-mocha-blue/35"
        />
        <span>Wusstest Du schon?</span>
      </>
    ),
    success: (
      <>
        <HugeiconsIcon icon={SmileIcon} strokeWidth={2} className="size-6" />
        <Separator
          orientation="vertical"
          className="bg-ctp-latte-green/35 dark:bg-ctp-mocha-green/35"
        />
        <span>Ah, der Klassiker!</span>
      </>
    ),
    warning: (
      <>
        <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-6" />
        <Separator
          orientation="vertical"
          className="bg-ctp-latte-yellow/35 dark:bg-ctp-mocha-yellow/35"
        />
        <span>Vorsicht ist besser als Nachsicht!</span>
      </>
    ),
    danger: (
      <>
        <HugeiconsIcon icon={SkullIcon} strokeWidth={2} className="size-6" />
        <Separator
          orientation="vertical"
          className="bg-ctp-latte-red/35 dark:bg-ctp-mocha-red/35"
        />
        <span>Welcome, to the DANGER ZONE!</span>
      </>
    ),
  };

  return (
    <Card
      className={`${alertStyles[type]} my-6 rounded-[40px] text-pretty corner-squircle`}>
      <CardHeader>
        <CardTitle className="flex place-items-center gap-1 text-xl font-bold">
          <h3 className="flex place-items-center gap-2">{alertTitles[type]}</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="ml-[0.15rem] text-lg font-semibold whitespace-pre-wrap">
        {children}
      </CardContent>
      <CardFooter className="justify-end pr-4">
        <span className="flex place-items-center gap-1 text-sm font-semibold italic">
          - Nova{' '}
          <Image
            src={RocketIcon}
            alt="Rocket Icon"
            width={40}
            height={40}
            className="w-auto transition-transform duration-300 ease-in-out hover:scale-110"
          />
        </span>
      </CardFooter>
    </Card>
  );
}
