import { StaticImageData } from 'next/image';

import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@bubbles/ui/shadcn/card';

import ProjectImage from '@/components/layout/projects/project-image';

interface IProjectCardProps {
  tech: string[];
  github: string;
  live: string;
  image: StaticImageData;
}
type ProjectTranslation = { title: string; description: string };

export default function ProjectCard({
  tech,
  github,
  live,
  image,
  dictionary,
}: IProjectCardProps & { dictionary: ProjectTranslation }) {
  return (
    <Card className="shadow-md dark:shadow-popover-foreground/5 flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-primary text-2xl">
          {dictionary.title}
        </CardTitle>
      </CardHeader>
      <CardContent role="list" className="flex flex-wrap gap-2">
        {tech.map((t) => (
          <Badge
            role="listitem"
            variant={'default'}
            key={t}
            className="px-3 py-1 rounded text-lg font-bold dark:shadow-popover-foreground/5">
            {t}
          </Badge>
        ))}
      </CardContent>
      <CardContent className="flex flex-col flex-1 gap-4">
        {live && (
          <ProjectImage live={live} image={image} title={dictionary.title} />
        )}
      </CardContent>
      <CardDescription className="px-6 pb-2 h-full">
        <p className="text-lg text-foreground">{dictionary.description}</p>
      </CardDescription>
      <CardFooter className="mt-auto px-6 pt-2 pb-4">
        <div className="flex gap-2 text-xs grow justify-center">
          <Button
            size={'lg'}
            className="w-full max-w-[10rem] dark:shadow-popover-foreground/5"
            render={
              <a
                href={live}
                aria-label="Live"
                target="_blank"
                rel="noopener noreferrer"
              />
            }>
            Live
          </Button>
          <Button
            size={'lg'}
            variant="outline"
            className="w-full max-w-[10rem] dark:shadow-popover-foreground/5"
            render={
              <a
                href={github}
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              />
            }>
            GitHub
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
