// FALLBACK(no-db): These helpers mark the temporary no-database integration
// path so we can remove it quickly once the real infrastructure is running.

const noDbFallbackSetting =
  process.env.THE_CODING_VAULT_ENABLE_NO_DB_FALLBACK ?? 'true';

export const isDatabaseFallbackEnabled = noDbFallbackSetting !== 'false';
export const isAuthFallbackEnabled =
  isDatabaseFallbackEnabled || !process.env.JWT_SECRET;

export function logFallback(context: string, message: string) {
  console.warn(`[FALLBACK] ${context}: ${message}`);
}
