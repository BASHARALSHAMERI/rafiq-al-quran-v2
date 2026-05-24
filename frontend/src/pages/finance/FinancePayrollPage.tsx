import { 
  Wallet, 
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import { Suspense, lazy, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "../../app/i18n";
import { useAuthStore } from "../../features/auth/auth.store";
import { Button } from "../../components/ui/Button";
import { LoadingState } from "../../components/ui/LoadingState";
import { FinancePageFilters } from "../../features/finance-v2/components/page/FinancePageFilters";
import { statusLabels, methodLabels } from "../../features/finance-v2/components/FinanceShared";
import { useCentersQuery } from "../../features/org/org.hooks";
import { 
  FinancePageShell, 
  FinancePageHeader,
  FinanceMoney 
} from "../../features/finance-v2/design";
import { useFinanceV2PayrollBatchesQuery } from "../../features/finance-v2/finance-v2.hooks";

import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/finance-v4.css";

const FinancePayrollTab = lazy(() => import("../../features/finance-v2/components/tabs/FinancePayrollTab"));
const FinanceSalaryGradesTab = lazy(() => import("../../features/finance-v2/components/tabs/FinanceSalaryGradesTab"));
const FinancePayrollProfilesTab = lazy(() => import("../../features/finance-v2/components/tabs/FinancePayrollProfilesTab"));

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

export default function FinancePayrollPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const isCoreAdmin = user?.role === "SUPER_ADMIN" || user?.role === "CENTER_ADMIN";
  const canCreatePayrollBatch = isCoreAdmin || user?.role === "ACCOUNTANT";

  const now = new Date();
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();

  const [centerId, setCenterId] = useState<number | undefined>();
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [status, setStatus] = useState<any>("");
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"batches" | "profiles" | "grades">("batches");

  const centersQ = useCentersQuery();
  const centers = useMemo(() => centersQ.data?.items ?? [], [centersQ.data?.items]);

  const batchesQ = useFinanceV2PayrollBatchesQuery(centerId, year, month);
  const batches = useMemo(() => batchesQ.data?.rows ?? [], [batchesQ.data?.rows]);

  const stats = useMemo(() => {
    let totalBase = 0;
    let totalDeduction = 0;
    let totalNet = 0;

    for (const batch of batches) {
      for (const item of (batch.items ?? [])) {
        totalBase += item.baseAmount;
        totalDeduction += item.deductionAmount;
        totalNet += item.netAmount;
      }
    }

    return { totalBase, totalDeduction, totalNet };
  }, [batches]);

  return (
    <FinancePageShell
      className="fin-premium-container ctr-page-modern"
      dir={ar ? "rtl" : "ltr"}
      header={
        <div className="fin-premium-header">
          <FinancePageHeader
            title={ar ? "الرواتب والاستقطاعات" : "Payroll & Deductions"}
            subtitle={ar ? "إدارة مستحقات الموظفين والمعلمين والاستقطاعات الشهرية" : "Manage employee/teacher entitlements and monthly deductions"}
            icon={<Wallet className="w-6 h-6 text-brand-600" />}
            actions={
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="glass-btn"
                  leftIcon={<RefreshCw className={`w-4 h-4 ${batchesQ.isFetching ? 'animate-spin' : ''}`} />}
                  onClick={() => batchesQ.refetch()}
                >
                  {ar ? "تحديث" : "Refresh"}
                </Button>
                {activeTab === "batches" && canCreatePayrollBatch && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-lg shadow-brand-500/20"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowBatchModal(true)}
                  >
                    {ar ? "صرف جديد" : "New Disbursement"}
                  </Button>
                )}
                {activeTab === "profiles" && isCoreAdmin && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-lg shadow-brand-500/20"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowProfileModal(true)}
                  >
                    {ar ? "إنشاء ملف" : "Create Profile"}
                  </Button>
                )}
                {activeTab === "grades" && isCoreAdmin && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-lg shadow-brand-500/20"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowGradeModal(true)}
                  >
                    {ar ? "إضافة درجة" : "Add Grade"}
                  </Button>
                )}
              </div>
            }
          />
          <nav className="exams-tabs-bar mt-6" aria-label={ar ? "تبويبات الرواتب" : "Payroll tabs"}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "batches"}
              className={`exams-tab-btn ${activeTab === "batches" ? "exams-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("batches")}
            >
              <Wallet size={16} />
              <span>{ar ? "الرواتب والبدلات" : "Payroll Batches"}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "profiles"}
              className={`exams-tab-btn ${activeTab === "profiles" ? "exams-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("profiles")}
            >
              <ArrowUpRight size={16} />
              <span>{ar ? "ملفات الرواتب" : "Payroll Profiles"}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "grades"}
              className={`exams-tab-btn ${activeTab === "grades" ? "exams-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("grades")}
            >
              <ArrowDownLeft size={16} />
              <span>{ar ? "سلم الرواتب" : "Salary Scales"}</span>
            </button>
          </nav>
        </div>
      }
      kpis={
        <div className="ctr-kpis-modern">
          <PayrollKpi
            icon={Wallet}
            cls="brand"
            val={<FinanceMoney amount={stats.totalBase} baseCurrency="YER" />}
            label={ar ? "إجمالي الأساسي" : "Total Base"}
          />
          <PayrollKpi
            icon={ArrowDownLeft}
            cls="rose"
            val={<FinanceMoney amount={stats.totalDeduction} baseCurrency="YER" />}
            label={ar ? "إجمالي الخصميات" : "Total Deductions"}
          />
          <PayrollKpi
            icon={ArrowUpRight}
            cls="emerald"
            val={<FinanceMoney amount={stats.totalNet} baseCurrency="YER" />}
            label={ar ? "الصافي للصرف" : "Total Net"}
          />
        </div>
      }
      toolbar={
        <FinancePageFilters
          ar={ar}
          centers={centers}
          centerId={centerId}
          month={month}
          year={year}
          status={status}
          statusLabels={statusLabels}
          onCenterChange={setCenterId}
          onMonthChange={setMonth}
          onYearChange={setYear}
          onStatusChange={setStatus}
          onReset={() => {
            setCenterId(undefined);
            setMonth(defaultMonth);
            setYear(defaultYear);
            setStatus("");
          }}
        />
      }
    >
      <div className="mt-6 animate-premium">
        <Suspense fallback={<LoadingState />}>
          {activeTab === "batches" && (
            <FinancePayrollTab
              centerId={centerId}
              year={year}
              month={month}
              isAdmin={isCoreAdmin}
              isSuperAdmin={user?.role === "SUPER_ADMIN"}
              canCreateBatch={canCreatePayrollBatch}
              ar={ar}
              methodLabels={methodLabels}
              centers={centers}
              externalShowBatchForm={canCreatePayrollBatch && showBatchModal}
              onExternalBatchFormClose={() => setShowBatchModal(false)}
            />
          )}
          {activeTab === "profiles" && (
            <FinancePayrollProfilesTab
              centerId={centerId}
              ar={ar}
              centers={centers}
              canManage={isCoreAdmin}
              externalShowForm={isCoreAdmin && showProfileModal}
              onExternalFormClose={() => setShowProfileModal(false)}
            />
          )}
          {activeTab === "grades" && (
            <FinanceSalaryGradesTab
              centerId={centerId}
              ar={ar}
              canManage={isCoreAdmin}
              externalShowForm={isCoreAdmin && showGradeModal}
              onExternalFormClose={() => setShowGradeModal(false)}
            />
          )}
        </Suspense>
      </div>
    </FinancePageShell>
  );
}
