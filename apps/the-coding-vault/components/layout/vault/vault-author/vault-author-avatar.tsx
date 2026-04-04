import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@bubbles/ui/shadcn/avatar';
import { transformAvatar } from '@/lib/utils';

interface VaultAuthorAvatarProps {
  avatarSrc: string;
  authorName: string;
}

const VaultAuthorAvatar = ({
  avatarSrc,
  authorName,
}: VaultAuthorAvatarProps) => {
  return (
    <Avatar className="ring-primary size-15 place-self-start ring-2 ring-offset-2 transition-all duration-300 ease-in-out hover:scale-105">
      <a href={avatarSrc} target="_blank" rel="noopener noreferrer">
        <AvatarImage
          src={transformAvatar(avatarSrc)}
          alt={authorName}
          className="object-cover object-center"
        />
      </a>
      <AvatarFallback className="text-xs">{authorName}</AvatarFallback>
    </Avatar>
  );
};

export default VaultAuthorAvatar;
