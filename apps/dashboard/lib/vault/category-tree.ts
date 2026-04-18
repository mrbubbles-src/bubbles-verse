type CategoryTreeInput = {
  parentDepth: number
}

const MAX_CATEGORY_PARENT_DEPTH = 0

/**
 * Checks whether Vault can add a child under the given category depth.
 *
 * V1 only allows a two-level tree: top-level categories and one child layer.
 */
export function canAppendCategoryChild({
  parentDepth,
}: CategoryTreeInput): boolean {
  return parentDepth <= MAX_CATEGORY_PARENT_DEPTH
}
