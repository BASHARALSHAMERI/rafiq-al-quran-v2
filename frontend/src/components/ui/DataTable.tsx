import type { ReactNode } from "react";
import { useI18n } from "../../app/i18n";
import { commonFeedback, text } from "../../shared/ui/feedback";
import EmptyState from "./EmptyState";
import Pagination, { type PaginationProps } from "./Pagination";
import { TableSkeleton } from "./Skeleton";

export type DataTableColumn<TRow> = {
  id: string;
  header: ReactNode;
  cell: (row: TRow, index: number) => ReactNode;
  width?: string | number;
  align?: "start" | "center" | "end";
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  isActions?: boolean;
};

export interface DataTableProps<TRow> {
  columns: Array<DataTableColumn<TRow>>;
  rows: TRow[];
  rowKey: keyof TRow | ((row: TRow, index: number) => string | number);
  caption?: string;
  className?: string;
  dense?: boolean;
  stickyHeader?: boolean;
  loading?: boolean;
  loadingState?: ReactNode;
  emptyState?: ReactNode;
  pagination?: PaginationProps;
  rowClassName?: (row: TRow, index: number) => string | undefined;
}

const resolveRowKey = <TRow,>(
  rowKey: DataTableProps<TRow>["rowKey"],
  row: TRow,
  index: number
) => {
  if (typeof rowKey === "function") {
    return rowKey(row, index);
  }

  return String(row[rowKey] ?? index);
};

export function DataTable<TRow>({
  columns,
  rows,
  rowKey,
  caption,
  className = "",
  dense = false,
  stickyHeader = true,
  loading = false,
  loadingState,
  emptyState,
  pagination,
  rowClassName
}: DataTableProps<TRow>) {
  const { language } = useI18n();
  const ar = language === "ar";

  return (
    <section className={`app-data-table ${className}`.trim()}>
      <div className="app-data-table__surface">
        {loading ? (
          <div className="app-data-table__slot">
            {loadingState ?? <TableSkeleton columns={columns.length || 4} rows={5} />}
          </div>
        ) : rows.length === 0 ? (
          <div className="app-data-table__slot">
            {emptyState ?? (
              <EmptyState
                title={text(ar, commonFeedback.noResultsTitle)}
                description={text(ar, commonFeedback.noResultsDescription)}
              />
            )}
          </div>
        ) : (
          <div className="app-data-table__scroll">
            <table className={`app-data-table__table ${dense ? "app-data-table__table--dense" : ""}`}>
              {caption ? <caption className="sr-only">{caption}</caption> : null}
              <thead className={stickyHeader ? "app-data-table__head app-data-table__head--sticky" : "app-data-table__head"}>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.id}
                      scope="col"
                      className={[
                        "app-data-table__header",
                        column.isActions ? "app-data-table__header--actions" : "",
                        column.align ? `app-data-table__header--${column.align}` : "",
                        column.headerClassName ?? ""
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={column.width ? { width: column.width } : undefined}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={resolveRowKey(rowKey, row, index)}
                    className={rowClassName?.(row, index)}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        data-label={typeof column.header === "string" ? column.header : undefined}
                        className={[
                          "app-data-table__cell",
                          column.isActions ? "app-data-table__cell--actions" : "",
                          column.align ? `app-data-table__cell--${column.align}` : "",
                          column.className ?? "",
                          column.cellClassName ?? ""
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {column.cell(row, index)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination ? (
        <div className="app-data-table__pagination">
          <Pagination {...pagination} />
        </div>
      ) : null}
    </section>
  );
}

export default DataTable;
