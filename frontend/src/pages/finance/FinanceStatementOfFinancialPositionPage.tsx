import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Scale, ShieldCheck, Wallet2 } from "lucide-react";
import { useI18n } from "../../app/i18n";
import { Badge } from "../../components/ui/Badge";
import { useAuthStore } from "../../features/auth/auth.store";
import { useOrgBrandingQuery, useCentersQuery } from "../../features/org/org.hooks";
import { canReadCenters } from "../../features/org/org.permissions";
import { useFinanceV2ReportFinancialPositionQuery } from "../../features/finance-v2/finance-v2.hooks";
import { ReportLayout } from "../../features/reports/components/ReportLayout";
import { FinancialStatementTree } from "../../features/reports/components/FinancialStatementTree";
import { ReportsSummaryCards } from "../../features/reports/components/ReportsSummaryCards";
import { useReportUrlFilters } from "../../features/reports/reports.hooks";
import { REPORT_CATALOG } from "../../features/reports/reportCatalog";
import {
  exportFinanceCsv,
  printFinanceReport,
  type FinanceReportColumn,
} from "../../features/accounting/printAccounting";
import type { FinancialPositionItemV2 } from "../../features/finance-v2/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const nowDate = new Date();
const defaultAsOf = nowDate.toISOString().slice(0, 10);
const FINANCIAL_POSITION_DEF = REPORT_CATALOG.find((report) => report.id === "financial_position")!;

type CsvRow = {
  code: string;
  name: string;
  category: string;
  amount: number;
};

export default function FinanceStatementOfFinancialPositionPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const canLoadCenters = canReadCenters(user?.role);
  const brandingQ = useOrgBrandingQuery();
  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const { values, setFilter, resetFilters, activeCount } = useReportUrlFilters(FINANCIAL_POSITION_DEF.filters);

  const centerId = values.centerId ? Number(values.centerId) : undefined;
  const asOf = (values.toDate as string) || defaultAsOf;
  const reportQ = useFinanceV2ReportFinancialPositionQuery({ centerId, asOf });
  const data = reportQ.data;
  const centerName = centerId
    ? centersQ.data?.items.find((center: { id: number }) => center.id === centerId)?.name
    : undefined;

  const centerOptions = canLoadCenters && centersQ.data?.items
    ? centersQ.data.items.map((center: { id: number; name: string }) => ({ value: center.id, label: center.name }))
    : [];

  const totalLiabilitiesAndNet = data
    ? data.liabilities.totalLiabilities + data.netAssets.totalNetAssets
    : 0;

  const amountColumn: FinanceReportColumn<FinancialPositionItemV2> = {
    label: ar ? "المبلغ" : "Amount",
    render: (row) => formatCurrency(row.balance),
    align: "left",
  };
  const statementColumns: FinanceReportColumn<FinancialPositionItemV2>[] = [
    { label: ar ? "الكود" : "Code", render: (row) => row.code, align: "center" },
    { label: ar ? "الحساب" : "Account", render: (row) => row.name },
    amountColumn,
  ];
  const csvColumns: FinanceReportColumn<CsvRow>[] = [
    { label: ar ? "الكود" : "Code", render: (row) => row.code },
    { label: ar ? "الاسم" : "Name", render: (row) => row.name },
    { label: ar ? "التصنيف" : "Category", render: (row) => row.category },
    { label: ar ? "المبلغ" : "Amount", render: (row) => row.amount.toFixed(2), align: "left" },
  ];

  const csvRows = useMemo<CsvRow[]>(() => {
    if (!data) return [];
    const rows: CsvRow[] = [];
    const addItems = (items: FinancialPositionItemV2[], category: string) => {
      items.forEach((item) => rows.push({ code: item.code, name: item.name, category, amount: item.balance }));
    };
    addItems(data.assets.current, ar ? "أصول متداولة" : "Current Assets");
    addItems(data.assets.fixed, ar ? "أصول ثابتة" : "Fixed Assets");
    addItems(data.liabilities.rows, ar ? "خصوم" : "Liabilities");
    addItems(data.netAssets.unrestricted, ar ? "صافي أصول غير مقيدة" : "Unrestricted Net Assets");
    addItems(data.netAssets.restricted, ar ? "صافي أصول مقيدة" : "Restricted Net Assets");
    return rows;
  }, [ar, data]);

  const handlePrint = useCallback(() => {
    if (!data) return;
    printFinanceReport<FinancialPositionItemV2>({
      title: ar ? "قائمة المركز المالي" : "Statement of Financial Position",
      subtitle: centerName ? `${ar ? "المركز" : "Center"}: ${centerName}` : ar ? "كل المراكز" : "All Centers",
      periodLabel: `${ar ? "حتى تاريخ" : "As of"} ${asOf}`,
      orientation: "landscape",
      ar,
      logoUrl: brandingQ.data?.logoUrl || undefined,
      orgName: brandingQ.data?.name || undefined,
      kpis: [
        { label: ar ? "إجمالي الأصول" : "Total Assets", value: formatCurrency(data.assets.totalAssets), color: "#2D9B7A" },
        { label: ar ? "إجمالي الخصوم" : "Total Liabilities", value: formatCurrency(data.liabilities.totalLiabilities), color: "#D97706" },
        { label: ar ? "صافي الأصول" : "Net Assets", value: formatCurrency(data.netAssets.totalNetAssets), color: "#2563EB" },
        { label: ar ? "حالة الميزان" : "Balance Status", value: data.isBalanced ? (ar ? "متوازن" : "Balanced") : (ar ? "غير متوازن" : "Unbalanced"), color: data.isBalanced ? "#2D9B7A" : "#E85858" },
      ],
      sections: [
        {
          title: ar ? "الأصول المتداولة" : "Current Assets",
          totalLabel: ar ? "الإجمالي" : "Total",
          totalValue: formatCurrency(data.assets.totalCurrent),
          rows: data.assets.current,
          columns: statementColumns,
        },
        {
          title: ar ? "الأصول الثابتة" : "Fixed Assets",
          totalLabel: ar ? "الإجمالي" : "Total",
          totalValue: formatCurrency(data.assets.totalFixed),
          rows: data.assets.fixed,
          columns: statementColumns,
        },
        {
          title: ar ? "الخصوم" : "Liabilities",
          totalLabel: ar ? "الإجمالي" : "Total",
          totalValue: formatCurrency(data.liabilities.totalLiabilities),
          rows: data.liabilities.rows,
          columns: statementColumns,
        },
        {
          title: ar ? "صافي الأصول غير المقيدة" : "Unrestricted Net Assets",
          totalLabel: ar ? "الإجمالي" : "Total",
          totalValue: formatCurrency(data.netAssets.totalUnrestricted),
          rows: data.netAssets.unrestricted,
          columns: statementColumns,
        },
        {
          title: ar ? "صافي الأصول المقيدة" : "Restricted Net Assets",
          totalLabel: ar ? "الإجمالي" : "Total",
          totalValue: formatCurrency(data.netAssets.totalRestricted),
          rows: data.netAssets.restricted,
          columns: statementColumns,
        },
      ],
    });
  }, [ar, asOf, brandingQ.data, centerName, data, statementColumns]);

  const handleExportExcel = useCallback(() => {
    if (!data) return;
    exportFinanceCsv<CsvRow>({
      filename: `financial-position-${asOf}.csv`,
      rows: csvRows,
      columns: csvColumns,
      extraRows: [
        [ar ? "إجمالي الأصول" : "Total Assets", "", "", data.assets.totalAssets.toFixed(2)],
        [ar ? "إجمالي الخصوم" : "Total Liabilities", "", "", data.liabilities.totalLiabilities.toFixed(2)],
        [ar ? "صافي الأصول" : "Net Assets", "", "", data.netAssets.totalNetAssets.toFixed(2)],
        [ar ? "إجمالي الخصوم وصافي الأصول" : "Total Liabilities & Net Assets", "", "", totalLiabilitiesAndNet.toFixed(2)],
      ],
    });
  }, [ar, asOf, csvColumns, csvRows, data, totalLiabilitiesAndNet]);

  const balanceBadge = data ? (
    data.isBalanced ? (
      <Badge variant="success" className="px-3 py-1 flex gap-1 items-center">
        <ShieldCheck size={14} />
        {ar ? "الميزانية متوازنة" : "Balanced"}
      </Badge>
    ) : (
      <Badge variant="error" className="px-3 py-1 flex gap-1 items-center">
        <AlertCircle size={14} />
        {ar ? "الميزانية غير متوازنة" : "Unbalanced"}
      </Badge>
    )
  ) : null;

  return (
    <ReportLayout
      definition={FINANCIAL_POSITION_DEF}
      filters={{ ...values, toDate: values.toDate ?? asOf }}
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
      isEmpty={!reportQ.isLoading && !reportQ.isError && !data}
      actions={balanceBadge}
      summary={data ? (
        <ReportsSummaryCards
          cards={[
            { label: ar ? "إجمالي الأصول" : "Total Assets", value: formatCurrency(data.assets.totalAssets), icon: Scale, cls: "emerald" },
            { label: ar ? "إجمالي الخصوم" : "Total Liabilities", value: formatCurrency(data.liabilities.totalLiabilities), icon: AlertCircle, cls: "amber" },
            { label: ar ? "صافي الأصول" : "Net Assets", value: formatCurrency(data.netAssets.totalNetAssets), icon: Wallet2, cls: "brand" },
            { label: ar ? "إجمالي الخصوم وصافي الأصول" : "Liabilities + Net Assets", value: formatCurrency(totalLiabilitiesAndNet), icon: ShieldCheck, cls: data.isBalanced ? "emerald" : "rose" },
          ]}
        />
      ) : null}
    >
      {data && <FinancialStatementTree data={data} />}
    </ReportLayout>
  );
}
