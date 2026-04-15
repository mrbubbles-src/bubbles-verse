import { describe, expect, it } from 'vitest';

import { defaultComponents, previewComponents, useMDXComponents } from '../src';

describe('defaultComponents', () => {
  it('exports the full reference markdown component set', () => {
    expect(defaultComponents.MarkdownAlerts).toBeDefined();
    expect(defaultComponents.MarkdownCodeBlock).toBeDefined();
    expect(defaultComponents.MarkdownChecklist).toBeDefined();
    expect(defaultComponents.MarkdownEmbed).toBeDefined();
    expect(defaultComponents.MarkdownImage).toBeDefined();
    expect(defaultComponents.MarkdownLink).toBeDefined();
    expect(defaultComponents.MarkdownToggle).toBeDefined();
    expect(defaultComponents.a).toBeDefined();
  });

  it('returns the exported registry from useMDXComponents', () => {
    expect(useMDXComponents()).toBe(defaultComponents);
  });

  it('exports a preview registry for client-side MDX rendering', () => {
    expect(previewComponents.MarkdownImage).toBeDefined();
    expect(previewComponents.MarkdownImage).not.toBe(
      defaultComponents.MarkdownImage,
    );
    expect(previewComponents.MarkdownLink).toBe(defaultComponents.MarkdownLink);
  });
});
