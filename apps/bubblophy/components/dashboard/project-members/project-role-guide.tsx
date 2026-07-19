'use client';

import type { ProjectMemberRole } from '@/lib/dashboard/types';

import {
  projectMemberRoleDescriptions,
  projectMemberRoleLabels,
} from '@/lib/projects/role-presentation';

import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@bubbles/ui/shadcn/collapsible';

const projectMemberRoles = [
  'owner',
  'maintainer',
  'member',
  'viewer',
] satisfies ProjectMemberRole[];

const projectMemberRoleVariants = {
  owner: 'default',
  maintainer: 'published',
  member: 'secondary',
  viewer: 'outline',
} satisfies Record<
  ProjectMemberRole,
  React.ComponentProps<typeof Badge>['variant']
>;

export interface ProjectRoleGuideProps {
  currentRole: ProjectMemberRole;
  isArchived: boolean;
}

/**
 * Shows the current person's project role and an optional compact comparison.
 *
 * @param props Current membership role and project archive state.
 * @returns A role summary with a collapsible four-role guide.
 */
export function ProjectRoleGuide({
  currentRole,
  isArchived,
}: ProjectRoleGuideProps) {
  const trigger = (
    <Button type="button" size="sm" variant="outline">
      Rollen vergleichen
    </Button>
  );

  return (
    <div className="grid gap-3 rounded-md border border-dashed border-border bg-background/60 p-3">
      <div className="grid gap-1">
        <p className="text-xs font-medium text-muted-foreground">Deine Rolle</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={projectMemberRoleVariants[currentRole]}>
            {projectMemberRoleLabels[currentRole]}
          </Badge>
          {isArchived ? <Badge variant="secondary">Archiviert</Badge> : null}
        </div>
        <p className="max-w-3xl text-xs text-muted-foreground">
          {projectMemberRoleDescriptions[currentRole]}
        </p>
        {isArchived ? (
          <p className="text-xs text-muted-foreground">
            Operative Daten sind nur lesbar; Owner und Maintainer können das
            Projekt wiederherstellen.
          </p>
        ) : null}
      </div>

      <Collapsible className="group/collapsible">
        <CollapsibleTrigger render={trigger} />
        <CollapsibleContent className="pt-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {projectMemberRoles.map((role) => (
              <div
                key={role}
                className="grid gap-1 rounded-md border border-border bg-muted/20 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">
                    {projectMemberRoleLabels[role]}
                  </span>
                  {role === currentRole ? (
                    <Badge variant="outline">Aktuell</Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {projectMemberRoleDescriptions[role]}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
