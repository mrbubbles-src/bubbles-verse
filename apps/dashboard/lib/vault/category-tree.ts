export type CategoryTreeInput = {
  parentDepth: number;
};

export type VaultCategoryTreeItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  entryCount: number;
};

export type VaultCategoryTreeNode = VaultCategoryTreeItem & {
  depth: number;
  children: VaultCategoryTreeNode[];
};

const MAX_CATEGORY_PARENT_DEPTH = 0;

/**
 * Checks whether Vault can add a child under the given category depth.
 *
 * V1 only allows a two-level tree: top-level categories and one child layer.
 */
export function canAppendCategoryChild({
  parentDepth,
}: CategoryTreeInput): boolean {
  return parentDepth <= MAX_CATEGORY_PARENT_DEPTH;
}

/**
 * Checks whether a category may be moved below the given parent depth.
 *
 * V1 keeps the tree to two layers and prevents top-level categories with
 * existing children from being moved under another category.
 *
 * @param input Proposed parent depth plus whether the category already has children.
 * @returns `true` when the move keeps the tree valid.
 */
export function canReparentCategory(input: {
  nextParentDepth: number | null;
  hasChildren: boolean;
}) {
  if (input.nextParentDepth === null) {
    return true;
  }

  if (!canAppendCategoryChild({ parentDepth: input.nextParentDepth })) {
    return false;
  }

  if (input.hasChildren) {
    return false;
  }

  return true;
}

/**
 * Converts flat Vault category rows into the two-level tree used by the UI.
 *
 * Top-level categories stay sorted by `sortOrder` then name, with one child
 * layer rendered underneath each parent.
 *
 * @param categories Flat category rows including entry counts.
 * @returns A sorted tree for the dashboard manager.
 */
export function buildVaultCategoryTree(
  categories: VaultCategoryTreeItem[]
): VaultCategoryTreeNode[] {
  const sortedCategories = [...categories].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.name.localeCompare(right.name, 'de');
  });
  const nodeMap = new Map<string, VaultCategoryTreeNode>();

  for (const category of sortedCategories) {
    nodeMap.set(category.id, {
      ...category,
      depth: 0,
      children: [],
    });
  }

  const rootNodes: VaultCategoryTreeNode[] = [];

  for (const category of sortedCategories) {
    const node = nodeMap.get(category.id);

    if (!node) {
      continue;
    }

    if (!category.parentId) {
      rootNodes.push(node);
      continue;
    }

    const parentNode = nodeMap.get(category.parentId);

    if (!parentNode) {
      rootNodes.push(node);
      continue;
    }

    node.depth = parentNode.depth + 1;
    parentNode.children.push(node);
  }

  return rootNodes;
}
