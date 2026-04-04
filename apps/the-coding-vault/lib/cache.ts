import { ICategories } from '@/types/types';
import { isDatabaseFallbackEnabled, logFallback } from './runtime-fallbacks';

let cachedCategories: ICategories[] | null = null;

export const getCachedCategories = async () => {
  if (cachedCategories) return cachedCategories;

  if (isDatabaseFallbackEnabled) {
    // FALLBACK(no-db): Return an empty category list until the shared database
    // is available inside the monorepo environment.
    logFallback(
      'getCachedCategories',
      'DATABASE_URL is missing, returning an empty category list.'
    );
    cachedCategories = [];
    return cachedCategories;
  }

  const { getCategories } = await import('./db');
  const categories = await getCategories();
  cachedCategories = categories;
  return categories;
};
