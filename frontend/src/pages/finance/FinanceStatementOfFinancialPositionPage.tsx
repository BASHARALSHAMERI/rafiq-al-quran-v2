import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, ArrowLeft, Building2, CalendarDays,
  FileDown, Printer, RefreshCw, RotateCcw, Scale,
  Search, ShieldCheck, Wallet2
} from "lucide-react";
import { useI18n } from "../../app/i18n";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAuthStore } from "../../features/auth/auth.store";
import { useOrgBrandingQuery, useCentersQuery } from "../../features/org/org.hooks";
import { canReadCenters } from "../../features/org/org.permissions";
import { useFinanceV2ReportFinancialPositionQuery } from "../../features/finance-v2/finance-v2.hooks";
import { FinancialStatementTree } from "../../features/reports/components/FinancialStatementTree";
import { useReportUrlFilters } from "../../features/reports/reports.hooks";
import { REPORT_CATALOG } from "../../features/reports/reportCatalog";
import {
  exportFinanceCsv,
  printFinanceReport,
  type FinanceReportColumn,
} from "../../features/accounting/printAccounting";
import type { FinancialPositionItemV2 } from "../../features/finance-v2/types";
import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/finance-v4.css";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

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

  const [searchQ, setSearchQ] = useState("");

  const centerOptions = canLoadCenters && centersQ.data?.items
    ? centersQ.data.items.map((center: { id: number; name: string }) => ({ value: center.id, label: center.name }))
    : [];

  const totalLiabilitiesAndNet = data
    ? data.liabilities.totalLiabilities + data.netAssets.totalNetAssets
    : 0;

  const hasActiveFilters = activeCount > 0 || !!searchQ;
  const handleBack = useCallback(() => navigate("/reports"), [navigate]);
  const handleRefresh = useCallback(() => { void reportQ.refetch(); }, [reportQ]);

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

  const kpiCards = data ? [
    { label: ar ? "إجمالي الأصول" : "Total Assets", value: formatCurrency(data.assets.totalAssets), icon: Scale, cls: "blue" },
    { label: ar ? "إجمالي الخصوم" : "Total Liabilities", value: formatCurrency(data.liabilities.totalLiabilities), icon: AlertCircle, cls: "amber" },
    { label: ar ? "صافي الأصول" : "Net Assets", value: formatCurrency(data.netAssets.totalNetAssets), icon: Wallet2, cls: "emerald" },
    { label: ar ? "الخصوم + صافي الأصول" : "Liabilities + Net Assets", value: formatCurrency(totalLiabilitiesAndNet), icon: ShieldCheck, cls: data.isBalanced ? "emerald" : "rose" },
  ] : [];

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
    <div className="fin-premium-container ctr-page-modern p-4" dir={ar ? "rtl" : "ltr"}>
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col gap-5 mx-auto" style={{ maxWidth: 1120, width: "100%" }}>
        {/* 1. Back + Header */}
        <div>
          <button
            onClick={handleBack}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
          >
            <ArrowLeft className={`w-4 h-4 ${ar ? "rotate-180 ml-1 mr-0" : "mr-1"}`} />
            {ar ? "العودة للتقارير" : "Back to Reports"}
          </button>

          <PageHeader
            title={ar ? "قائمة المركز المالي" : "Statement of Financial Position"}
            description={ar ? "الأصول والخصوم وصافي الأصول" : "Assets, liabilities and net assets"}
            icon={<Scale className="w-6 h-6 text-indigo-600" />}
            actions={
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <Button variant="secondary" className="glass-btn" size="sm" leftIcon={<RefreshCw className={reportQ.isFetching ? "animate-spin" : ""} />} onClick={handleRefresh}>
                  {ar ? "تحديث" : "Refresh"}
                </Button>
                <Button variant="secondary" className="glass-btn" size="sm" leftIcon={<Printer className="text-teal-600" />} onClick={handlePrint}>
                  {ar ? "طباعة" : "Print"}
                </Button>
                <Button variant="secondary" className="glass-btn" size="sm" leftIcon={<FileDown className="text-emerald-600" />} onClick={handleExportExcel}>
                  {ar ? "تصدير Excel" : "Export Excel"}
                </Button>
                {balanceBadge}
              </div>
            }
          />
        </div>

        {/* 2. Filters */}
        <div className="fin-filters-container">
          <div className="fin-filters-scroll">
            <div className="fin-filter-item" style={{ flex: 1, minWidth: 260 }}>
              <Search className="fin-filter-icon" size={18} />
              <input
                type="text"
                placeholder={ar ? "ابحث في الجدول..." : "Search table..."}
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                style={{ fontWeight: 500 }}
              />
            </div>
            {canLoadCenters && (
              <div className="fin-filter-item" style={{ minWidth: 160 }}>
                <Building2 className="fin-filter-icon" size={16} />
                <select value={values.centerId || ""} onChange={(e) => setFilter("centerId", e.target.value || undefined)}>
                  <option value="">{ar ? "المركز: الكل" : "Center: All"}</option>
                  {centerOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            )}
            <div className="fin-filter-item" style={{ minWidth: 160 }}>
              <CalendarDays className="fin-filter-icon" size={16} />
              <input type="date" value={asOf} onChange={(e) => setFilter("toDate", e.target.value)} title={ar ? "تاريخ التقرير" : "As of date"} />
            </div>
          </div>
          {hasActiveFilters && (
            <button className="fin-filter-reset" onClick={() => { resetFilters(); setSearchQ(""); }}>
              <RotateCcw size={14} />
              {ar ? "إعادة ضبط" : "Reset"}
            </button>
          )}
        </div>

        {/* 3. KPI Cards */}
        {kpiCards.length > 0 && (
          <div className="fin-premium-kpis mb-0" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 0 }}>
            {kpiCards.map((card) => (
              <div key={card.label} className="fin-kpi-card">
                <div className={`fin-kpi-card__icon fin-kpi-icon--${card.cls}`}><card.icon size={20} /></div>
                <div className="fin-kpi-card__content">
                  <span className="fin-kpi-card__value">{card.value}</span>
                  <span className="fin-kpi-card__label">{card.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. Content */}
        {reportQ.isLoading ? (
          <div className="flex flex-col gap-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-100 animate-pulse rounded-xl" />)}
          </div>
        ) : reportQ.isError ? (
          <ErrorState title={ar ? "تعذر تحميل بيانات التقرير" : "Unable to load report data"} onRetry={() => void reportQ.refetch()} />
        ) : (
          <div className="fin-premium-panel">
            {data ? (
              <FinancialStatementTree data={data} search={searchQ} />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                  {ar ? "لا توجد بيانات ضمن الفلاتر المحددة" : "No data found for the selected filters"}
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
