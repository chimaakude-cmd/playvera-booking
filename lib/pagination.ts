export const DEFAULT_PAGE_SIZE = 10;

export function paginateItems<T>(items: T[], page: number, pageSize = DEFAULT_PAGE_SIZE) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    startIndex: totalItems === 0 ? 0 : start + 1,
    endIndex: Math.min(start + pageSize, totalItems),
  };
}
