export type PaginationPageItem = {
  type: 'page';
  key: `page-${number}`;
  page: number;
  isCurrent: boolean;
};

export type PaginationEllipsisItem = {
  type: 'ellipsis';
  key: 'ellipsis-start' | 'ellipsis-end';
};

export type PaginationItem = PaginationPageItem | PaginationEllipsisItem;

type GetPaginationItemsOptions = {
  page: number;
  totalPages: number;
  siblingCount?: number;
  boundaryCount?: number;
};

function createRange(start: number, end: number) {
  if (end < start) {
    return [];
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

/**
 * Builds a compact pagination model with boundary pages, sibling pages, and
 * optional ellipsis markers around the current page.
 */
export function getPaginationItems({
  page,
  totalPages,
  siblingCount = 1,
  boundaryCount = 1,
}: GetPaginationItemsOptions): PaginationItem[] {
  if (totalPages < 1) {
    return [];
  }

  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const safeSiblingCount = Math.max(siblingCount, 0);
  const safeBoundaryCount = Math.max(boundaryCount, 0);

  const startPages = createRange(1, Math.min(safeBoundaryCount, totalPages));
  const endPages = createRange(
    Math.max(totalPages - safeBoundaryCount + 1, safeBoundaryCount + 1),
    totalPages
  );

  const siblingsStart = Math.max(
    Math.min(
      currentPage - safeSiblingCount,
      totalPages - safeBoundaryCount - safeSiblingCount * 2 - 1
    ),
    safeBoundaryCount + 2
  );

  const siblingsEnd = Math.min(
    Math.max(
      currentPage + safeSiblingCount,
      safeBoundaryCount + safeSiblingCount * 2 + 2
    ),
    endPages.length > 0 ? (endPages[0] ?? totalPages + 1) - 2 : totalPages - 1
  );

  const items: PaginationItem[] = startPages.map((pageNumber) => ({
    type: 'page',
    key: `page-${pageNumber}`,
    page: pageNumber,
    isCurrent: pageNumber === currentPage,
  }));

  if (siblingsStart > safeBoundaryCount + 2) {
    items.push({
      type: 'ellipsis',
      key: 'ellipsis-start',
    });
  } else if (safeBoundaryCount + 1 < totalPages - safeBoundaryCount) {
    items.push({
      type: 'page',
      key: `page-${safeBoundaryCount + 1}`,
      page: safeBoundaryCount + 1,
      isCurrent: safeBoundaryCount + 1 === currentPage,
    });
  }

  for (const pageNumber of createRange(siblingsStart, siblingsEnd)) {
    items.push({
      type: 'page',
      key: `page-${pageNumber}`,
      page: pageNumber,
      isCurrent: pageNumber === currentPage,
    });
  }

  if (siblingsEnd < totalPages - safeBoundaryCount - 1) {
    items.push({
      type: 'ellipsis',
      key: 'ellipsis-end',
    });
  } else if (totalPages - safeBoundaryCount > safeBoundaryCount) {
    items.push({
      type: 'page',
      key: `page-${totalPages - safeBoundaryCount}`,
      page: totalPages - safeBoundaryCount,
      isCurrent: totalPages - safeBoundaryCount === currentPage,
    });
  }

  for (const pageNumber of endPages) {
    if (startPages.includes(pageNumber)) {
      continue;
    }

    items.push({
      type: 'page',
      key: `page-${pageNumber}`,
      page: pageNumber,
      isCurrent: pageNumber === currentPage,
    });
  }

  return items;
}
