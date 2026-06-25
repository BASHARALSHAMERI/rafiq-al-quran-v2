import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ListTree, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import type { DataTableColumn } from "../../components/ui/DataTable";
import { useI18n } from "../../app/i18n";
import { useAuthStore } from "../../features/auth/auth.store";
import { useOrgBrandingQuery, useCentersQuery } from "../../features/org/org.hooks";
import { canReadCenters } from "../../features/org/org.permissions";
import { useFinanceV2ReportStatementOfActivitiesQuery } from "../../features/finance-v2/finance-v2.hooks";
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
import type { FinancialPositionItemV2 } from "../../features/finance-v2/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const nowDate = new Date();
const defaultTo = nowDate.toISOString().slice(0, 10);
const defaultFrom = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).toISOString().slice(0, 10);
const STATEMENT_ACTIVITIES_DEF = REPORT_CATALOG.find((report) => report.id === "statement_of_activities")!;

type StatementLine = {
  id: string;
  kind: "group" | "account" | "subtotal";
  section: "revenue" | "expense";
  typeLabel: string;
  group: string;
  code: string;
  label: string;
  accountsCount: number;
  amount: number;
};

const sumItems = (items: FinancialPositionItemV2[]) =>
  items.reduce((sum, item) => sum + Number(item.balance || 0), 0);

export default function FinanceStatementOfActivitiesPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const canLoadCenters = canReadCenters(user?.role);
  const brandingQ = useOrgBrandingQuery();
  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const { values, setFilter, resetFilters, activeCount } = useReportUrlFilters(STATEMENT_ACTIVITIES_DEF.filters);

  const from = (values.fromDate as string) || defaultFrom;
  const to = (values.toDate as string) || defaultTo;
  const centerId = values.centerId ? Number(values.centerId) : undefined;
  const reportQ = useFinanceV2ReportStatementOfActivitiesQuery({ centerId, from, to });
  const data = reportQ.data;
  const centerName = centerId
    ? centersQ.data?.items.find((center: { id: number }) => center.id === centerId)?.name
    : undefined;
  const netLabel = data && data.surplusOrDeficit < 0
    ? ar ? "عجز الفترة" : "Deficit for the Period"
    : ar ? "فائض الفترة" : "Surplus for the Period";

  const centerOptions = canLoadCenters && centersQ.data?.items
    ? centersQ.data.items.map((center: { id: number; name: string }) => ({ value: center.id, label: center.name }))
    : [];

  const buildSectionLines = useCallback((
    section: "revenue" | "expense",
    groups: Array<{ label: string; items: FinancialPositionItemV2[] }>,
    subtotalLabel: string,
    subtotal: number
  ): StatementLine[] => {
    const typeLabel = section === "revenue" ? (ar ? "إيراد" : "Revenue") : (ar ? "مصروف" : "Expense");
    const lines: StatementLine[] = [];
    groups.forEach((group, groupIndex) => {
      const amount = sumItems(group.items);
      if (group.items.length === 0 && amount === 0) return;
      lines.push({
        id: `${section}-group-${groupIndex}`,
        kind: "group",
        section,
        typeLabel,
        group: group.label,
        code: "-",
        label: group.label,
        accountsCount: group.items.length,
        amount,
      });
      group.items.forEach((item) => {
        lines.push({
          id: `${section}-account-${item.accountId}`,
          kind: "account",
          section,
          typeLabel,
          group: group.label,
          code: item.code,
          label: item.name,
          accountsCount: 1,
          amount: item.balance,
        });
      });
    });
    lines.push({
      id: `${section}-subtotal`,
      kind: "subtotal",
      section,
      typeLabel: ar ? "إجمالي" : "Total",
      group: "",
      code: "-",
      label: subtotalLabel,
      accountsCount: lines.filter((line) => line.kind === "account").length,
      amount: subtotal,
    });
    return lines;
  }, [ar]);

  const statementLines = useMemo<StatementLine[]>(() => {
    if (!data) return [];
    return [
      ...buildSectionLines(
        "revenue",
        [
          { label: ar ? "اشتراكات الطلاب" : "Student Contributions", items: data.revenue.studentContributions },
          { label: ar ? "التبرعات" : "Donations", items: data.revenue.donations },
          { label: ar ? "إيرادات أخرى" : "Other Revenue", items: data.revenue.other },
        ],
        ar ? "إجمالي الإيرادات" : "Total Revenue",
        data.revenue.totalRevenue
      ),
      ...buildSectionLines(
        "expense",
        [
          { label: ar ? "الرواتب والأجور" : "Payroll and Wages", items: data.expenses.payroll },
          { label: ar ? "المصروفات التشغيلية" : "Operating Expenses", items: data.expenses.operating },
          { label: ar ? "المصروفات التعليمية" : "Educational Expenses", items: data.expenses.educational },
          { label: ar ? "مصروفات المراكز" : "Center Expenses", items: data.expenses.centers },
          { label: ar ? "الإهلاك" : "Depreciation", items: data.expenses.depreciation },
          { label: ar ? "مصروفات أخرى" : "Other Expenses", items: data.expenses.other },
        ],
        ar ? "إجمالي المصروفات" : "Total Expenses",
        data.expenses.totalExpenses
      ),
    ];
  }, [ar, buildSectionLines, data]);

  const accountRowsCount = statementLines.filter((line) => line.kind === "account").length;
  const groupRowsCount = statementLines.filter((line) => line.kind === "group").length;
  const hasRows = Boolean(data && (accountRowsCount > 0 || data.revenue.totalRevenue || data.expenses.totalExpenses));

  const tableColumns = useMemo<DataTableColumn<StatementLine>[]>(() => [
    {
      id: "type",
      header: ar ? "النوع" : "Type",
      width: 120,
      cell: (line) => (
        <Badge variant={line.section === "revenue" ? "success" : "error"}>
          {line.typeLabel}
        </Badge>
      ),
    },
    {
      id: "line",
      header: ar ? "البند / الحساب" : "Line / Account",
      cell: (line) => (
        <div className={line.kind === "account" ? "ps-4" : ""}>
          <div className={line.kind === "subtotal" ? "font-black text-emerald-700" : "font-semibold text-gray-800"}>
            {line.label}
          </div>
          {line.kind === "account" && <div className="text-xs text-gray-500">{line.group}</div>}
        </div>
      ),
    },
    {
      id: "code",
      header: ar ? "كود الحساب" : "Account Code",
      width: 130,
      align: "center",
      headerClassName: "text-center",
      cell: (line) => <span className="font-mono text-xs text-gray-500">{line.code}</span>,
    },
    {
      id: "count",
      header: ar ? "الحسابات" : "Accounts",
      width: 100,
      align: "center",
      headerClassName: "text-center",
      cell: (line) => line.accountsCount,
    },
    {
      id: "amount",
      header: ar ? "المبلغ" : "Amount",
      width: 150,
      align: "end",
      headerClassName: "text-end",
      cell: (line) => (
        <span className={`font-bold tabular-nums ${line.kind === "subtotal" ? "text-emerald-700" : "text-gray-800"}`} dir="ltr">
          {formatCurrency(line.amount)}
        </span>
      ),
    },
  ], [ar]);

  const printColumns: FinanceReportColumn<StatementLine>[] = [
    { label: ar ? "النوع" : "Type", render: (line) => line.typeLabel, align: "center" },
    { label: ar ? "المجموعة" : "Group", render: (line) => line.group },
    { label: ar ? "كود الحساب" : "Account Code", render: (line) => line.code, align: "center" },
    { label: ar ? "البند" : "Line", render: (line) => line.label },
    { label: ar ? "عدد الحسابات" : "Accounts", render: (line) => line.accountsCount, align: "center" },
    { label: ar ? "المبلغ" : "Amount", render: (line) => formatCurrency(line.amount), align: "left" },
  ];

  const handlePrint = useCallback(() => {
    if (!data) return;
    printFinanceReport<StatementLine>({
      title: ar ? "قائمة الأنشطة" : "Statement of Activities",
      subtitle: centerName ? `${ar ? "المركز" : "Center"}: ${centerName}` : ar ? "كل المراكز" : "All Centers",
      periodLabel: `${ar ? "الفترة" : "Period"}: ${from} - ${to}`,
      orientation: "portrait",
      ar,
      logoUrl: brandingQ.data?.logoUrl || undefined,
      orgName: brandingQ.data?.name || undefined,
      kpis: [
        { label: ar ? "إجمالي الإيرادات" : "Total Revenue", value: formatCurrency(data.revenue.totalRevenue), color: "#2D9B7A" },
        { label: ar ? "إجمالي المصروفات" : "Total Expenses", value: formatCurrency(data.expenses.totalExpenses), color: "#E85858" },
        { label: netLabel, value: `${data.surplusOrDeficit > 0 ? "+" : ""}${formatCurrency(data.surplusOrDeficit)}`, color: data.surplusOrDeficit >= 0 ? "#2D9B7A" : "#E85858" },
        { label: ar ? "الحسابات الظاهرة" : "Visible Accounts", value: accountRowsCount, color: "#D97706" },
      ],
      rows: statementLines,
      columns: printColumns,
    });
  }, [accountRowsCount, ar, brandingQ.data, centerName, data, from, netLabel, printColumns, statementLines, to]);

  const handleExportExcel = useCallback(() => {
    if (!data) return;
    exportFinanceCsv<StatementLine>({
      filename: `statement-of-activities-${from}-${to}.csv`,
      rows: statementLines,
      columns: [
        { label: ar ? "النوع" : "Type", render: (line) => line.section },
        { label: ar ? "المجموعة" : "Group", render: (line) => line.group },
        { label: ar ? "كود الحساب" : "Account Code", render: (line) => line.code },
        { label: ar ? "البند" : "Line", render: (line) => line.label },
        { label: ar ? "المبلغ" : "Amount", render: (line) => line.amount.toFixed(2) },
      ],
      extraRows: [[ar ? "النتيجة" : "Result", "", "", netLabel, data.surplusOrDeficit.toFixed(2)]],
    });
  }, [ar, data, from, netLabel, statementLines, to]);

  return (
    <ReportLayout
      definition={STATEMENT_ACTIVITIES_DEF}
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
      isEmpty={!reportQ.isLoading && !reportQ.isError && !hasRows}
      summary={data ? (
        <ReportsSummaryCards
          cards={[
            { label: ar ? "إجمالي الإيرادات" : "Total Revenue", value: formatCurrency(data.revenue.totalRevenue), icon: TrendingUp, cls: "emerald" },
            { label: ar ? "إجمالي المصروفات" : "Total Expenses", value: formatCurrency(data.expenses.totalExpenses), icon: TrendingDown, cls: "rose" },
            { label: netLabel, value: `${data.surplusOrDeficit > 0 ? "+" : ""}${formatCurrency(data.surplusOrDeficit)}`, icon: WalletCards, cls: data.surplusOrDeficit >= 0 ? "emerald" : "rose" },
            { label: ar ? "الحسابات الظاهرة" : "Visible Accounts", value: accountRowsCount, icon: Activity, cls: "amber" },
          ]}
        />
      ) : null}
    >
      <ReportTable
        columns={tableColumns}
        rows={statementLines}
        rowKey={(line) => line.id}
        dense
        footer={
          data ? (
            <tr>
              <td colSpan={4} className="app-data-table__cell font-black text-emerald-800">
                <div className="flex items-center gap-2">
                  <ListTree size={16} />
                  {netLabel} - {groupRowsCount} {ar ? "مجموعات" : "groups"}
                </div>
              </td>
              <td className="app-data-table__cell text-end font-black text-emerald-700" dir="ltr">
                {data.surplusOrDeficit > 0 ? "+" : ""}{formatCurrency(data.surplusOrDeficit)}
              </td>
            </tr>
          ) : null
        }
      />
    </ReportLayout>
  );
}
