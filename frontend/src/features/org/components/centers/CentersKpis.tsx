import { Building2, CheckCircle2, BookOpen, Shield } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { Center } from "../../../org/types";

interface CentersKpisProps {
  centersQ: UseQueryResult<{ items: Center[] }, unknown>;
  filtered: Center[];
  ar: boolean;
}

export function CentersKpis({ centersQ, filtered, ar }: CentersKpisProps) {
  const totalCenters = filtered.length;
  const totalCircles = filtered.reduce((sum, center) => sum + Number(center._count?.circles ?? 0), 0);
  const totalSupervisors = filtered.reduce((sum, center) => sum + (center.centerSupervisors?.length ?? 0), 0);
  const activeCenters = filtered.filter((center) => center.isActive ?? true).length;

  return (
    <div className="ctr-kpis-modern">
      {centersQ.isLoading ? (
        <>
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="ctr-kpi-modern" style={{ height: "100px" }}>
              <div className="ctr-kpi-icon-wrap" style={{ background: "#e2e8f0" }} />
              <div className="ctr-kpi-content" style={{ gap: "8px", flex: 1 }}>
                <div style={{ height: "24px", width: "60%", background: "#e2e8f0", borderRadius: "4px" }} />
                <div style={{ height: "12px", width: "40%", background: "#f1f5f9", borderRadius: "4px" }} />
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          <CtrKpi icon={Building2} cls="brand" val={totalCenters} label={ar ? "إجمالي المراكز" : "Total Centers"} />
          <CtrKpi icon={CheckCircle2} cls="emerald" val={activeCenters} label={ar ? "مراكز نشطة" : "Active Centers"} />
          <CtrKpi icon={BookOpen} cls="violet" val={totalCircles} label={ar ? "إجمالي الحلقات" : "Total Circles"} />
          <CtrKpi icon={Shield} cls="amber" val={totalSupervisors} label={ar ? "المشرفون" : "Supervisors"} />
        </>
      )}
    </div>
  );
}

function CtrKpi({
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
