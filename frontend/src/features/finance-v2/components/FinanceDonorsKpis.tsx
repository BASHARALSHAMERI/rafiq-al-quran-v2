import { Gift, Users, Wallet, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { money } from "../../finance-v2/components/FinanceShared";

interface FinanceDonorsKpisProps {
  isLoading: boolean;
  donorsCount: number;
  receivedAmount: number;
  pledgedAmount: number;
  duePledges: number;
  ar: boolean;
}

export default function FinanceDonorsKpis({
  isLoading,
  donorsCount,
  receivedAmount,
  pledgedAmount,
  duePledges,
  ar
}: FinanceDonorsKpisProps) {
  if (isLoading) {
    return (
      <div className="ctr-kpis-modern">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="ctr-kpi-modern" style={{ height: "100px" }}>
            <div className="ctr-kpi-icon-wrap" style={{ background: "#e2e8f0" }} />
            <div className="ctr-kpi-content" style={{ gap: "8px", flex: 1 }}>
              <div style={{ height: "24px", width: "60%", background: "#e2e8f0", borderRadius: "4px" }} />
              <div style={{ height: "12px", width: "40%", background: "#f1f5f9", borderRadius: "4px" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="ctr-kpis-modern">
      <DonorsKpi icon={Users} cls="brand" val={donorsCount} label={ar ? "إجمالي المتبرعين" : "Total Donors"} />
      <DonorsKpi icon={Wallet} cls="emerald" val={money(receivedAmount, ar)} label={ar ? "التبرعات المستلمة" : "Received"} />
      <DonorsKpi icon={Gift} cls="violet" val={money(pledgedAmount, ar)} label={ar ? "إجمالي التعهدات" : "Total Pledges"} />
      <DonorsKpi icon={Clock} cls="amber" val={duePledges} label={ar ? "تعهدات مستحقة" : "Due Pledges"} />
    </div>
  );
}

function DonorsKpi({
  icon: Icon,
  cls,
  val,
  label
}: {
  icon: React.ElementType;
  cls: string;
  val: number | string;
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
