import Image from 'next/image';
import Vaulty from '@/public/images/vaulty.png';
import Link from 'next/link';
import {
  ArrowLeft01Icon,
  DoorOpenIcon,
  HugeiconsIcon,
} from '@bubbles/ui/lib/hugeicons';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@bubbles/ui/shadcn/tooltip';

const NotFound = () => {
  return (
    <section className="flex h-screen flex-col items-center justify-center gap-8 p-4">
      <h1 className="flex items-center justify-center gap-4">
        <span className="text-8 text-destructive animate-pulse text-7xl font-extrabold transition-all duration-1000 ease-in-out">
          404
        </span>
        <span className="text-9xl font-extralight">|</span>
        <span className="text-xl">Vaulty konnte den Eintrag nicht finden</span>
      </h1>
      <article className="relative flex flex-col items-center">
        <div className="bg-muted text-muted-foreground relative max-w-xs rounded-lg px-4 py-2 text-center shadow">
          <p className="z-10 text-center text-lg font-semibold text-pretty">
            Hey! Der Eintrag den Du suchst ist vermutlich noch nicht fertig.
            Schau doch später nochmal vorbei!
          </p>
          <div className="absolute -bottom-8 left-1/2 -z-10 -translate-x-1/2">
            <div className="bg-muted absolute bottom-3 left-1/2 h-12 w-12 -translate-x-1/2 rotate-45 shadow-md" />
          </div>
        </div>
        <Image
          src={Vaulty}
          alt="Vaulty"
          width={400}
          height={400}
          placeholder="blur"
          blurDataURL={Vaulty.blurDataURL}
        />
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/"
                className="hover:text-primary/80 group flex items-center justify-center gap-1 text-lg underline-offset-4 transition-colors duration-300 ease-in-out">
                <HugeiconsIcon
                  icon={DoorOpenIcon}
                  strokeWidth={2}
                  className="size-10"
                />
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  strokeWidth={2}
                  className="text-primary animate-caret-blink group-hover:text-foreground size-14 transition-all duration-300 ease-in-out group-hover:animate-none"
                />
                <span className="font-bold underline underline-offset-4">
                  Zurück zum Vault-Eingang!
                </span>
              </Link>
            }
          />
          <TooltipContent className="TooltipContent z-[1001] max-w-[20rem] font-bold text-pretty md:max-w-full">
            <p>Zurück zum Vault-Eingang</p>
          </TooltipContent>
        </Tooltip>
      </article>
    </section>
  );
};

export default NotFound;
