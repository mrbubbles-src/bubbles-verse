import type { OutputData } from '@editorjs/editorjs';

/**
 * Remove HTML entities and normalize whitespace from derived title text.
 *
 * @param value - Raw heading text from EditorJS.
 * @returns Clean plain-text content suitable for metadata fields.
 */
export function sanitizeTitleText(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convert free-form text into the reference slug format.
 *
 * @param value - Human-readable title or manual slug input.
 * @returns URL-safe slug with stable umlaut and separator handling.
 */
export function slugifySegment(value: string): string {
  const sanitized = sanitizeTitleText(value);
  const mapped = sanitized
    .replace(/ß/g, 'ss')
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue');

  return mapped
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/(^-+)|(-+$)/g, '');
}

/**
 * Normalize a slash-separated slug path into clean slugified segments.
 *
 * @param value - Raw path-like slug input that may contain whitespace or slashes.
 * @returns Normalized slug path without empty segments.
 */
export function normalizeSlugPath(value: string): string {
  return value
    .split('/')
    .map((segment) => slugifySegment(segment))
    .filter((segment) => segment.length > 0)
    .join('/');
}

/**
 * Join multiple slug segments into a normalized path.
 *
 * @param segments - Candidate path segments from an app-level slug strategy.
 * @returns Joined and normalized slug path.
 */
export function joinSlugSegments(
  segments: readonly (string | null | undefined)[]
): string {
  return normalizeSlugPath(
    segments
      .filter((segment): segment is string => typeof segment === 'string')
      .join('/')
  );
}

/**
 * Convert free-form text into the reference single-segment slug format.
 *
 * @param value - Human-readable title or manual slug input.
 * @returns URL-safe slug with stable umlaut and separator handling.
 */
export function generateSlug(value: string): string {
  return slugifySegment(value);
}

/**
 * Backwards-compatible alias for the reference slug generator.
 *
 * @param value - Human-readable title or manual slug input.
 * @returns URL-safe slug with stable umlaut and separator handling.
 */
export function slugify(value: string): string {
  return slugifySegment(value);
}

/**
 * Read the first H1 block title from EditorJS output.
 *
 * @param content - Current EditorJS output snapshot.
 * @returns Sanitized H1 text or `undefined` when no valid H1 exists.
 */
export function getHeaderLevelOneTitle(
  content?: OutputData | null
): string | undefined {
  const headerBlock = content?.blocks?.find(
    (block) =>
      block.type === 'header' &&
      Number(block.data?.level) === 1 &&
      typeof block.data?.text === 'string'
  );

  const headerRaw = headerBlock?.data?.text ?? '';
  const headerText = sanitizeTitleText(headerRaw);

  return headerText.length > 0 ? headerText : undefined;
}
