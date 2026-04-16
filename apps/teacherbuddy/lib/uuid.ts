let fallbackCounter = 0;

function toUuidString(bytes: Uint8Array): string {
  const normalized = new Uint8Array(bytes);
  const versionByte = normalized[6] ?? 0;
  const variantByte = normalized[8] ?? 0;

  normalized[6] = (versionByte & 0x0f) | 0x40;
  normalized[8] = (variantByte & 0x3f) | 0x80;

  const hex = Array.from(normalized, (value) =>
    value.toString(16).padStart(2, '0')
  ).join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function createFallbackBytes(): Uint8Array {
  fallbackCounter += 1;

  const seed =
    `${Date.now().toString(16)}${fallbackCounter.toString(16)}${Math.random().toString(16).slice(2)}`.padEnd(
      32,
      '0'
    );
  const bytes = new Uint8Array(16);

  for (let index = 0; index < bytes.length; index += 1) {
    const start = index * 2;
    bytes[index] = Number.parseInt(seed.slice(start, start + 2), 16);
  }

  return bytes;
}

/**
 * Creates a UUID that keeps working when `crypto.randomUUID()` is unavailable.
 */
export function createUuid(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  if (globalThis.crypto?.getRandomValues) {
    return toUuidString(globalThis.crypto.getRandomValues(new Uint8Array(16)));
  }

  return toUuidString(createFallbackBytes());
}
