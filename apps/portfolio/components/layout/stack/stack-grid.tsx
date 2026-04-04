import { Badge } from '@bubbles/ui/shadcn/badge';
import { Card, CardContent, CardHeader } from '@bubbles/ui/shadcn/card';

import { stack } from '@/data/stack';

export default function StackGrid() {
  return (
    <div className="space-y-6 lg:grid lg:grid-cols-3 gap-4 auto-rows-fr">
      {Object.entries(stack).map(([category, tools]) => (
        <Card
          key={category}
          className="flex flex-col p-4 h-full dark:shadow-popover-foreground/5">
          <CardHeader>
            <h3 className="text-2xl text-center font-semibold pt-1">
              {category}
            </h3>
          </CardHeader>
          <CardContent
            role="list"
            className="flex flex-wrap gap-3 justify-center">
            {tools.map((tool: string) => (
              <Badge
                key={tool}
                role="listitem"
                variant="default"
                className="font-semibold text-lg dark:shadow-popover-foreground/5">
                {tool}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
