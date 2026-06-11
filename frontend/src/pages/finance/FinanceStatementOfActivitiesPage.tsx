import { useState, useCallback } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../../app/i18n";
import { PageHeader } from "../../components/ui/PageHeader";
import { FilterBar } from "../../components/ui/FilterBar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAuthStore } from "../../features/auth/auth.store";
import { useOrgBrandingQuery, useCentersQuery } from "../../features/org/org.hooks";
import { canReadCenters } from "../../features/org/org.permissions";
import { useFinanceV2ReportStatementOfActivitiesQuery } from "../../features/finance-v2/finance-v2.hooks";
import { formatArabicDate } from "../../features/accounting/printAccounting";
import type { FinancialPositionItemV2 } from "../../features/finance-v2/types";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

const nowDate = new Date();
const defaultTo = nowDate.toISOString().slice(0, 10);
const defaultFrom = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1)
  .toISOString()
  .slice(0, 10);

export default function FinanceStatementOfActivitiesPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const brandingQ = useOrgBrandingQuery();
  const canLoadCenters = canReadCenters(user?.role);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [centerId, setCenterId] = useState<number | undefined>();

  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const reportQ = useFinanceV2ReportStatementOfActivitiesQuery({
    centerId,
    from,
    to
  });

  const data = reportQ.data;
  const logoUrl = brandingQ.data?.logoUrl || undefined;
  const orgName = brandingQ.data?.name || undefined;

  const SectionTitle = ({ title, amount, icon: Icon, colorClass }: { title: string; amount: number; icon: React.ElementType; colorClass: string }) => (
    <div className="flex justify-between items-center border-b-2 border-emerald-100 dark:border-emerald-900 pb-2 mb-4">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${colorClass}`}>
            <Icon size={18} className="text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(amount)}</span>
    </div>
  );

  const DataRow = ({ label, code, amount, isTotal = false }: { label: string; code?: string; amount: number; isTotal?: boolean }) => (
    <div className={`flex justify-between items-center py-2 text-sm border-b border-gray-50 dark:border-gray-800 last:border-0 ${isTotal ? 'border-t-2 border-gray-200 dark:border-gray-600 mt-2 pt-2 font-bold' : ''}`}>
      <div className="flex gap-2 items-center">
        {code && <span className="text-gray-400 dark:text-gray-500 font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{code}</span>}
        <span className={`${isTotal ? 'font-bold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300 font-medium'}`}>{label}</span>
      </div>
      <span className={`font-semibold tabular-nums ${isTotal ? 'text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'}`}>{formatCurrency(amount)}</span>
    </div>
  );

  const handlePrint = useCallback(() => {
    if (!data) return;

    const resolvedLogoUrl = logoUrl || "/brand/rafiq-logo.svg";
    const resolvedOrgName = orgName || (ar ? "جمعية رفقاء القرآن" : "Rafiq Al-Quran Association");
    const accentColor = "#2D9B7A";
    const accentLight = "#E4F4EE";

    const renderItems = (items: FinancialPositionItemV2[]) =>
      items.map((item) => `
        <tr>
          <td style="padding:5px 8px;border-bottom:1px solid #EDF2F7;font-size:12px;">
            <span style="color:#A0AEC0;font-family:monospace;font-size:11px;background:#F7FAFC;padding:1px 6px;border-radius:4px;">${item.code}</span>
            <span style="color:#4A5568;font-weight:600;margin-right:6px;">${item.name}</span>
          </td>
          <td style="padding:5px 8px;border-bottom:1px solid #EDF2F7;font-size:13px;font-weight:700;color:#2D3748;text-align:left;white-space:nowrap;direction:ltr;">${formatCurrency(item.balance)}</td>
        </tr>`).join("");

    const sectionRows = (title: string, items: FinancialPositionItemV2[]) =>
      items.length > 0 ? `<div style="margin-bottom:8px;"><h4 style="font-size:11px;font-weight:800;color:#718096;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${title}</h4><table>${renderItems(items)}</table></div>` : "";

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>${ar ? "قائمة الأنشطة" : "Statement of Activities"}</title>
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
            .kpi-card-value { font-size: 18px; font-weight: 900; }
            .kpi-card-label { font-size: 11px; font-weight: 700; color: #718096; margin-top: 2px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
            .card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; }
            .card-title { font-size: 15px; font-weight: 900; color: #1A365D; border-bottom: 2px solid #E4F4EE; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; }
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
                  <div class="header-sub">${ar ? "قائمة الأنشطة" : "Statement of Activities"}</div>
                </div>
                <div class="header-left">${formatArabicDate(new Date())}</div>
              </div>
              <div class="title-section">
                <h1>${ar ? "قائمة الأنشطة (الإيرادات والمصروفات)" : "Statement of Activities"}</h1>
                <div class="title-sub">${ar ? "من" : "From"} ${from} ${ar ? "إلى" : "to"} ${to}</div>
              </div>
              <div class="kpi-bar">
                <div class="kpi-card" style="background:#F2FAF6;border-color:#C6E6D8;"><div class="kpi-card-value" style="color:#2D9B7A;">${formatCurrency(data.revenue.totalRevenue)}</div><div class="kpi-card-label">${ar ? "إجمالي الإيرادات" : "Total Revenue"}</div></div>
                <div class="kpi-card" style="background:#FFF5F5;border-color:#FECACA;"><div class="kpi-card-value" style="color:#E85858;">${formatCurrency(data.expenses.totalExpenses)}</div><div class="kpi-card-label">${ar ? "إجمالي المصروفات" : "Total Expenses"}</div></div>
                <div class="kpi-card" style="background:${data.surplusOrDeficit >= 0 ? "#F2FAF6" : "#FFF5F5"};border-color:${data.surplusOrDeficit >= 0 ? "#C6E6D8" : "#FECACA"};"><div class="kpi-card-value" style="color:${data.surplusOrDeficit >= 0 ? "#2D9B7A" : "#E85858"};">${data.surplusOrDeficit >= 0 ? "+" : ""}${formatCurrency(data.surplusOrDeficit)}</div><div class="kpi-card-label">${ar ? "الفائض / العجز" : "Surplus / Deficit"}</div></div>
              </div>
              <div class="grid">
                <div class="card">
                  <div class="card-title"><span>${ar ? "الإيرادات" : "Revenue"}</span><span style="color:#2D9B7A;">${formatCurrency(data.revenue.totalRevenue)}</span></div>
                  ${sectionRows(ar ? "اشتراكات الطلاب" : "Student Contributions", data.revenue.studentContributions)}
                  ${sectionRows(ar ? "التبرعات" : "Donations", data.revenue.donations)}
                  ${data.revenue.other.length > 0 ? sectionRows(ar ? "إيرادات أخرى" : "Other Revenue", data.revenue.other) : ""}
                </div>
                <div class="card">
                  <div class="card-title"><span>${ar ? "المصروفات" : "Expenses"}</span><span style="color:#E85858;">${formatCurrency(data.expenses.totalExpenses)}</span></div>
                  ${sectionRows(ar ? "الرواتب والأجور" : "Payroll & Wages", data.expenses.payroll)}
                  ${sectionRows(ar ? "المصروفات التشغيلية" : "Operating Expenses", data.expenses.operating)}
                  ${sectionRows(ar ? "المصروفات التعليمية" : "Educational Expenses", data.expenses.educational)}
                  ${data.expenses.centers.length > 0 ? sectionRows(ar ? "مصروفات المراكز" : "Center Expenses", data.expenses.centers) : ""}
                  ${data.expenses.depreciation.length > 0 ? sectionRows(ar ? "الإهلاكات" : "Depreciation", data.expenses.depreciation) : ""}
                  ${data.expenses.other.length > 0 ? sectionRows(ar ? "مصروفات أخرى" : "Other Expenses", data.expenses.other) : ""}
                </div>
              </div>
              <div style="margin-top:20px;background:${data.surplusOrDeficit >= 0 ? "#F0FAF5" : "#FFF5F5"};border:1px solid ${data.surplusOrDeficit >= 0 ? "#C6E6D8" : "#FECACA"};border-radius:12px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:16px;font-weight:900;color:#1A365D;">${data.surplusOrDeficit >= 0 ? (ar ? "فائض الفترة" : "Surplus for the Period") : (ar ? "عجز الفترة" : "Deficit for the Period")}</span>
                <span style="font-size:24px;font-weight:900;color:${data.surplusOrDeficit >= 0 ? "#2D9B7A" : "#E85858"};">${data.surplusOrDeficit >= 0 ? "+" : ""}${formatCurrency(data.surplusOrDeficit)}</span>
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
  }, [data, ar, logoUrl, orgName, from, to]);

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

    addItems(data.revenue.studentContributions, ar ? "إيرادات - اشتراكات" : "Revenue - Contributions");
    addItems(data.revenue.donations, ar ? "إيرادات - تبرعات" : "Revenue - Donations");
    addItems(data.revenue.other, ar ? "إيرادات - أخرى" : "Revenue - Other");
    rows.push([ar ? "إجمالي الإيرادات" : "Total Revenue", "", "", data.revenue.totalRevenue.toFixed(2)].join(","));
    addItems(data.expenses.payroll, ar ? "مصروفات - رواتب" : "Expenses - Payroll");
    addItems(data.expenses.operating, ar ? "مصروفات - تشغيلية" : "Expenses - Operating");
    addItems(data.expenses.educational, ar ? "مصروفات - تعليمية" : "Expenses - Educational");
    addItems(data.expenses.centers, ar ? "مصروفات - مراكز" : "Expenses - Centers");
    addItems(data.expenses.depreciation, ar ? "مصروفات - إهلاكات" : "Expenses - Depreciation");
    addItems(data.expenses.other, ar ? "مصروفات - أخرى" : "Expenses - Other");
    rows.push([ar ? "إجمالي المصروفات" : "Total Expenses", "", "", data.expenses.totalExpenses.toFixed(2)].join(","));
    rows.push([ar ? "الفائض/العجز" : "Surplus/Deficit", "", "", data.surplusOrDeficit.toFixed(2)].join(","));

    const csv = "\uFEFF" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statement-of-activities-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, ar, from, to]);

  return (
    <div className="page p-6 max-w-5xl mx-auto space-y-6">
      <Link
        to="/reports"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <ArrowLeft className={`w-4 h-4 mr-1 ${ar ? "rotate-180 ml-1 mr-0" : ""}`} />
        {ar ? "العودة للتقارير" : "Back to Reports"}
      </Link>

      <PageHeader
        title={ar ? "قائمة الأنشطة (الإيرادات والمصروفات)" : "Statement of Activities"}
        description={
          ar
            ? "تعرض ملخص الإيرادات والمصروفات والفائض أو العجز خلال فترة محددة."
            : "Displays a summary of revenue, expenses, and surplus or deficit over a specific period."
        }
        icon={<Activity className="w-6 h-6 text-emerald-600" />}
      />

      <FilterBar
        onReset={() => {
          setFrom(defaultFrom);
          setTo(defaultTo);
          setCenterId(undefined);
        }}
        activeFiltersCount={
          (from !== defaultFrom ? 1 : 0) +
          (to !== defaultTo ? 1 : 0) +
          (centerId ? 1 : 0)
        }
      >
        <div className="flex flex-wrap gap-3">
          {canLoadCenters && (
            <Select
              className="w-48"
              value={centerId || ""}
              onChange={(e) => setCenterId(Number(e.target.value) || undefined)}
            >
              <option value="">{ar ? "كل المراكز" : "All Centers"}</option>
              {centersQ.data?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span className="text-gray-400">→</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 no-print">
            <Button
              variant="secondary"
              size="sm"
              className="glass-btn"
              leftIcon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
              onClick={handlePrint}
              disabled={!data}
            >
              {ar ? "طباعة" : "Print"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="glass-btn"
              leftIcon={<TrendingDown className="w-4 h-4 text-rose-600" />}
              onClick={handleExportExcel}
              disabled={!data}
            >
              {ar ? "تصدير Excel" : "Export"}
            </Button>
          </div>
        </div>
      </FilterBar>

      {reportQ.isLoading ? (
        <LoadingState />
      ) : reportQ.isError ? (
        <ErrorState
          title={ar ? "فشل تحميل التقرير" : "Failed to load report"}
          description={getLocalizedApiErrorMessage(reportQ.error, {
            ar,
            fallback: ar ? "تعذر تحميل قائمة الأنشطة. حاول مرة أخرى." : "Unable to load the statement of activities."
          })}
          onRetry={() => void reportQ.refetch()}
        />
      ) : !data ? (
        <LoadingState />
      ) : (
        <div className="space-y-8">
          {/* KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(data.revenue.totalRevenue)}</div>
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-1">{ar ? "إجمالي الإيرادات" : "Total Revenue"}</div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 border border-rose-100 dark:border-rose-800">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">{formatCurrency(data.expenses.totalExpenses)}</div>
              <div className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-1">{ar ? "إجمالي المصروفات" : "Total Expenses"}</div>
            </div>
            <div className={`rounded-xl p-4 border ${data.surplusOrDeficit >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800"}`}>
              <div className={`text-2xl font-black tabular-nums ${data.surplusOrDeficit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {data.surplusOrDeficit >= 0 ? "+" : ""}{formatCurrency(data.surplusOrDeficit)}
              </div>
              <div className={`text-xs font-bold mt-1 ${data.surplusOrDeficit >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
                {ar ? "الفائض / العجز" : "Surplus / Deficit"}
              </div>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Revenue Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
              <SectionTitle 
                title={ar ? "الإيرادات" : "Revenue"} 
                amount={data.revenue.totalRevenue} 
                icon={TrendingUp} 
                colorClass="bg-emerald-500" 
              />
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "اشتراكات الطلاب" : "Student Contributions"}</h4>
                  {data.revenue.studentContributions.map((item: FinancialPositionItemV2) => (
                    <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                  ))}
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "التبرعات" : "Donations"}</h4>
                  {data.revenue.donations.map((item: FinancialPositionItemV2) => (
                    <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                  ))}
                </div>

                {data.revenue.other.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "إيرادات أخرى" : "Other Revenue"}</h4>
                    {data.revenue.other.map((item: FinancialPositionItemV2) => (
                      <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Expenses Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <SectionTitle 
                title={ar ? "المصروفات" : "Expenses"} 
                amount={data.expenses.totalExpenses} 
                icon={TrendingDown} 
                colorClass="bg-rose-500" 
              />
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "الرواتب والأجور" : "Payroll & Wages"}</h4>
                  {data.expenses.payroll.map((item: FinancialPositionItemV2) => (
                    <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                  ))}
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "المصروفات التشغيلية" : "Operating Expenses"}</h4>
                  {data.expenses.operating.map((item: FinancialPositionItemV2) => (
                    <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                  ))}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "المصروفات التعليمية" : "Educational Expenses"}</h4>
                  {data.expenses.educational.map((item: FinancialPositionItemV2) => (
                    <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                  ))}
                </div>

                {data.expenses.centers.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "مصروفات المراكز" : "Center Expenses"}</h4>
                    {data.expenses.centers.map((item: FinancialPositionItemV2) => (
                      <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                    ))}
                  </div>
                )}

                {data.expenses.depreciation.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "الإهلاكات" : "Depreciation"}</h4>
                    {data.expenses.depreciation.map((item: FinancialPositionItemV2) => (
                      <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                    ))}
                  </div>
                )}

                {data.expenses.other.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{ar ? "مصروفات أخرى" : "Other Expenses"}</h4>
                    {data.expenses.other.map((item: FinancialPositionItemV2) => (
                      <DataRow key={item.accountId} label={item.name} code={item.code} amount={item.balance} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Surplus/Deficit Summary */}
          <div className={`rounded-2xl p-8 border ${data.surplusOrDeficit >= 0 ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/50' : 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-800/50'}`}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${data.surplusOrDeficit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                  {data.surplusOrDeficit >= 0 ? <TrendingUp className="text-white" size={32} /> : <TrendingDown className="text-white" size={32} />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.surplusOrDeficit >= 0 ? (ar ? "فائض الفترة" : "Surplus for the Period") : (ar ? "عجز الفترة" : "Deficit for the Period")}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    {ar ? "صافي التغير في الأصول خلال الفترة المختارة" : "Net change in assets during the selected period"}
                  </p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <span className={`text-4xl font-black ${data.surplusOrDeficit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {data.surplusOrDeficit >= 0 ? "+" : ""}
                  {formatCurrency(data.surplusOrDeficit)}
                </span>
                <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">YER</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
