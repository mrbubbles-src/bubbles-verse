import VaultAuthorAvatar from '@/components/layout/vault/vault-author/vault-author-avatar';
import VaultAuthorSocials from '@/components/layout/vault/vault-author/vault-author-socials';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@bubbles/ui/shadcn/tooltip';

interface VaultAuthorCardProps {
  author: {
    name?: string;
    email?: string;
    avatar?: string;
    authorSocials?: {
      website?: string;
      github?: string;
      linkedin?: string;
      codepen?: string;
      stackoverflow?: string;
      youtube?: string;
      twitter?: string;
      twitch?: string;
      discord?: string;
      instagram?: string;
      tiktok?: string;
      facebook?: string;
    };
  };
}
const VaultAuthorCard = ({ author }: VaultAuthorCardProps) => {
  return (
    <article className="bg-sidebar flex w-full items-center gap-4 rounded-md p-4 text-pretty shadow-md">
      <VaultAuthorAvatar
        avatarSrc={author.avatar || ''}
        authorName={author.name || ''}
      />
      <section className="flex flex-col gap-2">
        <section>
          <h2 className="text-2xl">{author.name}</h2>
          <Tooltip>
            <TooltipTrigger
              render={
                <a
                  href={`mailto:${author.email}`}
                  className="hover:text-primary/80 cursor-pointer py-2 text-sm font-semibold underline underline-offset-4 transition-all duration-300 ease-in-out">
                  {author.email}
                </a>
              }
            />
            <TooltipContent className="TooltipContent z-[1001] max-w-[20rem] font-bold text-pretty md:max-w-full">
              Hast du Fragen? Schick mir doch einfach eine E-Mail!
            </TooltipContent>
          </Tooltip>
        </section>
        <section className="flex max-w-[20rem] flex-wrap gap-x-1.5 gap-y-1">
          {author.authorSocials && (
            <VaultAuthorSocials authorSocials={author.authorSocials} />
          )}
        </section>
      </section>
    </article>
  );
};

export default VaultAuthorCard;
