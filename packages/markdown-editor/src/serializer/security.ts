/**
 * Default allowlisted inline MDX components from the reference serializer.
 *
 * Use for shortcode parsing that must stay within the established security
 * boundary.
 */
export const DEFAULT_ALLOWED_MDX_COMPONENTS = [] as const;

const allowedInlineComponentNames = new Set<string>(
  DEFAULT_ALLOWED_MDX_COMPONENTS,
);

/**
 * Escape curly braces so MDX does not treat user text as expressions.
 *
 * @param text - Raw user-authored text.
 * @returns Text with braces converted to HTML entities.
 */
export function escapeMdxBraces(text: string): string {
  return text.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
}

/**
 * Parse a safe inline component shortcode from paragraph content.
 *
 * Supports only the reference syntaxes and only for allowlisted component
 * names.
 *
 * @param text - Paragraph text to inspect.
 * @returns MDX component markup when the shortcode is allowed and valid.
 */
export function tryParseInlineComponent(text: string): string | null {
  if (!text) {
    return null;
  }

  const trimmed = text.trim();
  const shortcodeMatch = trimmed.match(
    /^\[\[(?<name>[A-Za-z_][A-Za-z0-9_]*)\s*(?<json>\{[\s\S]*\})?\]\]$/,
  );

  if (shortcodeMatch?.groups?.name) {
    const { name } = shortcodeMatch.groups;

    if (!allowedInlineComponentNames.has(name)) {
      return null;
    }

    const jsonProps = shortcodeMatch.groups.json?.trim();

    if (!jsonProps) {
      return `<${name} />`;
    }

    try {
      const parsedProps = JSON.parse(jsonProps);
      return `<${name} {...${JSON.stringify(parsedProps)}} />`;
    } catch {
      return null;
    }
  }

  const jsxMatch = trimmed.match(/^<(?<name>[A-Za-z_][A-Za-z0-9_]*)\s*\/>$/);

  if (jsxMatch?.groups?.name) {
    const { name } = jsxMatch.groups;
    return allowedInlineComponentNames.has(name) ? `<${name} />` : null;
  }

  return null;
}

/**
 * Normalize serializer output for MDX compatibility.
 *
 * @param text - Serialized MDX string before the final sanitization pass.
 * @returns MDX string with reference-compatible `<br />` normalization.
 */
export function sanitizeSerializedMdx(text: string): string {
  return text.replace(/<br\b([^>]*)>/gi, '<br />');
}
