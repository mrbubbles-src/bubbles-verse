'use client';

import { Button } from '@bubbles/ui/shadcn/button';
import Vaulty from '@/public/images/vaulty.png';
import Image from 'next/image';
import { useEffect } from 'react';
import { toast } from 'sonner';

type ErrorProps = {
  error: Error & { digest?: string; cause?: unknown };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // console.error('🧪 Errordata:', error);

    fetch('/api/error/report-error', {
      method: 'POST',
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        cause: error.cause,
      }),
    })
      .then(() => {
        toast.success('Fehler erfolgreich an Admin gemeldet!');
      })
      .catch((e) =>
        toast.error('Fehler beim Melden des Fehlers an den Admin 😔:', e),
      );
  }, [error]);

  return (
    <section className="flex h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <Image
        src={Vaulty}
        alt="Vaulty"
        placeholder="blur"
        blurDataURL={Vaulty.blurDataURL}
        width={250}
        height={250}
        className="animate-pulse"
      />
      <h1 className="text-destructive text-3xl font-bold">
        Oh nein! Vaulty hat einen Fehler entdeckt.
      </h1>
      <p className="text-muted-foreground max-w-md text-lg font-semibold">
        Irgendetwas ist gerade schiefgelaufen. Vaulty arbeitet bereits daran,
        das Problem zu verstehen und zu beheben.
      </p>
      <Button
        variant="secondary"
        onClick={reset}
        className="animate-bounce font-bold">
        Nochmal versuchen
      </Button>
    </section>
  );
}
