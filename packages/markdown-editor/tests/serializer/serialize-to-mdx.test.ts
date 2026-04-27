import { describe, expect, it } from 'vitest';

import { serializeToMdx } from '../../src';
import {
  checklistItems,
  createAlertBlock,
  createCodeBlock,
  createDelimiterBlock,
  createEmbedBlock,
  createHeaderBlock,
  createImageBlock,
  createListBlock,
  createParagraphBlock,
  createQuoteBlock,
  createTableBlock,
  createToggleBlock,
  inlineToolsParagraphText,
  orderedListItems,
  unorderedListItems,
} from './fixtures/blocks';

describe('serializeToMdx', () => {
  it('wraps paragraph output and preserves inline EditorJS tool markup', () => {
    const result = serializeToMdx({
      blocks: [createParagraphBlock({ text: inlineToolsParagraphText })],
    });

    expect(result).toContain('<div data-block-id="paragraph-1">');
    expect(result).toContain('<span className="inline-code">npm init</span>');
    expect(result).toContain('<s>done</s>');
    expect(result).toContain('className="cdx-annotation"');
    expect(result).toContain(
      '<kbd className="editorjs-inline-hotkey">CMD+K</kbd>'
    );
  });

  it('serializes headers as markdown headings', () => {
    const result = serializeToMdx({
      blocks: [createHeaderBlock({ level: 2, text: 'Heading' })],
    });

    expect(result).toContain('## Heading');
  });

  it('adds heading anchor ids to wrapped header blocks when provided', () => {
    const result = serializeToMdx(
      {
        blocks: [createHeaderBlock({ id: 'header-anchor-1', text: 'Intro' })],
      },
      {
        headingAnchorIdsByBlockId: {
          'header-anchor-1': 'intro-header-1',
        },
      }
    );

    expect(result).toContain('<div data-block-id="header-anchor-1"');
    expect(result).toContain('id="intro-header-1"');
    expect(result).toContain('className="topic-anchor-target"');
    expect(result).toContain('## Intro');
  });

  it('keeps header wrapper compatibility when no anchor map is provided', () => {
    const result = serializeToMdx({
      blocks: [
        createHeaderBlock({ id: 'header-anchor-2', text: 'Quickstart' }),
      ],
    });

    expect(result).toContain('<div data-block-id="header-anchor-2">');
    expect(result).not.toContain('class="topic-anchor-target"');
  });

  it('serializes ordered lists with nested children', () => {
    const result = serializeToMdx({
      blocks: [createListBlock({ items: orderedListItems, style: 'ordered' })],
    });

    expect(result).toContain('1. First item');
    expect(result).toContain('2. Second item');
    expect(result).toContain('    1. Nested item');
  });

  it('serializes unordered lists as markdown bullets', () => {
    const result = serializeToMdx({
      blocks: [
        createListBlock({ items: unorderedListItems, style: 'unordered' }),
      ],
    });

    expect(result).toContain('- Alpha');
    expect(result).toContain('- Beta');
  });

  it('serializes checklist lists via MarkdownChecklist', () => {
    const result = serializeToMdx({
      blocks: [createListBlock({ items: checklistItems, style: 'checklist' })],
    });

    expect(result).toContain('<MarkdownChecklist items={');
    expect(result).toContain('"content":"Checked"');
    expect(result).toContain('"checked":true');
  });

  it('serializes code blocks with explicit language', () => {
    const result = serializeToMdx({
      blocks: [createCodeBlock({ language: 'ts' })],
    });

    expect(result).toContain('<MarkdownCodeBlock');
    expect(result).toContain('code={"const answer = 42;"}');
    expect(result).toContain('language={"ts"}');
  });

  it('serializes code blocks with optional filename metadata', () => {
    const result = serializeToMdx({
      blocks: [
        createCodeBlock({ filename: 'app/layout.tsx', language: 'tsx' }),
      ],
    });

    expect(result).toContain('filename={"app/layout.tsx"}');
  });

  it('extracts optional filename metadata from the first code line', () => {
    const result = serializeToMdx({
      blocks: [
        createCodeBlock({
          code: '// @filename app/layout.tsx\nexport default function Layout() {}',
          language: 'tsx',
        }),
      ],
    });

    expect(result).toContain('filename={"app/layout.tsx"}');
    expect(result).toContain('code={"export default function Layout() {}"}');
    expect(result).not.toContain('@filename');
  });

  it('supports html-style filename metadata for markup code blocks', () => {
    const result = serializeToMdx({
      blocks: [
        createCodeBlock({
          code: '<!-- @filename app/page.tsx -->\n<main>Hello</main>',
          language: 'html',
        }),
      ],
    });

    expect(result).toContain('filename={"app/page.tsx"}');
    expect(result).toContain('code={"<main>Hello</main>"}');
  });

  it('serializes codeBox blocks with plaintext fallback', () => {
    const result = serializeToMdx({
      blocks: [createCodeBlock({ id: 'codebox-1', type: 'codeBox' })],
    });

    expect(result).toContain('<div data-block-id="codebox-1">');
    expect(result).toContain('<MarkdownCodeBlock');
    expect(result).toContain('language={"plaintext"}');
  });

  it('serializes quotes with caption footer lines', () => {
    const result = serializeToMdx({
      blocks: [createQuoteBlock({ caption: 'Author', text: 'Quoted' })],
    });

    expect(result).toContain('> Quoted');
    expect(result).toContain('> — Author');
  });

  it('serializes alerts after reference HTML normalization', () => {
    const result = serializeToMdx({
      blocks: [
        createAlertBlock({
          message:
            '<div><span style="color:red">Be careful</span><br><a href="/vault">now</a></div>',
        }),
      ],
    });

    expect(result).toContain('<MarkdownAlerts type={"warning"}>');
    expect(result).toContain('Be careful');
    expect(result).toContain('<MarkdownLink href="/vault">now</MarkdownLink>');
  });

  it('serializes delimiters as thematic breaks', () => {
    const result = serializeToMdx({
      blocks: [createDelimiterBlock()],
    });

    expect(result).toContain('\n\n---\n\n');
  });

  it('serializes toggles recursively with nested child blocks', () => {
    const result = serializeToMdx({
      blocks: [
        createToggleBlock(),
        createParagraphBlock({ id: 'toggle-child-1', text: 'Nested child' }),
        createHeaderBlock({
          id: 'toggle-child-2',
          level: 3,
          text: 'Nested heading',
        }),
      ],
    });

    expect(result).toContain('<MarkdownToggle text={"More details"}>');
    expect(result).toContain('<div data-block-id="toggle-child-1">');
    expect(result).toContain('Nested child');
    expect(result).toContain('### Nested heading');
  });

  it('forwards heading anchor ids through recursive toggle serialization', () => {
    const result = serializeToMdx(
      {
        blocks: [
          createToggleBlock({ id: 'toggle-anchor-1' }),
          createHeaderBlock({
            id: 'toggle-heading-anchor-1',
            level: 3,
            text: 'Nested anchor heading',
          }),
          createParagraphBlock({
            id: 'toggle-anchor-child-1',
            text: 'Nested body copy',
          }),
        ],
      },
      {
        headingAnchorIdsByBlockId: {
          'toggle-heading-anchor-1': 'nested-anchor-heading',
        },
      }
    );

    expect(result).toContain('id="nested-anchor-heading"');
    expect(result).toContain('className="topic-anchor-target"');
    expect(result).toContain('### Nested anchor heading');
  });

  it('serializes tables with padded GFM headings', () => {
    const result = serializeToMdx({
      blocks: [createTableBlock({ withHeadings: true })],
    });

    expect(result).toContain('| Name  | Value |');
    expect(result).toContain('| ----- | ----- |');
    expect(result).toContain('| Alpha | 1     |');
  });

  it('serializes tables without heading separators as escaped plain rows', () => {
    const result = serializeToMdx({
      blocks: [
        createTableBlock({
          id: 'table-no-headings-1',
          withHeadings: false,
        }),
      ],
    });

    expect(result).toContain('<div data-block-id="table-no-headings-1">');
    expect(result).toContain('| Name  | Value |');
    expect(result).not.toContain('| ----- | ----- |');
  });

  it('serializes embeds as MarkdownEmbed components', () => {
    const result = serializeToMdx({
      blocks: [createEmbedBlock()],
    });

    expect(result).toContain(
      '<MarkdownEmbed embed={"https://example.com/embed"} caption={"Embed caption"} />'
    );
  });

  it('serializes images with file metadata', () => {
    const result = serializeToMdx({
      blocks: [createImageBlock()],
    });

    expect(result).toContain('<MarkdownImage');
    expect(result).toContain('url={"https://example.com/image.png"}');
    expect(result).toContain('original_filename={"image.png"}');
    expect(result).toContain('public_id={"vault/image"}');
    expect(result).toContain('width={800}');
    expect(result).toContain('height={600}');
  });

  it('escapes quotes in serialized embed and image props', () => {
    const result = serializeToMdx({
      blocks: [
        createEmbedBlock({
          caption: 'Says "hello"',
          embed: 'https://example.com/embed?note="quoted"',
        }),
        createImageBlock({
          caption: 'Caption with "quotes"',
          file: {
            height: 600,
            original_filename: 'quote "image".png',
            public_id: 'vault/image',
            url: 'https://example.com/image-"quoted".png',
            width: 800,
          },
        }),
      ],
    });

    expect(result).toContain('caption={"Says \\"hello\\""}');
    expect(result).toContain(
      'embed={"https://example.com/embed?note=\\"quoted\\""}'
    );
    expect(result).toContain('caption={"Caption with \\"quotes\\""}');
    expect(result).toContain('original_filename={"quote \\"image\\".png"}');
  });

  it('escapes dangerous table cell characters before building GFM rows', () => {
    const result = serializeToMdx({
      blocks: [
        createTableBlock({
          content: [
            ['Name', 'Value'],
            ['Alpha | Beta', 'First line\nSecond line'],
          ],
          withHeadings: true,
        }),
      ],
    });

    expect(result).toContain('Alpha \\| Beta');
    expect(result).toContain('First line<br />Second line');
  });

  it('returns an empty string for empty block arrays', () => {
    expect(serializeToMdx({ blocks: [] })).toBe('');
  });
});
