const UUID_BYTE_LENGTH = 16

/**
 * Creates a stable client-side entry id.
 * Prefers `crypto.randomUUID()`, falls back to UUIDv4 bytes from
 * `crypto.getRandomValues()`, and finally uses a timestamp/random suffix when
 * the Web Crypto helpers are missing in older dev browsers.
 */
export function createEntryId(): string {
  const cryptoApi = globalThis.crypto

  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID()
  }

  if (typeof cryptoApi?.getRandomValues === 'function') {
    const bytes = new Uint8Array(UUID_BYTE_LENGTH)
    cryptoApi.getRandomValues(bytes)

    bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
    bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80

    return formatUuid(bytes)
  }

  return `entry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Formats 16 bytes as a UUIDv4 string.
 */
function formatUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}
