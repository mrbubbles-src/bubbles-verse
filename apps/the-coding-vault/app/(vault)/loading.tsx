'use client';

import { useEffect, useState } from 'react';
import VaultyIcon from '@/public/images/icon.svg';
import Image from 'next/image';

const logLines = [
  '> sudo vault -e -f vaulty.core',
  'Password:',
  'Initializing Kernel Modules...',
  'Loading: knowledge.mdx...',
  'Indexing: draft.cache...',
  'Parsing Metadata: meta.sys...',
  'Checking System Integrity...',
  'All Systems Nominal ✔︎',
  '### Vaulty Core Initialized ###',
  'Loading: vaulty.assets',
  'Loading: vaulty.config.json',
  'Setting Up: vaulty.database.postgresql',
  'Connecting to: vaulty.network...',
  'Establishing Secure Connection...',
  'Connection Established ✔︎',
  'Configuring: user.preferences...',
  'Loading: vaulty.theme.css',
  'Applying Theme: dark-mode',
  'Theme Applied ✔︎',
  'Loading: vaulty.extensions',
  '⊕ Enabling: vaulty.encryption',
  '⊕ Enabling: vaulty.backup',
  '⊕ Enabling: vaulty.sync',
  '⊕ Enabling: vaulty.notifications',
  '⊕ Enabling: vaulty.security',
  '⊕ Enabling: vaulty.performance',
  '⊕ Enabling: vaulty.integrations',
  '⊕ Enabling: vaulty.updates',
  '⊕ Enabling: vaulty.privacy',
  '⊕ Enabling: vaulty.terms',
  '### Vaulty is Ready ###',
  'Hidrating...',
];

const Loading = () => {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  useEffect(() => {
    let index = -1;
    const interval = setInterval(() => {
      if (index < logLines.length) {
        index++;
        const nextLine = logLines[index];
        if (nextLine) {
          setVisibleLines((prev) => [...prev, nextLine]);
        }
      } else {
        clearInterval(interval);
      }
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="flex h-screen flex-col items-center justify-center px-4 text-center">
      <Image
        src={VaultyIcon}
        alt="Vaulty Icon"
        width={250}
        height={250}
        className="animate-pulse drop-shadow"
      />
      <div className="text-muted-foreground font-code text-left text-sm">
        {visibleLines.map((line, i) => (
          <p
            key={`${i}-${line}`}
            className="text-accent-foreground font-semibold whitespace-pre">
            {line}
          </p>
        ))}
        {visibleLines.length < logLines.length && (
          <p className="animate-pulse">▍</p>
        )}
      </div>
    </section>
  );
};

export default Loading;
