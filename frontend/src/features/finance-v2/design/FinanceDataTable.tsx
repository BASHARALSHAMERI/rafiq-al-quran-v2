/**
 * FinanceDataTable — finance-scoped wrapper over the shared DataTable.
 */
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
  type DataTableProps
} from "../../../components/ui/DataTable";

export type FinanceTableDensity = "comfortable" | "dense";

/**
 * We define our own Column type for Finance that prefers 'render' but allows 'cell'
 * for backward compatibility with pages already using the shared DataTableColumn shape.
 */
export type FinanceDataTableColumn<TRow> = {
  header: ReactNode;
  render?: (row: TRow, index: number) => ReactNode;
  cell?: (row: TRow, index: number) => ReactNode; // Compat with standard DataTableColumn
  id?: string;
  width?: string | number;
  align?: "start" | "center" | "end";
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  isActions?: boolean;
};

export interface FinanceDataTableProps<TRow>
  extends Omit<DataTableProps<TRow>, "dense" | "columns"> {
  density?: FinanceTableDensity;
  columns: Array<FinanceDataTableColumn<TRow>>;
}

export interface FinanceTableFooterProps {
  ar: boolean;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setPage: (page: number | ((previous: number) => number)) => void;
  totalFilteredCount: number;
  pages: number;
  pageSizeOptions?: number[];
}

export function FinanceDataTable<TRow>({
  density = "comfortable",
  stickyHeader = true,
  columns,
  className = "",
  rowClassName,
  ...rest
}: FinanceDataTableProps<TRow>) {
  // Map our Finance columns to the underlying DataTable columns
  const mappedColumns: DataTableColumn<TRow>[] = columns.map((col, idx) => {
    // Determine the cell renderer: prefer 'render', fallback to 'cell'
    const cellRenderer = col.render ?? col.cell;
    
    if (!cellRenderer) {
      console.warn(`FinanceDataTable: Column at index ${idx} ("${col.header}") is missing both 'render' and 'cell' functions.`);
    }

    return {
      id: col.id || `col-${idx}`,
      header: col.header,
      cell: cellRenderer || (() => null),
      width: col.width,
      align: col.align,
      className: col.className,
      headerClassName: col.headerClassName,
      cellClassName: col.cellClassName,
      isActions: col.isActions
    };
  });

  return (
    <DataTable<TRow> 
      {...rest} 
      columns={mappedColumns}
      className={`fin-premium-table ${className}`.trim()}
      rowClassName={(row, index) => {
        const custom = rowClassName?.(row, index);
        return custom ? `fin-floating-row ${custom}` : "fin-floating-row";
      }}
      stickyHeader={stickyHeader} 
      dense={density === "dense"} 
    />
  );
}

/**
 * Helper to define a right-aligned "actions" column for finance tables.
 */
export function financeActionsColumn<TRow>(
  header: ReactNode,
  render: (row: TRow, index: number) => ReactNode,
  id: string = "actions"
): FinanceDataTableColumn<TRow> {
  return {
    id,
    header,
    render,
    isActions: true,
    align: "end"
  };
}

export function FinanceTableFooter({
  ar,
  pageSize,
  setPageSize,
  currentPage,
  setPage,
  totalFilteredCount,
  pages,
  pageSizeOptions = [5, 10, 20, 50]
}: FinanceTableFooterProps) {
  if (totalFilteredCount === 0) return null;

  const safePages = Math.max(1, pages);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), safePages);
  const from = Math.min(totalFilteredCount, (safeCurrentPage - 1) * pageSize + 1);
  const to = Math.min(totalFilteredCount, safeCurrentPage * pageSize);

  return (
    <div className="ctr-footer">
      <div className="ctr-page-size">
        <span>{ar ? "الصفوف:" : "Rows:"}</span>
        <select
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(1);
          }}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="ctr-page-info">
        {ar ? (
          <>
            عرض {from} - {to} من {totalFilteredCount}
          </>
        ) : (
          <>
            Showing {from} - {to} of {totalFilteredCount}
          </>
        )}
      </div>

      <div className="ctr-page-controls">
        <button
          type="button"
          className="ctr-page-btn"
          disabled={safeCurrentPage === 1}
          onClick={() => setPage((previous) => Math.max(1, previous - 1))}
        >
          {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {Array.from({ length: Math.min(5, safePages) }, (_, index) => {
          let page = safeCurrentPage;
          if (safeCurrentPage <= 3) page = index + 1;
          else if (safeCurrentPage >= safePages - 2) page = safePages - 4 + index;
          else page = safeCurrentPage - 2 + index;

          if (page <= 0 || page > safePages) return null;

          return (
            <button
              key={page}
              type="button"
              className={`ctr-page-btn ${safeCurrentPage === page ? "active" : ""}`}
              onClick={() => setPage(page)}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          className="ctr-page-btn"
          disabled={safeCurrentPage === safePages}
          onClick={() => setPage((previous) => Math.min(safePages, previous + 1))}
        >
          {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}
