import { describe, expect, it } from 'vitest';

import { serializeToMdx } from '../../src';
import {
  DEFAULT_ALLOWED_MDX_COMPONENTS,
  escapeMdxBraces,
  sanitizeSerializedMdx,
  tryParseInlineComponent,
} from '../../src/serializer/security';
import { createParagraphBlock } from './fixtures/blocks';

describe('escapeMdxBraces', () => {
  it('escapes nested braces from the reference behavior', () => {
    expect(escapeMdxBraces('{{value}}')).toBe('&#123;&#123;value&#125;&#125;');
  });

  it('escapes JSX-like content without touching angle brackets', () => {
    expect(escapeMdxBraces('<Demo prop={value} />')).toBe(
      '<Demo prop=&#123;value&#125; />'
    );
  });

  it('returns an empty string unchanged', () => {
    expect(escapeMdxBraces('')).toBe('');
  });
});

describe('tryParseInlineComponent', () => {
  it('exports the default inline component allowlist from the reference', () => {
    expect(DEFAULT_ALLOWED_MDX_COMPONENTS).toEqual(['FormBeispiel']);
  });

  it('parses valid shortcode JSON props for allowlisted components', () => {
    expect(tryParseInlineComponent('[[FormBeispiel {"key":"value"}]]')).toBe(
      '<FormBeispiel {...{"key":"value"}} />'
    );
  });

  it('rejects blocked component names', () => {
    expect(tryParseInlineComponent('[[DangerousComponent]]')).toBeNull();
  });

  it('rejects malformed JSON props', () => {
    expect(tryParseInlineComponent('[[FormBeispiel {"broken":}]]')).toBeNull();
  });

  it('parses JSX-style self-closing syntax for allowlisted components', () => {
    expect(tryParseInlineComponent('<FormBeispiel />')).toBe(
      '<FormBeispiel />'
    );
  });

  it('parses no-props shortcode syntax', () => {
    expect(tryParseInlineComponent('[[FormBeispiel]]')).toBe(
      '<FormBeispiel />'
    );
  });
});

describe('sanitizeSerializedMdx', () => {
  it('normalizes br tags to self-closing form in one dedicated pass', () => {
    expect(
      sanitizeSerializedMdx('<div>Line one<br class="soft">Line two</div>')
    ).toBe('<div>Line one<br />Line two</div>');
  });
});

describe('serializeToMdx security integration', () => {
  it('renders allowlisted shortcodes as inline MDX components', () => {
    const result = serializeToMdx({
      blocks: [createParagraphBlock({ text: '[[FormBeispiel]]' })],
    });

    expect(result).toContain('<FormBeispiel />');
  });

  it('falls back to escaped paragraph text when shortcode props are malformed', () => {
    const result = serializeToMdx({
      blocks: [createParagraphBlock({ text: '[[FormBeispiel {"broken":}]]' })],
    });

    expect(result).toContain('[[FormBeispiel &#123;"broken":&#125;]]');
    expect(result).not.toContain('<FormBeispiel');
  });

  it('applies the final br sanitization pass to serialized paragraph output', () => {
    const result = serializeToMdx({
      blocks: [createParagraphBlock({ text: 'Line one<br>Line two' })],
    });

    expect(result).toContain('Line one<br />Line two');
  });
});
