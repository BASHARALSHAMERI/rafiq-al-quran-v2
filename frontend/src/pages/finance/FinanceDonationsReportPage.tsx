import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, HandHeart, Search, Wallet2 } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import type { DataTableColumn } from "../../components/ui/DataTable";
import { useI18n } from "../../app/i18n";
import { useAuthStore } from "../../features/auth/auth.store";
import { useCentersQuery, useOrgBrandingQuery } from "../../features/org/org.hooks";
import { canReadCenters } from "../../features/org/org.permissions";
import { useFinanceV2DonationReportQuery, useFinanceV2DonorsQuery } from "../../features/finance-v2/finance-v2.hooks";
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
import type { DonationReportSummary, FinanceDonationV2 } from "../../features/finance-v2/types";

const nowDate = new Date();
const defaultTo = nowDate.toISOString().slice(0, 10);
const defaultFrom = new Date(nowDate.getFullYear(), 0, 1).toISOString().slice(0, 10);
const DONATIONS_DEF = REPORT_CATALOG.find((report) => report.id === "donations")!;

const statusLabelAr: Record<string, string> = {
  PLEDGED: "تعهد",
  RECEIVED: "مستلم",
  CANCELLED: "ملغي",
};
const statusLabelEn: Record<string, string> = {
  PLEDGED: "Pledged",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};
const statusColor: Record<string, "warning" | "success" | "error"> = {
  PLEDGED: "warning",
  RECEIVED: "success",
  CANCELLED: "error",
};
const methodLabelAr: Record<string, string> = {
  CASH: "نقد",
  TRANSFER: "حوالة",
};
const donorTypeLabelAr: Record<string, string> = {
  INDIVIDUAL_DONOR: "فرد",
  CHARITY_FOUNDATION: "مؤسسة خيرية",
  CHARITY_ASSOCIATION: "جمعية خيرية",
  MERCHANT: "تاجر",
  PARENT_DONOR: "ولي أمر",
  GOVERNMENT_ENTITY: "جهة حكومية",
  CORPORATE_SPONSOR: "شركة راعية",
};
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);

export default function FinanceDonationsReportPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const canLoadCenters = canReadCenters(user?.role);
  const brandingQ = useOrgBrandingQuery();
  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const { values, setFilter, resetFilters, activeCount } = useReportUrlFilters(DONATIONS_DEF.filters);

  const from = (values.fromDate as string) || defaultFrom;
  const to = (values.toDate as string) || defaultTo;
  const centerId = values.centerId ? Number(values.centerId) : undefined;
  const donorId = values.donorId ? Number(values.donorId) : undefined;
  const status = values.status ? String(values.status) : "";
  const method = values.paymentMethod ? String(values.paymentMethod) : "";
  const search = values.search ? String(values.search) : "";

  const donorsQ = useFinanceV2DonorsQuery({ centerId });
  const reportQ = useFinanceV2DonationReportQuery({
    dateFrom: from,
    dateTo: to,
    centerId,
    donorId,
    status: (status || undefined) as any,
    paymentMethod: (method || undefined) as any,
    search: search || undefined,
  });

  const summary = reportQ.data?.summary as DonationReportSummary | undefined;
  const rows = useMemo(() => reportQ.data?.rows ?? [], [reportQ.data]);
  const centerOptions = canLoadCenters && centersQ.data?.items
    ? centersQ.data.items.map((center: { id: number; name: string }) => ({ value: center.id, label: center.name }))
    : [];
  const donorOptions = donorsQ.data?.rows?.map((donor) => ({ value: donor.id, label: donor.name })) ?? [];

  const optionsMap = {
    centerId: centerOptions,
    donorId: donorOptions,
    status: [
      { value: "PLEDGED", label: ar ? "تعهد" : "Pledged" },
      { value: "RECEIVED", label: ar ? "مستلم" : "Received" },
      { value: "CANCELLED", label: ar ? "ملغي" : "Cancelled" },
    ],
    paymentMethod: [
      { value: "CASH", label: ar ? "نقد" : "Cash" },
      { value: "TRANSFER", label: ar ? "حوالة" : "Transfer" },
    ],
  };

  const resolveStatus = (value: string) => ar ? (statusLabelAr[value] ?? value) : (statusLabelEn[value] ?? value);
  const resolveMethod = (value: string) => ar ? (methodLabelAr[value] ?? value) : value;
  const resolveDonorType = (value?: string | null) => value ? (ar ? (donorTypeLabelAr[value] ?? value) : value) : "-";

  const columns = useMemo<DataTableColumn<FinanceDonationV2>[]>(() => [
    {
      id: "index",
      header: ar ? "م" : "#",
      width: 44,
      align: "center",
      headerClassName: "text-center",
      cell: (_, index) => <span className="text-gray-400 text-xs font-bold tabular-nums">{index + 1}</span>,
    },
    {
      id: "voucherNo",
      header: ar ? "رقم السند" : "Voucher#",
      width: 100,
      align: "center",
      headerClassName: "text-center",
      cell: (row) => <span className="font-mono text-xs text-gray-600">{row.voucher?.voucherNo ?? "-"}</span>,
    },
    {
      id: "donationDate",
      header: ar ? "التاريخ" : "Date",
      width: 105,
      cell: (row) => <span className="text-sm">{row.donationDate}</span>,
    },
    {
      id: "donor",
      header: ar ? "الداعم" : "Donor",
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-800">{row.donor?.name ?? "-"}</div>
          <div className="text-xs text-gray-500">{resolveDonorType(row.donor?.donorType)}</div>
        </div>
      ),
    },
    {
      id: "purpose",
      header: ar ? "الغرض" : "Purpose",
      cell: (row) => <span className="text-sm text-gray-600">{row.purpose ?? row.notes ?? "-"}</span>,
    },
    {
      id: "paymentMethod",
      header: ar ? "طريقة الدفع" : "Method",
      width: 100,
      align: "center",
      headerClassName: "text-center",
      cell: (row) => resolveMethod(row.paymentMethod),
    },
    {
      id: "amount",
      header: ar ? "المبلغ" : "Amount",
      width: 130,
      align: "end",
      headerClassName: "text-end",
      cell: (row) => (
        <span className="font-semibold text-emerald-700 tabular-nums" dir="ltr">
          {row.originalAmount != null && row.originalCurrencyCode && row.originalCurrencyCode !== "YER"
            ? `${formatCurrency(Number(row.originalAmount))} ${row.originalCurrencyCode}`
            : `${formatCurrency(Number(row.amount))} YER`}
        </span>
      ),
    },
    {
      id: "status",
      header: ar ? "الحالة" : "Status",
      width: 95,
      align: "center",
      headerClassName: "text-center",
      cell: (row) => <Badge variant={statusColor[row.status] ?? "default"}>{resolveStatus(row.status)}</Badge>,
    },
    {
      id: "center",
      header: ar ? "المركز" : "Center",
      width: 130,
      cell: (row) => row.center?.name ?? (ar ? "عام" : "General"),
    },
  ], [ar]);

  const printColumns: FinanceReportColumn<FinanceDonationV2>[] = [
    { label: ar ? "التاريخ" : "Date", render: (row) => row.donationDate },
    { label: ar ? "رقم السند" : "Voucher#", render: (row) => row.voucher?.voucherNo ?? "-" },
    { label: ar ? "الداعم" : "Donor", render: (row) => row.donor?.name ?? "-" },
    { label: ar ? "نوع الداعم" : "Donor Type", render: (row) => resolveDonorType(row.donor?.donorType) },
    { label: ar ? "الغرض" : "Purpose", render: (row) => row.purpose ?? "-" },
    { label: ar ? "طريقة الدفع" : "Method", render: (row) => resolveMethod(row.paymentMethod) },
    { label: ar ? "المبلغ" : "Amount", render: (row) => formatCurrency(Number(row.amount)), align: "left" },
    { label: ar ? "الحالة" : "Status", render: (row) => resolveStatus(row.status), align: "center" },
    { label: ar ? "المركز" : "Center", render: (row) => row.center?.name ?? (ar ? "عام" : "General") },
  ];

  const handlePrint = useCallback(() => {
    printFinanceReport<FinanceDonationV2>({
      title: ar ? "تقرير التبرعات العامة" : "Donations Report",
      subtitle: ar ? "جميع التبرعات الواردة للجمعية" : "All received donations",
      periodLabel: `${ar ? "الفترة" : "Period"}: ${from} - ${to}`,
      orientation: "landscape",
      ar,
      logoUrl: brandingQ.data?.logoUrl || undefined,
      orgName: brandingQ.data?.name || undefined,
      kpis: summary ? [
        { label: ar ? "إجمالي التبرعات" : "Total Amount", value: formatCurrency(summary.totalAmount), color: "#2D9B7A" },
        { label: ar ? "عدد العمليات" : "Transactions", value: summary.totalCount, color: "#2563EB" },
        { label: ar ? "المستلمة" : "Received", value: formatCurrency(summary.receivedAmount), color: "#2D9B7A" },
        { label: ar ? "التعهدات" : "Pledged", value: summary.pledgedCount, color: "#D97706" },
      ] : [],
      rows,
      columns: printColumns,
    });
  }, [ar, brandingQ.data, from, printColumns, rows, summary, to]);

  const handleExportExcel = useCallback(() => {
    exportFinanceCsv<FinanceDonationV2>({
      filename: `donations-report-${from}-${to}.csv`,
      rows,
      columns: [
        { label: ar ? "رقم" : "ID", render: (row) => row.id },
        { label: ar ? "رقم السند" : "Voucher#", render: (row) => row.voucher?.voucherNo ?? "" },
        { label: ar ? "التاريخ" : "Date", render: (row) => row.donationDate },
        { label: ar ? "الداعم" : "Donor", render: (row) => row.donor?.name ?? "" },
        { label: ar ? "نوع الداعم" : "Donor Type", render: (row) => row.donor?.donorType ?? "" },
        { label: ar ? "الغرض" : "Purpose", render: (row) => row.purpose ?? "" },
        { label: ar ? "طريقة الدفع" : "Payment Method", render: (row) => row.paymentMethod },
        { label: ar ? "المبلغ" : "Amount", render: (row) => Number(row.amount) },
        { label: ar ? "المبلغ الأصلي" : "Original Amount", render: (row) => row.originalAmount != null ? `${Number(row.originalAmount)} ${row.originalCurrencyCode ?? "YER"}` : "" },
        { label: ar ? "الحالة" : "Status", render: (row) => row.status },
        { label: ar ? "المركز" : "Center", render: (row) => row.center?.name ?? "" },
        { label: ar ? "ملاحظات" : "Notes", render: (row) => row.notes ?? "" },
      ],
    });
  }, [ar, from, rows, to]);

  return (
    <ReportLayout
      definition={DONATIONS_DEF}
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
            { label: ar ? "إجمالي التبرعات" : "Total Amount", value: formatCurrency(summary.totalAmount), icon: Wallet2, cls: "emerald" },
            { label: ar ? "عدد العمليات" : "Transactions", value: summary.totalCount, icon: HandHeart, cls: "brand" },
            { label: ar ? "المستلمة" : "Received", value: formatCurrency(summary.receivedAmount), icon: Wallet2, cls: "emerald" },
            { label: ar ? "آخر تبرع" : "Last Donation", value: summary.lastDonationDate ?? "-", icon: CalendarDays, cls: "amber" },
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
            <p className="rcc-empty__title !text-xl">{ar ? "لا توجد تبرعات مطابقة" : "No matching donations"}</p>
            <p className="rcc-empty__desc">{ar ? "حاول تغيير نطاق التاريخ أو الفلاتر." : "Try adjusting the date range or filters."}</p>
          </div>
        }
      />
    </ReportLayout>
  );
}
