'use client';

import type { ReactNode } from 'react';

import { ArrowRight01Icon, HugeiconsIcon } from '@bubbles/ui/lib/hugeicons';
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
      <CollapsibleTrigger className="flex cursor-pointer place-items-center text-lg font-semibold transition-colors group-data-open/collapsible:text-primary">
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className="transition-transform duration-500 ease-in-out group-data-open/collapsible:rotate-90"
        />
        {text}
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden opacity-100 transition-[height,opacity] duration-300 ease-in-out data-ending-style:h-0 data-ending-style:opacity-0 data-starting-style:h-0 data-starting-style:opacity-0">
        <Card>
          <CardContent className="text-lg">{children}</CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
