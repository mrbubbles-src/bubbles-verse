import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const globalsCssPath = path.resolve(
  import.meta.dirname,
  '../src/styles/globals.css'
);
const globalsCss = readFileSync(globalsCssPath, 'utf8');

describe('globals.css', () => {
  it('exposes runtime and Tailwind tokens for bubbles shadows', () => {
    expect(globalsCss).toContain('--shadow-color:');
    expect(globalsCss).toContain('--bubbles-shadow:');
    expect(globalsCss).toContain('--bubbles-inset-shadow:');
    expect(globalsCss).toContain('--shadow-bubbles: var(--bubbles-shadow)');
    expect(globalsCss).toContain(
      '--inset-shadow-bubbles: var(--bubbles-inset-shadow)'
    );
  });
});
