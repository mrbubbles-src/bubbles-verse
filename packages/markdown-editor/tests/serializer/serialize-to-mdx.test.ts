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
    expect(result).toContain('<span class="inline-code">npm init</span>');
    expect(result).toContain('<s>done</s>');
    expect(result).toContain('class="cdx-annotation"');
    expect(result).toContain('<kbd class="editorjs-inline-hotkey">CMD+K</kbd>');
  });

  it('serializes headers as markdown headings', () => {
    const result = serializeToMdx({
      blocks: [createHeaderBlock({ level: 2, text: 'Heading' })],
    });

    expect(result).toContain('## Heading');
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
    expect(result).toContain('language="ts"');
  });

  it('serializes codeBox blocks with plaintext fallback', () => {
    const result = serializeToMdx({
      blocks: [createCodeBlock({ id: 'codebox-1', type: 'codeBox' })],
    });

    expect(result).toContain('<div data-block-id="codebox-1">');
    expect(result).toContain('<MarkdownCodeBlock');
    expect(result).toContain('language="plaintext"');
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

    expect(result).toContain('<MarkdownAlerts type="warning">');
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

    expect(result).toContain('<MarkdownToggle text="More details">');
    expect(result).toContain('<div data-block-id="toggle-child-1">');
    expect(result).toContain('Nested child');
    expect(result).toContain('### Nested heading');
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
      '<MarkdownEmbed embed="https://example.com/embed" caption="Embed caption" />'
    );
  });

  it('serializes images with file metadata', () => {
    const result = serializeToMdx({
      blocks: [createImageBlock()],
    });

    expect(result).toContain('<MarkdownImage');
    expect(result).toContain('url="https://example.com/image.png"');
    expect(result).toContain('original_filename="image.png"');
    expect(result).toContain('public_id="vault/image"');
    expect(result).toContain('width="800"');
    expect(result).toContain('height="600"');
  });

  it('returns an empty string for empty block arrays', () => {
    expect(serializeToMdx({ blocks: [] })).toBe('');
  });
});
