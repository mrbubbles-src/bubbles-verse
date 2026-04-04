import { Skeleton } from '@bubbles/ui/shadcn/skeleton';

const CurriculumVitaeSkeleton = () => {
  return (
    <>
      <Skeleton className="w-full lg:max-w-[calc(100%-8em)] xl:max-w-[calc(100%-26em)] max-w-[calc(100%-2em)] h-[45rem] md:h-[60rem] bg-card place-self-center" />
    </>
  );
};

export default CurriculumVitaeSkeleton;
