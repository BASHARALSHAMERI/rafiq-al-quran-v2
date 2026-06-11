import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import { useI18n } from "../../../app/i18n";
import ReportActions from "./ReportActions";
import ReportFilterBar from "./ReportFilterBar";
import type { ReportDefinition, ReportExportFormat } from "../types";
import type { FilterChangeHandler, FilterValues, FilterOptionsMap } from "./ReportFilterBar";

export type ReportLayoutProps = {
  definition: ReportDefinition;
  filters: FilterValues;
  optionsMap?: FilterOptionsMap;
  onFilterChange: FilterChangeHandler;
  onResetFilters: () => void;
  activeFilterCount: number;
  onRefresh: () => void;
  onBack?: () => void;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  isExporting?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  hasPermission?: boolean;
  children?: ReactNode;
  summary?: ReactNode;
  actions?: ReactNode;
};

const statusLabelAr: Record<string, string> = {
  ready: "جاهز",
  needs_backend: "يحتاج ربط",
  in_progress: "قيد التطوير",
};
const statusLabelEn: Record<string, string> = {
  ready: "Ready",
  needs_backend: "Needs Backend",
  in_progress: "In Progress",
};
const statusVariant: Record<string, "success" | "warning" | "error" | "default"> = {
  ready: "success",
  needs_backend: "warning",
  in_progress: "warning",
};

export function ReportLayout({
  definition,
  filters,
  optionsMap = {},
  onFilterChange,
  onResetFilters,
  activeFilterCount,
  onRefresh,
  onBack,
  onExportPdf,
  onExportExcel,
  onPrint,
  isLoading = false,
  isRefreshing = false,
  isExporting = false,
  error = null,
  isEmpty = false,
  hasPermission = true,
  children,
  summary,
  actions,
}: ReportLayoutProps) {
  const { language } = useI18n();
  const ar = language === "ar";
  const supportedExports = definition.exports as ReportExportFormat[];

  return (
    <div className="fin-premium-container ctr-page-modern p-4" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-5">
        {/* Back link */}
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 self-start no-print"
        >
          <ArrowLeft className={`w-4 h-4 ${ar ? "rotate-180 ml-1" : "mr-1"}`} />
          {ar ? "العودة للتقارير" : "Back to Reports"}
        </button>

        {/* Header */}
        <div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
                    {definition.title}
                  </h1>
                  <Badge variant={statusVariant[definition.status] ?? "default"} size="sm">
                    {ar ? statusLabelAr[definition.status] : statusLabelEn[definition.status]}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {definition.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap no-print">
              {actions}
              <ReportActions
                supportedExports={supportedExports}
                isRefreshing={isRefreshing}
                isExporting={isExporting}
                onRefresh={onRefresh}
                onExportPdf={onExportPdf}
                onExportExcel={onExportExcel}
                onPrint={onPrint}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <ReportFilterBar
          filterDefs={definition.filters}
          values={filters}
          onChange={onFilterChange}
          onReset={onResetFilters}
          activeCount={activeFilterCount}
          optionsMap={optionsMap}
        />

        {/* Summary KPIs */}
        {summary && <div>{summary}</div>}

        {/* Data Source Note */}
        {definition.dataSourceNote && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300">
            {ar ? "ملاحظة:" : "Note:"} {definition.dataSourceNote}
          </div>
        )}

        {/* Permission denied */}
        {!hasPermission && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 text-center border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-300 font-semibold text-lg">
              {ar ? "لا تملك صلاحية عرض هذا التقرير" : "You do not have permission to view this report"}
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && hasPermission && (
          <LoadingState />
        )}

        {/* Error */}
        {error && hasPermission && (
          <ErrorState
            title={ar ? "تعذر تحميل التقرير" : "Failed to load report"}
            onRetry={onRefresh}
          />
        )}

        {/* Empty */}
        {!isLoading && !error && isEmpty && hasPermission && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
              {ar ? "لا توجد بيانات ضمن الفلاتر المحددة" : "No data found for the selected filters"}
            </p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && !isEmpty && hasPermission && children}
      </div>
    </div>
  );
}

export default ReportLayout;
