import { useEffect, useMemo, useState } from "react";
import type { PaginationProps } from "../../components/ui/Pagination";

type ClientPaginationOptions = {
  initialPageSize?: number;
  pageSizeOptions?: number[];
  resetKey?: unknown;
};

export const buildPaginationLabels = (ar: boolean): PaginationProps["labels"] => ({
  previous: ar ? "السابق" : "Previous",
  next: ar ? "التالي" : "Next",
  first: ar ? "الأول" : "First",
  last: ar ? "الأخير" : "Last",
  pageSize: ar ? "حجم الصفحة" : "Page size",
  rows: ar ? "صفوف" : "rows",
  page: ar ? "الصفحة" : "Page",
  summary: ({ from, to, total }) =>
    ar ? `عرض ${from}-${to} من ${total}` : `Showing ${from}-${to} of ${total}`
});

export function useClientPagination<T>(
  rows: T[],
  { initialPageSize = 10, pageSizeOptions = [10, 20, 50], resetKey }: ClientPaginationOptions = {}
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (resetKey !== undefined) {
      setCurrentPage(1);
    }
  }, [resetKey]);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [currentPage, pageSize, rows]);

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

  const getPaginationProps = (
    overrides: Partial<PaginationProps> = {}
  ): PaginationProps => ({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    pageSizeOptions,
    onPageChange: setCurrentPage,
    onPageSizeChange: handlePageSizeChange,
    ...overrides
  });

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    pagedRows,
    setCurrentPage,
    setPageSize: handlePageSizeChange,
    getPaginationProps
  };
}

export default useClientPagination;
