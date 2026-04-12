import { describe, expect, it } from 'vitest';

import { serializeToMdx } from '../src';
import {
  DEFAULT_ALLOWED_MDX_COMPONENTS,
  escapeMdxBraces,
  sanitizeSerializedMdx,
  tryParseInlineComponent,
} from '../src/serializer/security';

describe('serializer security helpers', () => {
  it('matches the reference brace escaping behavior', () => {
    expect(escapeMdxBraces('{process.env.SECRET}')).toBe(
      '&#123;process.env.SECRET&#125;',
    );
  });

  it('exports the default inline component allowlist from the reference', () => {
    expect(DEFAULT_ALLOWED_MDX_COMPONENTS).toEqual(['FormBeispiel']);
  });

  it('parses only allowlisted shortcode syntaxes from the reference', () => {
    expect(tryParseInlineComponent('[[FormBeispiel]]')).toBe(
      '<FormBeispiel />',
    );
    expect(
      tryParseInlineComponent('[[FormBeispiel {"key":"value"}]]'),
    ).toBe('<FormBeispiel {...{"key":"value"}} />');
    expect(tryParseInlineComponent('<FormBeispiel />')).toBe(
      '<FormBeispiel />',
    );
    expect(tryParseInlineComponent('[[DangerousComponent]]')).toBeNull();
    expect(
      tryParseInlineComponent('[[FormBeispiel {"broken":}]]'),
    ).toBeNull();
  });

  it('normalizes non-self-closing br tags exactly once at the end', () => {
    expect(sanitizeSerializedMdx('<div>Line one<br>Line two</div>')).toBe(
      '<div>Line one<br />Line two</div>',
    );
  });
});

describe('serializeToMdx security integration', () => {
  it('escapes braces in paragraph output before serialization', () => {
    const result = serializeToMdx({
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph',
          data: {
            text: 'Value is {process.env.SECRET}',
          },
        },
      ],
    });

    expect(result).toContain('Value is &#123;process.env.SECRET&#125;');
  });

  it('falls back to plain paragraph content when shortcode props are invalid', () => {
    const result = serializeToMdx({
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph',
          data: {
            text: '[[FormBeispiel {"broken":}]]',
          },
        },
      ],
    });

    expect(result).toContain('[[FormBeispiel &#123;"broken":&#125;]]');
    expect(result).not.toContain('<FormBeispiel');
  });

  it('applies the final br sanitization pass to serialized output', () => {
    const result = serializeToMdx({
      blocks: [
        {
          id: 'paragraph-1',
          type: 'paragraph',
          data: {
            text: 'Line one<br>Line two',
          },
        },
      ],
    });

    expect(result).toContain('Line one<br />Line two');
  });
});
