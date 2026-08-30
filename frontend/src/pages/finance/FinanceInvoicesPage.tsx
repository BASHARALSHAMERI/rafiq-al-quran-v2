import {
  FileText,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  History,
  Receipt,
  Settings,
  AlertCircle
} from "lucide-react";
import { Suspense, lazy, useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useI18n } from "../../app/i18n";
import { Button } from "../../components/ui/Button";
import { LoadingState } from "../../components/ui/LoadingState";
import { FinancePageFilters } from "../../features/finance-v2/components/page/FinancePageFilters";
import { statusLabels } from "../../features/finance-v2/components/FinanceShared";
import { useCentersQuery } from "../../features/org/org.hooks";
import {
  FinancePageShell,
  FinancePageHeader,
  FinanceMoney
} from "../../features/finance-v2/design";
import { useFinanceV2InvoicesQuery, useFinanceV2PolicyQuery, usePatchOrganizationPolicyMutation } from "../../features/finance-v2/finance-v2.hooks";
import { useAuthStore } from "../../features/auth/auth.store";
import Modal from "../../components/ui/Modal";
import { notifyError, notifySuccess } from "../../shared/ui/feedback";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";

import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/finance-v4.css";

const FinanceInvoicesTab = lazy(() => import("../../features/finance-v2/components/tabs/FinanceInvoicesTab"));
const FinancePaymentsTab = lazy(() => import("../../features/finance-v2/components/tabs/FinancePaymentsTab"));
const FinanceSubscriptionTab = lazy(() => import("../../features/finance-v2/components/tabs/FinanceSubscriptionTab"));
const FinanceTuitionPlansTab = lazy(() => import("../../features/finance-v2/components/tabs/FinanceTuitionPlansTab"));

function InvoiceKpi({
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

const TABS = [
  { key: "invoices", labelAr: "الفواتير", labelEn: "Invoices", icon: Receipt },
  { key: "payments", labelAr: "سجل الدفعات", labelEn: "Payment History", icon: History },
  { key: "tuition-plans", labelAr: "خطط الرسوم", labelEn: "Tuition Plans", icon: Receipt },
  { key: "subscriptions", labelAr: "إدارة الاشتراكات", labelEn: "Manage Subscriptions", icon: Receipt },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function FinanceInvoicesPage() {
  const { language } = useI18n();
  const ar = language === "ar";

  const now = new Date();
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();

  const [centerId, setCenterId] = useState<number | undefined>();
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [status, setStatus] = useState<any>("");

  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("invoices");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isFinanceManager = role === "FINANCE_MANAGER";
  const isAccountant = role === "ACCOUNTANT";
  const isTreasurer = role === "TREASURER";
  const canPrepareInvoice = isSuperAdmin || isFinanceManager || isAccountant;
  const canCollectPayment = isSuperAdmin || isTreasurer;
  const canAssignStudentFees = canPrepareInvoice;
  const canManageTuitionPlans = isSuperAdmin || isFinanceManager;

  const policyQ = useFinanceV2PolicyQuery(centerId);
  const feesEnabled = policyQ.data?.effective?.feesEnabled ?? false;
  const patchPolicyM = usePatchOrganizationPolicyMutation();

  const visibleTabs = useMemo(() => {
    if (feesEnabled) return TABS;
    return TABS.filter((t) => t.key !== "subscriptions" && t.key !== "tuition-plans");
  }, [feesEnabled]);

  useEffect(() => {
    if (policyQ.isSuccess && !feesEnabled && (activeTab === "subscriptions" || activeTab === "tuition-plans")) {
      setActiveTab("invoices");
    }
  }, [activeTab, feesEnabled, policyQ.isSuccess]);

  const centersQ = useCentersQuery();
  const centers = useMemo(() => centersQ.data?.items ?? [], [centersQ.data?.items]);

  const invoicesQ = useFinanceV2InvoicesQuery({
    centerId,
    month,
    year,
    status: status || undefined,
    page: 1,
    pageSize: 100
  });

  const invoices = useMemo(() => invoicesQ.data?.rows ?? [], [invoicesQ.data?.rows]);

  const stats = useMemo(() => {
    let total = 0;
    let due = 0;
    let collected = 0;
    let remaining = 0;

    for (const inv of invoices) {
      if (inv.status === "CANCELLED") continue;
      total += inv.amount;
      due += inv.amount;
      collected += inv.totalPaid;
      remaining += inv.remainingAmount;
    }

    return { total, due, collected, remaining };
  }, [invoices]);

  const handleSelectInvoice = useCallback((id: number) => {
    setSelectedInvoiceId(id);
    setActiveTab("payments");
  }, []);

  const handleTabChange = useCallback((key: TabKey) => {
    setActiveTab(key);
    if (key !== "payments") setSelectedInvoiceId(null);
  }, []);

  return (
    <FinancePageShell
      className="fin-premium-container ctr-page-modern"
      dir={ar ? "rtl" : "ltr"}
      header={
        <div className="fin-premium-header">
          <FinancePageHeader
            title={ar ? "اشتراكات الطلاب" : "Student Subscriptions"}
            subtitle={ar ? "إصدار الاشتراكات المصرح بها ومتابعة تحصيلها" : "Issue and track authorized subscriptions"}
            icon={<FileText className="w-6 h-6 text-brand-600" />}
            actions={
              activeTab === "invoices" ? (
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="glass-btn"
                    leftIcon={<RefreshCw className={`w-4 h-4 ${invoicesQ.isFetching ? 'animate-spin' : ''}`} />}
                    onClick={() => invoicesQ.refetch()}
                  >
                    {ar ? "تحديث" : "Refresh"}
                  </Button>
                  {feesEnabled && canPrepareInvoice ? (
                    <Button
                      variant="primary"
                      size="sm"
                      className="shadow-lg shadow-brand-500/20"
                      leftIcon={<Plus className="w-4 h-4" />}
                      onClick={() => setShowNewInvoiceModal(true)}
                    >
                      {ar ? "فاتورة جديدة" : "New Invoice"}
                    </Button>
                  ) : null}
                </div>
              ) : activeTab === "payments" ? (
                <div className="flex items-center gap-3">
                  {canCollectPayment ? (
                    <Button
                      variant="primary"
                      size="sm"
                      className="shadow-lg shadow-brand-500/20"
                      leftIcon={<Plus className="w-4 h-4" />}
                      onClick={() => setShowNewPaymentModal(true)}
                    >
                      {ar ? "تسجيل سداد" : "Record Payment"}
                    </Button>
                  ) : null}
                </div>
              ) : null
            }
          />
        </div>
      }
      kpis={
        activeTab === "invoices" ? (
          <div className="ctr-kpis-modern">
            <InvoiceKpi
              icon={FileText}
              cls="brand"
              val={<FinanceMoney amount={stats.total} baseCurrency="YER" />}
              label={ar ? "إجمالي الفواتير" : "Total Invoices"}
            />
            <InvoiceKpi
              icon={Clock}
              cls="amber"
              val={<FinanceMoney amount={stats.due} baseCurrency="YER" />}
              label={ar ? "المستحق" : "Total Due"}
            />
            <InvoiceKpi
              icon={ArrowUpRight}
              cls="emerald"
              val={<FinanceMoney amount={stats.collected} baseCurrency="YER" />}
              label={ar ? "المحصل" : "Total Collected"}
            />
            <InvoiceKpi
              icon={ArrowDownLeft}
              cls="rose"
              val={<FinanceMoney amount={stats.remaining} baseCurrency="YER" />}
              label={ar ? "المتبقي" : "Total Remaining"}
            />
          </div>
        ) : null
      }
      toolbar={
        <>
          <div className="fin-tabs">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`fin-tab ${activeTab === tab.key ? "fin-tab--active" : ""}`}
                  onClick={() => handleTabChange(tab.key)}
                >
                  <Icon size={16} />
                  <span>{ar ? tab.labelAr : tab.labelEn}</span>
                </button>
              );
            })}
            {isSuperAdmin ? (
              <button type="button" className="fin-tab ml-auto" onClick={() => setShowPolicyModal(true)} title={ar ? "إعدادات الاشتراكات" : "Subscription Settings"}>
                <Settings size={16} />
                <span>{ar ? "الإعدادات" : "Settings"}</span>
              </button>
            ) : null}
          </div>
          {activeTab === "invoices" ? (
            <>
              {!feesEnabled && (
                <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-4 rounded-xl flex items-start gap-3 border border-amber-200 dark:border-amber-900/30">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">{ar ? "الرسوم غير مفعلة" : "Fees Disabled"}</h4>
                    <p className="text-sm mt-1">{ar ? "إصدار الفواتير معطل في هذا المركز بناءً على سياساته. لا يمكن إضافة فواتير جديدة حتى يتم تفعيل الرسوم من الإعدادات." : "Invoice issuance is disabled in this center based on its policies. You cannot add new invoices until fees are enabled in settings."}</p>
                  </div>
                </div>
              )}
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
            </>
          ) : null}
        </>
      }
    >
      <div>
        {activeTab === "invoices" ? (
          <Suspense fallback={<LoadingState />}>
            <FinanceInvoicesTab
              centerId={centerId}
              month={month}
              year={year}
              status={status}
              isAdmin={canPrepareInvoice}
              ar={ar}
              centers={centers}
              onSelectInvoice={handleSelectInvoice}
              statusLabels={statusLabels}
              externalShowForm={canPrepareInvoice && showNewInvoiceModal}
              onExternalFormClose={() => setShowNewInvoiceModal(false)}
              feesEnabled={feesEnabled}
            />
          </Suspense>
        ) : null}
        {activeTab === "payments" ? (
          <Suspense fallback={<LoadingState />}>
            <FinancePaymentsTab
              centerId={centerId}
              isAdmin={canCollectPayment}
              isSuperAdmin={isSuperAdmin}
              ar={ar}
              initialInvoiceId={selectedInvoiceId}
              externalShowPaymentForm={canCollectPayment && showNewPaymentModal}
              onExternalPaymentFormClose={() => setShowNewPaymentModal(false)}
            />
          </Suspense>
        ) : null}
        {activeTab === "subscriptions" && feesEnabled ? (
          <Suspense fallback={<LoadingState />}>
            <FinanceSubscriptionTab centerId={centerId} isAdmin={canAssignStudentFees} ar={ar} />
          </Suspense>
        ) : null}

        {activeTab === "tuition-plans" && feesEnabled ? (
          <Suspense fallback={<LoadingState />}>
            <FinanceTuitionPlansTab centerId={centerId} isAdmin={canManageTuitionPlans} ar={ar} />
          </Suspense>
        ) : null}
      </div>

      {/* ⚙️ Policy toggle modal */}
      <Modal isOpen={showPolicyModal} onClose={() => setShowPolicyModal(false)} title={ar ? "إعدادات الاشتراكات" : "Subscription Settings"} size="sm" panelClassName="circlemod-panel" bodyClassName="circlemod-body" footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={() => setShowPolicyModal(false)}>{ar ? "إغلاق" : "Close"}</Button>
        </div>
      }>
        <div className="circlemod-form">
          <div className="circlemod-section">
            <div className="flex items-center justify-between">
              <span className="font-bold">{ar ? "نظام الاشتراكات" : "Subscription System"}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${feesEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                {feesEnabled ? (ar ? "مفعل" : "Enabled") : (ar ? "معطل" : "Disabled")}
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-3">{ar ? "عند التعطيل، يختفي تبويب إدارة الاشتراكات وزر الفاتورة الجديدة" : "When disabled, the subscriptions tab and new invoice button are hidden"}</p>
          </div>
          <div className="flex justify-center mt-4">
            <Button
              variant={feesEnabled ? "danger" : "primary"}
              onClick={async () => {
                if (feesEnabled && !window.confirm(ar ? "هل أنت متأكد من تعطيل نظام الاشتراكات؟" : "Are you sure you want to disable the subscription system?")) return;
                try {
                  await patchPolicyM.mutateAsync({ feesEnabled: !feesEnabled });
                  if (feesEnabled) {
                    setActiveTab("invoices");
                  }
                  notifySuccess(feesEnabled
                    ? (ar ? "تم تعطيل الاشتراكات" : "Subscriptions disabled")
                    : (ar ? "تم تفعيل الاشتراكات" : "Subscriptions enabled"));
                } catch (err) {
                  notifyError(getLocalizedApiErrorMessage(err, { ar, fallback: ar ? "فشل التحديث" : "Update failed" }));
                }
              }}
              isLoading={patchPolicyM.isPending}
            >
              {feesEnabled
                ? (ar ? "تعطيل نظام الاشتراكات" : "Disable Subscriptions")
                : (ar ? "تفعيل نظام الاشتراكات" : "Enable Subscriptions")}
            </Button>
          </div>
        </div>
      </Modal>
    </FinancePageShell>
  );
}
