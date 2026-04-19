import '@testing-library/jest-dom/vitest';

if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
}

if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
}

/**
 * Creates a tiny in-memory Storage fallback for Bun/jsdom test runs.
 *
 * Some local Vitest environments expose `window.localStorage` without the full
 * Storage API. The editor tests rely on `clear`, `getItem`, `setItem`, and
 * `removeItem`, so the setup restores a stable implementation when needed.
 *
 * @returns Minimal Storage-compatible in-memory store.
 */
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.get(key) ?? null;
    },
    key(index) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

if (
  typeof window !== 'undefined' &&
  (typeof window.localStorage === 'undefined' ||
    typeof window.localStorage.clear !== 'function')
) {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
}
