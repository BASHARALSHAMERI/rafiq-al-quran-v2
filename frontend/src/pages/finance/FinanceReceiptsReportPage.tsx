import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, FileText, Search, Wallet2 } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import type { DataTableColumn } from "../../components/ui/DataTable";
import { useI18n } from "../../app/i18n";
import { useAuthStore } from "../../features/auth/auth.store";
import { useCentersQuery, useOrgBrandingQuery } from "../../features/org/org.hooks";
import { canReadCenters } from "../../features/org/org.permissions";
import { useFinanceV2AccountsQuery, useFinanceV2ReceiptReportQuery } from "../../features/finance-v2/finance-v2.hooks";
import { ReportLayout } from "../../features/reports/components/ReportLayout";
import { ReportTable } from "../../features/reports/components/ReportTable";
import { ReportsSummaryCards } from "../../features/reports/components/ReportsSummaryCards";
import { useReportUrlFilters } from "../../features/reports/reports.hooks";
import { REPORT_CATALOG } from "../../features/reports/reportCatalog";
import {
  exportFinanceCsv,
  printFinanceReport,
  type FinanceReportColumn,
} from "../../features/accounting/printAccounting";
import type { ReceiptReportSummary, ReceiptReportVoucher } from "../../features/finance-v2/types";

const nowDate = new Date();
const defaultTo = nowDate.toISOString().slice(0, 10);
const defaultFrom = new Date(nowDate.getFullYear(), 0, 1).toISOString().slice(0, 10);
const RECEIPTS_DEF = REPORT_CATALOG.find((report) => report.id === "receipts_report")!;

const statusLabelAr: Record<string, string> = {
  DRAFT: "مسودة",
  SUBMITTED: "مقدم",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  POSTED: "مرحل",
  VOID_REQUESTED: "طلب إلغاء",
  VOIDED: "ملغي",
  CANCELLED: "ملغي",
};
const statusLabelEn: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  POSTED: "Posted",
  VOID_REQUESTED: "Void Requested",
  VOIDED: "Voided",
  CANCELLED: "Cancelled",
};
const statusColor: Record<string, "warning" | "success" | "error" | "default"> = {
  DRAFT: "default",
  SUBMITTED: "warning",
  APPROVED: "success",
  REJECTED: "error",
  POSTED: "success",
  VOID_REQUESTED: "warning",
  VOIDED: "error",
  CANCELLED: "error",
};
const sourceLabelAr: Record<string, string> = {
  MANUAL: "يدوي",
  PAYMENT: "فاتورة طالب",
  PAYROLL_ITEM: "مرتب",
  REWARD_ITEM: "مكافأة",
  FUND_TRANSFER: "تحويل",
  EXPENSE: "مصروف",
};
const sourceLabelEn: Record<string, string> = {
  MANUAL: "Manual",
  PAYMENT: "Invoice",
  PAYROLL_ITEM: "Payroll",
  REWARD_ITEM: "Reward",
  FUND_TRANSFER: "Transfer",
  EXPENSE: "Expense",
};
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
const formatDate = (value: string | null | undefined, locale: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, { year: "numeric", month: "2-digit", day: "2-digit" });
};

export default function FinanceReceiptsReportPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const locale = ar ? "ar-SA-u-nu-latn" : "en-US";
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const canLoadCenters = canReadCenters(user?.role);
  const brandingQ = useOrgBrandingQuery();
  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const { values, setFilter, resetFilters, activeCount } = useReportUrlFilters(RECEIPTS_DEF.filters);

  const from = (values.fromDate as string) || defaultFrom;
  const to = (values.toDate as string) || defaultTo;
  const centerId = values.centerId ? Number(values.centerId) : undefined;
  const accountId = values.accountId ? Number(values.accountId) : undefined;
  const status = values.status ? String(values.status) : "";
  const sourceType = values.sourceType ? String(values.sourceType) : "";
  const method = values.paymentMethod ? String(values.paymentMethod) : "";
  const search = values.search ? String(values.search) : "";

  const accountsQ = useFinanceV2AccountsQuery(centerId);
  const reportQ = useFinanceV2ReceiptReportQuery({
    dateFrom: from,
    dateTo: to,
    centerId,
    accountId,
    status: (status || undefined) as any,
    sourceType: sourceType || undefined,
    paymentMethod: (method || undefined) as any,
    search: search || undefined,
  });

  const summary = reportQ.data?.summary as ReceiptReportSummary | undefined;
  const rows = useMemo(() => reportQ.data?.rows ?? [], [reportQ.data]);
  const centerOptions = canLoadCenters && centersQ.data?.items
    ? centersQ.data.items.map((center: { id: number; name: string }) => ({ value: center.id, label: center.name }))
    : [];
  const accountOptions = accountsQ.data?.map((account) => ({
    value: account.id,
    label: account.accountingAccount?.name ?? account.accountType,
  })) ?? [];
  const optionsMap = {
    centerId: centerOptions,
    accountId: accountOptions,
    status: [
      { value: "DRAFT", label: ar ? "مسودة" : "Draft" },
      { value: "SUBMITTED", label: ar ? "مقدم" : "Submitted" },
      { value: "APPROVED", label: ar ? "معتمد" : "Approved" },
      { value: "REJECTED", label: ar ? "مرفوض" : "Rejected" },
      { value: "POSTED", label: ar ? "مرحل" : "Posted" },
      { value: "VOIDED", label: ar ? "ملغي" : "Voided" },
    ],
    sourceType: [
      { value: "MANUAL", label: ar ? "يدوي" : "Manual" },
      { value: "PAYMENT", label: ar ? "فاتورة طالب" : "Invoice" },
      { value: "FUND_TRANSFER", label: ar ? "تحويل" : "Transfer" },
    ],
    paymentMethod: [
      { value: "CASH", label: ar ? "نقد" : "Cash" },
      { value: "TRANSFER", label: ar ? "حوالة" : "Transfer" },
    ],
  };

  const resolveStatus = (value: string) => ar ? (statusLabelAr[value] ?? value) : (statusLabelEn[value] ?? value);
  const resolveSource = (value: string) => ar ? (sourceLabelAr[value] ?? value) : (sourceLabelEn[value] ?? value);
  const resolvePayerName = (row: ReceiptReportVoucher) =>
    row.donation?.donor?.name ??
    row.payment?.invoice?.student?.fullName ??
    row.externalTransferRef ??
    "-";

  const columns = useMemo<DataTableColumn<ReceiptReportVoucher>[]>(() => [
    {
      id: "index",
      header: ar ? "م" : "#",
      width: 42,
      align: "center",
      headerClassName: "text-center",
      cell: (_, index) => <span className="text-gray-400 text-xs font-bold tabular-nums">{index + 1}</span>,
    },
    {
      id: "voucherNo",
      header: ar ? "رقم السند" : "Voucher#",
      width: 115,
      cell: (row) => <span className="font-mono text-xs font-semibold text-gray-700">{row.voucherNo}</span>,
    },
    {
      id: "date",
      header: ar ? "التاريخ" : "Date",
      width: 105,
      cell: (row) => <span className="text-xs text-gray-500" dir="ltr">{formatDate(row.voucherDate ?? row.createdAt, locale)}</span>,
    },
    {
      id: "sourceType",
      header: ar ? "المصدر" : "Source",
      width: 110,
      cell: (row) => <span className="text-xs text-gray-600">{resolveSource(row.sourceType)}</span>,
    },
    {
      id: "payer",
      header: ar ? "الدافع" : "Payer",
      cell: (row) => <span className="text-xs text-gray-700">{resolvePayerName(row)}</span>,
    },
    {
      id: "account",
      header: ar ? "الحساب" : "Account",
      width: 140,
      cell: (row) => <span className="text-xs text-gray-600">{row.account?.accountingAccount?.name ?? "-"}</span>,
    },
    {
      id: "center",
      header: ar ? "المركز" : "Center",
      width: 100,
      cell: (row) => row.center?.name ?? (ar ? "عام" : "General"),
    },
    {
      id: "amount",
      header: ar ? "المبلغ" : "Amount",
      width: 120,
      align: "end",
      headerClassName: "text-end",
      cell: (row) => (
        <span className="font-semibold text-gray-800 tabular-nums text-xs" dir="ltr">
          {formatCurrency(Number(row.amount))}
        </span>
      ),
    },
    {
      id: "status",
      header: ar ? "الحالة" : "Status",
      width: 90,
      align: "center",
      headerClassName: "text-center",
      cell: (row) => <Badge variant={statusColor[row.status] ?? "default"}>{resolveStatus(row.status)}</Badge>,
    },
    {
      id: "createdBy",
      header: ar ? "المنشئ" : "Created By",
      width: 120,
      cell: (row) => <span className="text-xs text-gray-500">{row.createdBy?.fullName ?? "-"}</span>,
    },
  ], [ar, locale]);

  const printColumns: FinanceReportColumn<ReceiptReportVoucher>[] = [
    { label: ar ? "التاريخ" : "Date", render: (row) => formatDate(row.voucherDate ?? row.createdAt, locale) },
    { label: ar ? "رقم السند" : "Voucher#", render: (row) => row.voucherNo },
    { label: ar ? "المصدر" : "Source", render: (row) => resolveSource(row.sourceType) },
    { label: ar ? "الدافع" : "Payer", render: (row) => resolvePayerName(row) },
    { label: ar ? "الحساب" : "Account", render: (row) => row.account?.accountingAccount?.name ?? row.account?.accountType ?? "-" },
    { label: ar ? "المركز" : "Center", render: (row) => row.center?.name ?? (ar ? "عام" : "General") },
    { label: ar ? "المبلغ" : "Amount", render: (row) => formatCurrency(Number(row.amount)), align: "left" },
    { label: ar ? "الحالة" : "Status", render: (row) => resolveStatus(row.status), align: "center" },
    { label: ar ? "المنشئ" : "Created By", render: (row) => row.createdBy?.fullName ?? "-" },
  ];

  const handlePrint = useCallback(() => {
    printFinanceReport<ReceiptReportVoucher>({
      title: ar ? "تقرير الإيصالات وسندات القبض" : "Receipts & Revenue Vouchers Report",
      subtitle: ar ? "جميع سندات القبض والإيصالات الواردة للجمعية" : "All receipts and revenue vouchers",
      periodLabel: `${ar ? "الفترة" : "Period"}: ${from} - ${to}`,
      orientation: "landscape",
      ar,
      logoUrl: brandingQ.data?.logoUrl || undefined,
      orgName: brandingQ.data?.name || undefined,
      kpis: summary ? [
        { label: ar ? "إجمالي المقبوضات" : "Total Receipts", value: formatCurrency(summary.totalAmount), color: "#2D9B7A" },
        { label: ar ? "عدد السندات" : "Count", value: summary.totalCount, color: "#2563EB" },
        { label: ar ? "المرحل" : "Posted", value: formatCurrency(summary.postedAmount), color: "#2D9B7A" },
        { label: ar ? "الملغية" : "Cancelled", value: summary.cancelledCount, color: "#E85858" },
      ] : [],
      rows,
      columns: printColumns,
    });
  }, [ar, brandingQ.data, from, printColumns, rows, summary, to]);

  const handleExportExcel = useCallback(() => {
    exportFinanceCsv<ReceiptReportVoucher>({
      filename: `receipts-report-${from}-${to}.csv`,
      rows,
      columns: [
        { label: ar ? "رقم" : "ID", render: (row) => row.id },
        { label: ar ? "رقم السند" : "Voucher#", render: (row) => row.voucherNo },
        { label: ar ? "التاريخ" : "Date", render: (row) => row.voucherDate ?? row.createdAt },
        { label: ar ? "المصدر" : "Source", render: (row) => resolveSource(row.sourceType) },
        { label: ar ? "التصنيف" : "Category", render: (row) => row.accountingCategory ?? "" },
        { label: ar ? "الدافع" : "Payer", render: (row) => resolvePayerName(row) },
        { label: ar ? "الحساب" : "Account", render: (row) => row.account?.accountingAccount?.name ?? row.account?.accountType ?? "" },
        { label: ar ? "المركز" : "Center", render: (row) => row.center?.name ?? "" },
        { label: ar ? "طريقة الدفع" : "Method", render: (row) => row.paymentMethod ?? "" },
        { label: ar ? "المبلغ" : "Amount", render: (row) => Number(row.amount) },
        { label: ar ? "العملة" : "Currency", render: (row) => row.originalCurrencyCode ?? "YER" },
        { label: ar ? "الحالة" : "Status", render: (row) => row.status },
        { label: ar ? "المنشئ" : "Created By", render: (row) => row.createdBy?.fullName ?? "" },
        { label: ar ? "تاريخ الإنشاء" : "Created At", render: (row) => row.createdAt },
        { label: ar ? "البيان" : "Notes", render: (row) => row.notes ?? "" },
      ],
    });
  }, [ar, from, rows, to]);

  return (
    <ReportLayout
      definition={RECEIPTS_DEF}
      filters={{ ...values, fromDate: values.fromDate ?? from, toDate: values.toDate ?? to }}
      optionsMap={optionsMap}
      onFilterChange={setFilter}
      onResetFilters={resetFilters}
      activeFilterCount={activeCount}
      onRefresh={() => void reportQ.refetch()}
      onBack={() => navigate("/reports")}
      onPrint={handlePrint}
      onExportPdf={handlePrint}
      onExportExcel={handleExportExcel}
      isLoading={reportQ.isLoading}
      isRefreshing={reportQ.isFetching}
      error={reportQ.error as Error | null}
      isEmpty={!reportQ.isLoading && !reportQ.isError && rows.length === 0}
      summary={summary ? (
        <ReportsSummaryCards
          cards={[
            { label: ar ? "إجمالي المقبوضات" : "Total Receipts", value: formatCurrency(summary.totalAmount), icon: Wallet2, cls: "emerald" },
            { label: ar ? "عدد السندات" : "Count", value: summary.totalCount, icon: FileText, cls: "brand" },
            { label: ar ? "المرحل" : "Posted", value: `${formatCurrency(summary.postedAmount)} (${summary.postedCount})`, icon: Wallet2, cls: "emerald" },
            { label: ar ? "آخر سند" : "Last Receipt", value: formatDate(summary.lastReceiptDate, locale), icon: CalendarDays, cls: "amber" },
          ]}
        />
      ) : null}
    >
      <ReportTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        dense
        emptyState={
          <div className="rcc-empty !py-16">
            <div className="rcc-empty__ico !w-16 !h-16 !bg-gray-50 !text-gray-300"><Search size={32} /></div>
            <p className="rcc-empty__title !text-xl">{ar ? "لا توجد سندات قبض مطابقة" : "No matching receipts"}</p>
            <p className="rcc-empty__desc">{ar ? "حاول تغيير نطاق التاريخ أو الفلاتر." : "Try adjusting the date range or filters."}</p>
          </div>
        }
      />
    </ReportLayout>
  );
}
