import { describe, expect, it } from 'vitest';

import { convertMarkdownToEditorJs } from '../../src/lib/convert-markdown-to-editor-js';

describe('convertMarkdownToEditorJs', () => {
  it('converts core markdown structures into EditorJS blocks', () => {
    const result = convertMarkdownToEditorJs(
      '# Heading\n\nParagraph with **bold** text.\n\n- First\n- Second'
    );

    expect(result.stats.totalBlocks).toBe(3);
    expect(result.data.blocks.map((block) => block.type)).toEqual([
      'header',
      'paragraph',
      'list',
    ]);
    expect(result.warnings).toEqual([]);
  });

  it('turns markdown images into placeholder image blocks and warnings', () => {
    const result = convertMarkdownToEditorJs(
      '![Alt text](https://example.com/image.png)'
    );

    expect(result.stats.imagePlaceholders).toBe(1);
    expect(result.data.blocks[0]?.type).toBe('image');
    expect(result.warnings[0]).toContain('placeholder');
  });

  it('keeps fenced code filename metadata when present', () => {
    const result = convertMarkdownToEditorJs(
      '```tsx filename="app/layout.tsx"\nexport default function Layout() {}\n```'
    );

    expect(result.data.blocks[0]).toMatchObject({
      type: 'code',
      data: {
        filename: 'app/layout.tsx',
        language: 'tsx',
      },
    });
  });
});
