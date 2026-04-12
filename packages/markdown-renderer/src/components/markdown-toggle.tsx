'use client';

import type { ReactNode } from 'react';

import { ChevronRight } from 'lucide-react';

import { Card, CardContent } from '@bubbles/ui/shadcn/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@bubbles/ui/shadcn/collapsible';

export type MarkdownToggleProps = {
  text?: string;
  children: ReactNode;
};

/**
 * Render collapsible markdown sections using the reference card treatment.
 *
 * @param props - Toggle label and hidden content.
 * @returns Expandable content block for MDX.
 */
export function MarkdownToggle({ text, children }: MarkdownToggleProps) {
  return (
    <Collapsible className="group/collapsible">
      <CollapsibleTrigger className="group-data-[state=open]/collapsible:text-primary flex cursor-pointer place-items-center text-lg font-semibold transition-colors">
        <ChevronRight className="transition-transform duration-500 ease-in-out group-data-[state=open]/collapsible:rotate-90" />
        {text}
      </CollapsibleTrigger>
      <CollapsibleContent className="group-data-[state=open]/collapsible:animate-collapsible-down animate-collapsible-up transition-all duration-500 ease-in-out">
        <Card className="opacity-0 transition-all duration-500 ease-in-out group-data-[state=open]/collapsible:opacity-100">
          <CardContent className="text-lg">{children}</CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
