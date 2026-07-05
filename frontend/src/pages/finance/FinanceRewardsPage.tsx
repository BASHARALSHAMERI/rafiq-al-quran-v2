import { 
  Coins, 
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
import { statusLabels } from "../../features/finance-v2/components/FinanceShared";
import { useCentersQuery } from "../../features/org/org.hooks";
import { 
  FinancePageShell, 
  FinancePageHeader,
  FinanceMoney 
} from "../../features/finance-v2/design";
import { useFinanceV2RewardBatchesQuery } from "../../features/finance-v2/finance-v2.hooks";
import type { RewardBatchStatusV2 } from "../../features/finance-v2/types";

import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/finance-v4.css";

const FinanceRewardsTab = lazy(() => import("../../features/finance-v2/components/tabs/FinanceRewardsTab"));

function RewardKpi({
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

export default function FinanceRewardsPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const canCreateRewardBatch =
    user?.role === "SUPER_ADMIN" || user?.role === "ACCOUNTANT" || user?.role === "FINANCE_MANAGER";
  const canPayReward =
    user?.role === "SUPER_ADMIN" || user?.role === "TREASURER";

  const now = new Date();
  const defaultYear = now.getFullYear();

  const [centerId, setCenterId] = useState<number | undefined>();
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [status, setStatus] = useState<RewardBatchStatusV2 | "">("");
  const [showBatchModal, setShowBatchModal] = useState(false);

  const centersQ = useCentersQuery();
  const centers = useMemo(() => centersQ.data?.items ?? [], [centersQ.data?.items]);

  const batchesQ = useFinanceV2RewardBatchesQuery(centerId, year);
  const batches = useMemo(
    () => (batchesQ.data?.rows ?? []).filter((batch) =>
      (!status || batch.status === status) &&
      (batch.cycle !== "MONTHLY" || batch.periodMonth === month)
    ),
    [batchesQ.data?.rows, month, status]
  );

  const stats = useMemo(() => {
    let total = 0;
    let approved = 0;
    let pending = 0;

    for (const batch of batches) {
      const isApproved = ["APPROVED", "IN_PROGRESS", "PARTIALLY_PAID", "PAID", "CLOSED"].includes(batch.status);
      for (const item of (batch.items ?? [])) {
        total += item.amount;
        if (isApproved) {
          approved += item.amount;
          if (item.status !== "PAID" && item.status !== "VOIDED") pending += item.amount;
        }
      }
    }

    return { total, approved, pending };
  }, [batches]);

  return (
    <FinancePageShell
      className="fin-premium-container ctr-page-modern"
      dir={ar ? "rtl" : "ltr"}
      header={
        <div className="fin-premium-header">
          <FinancePageHeader
            title={ar ? "إدارة المكافآت" : "Rewards Management"}
            subtitle={ar ? "صرف المكافآت التشجيعية للطلاب والمعلمين المتميزين" : "Disburse incentive rewards for outstanding students and teachers"}
            icon={<Coins className="w-6 h-6 text-brand-600" />}
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
                {canCreateRewardBatch ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-lg shadow-brand-500/20"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowBatchModal(true)}
                  >
                    {ar ? "مكافأة جديدة" : "New Reward"}
                  </Button>
                ) : null}
              </div>
            }
          />
        </div>
      }
      kpis={
        <div className="ctr-kpis-modern">
          <RewardKpi
            icon={Coins}
            cls="brand"
            val={<FinanceMoney amount={stats.total} baseCurrency="YER" />}
            label={ar ? "إجمالي المكافآت" : "Total Rewards"}
          />
          <RewardKpi
            icon={ArrowUpRight}
            cls="emerald"
            val={<FinanceMoney amount={stats.approved} baseCurrency="YER" />}
            label={ar ? "مكافآت معتمدة" : "Approved Rewards"}
          />
          <RewardKpi
            icon={ArrowDownLeft}
            cls="blue"
            val={<FinanceMoney amount={stats.pending} baseCurrency="YER" />}
            label={ar ? "بانتظار الصرف" : "Pending Payout"}
          />
        </div>
      }
      toolbar={
        <FinancePageFilters
          ar={ar}
          centers={centers}
          centerId={centerId}
          year={year}
          month={month}
          status={status}
          statusLabels={statusLabels}
          statusList={["PENDING", "APPROVED", "PAID"]}
          onCenterChange={setCenterId}
          onYearChange={setYear}
          onMonthChange={setMonth}
          onStatusChange={setStatus}
          onReset={() => {
            setCenterId(undefined);
            setYear(defaultYear);
            setMonth(now.getMonth() + 1);
            setStatus("");
          }}
        />
      }
    >
      <div>
        <Suspense fallback={<LoadingState />}>
          <FinanceRewardsTab
            centerId={centerId}
            year={year}
            month={month}
            status={status}
            isAdmin={canPayReward}
            isSuperAdmin={user?.role === "SUPER_ADMIN"}
            canCreateBatch={canCreateRewardBatch}
            ar={ar}
            centers={centers}
            externalShowBatchForm={canCreateRewardBatch && showBatchModal}
            onExternalBatchFormClose={() => setShowBatchModal(false)}
          />
        </Suspense>
      </div>
    </FinancePageShell>
  );
}
