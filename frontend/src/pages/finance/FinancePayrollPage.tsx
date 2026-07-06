import {
  Wallet,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Users,
  Award,
  TrendingDown,
  BarChart3,
  FileText,
  CheckCircle,
  XCircle,
  Search
} from "lucide-react";
import { Suspense, lazy, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "../../app/i18n";
import { useAuthStore } from "../../features/auth/auth.store";
import { Button } from "../../components/ui/Button";
import { LoadingState } from "../../components/ui/LoadingState";
import { voucherStatusLabels, methodLabels } from "../../features/finance-v2/components/FinanceShared";
import { useCentersQuery } from "../../features/org/org.hooks";
import {
  FinancePageShell,
  FinancePageHeader,
  FinanceMoney
} from "../../features/finance-v2/design";
import {
  useFinanceV2PayrollBatchesQuery,
  useFinanceV2PayrollProfilesQuery,
  useFinanceV2SalaryGradesQuery,
  useExchangeRatesQuery
} from "../../features/finance-v2/finance-v2.hooks";
import type { PayrollBatchStatusV2 } from "../../features/finance-v2/types";

import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/finance-v4.css";
import "../../styles/pages/vouchers-premium.css";

const FinancePayrollTab = lazy(() => import("../../features/finance-v2/components/tabs/FinancePayrollTab"));
const FinanceSalaryGradesTab = lazy(() => import("../../features/finance-v2/components/tabs/FinanceSalaryGradesTab"));
const FinancePayrollProfilesTab = lazy(() => import("../../features/finance-v2/components/tabs/FinancePayrollProfilesTab"));
const FinanceDeductionReview = lazy(() =>
  import("../../features/staff-attendance/components/FinanceDeductionReview").then(m => ({ default: m.FinanceDeductionReview }))
);

// ─── Shared KPI card ─────────────────────────────────────────────────────────
function PayrollKpi({
  icon: Icon,
  cls,
  val,
  label
}: {
  icon: React.ElementType;
  cls: string;
  val: React.ReactNode;
  label: string;
}) {
  return (
    <motion.div
      className={`ctr-kpi-modern ${cls}`}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
    >
      <div className="ctr-kpi-icon-wrap">
        <Icon size={24} />
      </div>
      <div className="ctr-kpi-content">
        <span className="ctr-kpi-val">{val}</span>
        <span className="ctr-kpi-label">{label}</span>
      </div>
    </motion.div>
  );
}

// ─── Arabic month label ───────────────────────────────────────────────────────
const AR_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── Active tab type ──────────────────────────────────────────────────────────
type PayrollTab = "batches" | "profiles" | "grades" | "deductions";

// ─── Payroll batch status labels (subset used in filter) ─────────────────────
const BATCH_STATUS_LIST: PayrollBatchStatusV2[] = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "IN_PROGRESS", "PARTIALLY_PAID", "PAID", "CANCELLED"];

// ─── Profile status options ───────────────────────────────────────────────────
type ProfileStatusFilter = "" | "active" | "inactive";

export default function FinancePayrollPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);

  // ── Role-based access flags ───────────────────────────────────────────────
  const canCreatePayrollBatch =
    user?.role === "SUPER_ADMIN" || user?.role === "ACCOUNTANT" || user?.role === "FINANCE_MANAGER";
  const canPayPayroll =
    user?.role === "SUPER_ADMIN" || user?.role === "TREASURER";
  const canApproveBatch =
    user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_MANAGER";
  const canManageProfiles =
    user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_MANAGER";
  const canManageGrades =
    user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_MANAGER";
  const canViewDeductions =
    user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_MANAGER" || user?.role === "ACCOUNTANT";

  // ── Active tab ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<PayrollTab>("batches");

  // ── Modal open signals (lifted into page so header buttons can trigger) ───
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);

  // ── Shared date/center state (batches + deductions) ───────────────────────
  const now = new Date();
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();

  const [centerId, setCenterId] = useState<number | undefined>();
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [batchStatus, setBatchStatus] = useState<PayrollBatchStatusV2 | "">("");

  // ── Profiles tab local filters ────────────────────────────────────────────
  const [profileCenterId, setProfileCenterId] = useState<number | undefined>();
  const [profileStatus, setProfileStatus] = useState<ProfileStatusFilter>("");
  const [profileSearch, setProfileSearch] = useState("");

  // ── Grades tab local filter ───────────────────────────────────────────────
  // removed gradeSearch as it's no longer used

  // ── Center list (shared) ──────────────────────────────────────────────────
  const centersQ = useCentersQuery();
  const centers = useMemo(() => centersQ.data?.items ?? [], [centersQ.data?.items]);

  // ── Batches data + KPIs ───────────────────────────────────────────────────
  const batchesQ = useFinanceV2PayrollBatchesQuery(centerId, year, month);
  const batches = useMemo(
    () => (batchesQ.data?.rows ?? []).filter((b: any) => !batchStatus || b.status === batchStatus),
    [batchesQ.data?.rows, batchStatus]
  );

  const batchStats = useMemo(() => {
    let totalBase = 0;
    let totalBonus = 0;
    let totalDeduction = 0;
    let totalNet = 0;
    let employeeCount = 0;

    for (const batch of batches) {
      for (const item of (batch.items ?? [])) {
        // Exclude duplicates/excluded employees from the aggregates
        if (item._duplicatePaid) continue;
        totalBase += item.baseAmount;
        totalBonus += item.bonusAmount;
        totalDeduction += item.deductionAmount;
        totalNet += item.netAmount;
        employeeCount += 1;
      }
    }

    return { totalBase, totalBonus, totalDeduction, totalNet, batchCount: batches.length, employeeCount };
  }, [batches]);

  // ── Profiles data + KPIs ──────────────────────────────────────────────────
  const profilesQ = useFinanceV2PayrollProfilesQuery(profileCenterId);
  const allProfiles = useMemo(() => profilesQ.data?.rows ?? [], [profilesQ.data?.rows]);

  const profileStats = useMemo(() => {
    const active = allProfiles.filter((p: any) => p.isActive);
    const inactive = allProfiles.filter((p: any) => !p.isActive);
    const totalMonthly = active.reduce((sum: number, p: any) => sum + (p.monthlyBaseAmount ?? 0), 0);
    const avg = active.length > 0 ? totalMonthly / active.length : 0;
    return { total: allProfiles.length, active: active.length, inactive: inactive.length, totalMonthly, avg };
  }, [allProfiles]);

  // ── Grades data + KPIs ────────────────────────────────────────────────────
  const gradesQ = useFinanceV2SalaryGradesQuery(undefined);
  const allGrades = useMemo(() => gradesQ.data ?? [], [gradesQ.data]);

  const ratesQ = useExchangeRatesQuery();
  const rates = useMemo(() => ratesQ.data ?? [], [ratesQ.data]);

  const gradeStats = useMemo(() => {
    const active = allGrades.filter((g: any) => g.isActive);
    
    const latestRates: Record<string, number> = { YER: 1 };
    rates.forEach((r: any) => {
      if (!latestRates[r.currencyCode]) {
         latestRates[r.currencyCode] = r.rateToBase;
      }
    });

    const equivalentSalaries = active.map((g: any) => {
       const code = g.currencyCode || "YER";
       const rate = latestRates[code] || 1;
       return g.baseSalary * rate;
    });
      
    const minSalary = equivalentSalaries.length > 0 ? Math.min(...equivalentSalaries) : 0;
    const maxSalary = equivalentSalaries.length > 0 ? Math.max(...equivalentSalaries) : 0;

    return { total: allGrades.length, active: active.length, minSalary, maxSalary };
  }, [allGrades, rates]);

  // ── Refresh handler per tab ───────────────────────────────────────────────
  const handleRefresh = () => {
    if (activeTab === "batches") batchesQ.refetch();
    else if (activeTab === "profiles") profilesQ.refetch();
    else if (activeTab === "grades") gradesQ.refetch();
  };

  const isRefreshing =
    (activeTab === "batches" && batchesQ.isFetching) ||
    (activeTab === "profiles" && profilesQ.isFetching) ||
    (activeTab === "grades" && gradesQ.isFetching);

  // ═════════════════════════════════════════════════════════════════════════════
  // KPI section — rendered per tab
  // ═════════════════════════════════════════════════════════════════════════════
  const kpisSection = (() => {
    if (activeTab === "batches") {
      return (
        <div className="ctr-kpis-modern">
          <PayrollKpi
            icon={Wallet}
            cls="brand"
            val={<FinanceMoney amount={batchStats.totalBase} baseCurrency="YER" />}
            label={ar ? "إجمالي الأساسي" : "Total Base"}
          />
          <PayrollKpi
            icon={ArrowUpRight}
            cls="blue"
            val={<FinanceMoney amount={batchStats.totalBonus} baseCurrency="YER" />}
            label={ar ? "إجمالي البدلات" : "Total Bonuses"}
          />
          <PayrollKpi
            icon={ArrowDownLeft}
            cls="rose"
            val={<FinanceMoney amount={batchStats.totalDeduction} baseCurrency="YER" />}
            label={ar ? "إجمالي الخصميات" : "Total Deductions"}
          />
          <PayrollKpi
            icon={TrendingDown}
            cls="emerald"
            val={<FinanceMoney amount={batchStats.totalNet} baseCurrency="YER" />}
            label={ar ? "الصافي للصرف" : "Total Net"}
          />
          <PayrollKpi
            icon={Users}
            cls="violet"
            val={batchStats.employeeCount}
            label={ar ? "عدد الموظفين" : "Employees"}
          />
        </div>
      );
    }

    if (activeTab === "profiles") {
      return (
        <div className="ctr-kpis-modern">
          <PayrollKpi
            icon={FileText}
            cls="brand"
            val={profileStats.total}
            label={ar ? "إجمالي الملفات" : "Total Profiles"}
          />
          <PayrollKpi
            icon={CheckCircle}
            cls="emerald"
            val={profileStats.active}
            label={ar ? "الملفات النشطة" : "Active Profiles"}
          />
          <PayrollKpi
            icon={XCircle}
            cls="rose"
            val={profileStats.inactive}
            label={ar ? "الملفات غير النشطة" : "Inactive Profiles"}
          />
          <PayrollKpi
            icon={Wallet}
            cls="blue"
            val={<FinanceMoney amount={profileStats.totalMonthly} baseCurrency="YER" />}
            label={ar ? "إجمالي الرواتب الشهرية" : "Monthly Total"}
          />
          <PayrollKpi
            icon={BarChart3}
            cls="amber"
            val={<FinanceMoney amount={profileStats.avg} baseCurrency="YER" />}
            label={ar ? "متوسط الراتب" : "Avg. Salary"}
          />
        </div>
      );
    }

    if (activeTab === "grades") {
      return (
        <div className="ctr-kpis-modern">
          <PayrollKpi
            icon={Award}
            cls="brand"
            val={gradeStats.total}
            label={ar ? "إجمالي الدرجات" : "Total Grades"}
          />
          <PayrollKpi
            icon={CheckCircle}
            cls="emerald"
            val={gradeStats.active}
            label={ar ? "الدرجات النشطة" : "Active Grades"}
          />
          <PayrollKpi
            icon={ArrowUpRight}
            cls="rose"
            val={<FinanceMoney amount={gradeStats.maxSalary} baseCurrency="YER" />}
            label={ar ? "أعلى راتب" : "Max Salary"}
          />
          <PayrollKpi
            icon={ArrowDownLeft}
            cls="blue"
            val={<FinanceMoney amount={gradeStats.minSalary} baseCurrency="YER" />}
            label={ar ? "أقل راتب" : "Min Salary"}
          />
        </div>
      );
    }

    // deductions tab — KPIs are rendered inside FinanceDeductionReview itself
    return null;
  })();

  // ═════════════════════════════════════════════════════════════════════════════
  // Toolbar / Filter bar — rendered per tab
  // ═════════════════════════════════════════════════════════════════════════════
  const toolbarSection = (() => {
    // ── Batches toolbar ───────────────────────────────────────────────────────
    if (activeTab === "batches") {
      return (
        <div className="fin-filters-container" dir={ar ? "rtl" : "ltr"}>
          <div className="fin-filters-scroll">
            {/* Center */}
            <div className="fin-filter-item min-w-[180px]">
              <select
                value={centerId ?? ""}
                onChange={(e) => setCenterId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">{ar ? "كل المراكز" : "All Centers"}</option>
                {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {/* Month */}
            <div className="fin-filter-item min-w-[140px]">
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{ar ? AR_MONTHS[i] : EN_MONTHS[i]}</option>
                ))}
              </select>
            </div>
            {/* Year */}
            <div className="fin-filter-item w-28">
              <input
                type="number" min={2000} max={2100} value={year}
                onChange={(e) => setYear(Math.min(2100, Math.max(2000, Number(e.target.value))))}
              />
            </div>
            {/* Batch status */}
            <div className="fin-filter-item min-w-[160px]">
              <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value as any)}>
                <option value="">{ar ? "كل الحالات" : "All Statuses"}</option>
                {BATCH_STATUS_LIST.map((s) => (
                  <option key={s} value={s}>{voucherStatusLabels[s] ?? s}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            className="fin-filter-reset"
            onClick={() => { setCenterId(undefined); setMonth(defaultMonth); setYear(defaultYear); setBatchStatus(""); }}
          >
            <RefreshCw className="w-4 h-4" />
            <span>{ar ? "إعادة ضبط" : "Reset"}</span>
          </button>
        </div>
      );
    }

    // ── Profiles toolbar ──────────────────────────────────────────────────────
    if (activeTab === "profiles") {
      return (
        <div className="fin-filters-container" dir={ar ? "rtl" : "ltr"}>
          <div className="fin-filters-scroll">
            {/* Center */}
            <div className="fin-filter-item min-w-[180px]">
              <select
                value={profileCenterId ?? ""}
                onChange={(e) => setProfileCenterId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">{ar ? "كل المراكز" : "All Centers"}</option>
                {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {/* Profile active status */}
            <div className="fin-filter-item min-w-[150px]">
              <select value={profileStatus} onChange={(e) => setProfileStatus(e.target.value as ProfileStatusFilter)}>
                <option value="">{ar ? "كل الحالات" : "All Statuses"}</option>
                <option value="active">{ar ? "نشط" : "Active"}</option>
                <option value="inactive">{ar ? "غير نشط" : "Inactive"}</option>
              </select>
            </div>
            {/* Employee search */}
            <div className="fin-filter-item min-w-[220px]">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                className="bg-transparent border-none outline-none w-full text-sm"
                placeholder={ar ? "ابحث باسم الموظف..." : "Search employee..."}
                value={profileSearch}
                onChange={(e) => setProfileSearch(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            className="fin-filter-reset"
            onClick={() => { setProfileCenterId(undefined); setProfileStatus(""); setProfileSearch(""); }}
          >
            <RefreshCw className="w-4 h-4" />
            <span>{ar ? "إعادة ضبط" : "Reset"}</span>
          </button>
        </div>
      );
    }

    // ── Grades toolbar ────────────────────────────────────────────────────────
    if (activeTab === "grades") {
      return null;
    }

    // deductions — no external toolbar (FinanceDeductionReview owns its filters)
    return null;
  })();

  // ═════════════════════════════════════════════════════════════════════════════
  // Header action buttons — rendered per tab
  // ═════════════════════════════════════════════════════════════════════════════
  const headerActions = (
    <div className="flex items-center gap-3">
      {/* Refresh — only for tabs where we control the query */}
      {activeTab !== "deductions" && (
        <Button
          variant="secondary"
          size="sm"
          className="glass-btn"
          leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />}
          onClick={handleRefresh}
        >
          {ar ? "تحديث" : "Refresh"}
        </Button>
      )}

      {/* Batches — إنشاء مسير */}
      {activeTab === "batches" && canCreatePayrollBatch && (
        <Button
          variant="primary"
          size="sm"
          className="shadow-lg shadow-brand-500/20"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowBatchModal(true)}
        >
          {ar ? "إنشاء مسير" : "New Batch"}
        </Button>
      )}

      {/* Profiles — إنشاء ملف راتب */}
      {activeTab === "profiles" && canManageProfiles && (
        <Button
          variant="primary"
          size="sm"
          className="shadow-lg shadow-brand-500/20"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowProfileModal(true)}
        >
          {ar ? "إنشاء ملف راتب" : "Create Profile"}
        </Button>
      )}

      {/* Grades — إضافة درجة راتب */}
      {activeTab === "grades" && canManageGrades && (
        <Button
          variant="primary"
          size="sm"
          className="shadow-lg shadow-brand-500/20"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowGradeModal(true)}
        >
          {ar ? "إضافة درجة راتب" : "Add Salary Grade"}
        </Button>
      )}
    </div>
  );

  // ═════════════════════════════════════════════════════════════════════════════
  // Render
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <FinancePageShell
      className="fin-premium-container ctr-page-modern"
      dir={ar ? "rtl" : "ltr"}
      header={
        <div className="fin-premium-header">
          <FinancePageHeader
            title={ar ? "الرواتب والاستقطاعات" : "Payroll & Deductions"}
            subtitle={
              ar
                ? "إدارة مستحقات الموظفين والمعلمين والاستقطاعات الشهرية"
                : "Manage employee/teacher entitlements and monthly deductions"
            }
            icon={<Wallet className="w-6 h-6 text-brand-600" />}
            actions={headerActions}
          />

          {/* ── Tab bar ── */}
          <nav className="exams-tabs-bar mt-6" aria-label={ar ? "تبويبات الرواتب" : "Payroll tabs"}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "batches"}
              className={`exams-tab-btn ${activeTab === "batches" ? "exams-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("batches")}
            >
              <Wallet size={16} />
              <span>{ar ? "مسيرات الرواتب" : "Payroll Batches"}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "profiles"}
              className={`exams-tab-btn ${activeTab === "profiles" ? "exams-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("profiles")}
            >
              <FileText size={16} />
              <span>{ar ? "ملفات الرواتب" : "Payroll Profiles"}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "grades"}
              className={`exams-tab-btn ${activeTab === "grades" ? "exams-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("grades")}
            >
              <Award size={16} />
              <span>{ar ? "سلم الرواتب" : "Salary Scales"}</span>
            </button>
            {canViewDeductions && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "deductions"}
                className={`exams-tab-btn ${activeTab === "deductions" ? "exams-tab-btn--active" : ""}`}
                onClick={() => setActiveTab("deductions")}
              >
                <Shield size={16} />
                <span>{ar ? "الخصومات المالية" : "Finance Deductions"}</span>
              </button>
            )}
          </nav>
        </div>
      }
      kpis={kpisSection ? <div>{kpisSection}</div> : undefined}
      toolbar={toolbarSection ?? undefined}
    >
      <div className="mt-4 animate-premium">
        <Suspense fallback={<LoadingState />}>
          {/* ── Batches ── */}
          {activeTab === "batches" && (
            <FinancePayrollTab
              centerId={centerId}
              year={year}
              month={month}
              status={batchStatus}
              isAdmin={canPayPayroll}
              isSuperAdmin={user?.role === "SUPER_ADMIN"}
              canCreateBatch={canCreatePayrollBatch}
              canApproveBatch={canApproveBatch}
              ar={ar}
              methodLabels={methodLabels}
              centers={centers}
              externalShowBatchForm={canCreatePayrollBatch && showBatchModal}
              onExternalBatchFormClose={() => setShowBatchModal(false)}
            />
          )}

          {/* ── Profiles ── */}
          {activeTab === "profiles" && (
            <FinancePayrollProfilesTab
              centerId={profileCenterId}
              ar={ar}
              centers={centers}
              canManage={canManageProfiles}
              externalShowForm={canManageProfiles && showProfileModal}
              onExternalFormClose={() => setShowProfileModal(false)}
            />
          )}

          {/* ── Grades ── */}
          {activeTab === "grades" && (
            <FinanceSalaryGradesTab
              centerId={undefined}
              ar={ar}
              canManage={canManageGrades}
              externalShowForm={canManageGrades && showGradeModal}
              onExternalFormClose={() => setShowGradeModal(false)}
            />
          )}

          {/* ── Deductions ──
              Pass embedded=true so the component removes its outer workspace padding.
              Pass hideKpis=false and hideFilters=false so they render once inside the component.
              The page itself renders NO kpis or toolbar for this tab (kpisSection/toolbarSection return null).
          */}
          {activeTab === "deductions" && canViewDeductions && (
            <FinanceDeductionReview
              embedded={true}
              hideKpis={false}
              hideFilters={false}
              hideSubTabs={false}
              externalMonth={month}
              externalYear={year}
              externalCenterId={centerId ?? null}
            />
          )}
        </Suspense>
      </div>
    </FinancePageShell>
  );
}
