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

export type VaultCategoryTreeLevelFilter = 'all' | 'top-level' | 'children';

export type VaultCategoryTreeSummary = {
  total: number;
  topLevel: number;
  child: number;
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

/**
 * Counts the total, top-level, and child categories in the current tree.
 *
 * @param categories Current category tree from the dashboard page model.
 * @returns Compact counts for the categories status line.
 */
export function getVaultCategoryTreeSummary(
  categories: VaultCategoryTreeNode[]
): VaultCategoryTreeSummary {
  let total = 0;
  let topLevel = 0;
  let child = 0;

  function walk(nodes: VaultCategoryTreeNode[]) {
    for (const node of nodes) {
      total += 1;

      if (node.depth === 0) {
        topLevel += 1;
      } else {
        child += 1;
      }

      walk(node.children);
    }
  }

  walk(categories);

  return {
    total,
    topLevel,
    child,
  };
}

/**
 * Filters the category tree by query and visible hierarchy level.
 *
 * Query filtering keeps parent rows when matching child categories still need
 * visible context, while the dedicated level filter can collapse the result
 * down to top-level groups or child-focused management rows.
 *
 * @param categories Full category tree from the database.
 * @param filters Search text plus hierarchy-level filter.
 * @returns Pruned tree that still preserves the visible parent-child context.
 */
export function filterVaultCategoryTree(
  categories: VaultCategoryTreeNode[],
  filters: {
    query: string;
    level: VaultCategoryTreeLevelFilter;
  }
): VaultCategoryTreeNode[] {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase('de');

  if (filters.level === 'top-level') {
    return categories
      .filter((category) =>
        matchesVaultCategoryQuery(category, normalizedQuery)
      )
      .map((category) => ({
        ...category,
        children: [],
      }));
  }

  if (filters.level === 'children') {
    return categories.flatMap((category) => {
      const matchingChildren = category.children.filter((child) =>
        matchesVaultCategoryQuery(child, normalizedQuery)
      );

      if (matchingChildren.length === 0) {
        return [];
      }

      return [
        {
          ...category,
          children: matchingChildren,
        },
      ];
    });
  }

  return categories.flatMap((category) => {
    const filteredChildren = filterVaultCategoryTree(
      category.children,
      filters
    );
    const matchesQuery = matchesVaultCategoryQuery(category, normalizedQuery);

    if (!matchesQuery && filteredChildren.length === 0) {
      return [];
    }

    return [
      {
        ...category,
        children: filteredChildren,
      },
    ];
  });
}

/**
 * Checks whether one category row matches the current text search.
 *
 * @param category Current category row or node.
 * @param normalizedQuery Lower-cased query string from the toolbar.
 * @returns `true` when the name or description matches the search input.
 */
function matchesVaultCategoryQuery(
  category: Pick<VaultCategoryTreeNode, 'name' | 'description'>,
  normalizedQuery: string
) {
  if (!normalizedQuery) {
    return true;
  }

  return [category.name, category.description].some((value) =>
    value.toLocaleLowerCase('de').includes(normalizedQuery)
  );
}
