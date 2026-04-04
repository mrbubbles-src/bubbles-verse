import { Card, CardContent, CardHeader } from '@bubbles/ui/shadcn/card';

import About from '@/components/layout/about/about';
import ContactAbout from '@/components/layout/about/contact-about';
import ContactForm from '@/components/layout/contact/ContactForm';
import ProjectCard from '@/components/layout/projects/project-card';
import StackGrid from '@/components/layout/stack/stack-grid';
import { projects } from '@/data/projects';
import { getDictionary } from '@/get-digtionary';
import { Locale } from '@/i18n-config';

export default async function Home(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await props.params;
  const dictionary = await getDictionary(lang);

  return (
    <>
      <section
        id="about"
        className="scroll-mt-24"
        aria-labelledby={dictionary.a11y.landingPage.labelledByAbout}>
        <h2
          id={dictionary.a11y.landingPage.labelledByAbout}
          className="sr-only">
          {dictionary.landingPage.screenreaderAbout}
        </h2>
        <About dictionary={dictionary.about} />
      </section>

      <section
        id="stack"
        className="scroll-mt-24"
        aria-labelledby={dictionary.a11y.landingPage.labelledByTech}>
        <h2
          id={dictionary.a11y.landingPage.labelledByTech}
          className="text-3xl font-bold mb-6">
          {dictionary.landingPage.titleTech}
        </h2>
        <StackGrid />
      </section>

      <section
        id="projects"
        className="scroll-mt-24 "
        aria-labelledby={dictionary.a11y.landingPage.labelledByProjects}>
        <h2
          id={dictionary.a11y.landingPage.labelledByProjects}
          className="text-3xl font-bold mb-6">
          {dictionary.landingPage.titleProjects}
        </h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {projects.map(({ key, ...projProps }) => (
            <ProjectCard
              key={key}
              dictionary={dictionary.projects[key]}
              {...projProps}
            />
          ))}
        </div>
      </section>

      <section
        id="contact"
        className="scroll-mt-24 xl:grid xl:grid-cols-2 gap-4"
        aria-labelledby={dictionary.a11y.landingPage.labelledByContact}>
        <Card className="w-full">
          <CardHeader>
            <h2
              id={dictionary.a11y.landingPage.labelledByContact}
              className="text-3xl font-bold">
              {dictionary.landingPage.titleContact}
            </h2>
          </CardHeader>
          <CardContent className="h-full">
            <ContactForm language={lang} dictionary={dictionary.contact} />
          </CardContent>
        </Card>
        <Card className="w-full mt-4 xl:mt-0 dark:shadow-popover-foreground/5">
          <CardHeader>
            <h2 className="text-3xl font-bold text-center">
              {dictionary.landingPage.titleContactAbout}
            </h2>
          </CardHeader>
          <CardContent>
            <ContactAbout dictionary={dictionary.contactAbout} />
          </CardContent>
        </Card>
      </section>
    </>
  );
}
