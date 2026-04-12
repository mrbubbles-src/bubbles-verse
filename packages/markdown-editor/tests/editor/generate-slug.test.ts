import { describe, expect, it } from 'vitest';

import { generateSlug } from '../../src/index';

describe('generateSlug', () => {
  it('preserves the reference umlaut and entity normalization', () => {
    expect(generateSlug('Grüß&nbsp;Gott')).toBe('gruess-gott');
    expect(generateSlug('Ärger Ölung Übermut')).toBe('aerger-oelung-uebermut');
  });

  it('removes accents, duplicate separators, and unsupported characters', () => {
    expect(generateSlug('Crème brûlée déjà vu')).toBe('creme-brulee-deja-vu');
    expect(generateSlug('--Already---Slug--')).toBe('already-slug');
    expect(generateSlug('!!!')).toBe('');
  });
});
