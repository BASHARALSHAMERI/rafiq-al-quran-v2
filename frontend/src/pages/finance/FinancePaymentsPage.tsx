import { 
  CreditCard, 
  RefreshCw,
  TrendingUp,
  Receipt,
  Wallet,
  Plus
} from "lucide-react";
import { Suspense, lazy, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "../../app/i18n";
import { useAuthStore } from "../../features/auth/auth.store";
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

const FinancePaymentsTab = lazy(() => import("../../features/finance-v2/components/tabs/FinancePaymentsTab"));

function PaymentKpi({
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

export default function FinancePaymentsPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const canRecordPayment =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ACCOUNTANT" ||
    user?.role === "FINANCE_MANAGER" ||
    user?.role === "TREASURER";

  const now = new Date();
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();

  const [centerId, setCenterId] = useState<number | undefined>();
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [status, setStatus] = useState<any>("");
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);

  const centersQ = useCentersQuery();
  const centers = useMemo(() => centersQ.data?.items ?? [], [centersQ.data?.items]);

  const invoicesQ = useFinanceV2InvoicesQuery({
    centerId,
    page: 1,
    pageSize: 1000
  });
  
  const invoices = useMemo(() => invoicesQ.data?.rows ?? [], [invoicesQ.data?.rows]);

  const stats = useMemo(() => {
    let collected = 0;
    let count = 0;
    let cash = 0;
    let transfer = 0;

    for (const inv of invoices) {
      collected += inv.totalPaid;
      count += (inv.payments?.length ?? 0);
      inv.payments?.forEach((p: any) => {
        if (p.method === 'CASH') cash += p.amount;
        else transfer += p.amount;
      });
    }

    return { collected, count, cash, transfer };
  }, [invoices]);

  return (
    <FinancePageShell
      className="fin-premium-container ctr-page-modern"
      dir={ar ? "rtl" : "ltr"}
      header={
        <div className="fin-premium-header">
          <FinancePageHeader
            title={ar ? "المدفوعات والتحصيل" : "Payments & Collections"}
            subtitle={ar ? "تسجيل مبالغ السداد ومراجعة تاريخ الدفعات لكل فاتورة" : "Record payments and review transaction history for each invoice"}
            icon={<CreditCard className="w-6 h-6 text-brand-600" />}
            actions={
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
                {canRecordPayment ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-lg shadow-brand-500/20"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowNewPaymentModal(true)}
                  >
                    {ar ? "تسجيل دفعة" : "Record Payment"}
                  </Button>
                ) : null}
              </div>
            }
          />
        </div>
      }
      kpis={
        <div className="ctr-kpis-modern">
          <PaymentKpi
            icon={TrendingUp}
            cls="emerald"
            val={<FinanceMoney amount={stats.collected} baseCurrency="YER" />}
            label={ar ? "إجمالي المحصل" : "Total Collected"}
          />
          <PaymentKpi
            icon={Receipt}
            cls="brand"
            val={stats.count}
            label={ar ? "عدد الدفعات" : "Payments Count"}
          />
          <PaymentKpi
            icon={Wallet}
            cls="blue"
            val={<FinanceMoney amount={stats.cash} baseCurrency="YER" />}
            label={ar ? "نقدًا" : "Cash"}
          />
          <PaymentKpi
            icon={Wallet}
            cls="violet"
            val={<FinanceMoney amount={stats.transfer} baseCurrency="YER" />}
            label={ar ? "تحويل" : "Transfer"}
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
      <div>
        <Suspense fallback={<LoadingState />}>
          <FinancePaymentsTab
            centerId={centerId}
            isAdmin={canRecordPayment}
            isSuperAdmin={user?.role === "SUPER_ADMIN"}
            ar={ar}
            externalShowPaymentForm={canRecordPayment && showNewPaymentModal}
            onExternalPaymentFormClose={() => setShowNewPaymentModal(false)}
          />
        </Suspense>
      </div>
    </FinancePageShell>
  );
}
