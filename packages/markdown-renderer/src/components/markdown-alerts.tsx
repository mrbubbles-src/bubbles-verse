import type { ReactNode } from 'react';

import Image from 'next/image';
import { CircleAlert, Skull, Smile, TriangleAlert } from 'lucide-react';

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
    info: 'bg-blue-100 shadow-md border-blue-300 border-2 text-blue-600',
    success: 'bg-green-100 shadow-md border-green-300 border-2 text-green-600',
    warning:
      'bg-orange-100 shadow-md border-orange-300 border-2 text-orange-600',
    danger: 'bg-red-100 shadow-md border-red-300 border-2 text-red-600',
  };
  const alertTitles = {
    info: (
      <>
        <CircleAlert className="size-6" />
        <span>Wusstest Du schon?</span>
      </>
    ),
    success: (
      <>
        <Smile className="size-6" />
        <span>Ah, der Klassiker!</span>
      </>
    ),
    warning: (
      <>
        <TriangleAlert className="size-6" />
        <span>Vorsicht ist besser als Nachsicht!</span>
      </>
    ),
    danger: (
      <>
        <Skull className="size-6" />
        <span>Welcome, to the DANGER ZONE!</span>
      </>
    ),
  };

  return (
    <Card className={`${alertStyles[type]} my-4 text-pretty`}>
      <CardHeader>
        <CardTitle className="flex place-items-center gap-1 text-xl font-bold">
          <h3 className="flex place-items-center gap-1">{alertTitles[type]}</h3>
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
