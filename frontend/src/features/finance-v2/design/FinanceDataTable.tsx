/**
 * FinanceDataTable — finance-scoped wrapper over the shared DataTable.
 */
import type { ReactNode } from "react";
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
  isActions?: boolean;
};

export interface FinanceDataTableProps<TRow>
  extends Omit<DataTableProps<TRow>, "dense" | "columns"> {
  density?: FinanceTableDensity;
  columns: Array<FinanceDataTableColumn<TRow>>;
}

export function FinanceDataTable<TRow>({
  density = "comfortable",
  stickyHeader = true,
  columns,
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
      isActions: col.isActions
    };
  });

  return (
    <DataTable<TRow> 
      {...rest} 
      columns={mappedColumns}
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
