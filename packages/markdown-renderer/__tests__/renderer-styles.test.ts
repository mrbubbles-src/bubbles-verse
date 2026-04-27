import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const rendererStylesheetPath = path.resolve(
  import.meta.dirname,
  '../src/styles/renderer.css'
);
const rendererStylesheet = readFileSync(rendererStylesheetPath, 'utf8');

describe('renderer.css', () => {
  it('defines the renderer syntax token variables for light and dark mode', () => {
    expect(rendererStylesheet).toContain('--sh-class:');
    expect(rendererStylesheet).toContain('--sh-comment:');
    expect(rendererStylesheet).toContain('--code-bg:');
    expect(rendererStylesheet).toContain('.dark {');
  });

  it('styles inline code without pulling in editor chrome selectors', () => {
    expect(rendererStylesheet).toContain('code:not(pre code)');
    expect(rendererStylesheet).not.toMatch(
      /\.ce-|\.cdx-|editorjs|split-pane|toolbar/i
    );
  });

  it('uses shared UI tokens directly for inline code shape', () => {
    expect(rendererStylesheet).toContain('background-color: var(--code-bg)');
    expect(rendererStylesheet).toContain('border-radius: var(--radius-md)');
    expect(rendererStylesheet).toContain('box-shadow: var(--bubbles-shadow)');
    expect(rendererStylesheet).not.toContain(
      'background-color: var(--ctp-latte'
    );
    expect(rendererStylesheet).not.toContain('--renderer-inline-code-border');
    expect(rendererStylesheet).not.toContain('--renderer-inline-code-radius');
  });

  it('maps renderer colors through shared custom properties instead of raw values', () => {
    expect(rendererStylesheet).toContain('var(--ctp-latte-yellow)');
    expect(rendererStylesheet).toContain('var(--ctp-mocha-yellow)');
    expect(rendererStylesheet).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(rendererStylesheet).not.toMatch(/\brgba?\(/i);
  });
});
