import { 
  FileText, 
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  History,
  Receipt
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
import { useFinanceV2InvoicesQuery } from "../../features/finance-v2/finance-v2.hooks";

import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/finance-v4.css";

const FinanceInvoicesTab = lazy(() => import("../../features/finance-v2/components/tabs/FinanceInvoicesTab"));
const FinancePaymentsTab = lazy(() => import("../../features/finance-v2/components/tabs/FinancePaymentsTab"));

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
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-lg shadow-brand-500/20"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowNewInvoiceModal(true)}
                  >
                    {ar ? "فاتورة جديدة" : "New Invoice"}
                  </Button>
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
            {TABS.map((tab) => {
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
      </div>
    </FinancePageShell>
  );
}
