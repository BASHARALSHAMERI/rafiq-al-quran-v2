import { 
  Wallet, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
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
import { useFinanceV2AccountsQuery } from "../../features/finance-v2/finance-v2.hooks";

import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/finance-v4.css";

const FinanceTreasuryTab = lazy(() => import("../../features/finance-v2/components/tabs/FinanceTreasuryTab"));

function TreasuryKpi({
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

export default function FinanceTreasuryPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const canCreateTransfer =
    user?.role === "SUPER_ADMIN" || user?.role === "ACCOUNTANT" || user?.role === "FINANCE_MANAGER";
  const canOperateTreasury = canCreateTransfer || user?.role === "TREASURER";

  const now = new Date();
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();

  const [centerId, setCenterId] = useState<number | undefined>();
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [status, setStatus] = useState<any>("");
  const [showTransferModal, setShowTransferModal] = useState(false);

  const centersQ = useCentersQuery();
  const centers = useMemo(() => centersQ.data?.items ?? [], [centersQ.data?.items]);

  const accountsQ = useFinanceV2AccountsQuery(centerId);
  const accounts = useMemo(() => accountsQ.data ?? [], [accountsQ.data]);

  const stats = useMemo(() => {
    let cash = 0;
    let bank = 0;
    let total = 0;

    for (const acc of accounts) {
      const balance = acc.currentBalance || acc.balance || 0;
      if (acc.accountType === "ORG_FUND" || acc.accountType === "CENTER_FUND") cash += balance;
      else bank += balance;
      total += balance;
    }

    return { cash, bank, total };
  }, [accounts]);

  return (
    <FinancePageShell
      className="fin-premium-container ctr-page-modern"
      dir={ar ? "rtl" : "ltr"}
      header={
        <div className="fin-premium-header">
          <FinancePageHeader
            title={ar ? "الخزينة والحسابات" : "Treasury & Accounts"}
            subtitle={ar ? "إدارة النقدية في الصناديق والتحويلات البنكية بين الحسابات" : "Manage cash in funds and bank transfers between accounts"}
            icon={<Wallet className="w-6 h-6 text-brand-600" />}
            actions={
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="glass-btn"
                  leftIcon={<RefreshCw className={`w-4 h-4 ${accountsQ.isFetching ? 'animate-spin' : ''}`} />}
                  onClick={() => accountsQ.refetch()}
                >
                  {ar ? "تحديث" : "Refresh"}
                </Button>
                {canCreateTransfer ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-lg shadow-brand-500/20"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowTransferModal(true)}
                  >
                    {ar ? "تحويل صندوق" : "Fund Transfer"}
                  </Button>
                ) : null}
              </div>
            }
          />
        </div>
      }
      kpis={
        <div className="ctr-kpis-modern">
          <TreasuryKpi
            icon={Banknote}
            cls="emerald"
            val={<FinanceMoney amount={stats.total} baseCurrency="YER" />}
            label={ar ? "إجمالي السيولة" : "Total Liquidity"}
          />
          <TreasuryKpi
            icon={ArrowUpRight}
            cls="brand"
            val={<FinanceMoney amount={stats.cash} baseCurrency="YER" />}
            label={ar ? "النقدية (كاش)" : "Cash on Hand"}
          />
          <TreasuryKpi
            icon={ArrowDownLeft}
            cls="blue"
            val={<FinanceMoney amount={stats.bank} baseCurrency="YER" />}
            label={ar ? "البنوك والتحويلات" : "Banks & Transfers"}
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
          <FinanceTreasuryTab
            centerId={centerId}
            isAdmin={canOperateTreasury}
            isSuperAdmin={user?.role === "SUPER_ADMIN"}
            canEditLedgerAccount={user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_MANAGER"}
            ar={ar}
            externalShowTransfer={canCreateTransfer && showTransferModal}
            onExternalTransferClose={() => setShowTransferModal(false)}
          />
        </Suspense>
      </div>
    </FinancePageShell>
  );
}
