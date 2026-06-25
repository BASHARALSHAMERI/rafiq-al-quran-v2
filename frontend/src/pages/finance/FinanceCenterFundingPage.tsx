import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingDown, TrendingUp, Wallet2 } from "lucide-react";
import type { DataTableColumn } from "../../components/ui/DataTable";
import { useI18n } from "../../app/i18n";
import { useAuthStore } from "../../features/auth/auth.store";
import { useCentersQuery, useOrgBrandingQuery } from "../../features/org/org.hooks";
import { canReadCenters } from "../../features/org/org.permissions";
import { useFinanceV2ReportCenterFundingQuery } from "../../features/finance-v2/finance-v2.hooks";
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);

const nowDate = new Date();
const defaultTo = nowDate.toISOString().slice(0, 10);
const defaultFrom = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - 30)
  .toISOString()
  .slice(0, 10);
const CENTER_FUNDING_DEF = REPORT_CATALOG.find((report) => report.id === "center_funding")!;

type CenterFundingRow = {
  centerId: number;
  centerName: string;
  studentFees: number;
  donations: number;
  totalFunding: number;
  payrollCosts: number;
  operatingCosts: number;
  educationalCosts: number;
  totalCosts: number;
  fundingGap: number;
};

export default function FinanceCenterFundingPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const canLoadCenters = canReadCenters(user?.role);
  const brandingQ = useOrgBrandingQuery();
  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const { values, setFilter, resetFilters, activeCount } = useReportUrlFilters(CENTER_FUNDING_DEF.filters);

  const from = (values.fromDate as string) || defaultFrom;
  const to = (values.toDate as string) || defaultTo;
  const centerId = values.centerId ? Number(values.centerId) : undefined;
  const search = values.search ? String(values.search) : "";
  const reportQ = useFinanceV2ReportCenterFundingQuery({ centerId, from, to });

  const rows = useMemo<CenterFundingRow[]>(() => {
    const reportRows = reportQ.data?.rows ?? [];
    if (!search) return reportRows;
    const lowerSearch = search.toLowerCase();
    return reportRows.filter((row) => row.centerName.toLowerCase().includes(lowerSearch));
  }, [reportQ.data?.rows, search]);
  const kpis = reportQ.data?.kpis;
  const centerOptions = canLoadCenters && centersQ.data?.items
    ? centersQ.data.items.map((center: { id: number; name: string }) => ({ value: center.id, label: center.name }))
    : [];

  const columns = useMemo<DataTableColumn<CenterFundingRow>[]>(() => [
    {
      id: "centerName",
      header: ar ? "المركز" : "Center",
      cell: (row) => <div className="font-medium">{row.centerName}</div>,
    },
    {
      id: "studentFees",
      header: ar ? "الرسوم" : "Student Fees",
      align: "end",
      headerClassName: "text-end",
      cell: (row) => formatCurrency(row.studentFees),
    },
    {
      id: "donations",
      header: ar ? "التبرعات" : "Donations",
      align: "end",
      headerClassName: "text-end",
      cell: (row) => formatCurrency(row.donations),
    },
    {
      id: "totalFunding",
      header: ar ? "إجمالي التمويل" : "Total Funding",
      align: "end",
      headerClassName: "text-end",
      cell: (row) => <span className="text-emerald-600 font-semibold">{formatCurrency(row.totalFunding)}</span>,
    },
    {
      id: "payrollCosts",
      header: ar ? "الرواتب" : "Payroll",
      align: "end",
      headerClassName: "text-end",
      cell: (row) => formatCurrency(row.payrollCosts),
    },
    {
      id: "operatingCosts",
      header: ar ? "التشغيلية" : "Operating",
      align: "end",
      headerClassName: "text-end",
      cell: (row) => formatCurrency(row.operatingCosts),
    },
    {
      id: "educationalCosts",
      header: ar ? "التعليمية" : "Educational",
      align: "end",
      headerClassName: "text-end",
      cell: (row) => formatCurrency(row.educationalCosts),
    },
    {
      id: "totalCosts",
      header: ar ? "إجمالي التكلفة" : "Total Costs",
      align: "end",
      headerClassName: "text-end",
      cell: (row) => <span className="text-rose-600 font-semibold">{formatCurrency(row.totalCosts)}</span>,
    },
    {
      id: "fundingGap",
      header: ar ? "العجز/الفائض" : "Funding Gap",
      align: "end",
      headerClassName: "text-end",
      cell: (row) => (
        <span className={`font-bold ${row.fundingGap >= 0 ? "text-emerald-600" : "text-rose-600"}`} dir="ltr">
          {row.fundingGap >= 0 ? "+" : ""}{formatCurrency(row.fundingGap)}
        </span>
      ),
    },
  ], [ar]);

  const printColumns: FinanceReportColumn<CenterFundingRow>[] = [
    { label: ar ? "المركز" : "Center", render: (row) => row.centerName },
    { label: ar ? "الرسوم" : "Student Fees", render: (row) => formatCurrency(row.studentFees), align: "left" },
    { label: ar ? "التبرعات" : "Donations", render: (row) => formatCurrency(row.donations), align: "left" },
    { label: ar ? "إجمالي التمويل" : "Total Funding", render: (row) => formatCurrency(row.totalFunding), align: "left" },
    { label: ar ? "الرواتب" : "Payroll", render: (row) => formatCurrency(row.payrollCosts), align: "left" },
    { label: ar ? "التشغيلية" : "Operating", render: (row) => formatCurrency(row.operatingCosts), align: "left" },
    { label: ar ? "التعليمية" : "Educational", render: (row) => formatCurrency(row.educationalCosts), align: "left" },
    { label: ar ? "إجمالي التكلفة" : "Total Costs", render: (row) => formatCurrency(row.totalCosts), align: "left" },
    { label: ar ? "العجز/الفائض" : "Funding Gap", render: (row) => `${row.fundingGap >= 0 ? "+" : ""}${formatCurrency(row.fundingGap)}`, align: "left" },
  ];

  const handlePrint = useCallback(() => {
    printFinanceReport<CenterFundingRow>({
      title: ar ? "تقرير تمويل وتكلفة المراكز" : "Center Funding & Cost Report",
      subtitle: ar ? "التمويل مقابل تكاليف التشغيل للمراكز" : "Funding versus operating costs by center",
      periodLabel: `${ar ? "الفترة" : "Period"}: ${from} - ${to}`,
      orientation: "landscape",
      ar,
      logoUrl: brandingQ.data?.logoUrl || undefined,
      orgName: brandingQ.data?.name || undefined,
      kpis: kpis ? [
        { label: ar ? "إجمالي التمويل" : "Total Funding", value: formatCurrency(kpis.totalFunding), color: "#2D9B7A" },
        { label: ar ? "إجمالي التكلفة" : "Total Costs", value: formatCurrency(kpis.totalCosts), color: "#E85858" },
        { label: ar ? "صافي العجز/الفائض" : "Net Funding Gap", value: `${kpis.netFundingGap >= 0 ? "+" : ""}${formatCurrency(kpis.netFundingGap)}`, color: kpis.netFundingGap >= 0 ? "#2D9B7A" : "#E85858" },
      ] : [],
      rows,
      columns: printColumns,
    });
  }, [ar, brandingQ.data, from, kpis, printColumns, rows, to]);

  const handleExportExcel = useCallback(() => {
    exportFinanceCsv<CenterFundingRow>({
      filename: `center-funding-${from}-${to}.csv`,
      rows,
      columns: [
        { label: ar ? "المركز" : "Center", render: (row) => row.centerName },
        { label: ar ? "الرسوم" : "Student Fees", render: (row) => row.studentFees },
        { label: ar ? "التبرعات" : "Donations", render: (row) => row.donations },
        { label: ar ? "إجمالي التمويل" : "Total Funding", render: (row) => row.totalFunding },
        { label: ar ? "الرواتب" : "Payroll", render: (row) => row.payrollCosts },
        { label: ar ? "التشغيلية" : "Operating", render: (row) => row.operatingCosts },
        { label: ar ? "التعليمية" : "Educational", render: (row) => row.educationalCosts },
        { label: ar ? "إجمالي التكلفة" : "Total Costs", render: (row) => row.totalCosts },
        { label: ar ? "العجز/الفائض" : "Funding Gap", render: (row) => row.fundingGap },
      ],
    });
  }, [ar, from, rows, to]);

  return (
    <ReportLayout
      definition={CENTER_FUNDING_DEF}
      filters={{ ...values, fromDate: values.fromDate ?? from, toDate: values.toDate ?? to }}
      optionsMap={{ centerId: centerOptions }}
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
      summary={kpis ? (
        <ReportsSummaryCards
          cards={[
            { label: ar ? "إجمالي التمويل" : "Total Funding", value: formatCurrency(kpis.totalFunding), icon: TrendingUp, cls: "emerald" },
            { label: ar ? "إجمالي التكلفة" : "Total Costs", value: formatCurrency(kpis.totalCosts), icon: TrendingDown, cls: "rose" },
            { label: ar ? "صافي العجز/الفائض" : "Net Funding Gap", value: `${kpis.netFundingGap >= 0 ? "+" : ""}${formatCurrency(kpis.netFundingGap)}`, icon: Wallet2, cls: kpis.netFundingGap >= 0 ? "emerald" : "rose" },
          ]}
        />
      ) : null}
    >
      <ReportTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.centerId}
        dense
        emptyState={
          <div className="rcc-empty !py-16">
            <div className="rcc-empty__ico !w-16 !h-16 !bg-gray-50 !text-gray-300"><Search size={32} /></div>
            <p className="rcc-empty__title !text-xl">{ar ? "لا توجد بيانات" : "No data"}</p>
            <p className="rcc-empty__desc">{ar ? "لا توجد حركات مالية للمراكز في هذه الفترة." : "No center financial movements were recorded in this period."}</p>
          </div>
        }
      />
    </ReportLayout>
  );
}
