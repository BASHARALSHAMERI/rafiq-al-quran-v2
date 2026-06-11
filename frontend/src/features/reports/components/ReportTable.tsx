import type { ReactNode } from "react";
import DataTable, { type DataTableColumn } from "../../../components/ui/DataTable";
import Badge from "../../../components/ui/Badge";
import { useI18n } from "../../../app/i18n";

export type { DataTableColumn };

export type ReportTableProps<TRow> = {
  columns: DataTableColumn<TRow>[];
  rows: TRow[];
  rowKey: keyof TRow | ((row: TRow, index: number) => string | number);
  isLoading?: boolean;
  emptyState?: ReactNode;
  footer?: ReactNode;
  pagination?: {
    totalItems: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  dense?: boolean;
  className?: string;
};

export function ReportTable<TRow>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  emptyState,
  footer,
  pagination,
  dense = true,
  className = "",
}: ReportTableProps<TRow>) {
  const { language } = useI18n();
  const ar = language === "ar";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={rowKey}
        dense={dense}
        loading={isLoading}
        emptyState={emptyState}
        footer={footer}
        pagination={
          pagination
            ? {
                ...pagination,
                labels: {
                  previous: ar ? "السابق" : "Previous",
                  next: ar ? "التالي" : "Next",
                  first: ar ? "الأول" : "First",
                  last: ar ? "الأخير" : "Last",
                  pageSize: ar ? "عدد الصفوف" : "Page Size",
                  rows: ar ? "صف" : "rows",
                  page: ar ? "صفحة" : "Page",
                  summary: ({ from, to, total }: { from: number; to: number; total: number }) =>
                    ar
                      ? `${from} - ${to} من ${total}`
                      : `Showing ${from} to ${to} of ${total}`,
                },
              }
            : undefined
        }
        className={className}
      />
    </div>
  );
}

export const useReportBadge = (ar: boolean) => ({
  statusBadge: (value: string): "default" | "success" | "warning" | "error" => {
    const upper = value.toUpperCase();
    if (["PAID", "COMPLETED", "PUBLISHED", "PASSED", "PRESENT", "SUCCESS", "APPROVED", "ACTIVE"].includes(upper)) return "success";
    if (["PARTIAL", "PENDING", "LATE", "IN_PROGRESS", "DRAFT"].includes(upper)) return "warning";
    if (["FAILED", "CANCELLED", "ABSENT", "ERROR", "REJECTED", "INACTIVE"].includes(upper)) return "error";
    return "default";
  },
  renderBadge: (value: string) => {
    const variant = (() => {
      const upper = value.toUpperCase();
      if (["PAID", "COMPLETED", "PUBLISHED", "PASSED", "PRESENT", "SUCCESS", "APPROVED", "ACTIVE"].includes(upper)) return "success";
      if (["PARTIAL", "PENDING", "LATE", "IN_PROGRESS", "DRAFT"].includes(upper)) return "warning";
      if (["FAILED", "CANCELLED", "ABSENT", "ERROR", "REJECTED", "INACTIVE"].includes(upper)) return "error";
      return "default";
    })();
    return <Badge variant={variant}>{value}</Badge>;
  },
  renderCurrency: (val: number) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val),
  renderNumber: (val: number) =>
    new Intl.NumberFormat("en-US").format(val),
  renderDate: (val: string) => {
    if (!val) return "-";
    try {
      return new Date(val).toLocaleDateString(ar ? "ar-SA" : "en-US");
    } catch {
      return val;
    }
  },
  renderBoolean: (val: boolean) =>
    val ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No"),
});

export default ReportTable;
