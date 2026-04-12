import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { defaultComponents } from '@bubbles/markdown-renderer';

import VaultAlerts from './components/layout/vault/vault-components/vault-alerts';
import { VaultChecklist } from './components/layout/vault/vault-components/vault-checklist';
import VaultCodeBlock from './components/layout/vault/vault-components/vault-code/vault-codeblock';
import VaultDetailsToggle from './components/layout/vault/vault-components/vault-details-toggle';
import VaultEmbed from './components/layout/vault/vault-components/vault-embed';
import VaultImage from './components/layout/vault/vault-components/vault-image/vault-image';
import VaultLink from './components/layout/vault/vault-components/vault-link';

type AnchorProps = ComponentPropsWithoutRef<'a'>;

/**
 * Extend the shared markdown-renderer registry with Vault-only MDX tags while
 * keeping the package defaults for all base markdown elements.
 */
const components = {
  ...defaultComponents,
  a: ({ href, children, ...props }: AnchorProps) =>
    href ? (
      <VaultLink href={href} {...props}>
        {children}
      </VaultLink>
    ) : (
      <>{children}</>
    ),
  VaultAlerts: ({
    type = 'info',
    children,
  }: {
    type?: 'info' | 'success' | 'warning' | 'danger';
    children: ReactNode;
  }) => <VaultAlerts type={type}>{children}</VaultAlerts>,
  VaultChecklist,
  VaultCodeBlock,
  VaultDetailsToggle: ({
    text,
    children,
  }: {
    text: string;
    children: ReactNode;
  }) => <VaultDetailsToggle text={text}>{children}</VaultDetailsToggle>,
  VaultEmbed,
  VaultImage,
  VaultLink,
};

declare global {
  type MDXProvidedComponents = typeof components;
}

/**
 * Return the Vault's MDX component registry for package-driven MDX rendering.
 */
export function useMDXComponents(): MDXProvidedComponents {
  return components;
}

export { components };
