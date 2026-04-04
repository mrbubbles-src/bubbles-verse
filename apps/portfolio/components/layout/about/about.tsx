import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@bubbles/ui/shadcn/button';
import { Card, CardContent, CardHeader } from '@bubbles/ui/shadcn/card';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { getDictionary } from '@/get-digtionary';
import ProfileImage from '@/public/profile.jpg';

export default function About({
  dictionary,
}: {
  dictionary: Awaited<ReturnType<typeof getDictionary>>['about'];
}) {
  function calculateAge(
    birthYear: number,
    birthMonth: number,
    birthDay: number
  ) {
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const birthDateThisYear = new Date(
      today.getFullYear(),
      birthMonth - 1,
      birthDay
    );
    if (today < birthDateThisYear) {
      age--;
    }
    return age;
  }
  const age = calculateAge(1988, 4, 16);

  return (
    <Card className="shadow-md dark:shadow-popover-foreground/5 xl:flex xl:flex-row gap-1">
      <CardHeader className="w-full place-self-center flex flex-col">
        <Image
          src={ProfileImage}
          alt={dictionary.imageAlt}
          width={400}
          height={400}
          placeholder="blur"
          blurDataURL={ProfileImage.blurDataURL}
          className="rounded-lg shadow-md dark:shadow-popover-foreground/5 object-cover place-self-center"
        />
        <div className="flex justify-center gap-4 mt-4 w-full grow">
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
        </div>
      </CardHeader>
      <CardContent className="xl:place-self-center xl:mr-16">
        <h1 className="text-3xl font-bold my-4 xl:my-0 xl:mb-4">
          {dictionary.greetingP1}{' '}
          <code
            className="bg-accent rounded-md shadow-sm p-[0.3rem] dark:shadow-popover-foreground/5 italic text-sm md:text-xl text-pretty text-primary"
            aria-hidden="true">
            `<strong className="text-sh-sign">&#36;</strong>
            <strong className="text-sh-entity">&#123;</strong>
            <strong className="text-sh-sign">&lt;</strong>
            <strong className="text-sh-identifier">span</strong>
            <strong className="text-sh-sign">&gt;</strong>
            <strong className="text-sh-entity">&#123;</strong>
            <strong className="text-sh-identifier">username</strong>
            <strong className="text-sh-entity">&#125;</strong>
            <strong className="text-sh-sign">&lt;/</strong>
            <strong className="text-sh-identifier">span</strong>
            <strong className="text-sh-sign">&gt;</strong>
            <strong className="text-sh-entity">&#125;</strong>`
          </code>
          , {dictionary.greetingP2}
        </h1>
        <article>
          <h2 className="sr-only">{dictionary.screenreaderTitle}</h2>
          <p className="mb-1 leading-relaxed text-lg">
            {dictionary.nameIntroP1}{' '}
            <strong className="text-primary">Manuel Fahrenholz</strong>, aka{' '}
            <a
              href="https://github.com/mrbubbles-src"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold underline underline-offset-4 cursor-pointer">
              mrbubbles-src
            </a>
            . {dictionary.nameIntroP2}
          </p>
          <p className="mb-1 leading-relaxed text-lg">
            {dictionary.ageP1} <strong className="text-primary">{age}</strong>{' '}
            {dictionary.ageP2}{' '}
            <strong className="text-primary">{dictionary.ageP3}</strong>.
          </p>
          <p className="mb-1 leading-relaxed text-lg">
            {dictionary.jobP1}{' '}
            <strong className="text-primary">Fullstack Web Developer</strong>{' '}
            {dictionary.jobP2}{' '}
            <strong className="text-primary">MERN-Stack</strong>
            {dictionary.jobP3}{' '}
            <strong className="text-primary">
              Junior Teacher for Web Development
            </strong>
            {dictionary.jobP4}
          </p>
          <p className="mb-1 leading-relaxed text-lg">{dictionary.care}</p>
          <p className="mb-1 leading-relaxed text-lg">{dictionary.hobbies}</p>
          <p className="mb-1 leading-relaxed text-lg">{dictionary.cta}</p>
          <p className="mb-1 leading-relaxed text-lg">{dictionary.closingP1}</p>
          <p className="mb-1 leading-relaxed text-lg">
            {dictionary.closingP2},
          </p>
          <p className="mb-1 leading-relaxed text-lg">{dictionary.signature}</p>
        </article>
        <div className="flex justify-center gap-4 mt-3 grow">
          <Button
            size={'lg'}
            className="w-full max-w-[10rem] dark:shadow-popover-foreground/5"
            render={<Link href="/cv" />}>
            {dictionary.cvButton}
          </Button>
          <Button
            size={'lg'}
            className="w-full max-w-[10rem] dark:shadow-popover-foreground/5"
            render={<Link href="/#contact" />}>
            {dictionary.contactButton}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
