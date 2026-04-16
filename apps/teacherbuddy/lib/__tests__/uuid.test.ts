import { createUuid } from '@/lib/uuid';

import { afterEach, describe, expect, it } from 'vitest';

const originalCrypto = globalThis.crypto;

describe('createUuid', () => {
  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  });

  it('prefers crypto.randomUUID when available', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        randomUUID: () => 'random-uuid',
      },
    });

    expect(createUuid()).toBe('random-uuid');
  });

  it('uses crypto.getRandomValues when randomUUID is unavailable', () => {
    const getRandomValues = (bytes: Uint8Array) => {
      bytes.set(new Uint8Array(16).fill(16));
      return bytes;
    };

    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        getRandomValues,
      },
    });

    expect(createUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it('falls back to a generated uuid string without crypto', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: undefined,
    });

    const first = createUuid();
    const second = createUuid();

    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
    expect(second).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
    expect(first).not.toBe(second);
  });
});
