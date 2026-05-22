import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";

type PaginationLabels = {
  previous: string;
  next: string;
  first: string;
  last: string;
  pageSize: string;
  rows: string;
  page: string;
  summary: (args: { from: number; to: number; total: number }) => string;
};

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  rtl?: boolean;
  className?: string;
  disabled?: boolean;
  labels?: Partial<PaginationLabels>;
}

const DEFAULT_LABELS: PaginationLabels = {
  previous: "Previous",
  next: "Next",
  first: "First",
  last: "Last",
  pageSize: "Page size",
  rows: "rows",
  page: "Page",
  summary: ({ from, to, total }) => `Showing ${from}-${to} of ${total}`
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  rtl,
  className = "",
  disabled = false,
  labels
}: PaginationProps) {
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };
  const resolvedRtl =
    rtl ?? (typeof document !== "undefined" ? document.documentElement.dir === "rtl" : false);
  const safeTotalPages = Math.max(totalPages, 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), safeTotalPages);
  const pageSizeValue = pageSize ?? pageSizeOptions[0] ?? 10;
  const from = totalItems && totalItems > 0 ? (safeCurrentPage - 1) * pageSizeValue + 1 : 0;
  const to = totalItems ? Math.min(safeCurrentPage * pageSizeValue, totalItems) : 0;
  const canGoPrevious = !disabled && safeCurrentPage > 1;
  const canGoNext = !disabled && safeCurrentPage < safeTotalPages;

  return (
    <div className={`app-pagination ${className}`.trim()} dir={resolvedRtl ? "rtl" : "ltr"}>
      <div className="app-pagination__summary">
        {typeof totalItems === "number" ? (
          <span>{mergedLabels.summary({ from, to, total: totalItems })}</span>
        ) : (
          <span>
            {mergedLabels.page} {safeCurrentPage} / {safeTotalPages}
          </span>
        )}
      </div>

      <div className="app-pagination__controls">
        {onPageSizeChange ? (
          <label className="app-pagination__page-size">
            <span className="app-pagination__page-size-label">{mergedLabels.pageSize}</span>
            <select
              className="app-pagination__page-size-select"
              value={pageSizeValue}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              disabled={disabled}
              aria-label={mergedLabels.pageSize}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option} {mergedLabels.rows}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="app-pagination__nav" aria-label="Pagination Navigation">
          <button
            type="button"
            className="app-pagination__button"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious}
            aria-label={mergedLabels.first}
            title={mergedLabels.first}
          >
            <ChevronFirst className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="app-pagination__button"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={!canGoPrevious}
            aria-label={mergedLabels.previous}
            title={mergedLabels.previous}
          >
            {resolvedRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <span className="app-pagination__current">
            {safeCurrentPage} / {safeTotalPages}
          </span>
          <button
            type="button"
            className="app-pagination__button"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={!canGoNext}
            aria-label={mergedLabels.next}
            title={mergedLabels.next}
          >
            {resolvedRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <button
            type="button"
            className="app-pagination__button"
            onClick={() => onPageChange(safeTotalPages)}
            disabled={!canGoNext}
            aria-label={mergedLabels.last}
            title={mergedLabels.last}
          >
            <ChevronLast className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Pagination;
