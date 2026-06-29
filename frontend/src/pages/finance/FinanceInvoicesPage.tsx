import { 
  FileText, 
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  History,
  Receipt,
  Settings
} from "lucide-react";
import { Suspense, lazy, useMemo, useState, useCallback } from "react";
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

import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/finance-v4.css";

const FinanceInvoicesTab = lazy(() => import("../../features/finance-v2/components/tabs/FinanceInvoicesTab"));
const FinancePaymentsTab = lazy(() => import("../../features/finance-v2/components/tabs/FinancePaymentsTab"));
const FinanceSubscriptionTab = lazy(() => import("../../features/finance-v2/components/tabs/FinanceSubscriptionTab"));

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
  const [activeTab, setActiveTab] = useState<TabKey>("invoices");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const policyQ = useFinanceV2PolicyQuery();
  const feesEnabled = policyQ.data?.feesEnabled ?? false;
  const patchPolicyM = usePatchOrganizationPolicyMutation();

  const visibleTabs = useMemo(() => {
    if (feesEnabled) return TABS;
    return TABS.filter((t) => t.key !== "subscriptions");
  }, [feesEnabled]);

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
                  {feesEnabled ? (
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
              </button>
            ) : null}
          </div>
          {activeTab === "invoices" ? (
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
              isAdmin={true}
              ar={ar}
              centers={centers}
              onSelectInvoice={handleSelectInvoice}
              statusLabels={statusLabels}
              externalShowForm={showNewInvoiceModal}
              onExternalFormClose={() => setShowNewInvoiceModal(false)}
              feesEnabled={feesEnabled}
            />
          </Suspense>
        ) : null}
        {activeTab === "payments" ? (
          <Suspense fallback={<LoadingState />}>
            <FinancePaymentsTab
              centerId={centerId}
              isAdmin={true}
              isSuperAdmin={false}
              ar={ar}
              initialInvoiceId={selectedInvoiceId}
            />
          </Suspense>
        ) : null}
        {activeTab === "subscriptions" && feesEnabled ? (
          <Suspense fallback={<LoadingState />}>
            <FinanceSubscriptionTab centerId={centerId} isAdmin={isSuperAdmin} ar={ar} />
          </Suspense>
        ) : null}
      </div>

      {/* ⚙️ Policy toggle modal */}
      <Modal isOpen={showPolicyModal} onClose={() => setShowPolicyModal(false)} title={ar ? "إعدادات الاشتراكات" : "Subscription Settings"} size="sm" panelClassName="circlemod-panel" bodyClassName="circlemod-body">
        <div className="circlemod-form p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{ar ? "تفعيل نظام الاشتراكات" : "Enable Subscription System"}</span>
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${feesEnabled ? 'bg-brand-600' : 'bg-gray-300'}`}
              onClick={() => patchPolicyM.mutate({ feesEnabled: !feesEnabled })}
              disabled={patchPolicyM.isPending}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${feesEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className="text-xs text-text-tertiary mt-2">{ar ? "عند التعطيل، يختفي تبويب إدارة الاشتراكات وزر الفاتورة الجديدة" : "When disabled, the subscriptions tab and new invoice button are hidden"}</p>
        </div>
      </Modal>
    </FinancePageShell>
  );
}
