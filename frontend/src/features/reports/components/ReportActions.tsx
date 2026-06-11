import { Download, FileDown, Printer, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useI18n } from "../../../app/i18n";
import type { ReportExportFormat } from "../types";

export type ReportActionsProps = {
  supportedExports: ReportExportFormat[];
  isRefreshing?: boolean;
  isExporting?: boolean;
  onRefresh: () => void;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
};

export function ReportActions({
  supportedExports,
  isRefreshing = false,
  isExporting = false,
  onRefresh,
  onExportPdf,
  onExportExcel,
  onPrint,
}: ReportActionsProps) {
  const { language } = useI18n();
  const ar = language === "ar";

  return (
    <div className="flex items-center gap-2 flex-wrap no-print">
      <Button
        variant="secondary"
        size="sm"
        className="glass-btn"
        leftIcon={<RefreshCw className={isRefreshing ? "animate-spin" : ""} />}
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        {ar ? "تحديث" : "Refresh"}
      </Button>

      {supportedExports.includes('excel') && onExportExcel && (
        <Button
          variant="secondary"
          size="sm"
          className="glass-btn"
          leftIcon={<FileDown className="text-emerald-600" />}
          onClick={onExportExcel}
          disabled={isExporting}
        >
          {ar ? "تصدير Excel" : "Export Excel"}
        </Button>
      )}

      {supportedExports.includes('pdf') && onExportPdf && (
        <Button
          variant="secondary"
          size="sm"
          className="glass-btn"
          leftIcon={<Download className="text-rose-600" />}
          onClick={onExportPdf}
          disabled={isExporting}
        >
          {ar ? "تصدير PDF" : "Export PDF"}
        </Button>
      )}

      {supportedExports.includes('print') && onPrint && (
        <Button
          variant="secondary"
          size="sm"
          className="glass-btn"
          leftIcon={<Printer className="text-indigo-600" />}
          onClick={onPrint}
        >
          {ar ? "طباعة" : "Print"}
        </Button>
      )}
    </div>
  );
}

export default ReportActions;
