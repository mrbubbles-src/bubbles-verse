import { describe, expect, it } from 'vitest';

import { serializeToMdx } from '../src';

describe('serializeToMdx', () => {
  it('serializes the supported block handlers into wrapped MDX output', () => {
    const result = serializeToMdx({
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph',
          data: {
            text: 'Paragraph with <span class="inline-code">npm init</span>, <s>done</s>, <span class="cdx-annotation" data-title="Note" data-text="Extra">annotation</span>, and <kbd class="editorjs-inline-hotkey">CMD+K</kbd>.',
          },
        },
        {
          id: 'header-1',
          type: 'header',
          data: { text: 'Heading', level: 2 },
        },
        {
          id: 'list-1',
          type: 'list',
          data: {
            style: 'ordered',
            items: [
              { content: 'First item' },
              { content: 'Second item', items: [{ content: 'Nested item' }] },
            ],
          },
        },
        {
          id: 'checklist-1',
          type: 'list',
          data: {
            style: 'checklist',
            items: [
              { content: 'Checked', meta: { checked: true } },
              { content: 'Unchecked', meta: { checked: false } },
            ],
          },
        },
        {
          id: 'code-1',
          type: 'code',
          data: {
            code: 'const answer = 42;',
            language: 'ts',
          },
        },
        {
          id: 'quote-1',
          type: 'quote',
          data: {
            text: 'Quoted',
            caption: 'Author',
          },
        },
        {
          id: 'alert-1',
          type: 'alert',
          data: {
            type: 'warning',
            message: '<div>Be careful<br>now</div>',
          },
        },
        {
          id: 'delimiter-1',
          type: 'delimiter',
          data: {},
        },
        {
          id: 'toggle-1',
          type: 'toggle',
          data: {
            text: 'More details',
            items: 2,
          },
        },
        {
          id: 'toggle-child-1',
          type: 'paragraph',
          data: {
            text: 'Nested child',
          },
        },
        {
          id: 'toggle-child-2',
          type: 'header',
          data: {
            text: 'Nested heading',
            level: 3,
          },
        },
        {
          id: 'table-1',
          type: 'table',
          data: {
            withHeadings: true,
            content: [
              ['Name', 'Value'],
              ['Alpha', '1'],
            ],
          },
        },
        {
          id: 'embed-1',
          type: 'embed',
          data: {
            embed: 'https://example.com/embed',
            caption: 'Embed caption',
          },
        },
        {
          id: 'image-1',
          type: 'image',
          data: {
            file: {
              url: 'https://example.com/image.png',
              original_filename: 'image.png',
              public_id: 'vault/image',
              width: 800,
              height: 600,
            },
            caption: 'Image caption',
          },
        },
      ],
    });

    expect(result).toContain('<div data-block-id="paragraph-1">');
    expect(result).toContain('<span class="inline-code">npm init</span>');
    expect(result).toContain('<s>done</s>');
    expect(result).toContain('class="cdx-annotation"');
    expect(result).toContain('<kbd class="editorjs-inline-hotkey">CMD+K</kbd>');
    expect(result).toContain('## Heading');
    expect(result).toContain('1. First item');
    expect(result).toContain('<MarkdownChecklist items={');
    expect(result).toContain('<MarkdownCodeBlock');
    expect(result).toContain('language="ts"');
    expect(result).toContain('> Quoted');
    expect(result).toContain('<MarkdownAlerts type="warning">');
    expect(result).toContain('Be careful');
    expect(result).toContain('---');
    expect(result).toContain('<MarkdownToggle text="More details">');
    expect(result).toContain('<div data-block-id="toggle-child-1">');
    expect(result).toContain('### Nested heading');
    expect(result).toContain('| Name  | Value |');
    expect(result).toContain('| ----- | ----- |');
    expect(result).toContain('<MarkdownEmbed embed="https://example.com/embed" caption="Embed caption" />');
    expect(result).toContain('<MarkdownImage');
    expect(result).toContain('original_filename="image.png"');
    expect(result).toContain('width="800"');
  });

  it('returns an empty string for missing block data', () => {
    expect(serializeToMdx({ blocks: [] })).toBe('');
  });
});
