import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { useI18n } from "../../app/i18n";
import { Badge } from "../../components/ui/Badge";
import { useAuthStore } from "../../features/auth/auth.store";
import { useOrgBrandingQuery, useCentersQuery } from "../../features/org/org.hooks";
import { canReadCenters } from "../../features/org/org.permissions";
import { useFinanceV2ReportFinancialPositionQuery } from "../../features/finance-v2/finance-v2.hooks";
import { ReportLayout } from "../../features/reports/components/ReportLayout";
import { useReportUrlFilters } from "../../features/reports/reports.hooks";
import { REPORT_CATALOG } from "../../features/reports/reportCatalog";
import { formatArabicDate } from "../../features/accounting/printAccounting";
import type { FinancialPositionItemV2 } from "../../features/finance-v2/types";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

const nowDate = new Date();
const defaultAsOf = nowDate.toISOString().slice(0, 10);

const FINANCIAL_POSITION_DEF = REPORT_CATALOG.find((r) => r.id === "financial_position")!;

export default function FinanceStatementOfFinancialPositionPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const brandingQ = useOrgBrandingQuery();
  const canLoadCenters = canReadCenters(user?.role);

  const { values, setFilter, resetFilters, activeCount } = useReportUrlFilters(FINANCIAL_POSITION_DEF.filters);

  const centerId = values.centerId ? Number(values.centerId) : undefined;
  const asOf = (values.toDate as string) || defaultAsOf;

  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const reportQ = useFinanceV2ReportFinancialPositionQuery({
    centerId,
    asOf,
  });

  const data = reportQ.data;

  const totalLiabilitiesAndNet = data
    ? data.liabilities.totalLiabilities + data.netAssets.totalNetAssets
    : 0;

  const SectionTitle = ({ title, amount }: { title: string; amount: number }) => (
    <div className="flex justify-between items-center border-b-2 border-emerald-100 dark:border-emerald-900 pb-2 mb-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(amount)}</span>
    </div>
  );

  const SubSectionTitle = ({ title, amount }: { title: string; amount: number }) => (
    <div className="flex justify-between items-center mt-5 mb-2 bg-gray-50 dark:bg-gray-800/50 -mx-4 px-4 py-2 rounded-lg">
      <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400">{title}</h4>
      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatCurrency(amount)}</span>
    </div>
  );

  const DataRow = ({ label, code, amount, indent = false }: { label: string; code: string; amount: number; indent?: boolean }) => (
    <div className={`flex justify-between items-center py-2 text-sm border-b border-gray-50 dark:border-gray-800 last:border-0 ${indent ? (ar ? 'pr-6' : 'pl-6') : ''}`}>
      <div className="flex gap-2 items-center">
        <span className="text-gray-400 dark:text-gray-500 font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{code}</span>
        <span className="text-gray-700 dark:text-gray-300 font-medium">{label}</span>
      </div>
      <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrency(amount)}</span>
    </div>
  );

  const logoUrl = brandingQ.data?.logoUrl || undefined;
  const orgName = brandingQ.data?.name || undefined;

  const handlePrint = useCallback(() => {
    if (!data) return;

    const resolvedLogoUrl = logoUrl || "/brand/rafiq-logo.svg";
    const resolvedOrgName = orgName || (ar ? "جمعية رفقاء القرآن" : "Rafiq Al-Quran Association");
    const accentColor = "#2D9B7A";
    const accentLight = "#E4F4EE";

    const renderItems = (items: FinancialPositionItemV2[], indent = false) =>
      items.map((item) => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #EDF2F7;font-size:12px;${indent ? "padding-right:24px" : ""}">
            <span style="color:#A0AEC0;font-family:monospace;font-size:11px;background:#F7FAFC;padding:1px 6px;border-radius:4px;">${item.code}</span>
            <span style="color:#4A5568;font-weight:600;margin-right:6px;">${item.name}</span>
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #EDF2F7;font-size:13px;font-weight:700;color:#2D3748;text-align:left;white-space:nowrap;direction:ltr;">${formatCurrency(item.balance)}</td>
        </tr>`).join("");

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>${ar ? "قائمة المركز المالي" : "Statement of Financial Position"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; padding: 36px; color: #2D3748; background: #F7FAFC; }
            .wrap { max-width: 900px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; position: relative; }
            .wrap::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, ${accentColor}, ${accentColor}99, ${accentColor}); }
            .inner { padding: 32px 32px 28px; }
            .header { display: flex; align-items: center; gap: 16px; padding-bottom: 18px; border-bottom: 2px solid ${accentLight}; margin-bottom: 22px; }
            .header-logo { width: 52px; height: 52px; flex-shrink: 0; }
            .header-center { flex: 1; }
            .header-org-name { font-size: 17px; font-weight: 900; color: #1A365D; line-height: 1.3; }
            .header-sub { font-size: 11px; color: ${accentColor}; font-weight: 600; }
            .header-left { text-align: left; font-size: 11px; color: #718096; font-weight: 600; flex-shrink: 0; }
            .title-section { text-align: center; margin-bottom: 24px; }
            .title-section h1 { font-size: 22px; font-weight: 900; color: #1A365D; display: inline-block; position: relative; }
            .title-section h1::after { content: ''; display: block; width: 50%; height: 4px; background: linear-gradient(90deg, transparent, ${accentColor}, transparent); margin: 8px auto 0; border-radius: 2px; }
            .title-sub { font-size: 13px; color: #718096; font-weight: 600; margin-top: 6px; }
            .kpi-bar { display: flex; gap: 12px; margin-bottom: 24px; }
            .kpi-card { flex: 1; background: #F2FAF6; border: 1px solid #E4F4EE; border-radius: 10px; padding: 12px 16px; text-align: center; }
            .kpi-card-value { font-size: 18px; font-weight: 900; color: #2D9B7A; }
            .kpi-card-label { font-size: 11px; font-weight: 700; color: #718096; margin-top: 2px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
            .card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; }
            .card-title { font-size: 15px; font-weight: 900; color: #1A365D; border-bottom: 2px solid #E4F4EE; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; }
            .card-title span:last-child { color: #2D9B7A; }
            .sub-title { font-size: 12px; font-weight: 700; color: #4A5568; background: #F7FAFC; margin: 12px -12px 8px; padding: 6px 12px; display: flex; justify-content: space-between; border-radius: 6px; }
            .total-row { background: #F0FAF5; border: 1px solid #C6E6D8; border-radius: 10px; padding: 14px 20px; display: flex; justify-content: space-between; }
            .total-row-label { font-size: 15px; font-weight: 900; color: #1A365D; }
            .total-row-value { font-size: 20px; font-weight: 900; color: #2D9B7A; }
            table { width: 100%; border-collapse: collapse; }
            .bal-badge { display: inline-block; padding: 2px 14px; border-radius: 12px; font-size: 11px; font-weight: 700; }
            .footer { text-align: center; margin-top: 20px; padding-top: 12px; border-top: 1px solid #E2E8F0; }
            .footer-text { font-size: 10px; color: #A0AEC0; font-weight: 600; }
            @media print {
              body { background: #FFFFFF; padding: 0; }
              .wrap { box-shadow: none; border-radius: 0; }
              .inner { padding: 20px 24px; }
              @page { margin: 12mm 10mm; size: A4 landscape; }
            }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="inner">
              <div class="header">
                <img class="header-logo" src="${resolvedLogoUrl}" alt="Logo" />
                <div class="header-center">
                  <div class="header-org-name">${resolvedOrgName}</div>
                  <div class="header-sub">${ar ? "قائمة المركز المالي" : "Statement of Financial Position"}</div>
                </div>
                <div class="header-left">${formatArabicDate(new Date())}</div>
              </div>
              <div class="title-section">
                <h1>${ar ? "قائمة المركز المالي" : "Statement of Financial Position"}</h1>
                <div class="title-sub">${ar ? "حتى تاريخ" : "As of"} ${values.toDate || defaultAsOf} ${centerId && centersQ.data?.items ? (ar ? "| المركز:" : "| Center:") + " " + centersQ.data.items.find((c: any) => c.id === centerId)?.name : ""}</div>
              </div>
              <div class="kpi-bar">
                <div class="kpi-card"><div class="kpi-card-value">${formatCurrency(data.assets.totalAssets)}</div><div class="kpi-card-label">${ar ? "إجمالي الأصول" : "Total Assets"}</div></div>
                <div class="kpi-card"><div class="kpi-card-value">${formatCurrency(data.liabilities.totalLiabilities)}</div><div class="kpi-card-label">${ar ? "إجمالي الخصوم" : "Total Liabilities"}</div></div>
                <div class="kpi-card"><div class="kpi-card-value">${formatCurrency(data.netAssets.totalNetAssets)}</div><div class="kpi-card-label">${ar ? "صافي الأصول" : "Net Assets"}</div></div>
                <div class="kpi-card" style="background:${data.isBalanced ? "#E4F4EE" : "#FDE8E8"};border-color:${data.isBalanced ? "#C6E6D8" : "#FECACA"};"><div class="kpi-card-value" style="color:${data.isBalanced ? "#2D9B7A" : "#E85858"}">${data.isBalanced ? (ar ? "متوازن" : "Balanced") : (ar ? "غير متوازن" : "Unbalanced")}</div><div class="kpi-card-label">${ar ? "حالة الميزان" : "Status"}</div></div>
              </div>
              <div class="grid">
                <div class="card">
                  <div class="card-title"><span>${ar ? "الأصول" : "Assets"}</span><span>${formatCurrency(data.assets.totalAssets)}</span></div>
                  ${data.assets.current.length > 0 ? `<div class="sub-title"><span>${ar ? "الأصول المتداولة" : "Current Assets"}</span><span>${formatCurrency(data.assets.current.reduce((s: number, i: any) => s + i.balance, 0))}</span></div>` : ""}
                  <table>${renderItems(data.assets.current, data.assets.current.length > 0)}</table>
                  <div class="sub-title"><span>${ar ? "الأصول الثابتة" : "Fixed Assets"}</span><span>${formatCurrency(data.assets.totalFixed)}</span></div>
                  <table>${renderItems(data.assets.fixed, true)}</table>
                </div>
                <div style="display:flex;flex-direction:column;gap:20px;">
                  <div class="card">
                    <div class="card-title"><span>${ar ? "الخصوم" : "Liabilities"}</span><span>${formatCurrency(data.liabilities.totalLiabilities)}</span></div>
                    ${data.liabilities.rows.length > 0 ? `<table>${renderItems(data.liabilities.rows)}</table>` : `<p style="text-align:center;color:#A0AEC0;font-size:13px;padding:12px;">${ar ? "لا توجد خصوم مسجلة" : "No liabilities recorded"}</p>`}
                  </div>
                  <div class="card">
                    <div class="card-title"><span>${ar ? "صافي الأصول" : "Net Assets"}</span><span>${formatCurrency(data.netAssets.totalNetAssets)}</span></div>
                    <div class="sub-title"><span>${ar ? "غير مقيدة" : "Unrestricted"}</span><span>${formatCurrency(data.netAssets.totalUnrestricted)}</span></div>
                    <table>${renderItems(data.netAssets.unrestricted)}</table>
                    <div class="sub-title"><span>${ar ? "مقيدة" : "Restricted"}</span><span>${formatCurrency(data.netAssets.totalRestricted)}</span></div>
                    <table>${renderItems(data.netAssets.restricted)}</table>
                  </div>
                  <div class="total-row">
                    <span class="total-row-label">${ar ? "إجمالي الخصوم وصافي الأصول" : "Total Liabilities & Net Assets"}</span>
                    <span class="total-row-value">${formatCurrency(totalLiabilitiesAndNet)}</span>
                  </div>
                </div>
              </div>
              <div class="footer">
                <div class="footer-text">${ar ? "نظام رفقاء القرآن - برنامج إدارة الجمعيات القرآنية" : "Rafiq Al-Quran System - Quranic Society Management"}</div>
              </div>
            </div>
          </div>
          <script>window.onload = function () { window.focus(); setTimeout(function () { window.print(); }, 300); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [data, ar, logoUrl, orgName, centerId, values, centersQ.data, defaultAsOf]);

  const handleExportPdf = useCallback(() => {
    handlePrint();
  }, [handlePrint]);

  const handleExportExcel = useCallback(() => {
    if (!data) return;

    const escapeCsv = (v: unknown) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const rows: string[] = [];
    rows.push([ar ? "كود" : "Code", ar ? "الاسم" : "Name", ar ? "التصنيف" : "Category", ar ? "المبلغ" : "Amount"].join(","));

    const addItems = (items: FinancialPositionItemV2[], category: string) => {
      items.forEach((item) => {
        rows.push([escapeCsv(item.code), escapeCsv(item.name), escapeCsv(category), item.balance.toFixed(2)].join(","));
      });
    };

    addItems(data.assets.current, ar ? "أصول متداولة" : "Current Assets");
    addItems(data.assets.fixed, ar ? "أصول ثابتة" : "Fixed Assets");
    rows.push([ar ? "إجمالي الأصول" : "Total Assets", "", "", data.assets.totalAssets.toFixed(2)].join(","));
    rows.push([ar ? "إجمالي الخصوم" : "Total Liabilities", "", "", data.liabilities.totalLiabilities.toFixed(2)].join(","));
    addItems(data.liabilities.rows, ar ? "خصوم" : "Liabilities");
    addItems(data.netAssets.unrestricted, ar ? "صافي أصول غير مقيدة" : "Unrestricted Net Assets");
    addItems(data.netAssets.restricted, ar ? "صافي أصول مقيدة" : "Restricted Net Assets");
    rows.push([ar ? "صافي الأصول" : "Net Assets", "", "", data.netAssets.totalNetAssets.toFixed(2)].join(","));

    const csv = "\uFEFF" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-position-${values.toDate || defaultAsOf}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, ar, values.toDate]);

  const balanceBadge = useMemo(() => data ? (
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
  ) : null, [data, ar]);

  const centerOptions = canLoadCenters && centersQ.data?.items
    ? centersQ.data.items.map((c: { id: number; name: string }) => ({ value: c.id, label: c.name }))
    : [];

  return (
    <ReportLayout
      definition={FINANCIAL_POSITION_DEF}
      filters={values}
      optionsMap={{ centerId: centerOptions }}
      onFilterChange={setFilter}
      onResetFilters={resetFilters}
      activeFilterCount={activeCount}
      onRefresh={() => void reportQ.refetch()}
      onBack={() => navigate("/reports")}
      onPrint={handlePrint}
      onExportPdf={handleExportPdf}
      onExportExcel={handleExportExcel}
      isLoading={reportQ.isLoading}
      error={reportQ.error as Error | null}
      isEmpty={!reportQ.isLoading && !reportQ.isError && !data}
      actions={balanceBadge}
    >
      {data && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(data.assets.totalAssets)}</div>
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-1">{ar ? "إجمالي الأصول" : "Total Assets"}</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{formatCurrency(data.liabilities.totalLiabilities)}</div>
              <div className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-1">{ar ? "إجمالي الخصوم" : "Total Liabilities"}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{formatCurrency(data.netAssets.totalNetAssets)}</div>
              <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mt-1">{ar ? "صافي الأصول" : "Net Assets"}</div>
            </div>
            <div className={`rounded-xl p-4 border ${data.isBalanced ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800"}`}>
              <div className={`text-2xl font-black tabular-nums ${data.isBalanced ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {data.isBalanced ? (ar ? "متوازن" : "Balanced") : (ar ? "غير متوازن" : "Unbalanced")}
              </div>
              <div className={`text-xs font-bold mt-1 ${data.isBalanced ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
                {ar ? "حالة الميزان" : "Balance Status"}
              </div>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ASSETS COLUMN */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <SectionTitle title={ar ? "الأصول" : "Assets"} amount={data.assets.totalAssets} />

              {data.assets.current.length > 0 && (
                <>
                  <SubSectionTitle
                    title={ar ? "الأصول المتداولة" : "Current Assets"}
                    amount={data.assets.current.reduce((s: number, i: FinancialPositionItemV2) => s + i.balance, 0)}
                  />
                  {data.assets.current.map((item: FinancialPositionItemV2) => (
                    <DataRow key={item.accountId} code={item.code} label={item.name} amount={item.balance} indent />
                  ))}
                </>
              )}

              <SubSectionTitle title={ar ? "الأصول الثابتة" : "Fixed Assets"} amount={data.assets.totalFixed} />
              {data.assets.fixed.map((item: FinancialPositionItemV2) => (
                <DataRow key={item.accountId} code={item.code} label={item.name} amount={item.balance} indent />
              ))}
              {data.assets.fixed.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-3">{ar ? "لا توجد أصول ثابتة" : "No fixed assets"}</p>
              )}
            </div>

            {/* LIABILITIES + NET ASSETS COLUMN */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <SectionTitle title={ar ? "الخصوم" : "Liabilities"} amount={data.liabilities.totalLiabilities} />
                {data.liabilities.rows.length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-4">{ar ? "لا توجد خصوم مسجلة" : "No liabilities recorded"}</p>
                ) : (
                  data.liabilities.rows.map((item: FinancialPositionItemV2) => (
                    <DataRow key={item.accountId} code={item.code} label={item.name} amount={item.balance} indent />
                  ))
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <SectionTitle title={ar ? "صافي الأصول" : "Net Assets"} amount={data.netAssets.totalNetAssets} />

                <SubSectionTitle title={ar ? "صافي أصول غير مقيدة" : "Unrestricted Net Assets"} amount={data.netAssets.totalUnrestricted} />
                {data.netAssets.unrestricted.map((item: FinancialPositionItemV2) => (
                  <DataRow key={item.accountId} code={item.code} label={item.name} amount={item.balance} indent />
                ))}
                {data.netAssets.unrestricted.length === 0 && (
                  <p className="text-xs text-gray-400 italic text-center py-2">{ar ? "لا توجد أصول غير مقيدة" : "No unrestricted net assets"}</p>
                )}

                <SubSectionTitle title={ar ? "صافي أصول مقيدة" : "Restricted Net Assets"} amount={data.netAssets.totalRestricted} />
                {data.netAssets.restricted.map((item: FinancialPositionItemV2) => (
                  <DataRow key={item.accountId} code={item.code} label={item.name} amount={item.balance} indent />
                ))}
                {data.netAssets.restricted.length === 0 && (
                  <p className="text-xs text-gray-400 italic text-center py-2">{ar ? "لا توجد أصول مقيدة" : "No restricted net assets"}</p>
                )}
              </div>

              {/* TOTAL FOOTER */}
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-700">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                    {ar ? "إجمالي الخصوم وصافي الأصول" : "Total Liabilities & Net Assets"}
                  </span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(totalLiabilitiesAndNet)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </ReportLayout>
  );
}
