import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@bubbles/ui/shadcn/button';
import { Card, CardContent, CardHeader } from '@bubbles/ui/shadcn/card';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { getDictionary } from '@/get-digtionary';
import ProfileImage from '@/public/profile.jpg';

export default function ContactAbout({
  dictionary,
}: {
  dictionary: Awaited<ReturnType<typeof getDictionary>>['contactAbout'];
}) {
  return (
    <Card className="shadow-none flex flex-col gap-1 w-full h-full p-0">
      <CardHeader className="w-full max-w-[330px] place-self-center">
        <Image
          src={ProfileImage}
          alt={dictionary.imageAlt}
          width={400}
          height={400}
          placeholder="blur"
          blurDataURL={ProfileImage.blurDataURL}
          className="rounded-lg shadow-md dark:shadow-popover-foreground/5 object-cover"
        />
      </CardHeader>
      <CardContent className="flex flex-col justify-center">
        <article
          aria-labelledby={dictionary.a11y.labelledByContactAbout}
          className="mt-5">
          <h2 id={dictionary.a11y.labelledByContactAbout} className="sr-only">
            {dictionary.title}
          </h2>
          <ul className="flex flex-col gap-2 items-center justify-center text-center md:items-start md:place-self-center">
            <li className="text-md xl:text-lg">
              <span>
                <strong className="mr-2 text-sm text-primary">Name:</strong>
              </span>
              <br className="md:hidden" />
              <span>Manuel Fahrenholz</span>
            </li>
            <li className="text-md xl:text-lg">
              <span>
                <strong className="mr-2 text-sm text-primary">
                  {dictionary.proffessionTitle}:
                </strong>
                <br className="md:hidden" />
              </span>
              <span>{dictionary.proffessionDescription}</span>
            </li>
            <li className="text-md xl:text-lg">
              <span>
                <strong className="mr-2 text-sm text-primary">Stack:</strong>
                <br className="md:hidden" />
              </span>
              <span>MERN</span>
            </li>
            <li className="text-md xl:text-lg">
              <span>
                <strong className="mr-2 text-sm text-primary">
                  {dictionary.currentJobTitle}:
                </strong>
                <br className="md:hidden" />
              </span>
              <span>{dictionary.currentJobDescription}</span>
            </li>
            <li className="text-md xl:text-lg">
              <span>
                <strong className="mr-2 text-sm text-primary">
                  {dictionary.locationTitle}
                </strong>
                <br className="md:hidden" />
              </span>
              <span>{dictionary.locationDescription}</span>
            </li>
          </ul>
        </article>
        <div className="flex justify-center gap-4 mt-6 flex-wrap place-self-center">
          <Button
            size={'lg'}
            className="w-full max-w-[10rem] dark:shadow-popover-foreground/5"
            render={
              <a
                href="https://github.com/mrbubbles-src"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              />
            }>
            <span aria-hidden="true">
              <FontAwesomeIcon icon={faGithub} />
            </span>{' '}
            GitHub
          </Button>
          <Button
            size={'lg'}
            className="w-full max-w-[10rem] dark:shadow-popover-foreground/5"
            render={
              <a
                href="https://linkedin.com/in/manuel-fahrenholz"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              />
            }>
            <span aria-hidden="true">
              <FontAwesomeIcon icon={faLinkedin} />
            </span>{' '}
            LinkedIn
          </Button>
          <Button
            size={'lg'}
            className="w-full max-w-[10rem] dark:shadow-popover-foreground/5"
            render={<Link href="/cv" />}>
            {dictionary.cvButton}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
