'use client';
import VaultAuthorCard from '@/components/layout/vault/vault-author/vault-author-card';
import { useState } from 'react';
interface VaultAuthorProps {
  author:
    | {
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
      }
    | string;
  dates: {
    createdAt: Date;
    updatedAt: Date;
  };
}
const VaultAuthor = ({ author, dates }: VaultAuthorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  if (typeof author === 'string')
    return (
      <section>
        <p className="text-md italic">
          <span className="font-semibold">Autor: </span>
          <span className="text-primary font-bold">{author}</span>
        </p>
        <p className="text-md italic">
          <span className="font-semibold">Erstellt: </span>
          <span
            className={`${dates.createdAt.getTime() !== dates.updatedAt.getTime() ? 'text-accent' : 'text-secondary'} font-bold`}>
            {new Date(dates.createdAt).toLocaleDateString('de-DE', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            Uhr
          </span>
        </p>
        {dates.createdAt.getTime() !== dates.updatedAt.getTime() && (
          <p className="text-md italic">
            <span className="font-semibold">Aktualisiert: </span>
            <span className="text-secondary font-bold">
              {new Date(dates.updatedAt).toLocaleDateString('de-DE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              Uhr
            </span>
          </p>
        )}
      </section>
    );

  return (
    <section className="group relative inline-block w-full">
      <p className="text-md italic">
        <span className="font-semibold">Autor: </span>
        <span
          onClick={() => setIsOpen((prev) => !prev)}
          className={`text-primary lg:group-hover:text-primary/80 cursor-pointer font-bold transition-all duration-300 ease-in-out ${isOpen ? 'text-primary/80' : ''}`}>
          {author.name}
        </span>
      </p>
      <p className="text-md italic">
        <span className="font-semibold">Erstellt: </span>
        <span
          className={`${dates.createdAt.getTime() !== dates.updatedAt.getTime() ? 'text-accent' : 'text-secondary'} font-bold`}>
          {new Date(dates.createdAt).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          Uhr
        </span>
      </p>
      {dates.createdAt.getTime() !== dates.updatedAt.getTime() && (
        <p className="text-md italic">
          <span className="font-semibold">Aktualisiert: </span>
          <span className="text-secondary font-bold">
            {new Date(dates.updatedAt).toLocaleDateString('de-DE', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            Uhr
          </span>
        </p>
      )}
      <div className="pointer-events-none absolute top-full left-0 z-[1000] hidden opacity-0 transition-opacity duration-200 ease-in-out group-hover:pointer-events-auto group-hover:opacity-100 lg:block">
        <VaultAuthorCard author={author} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 z-[1000] lg:hidden">
          <VaultAuthorCard author={author} />
        </div>
      )}
    </section>
  );
};

export default VaultAuthor;
