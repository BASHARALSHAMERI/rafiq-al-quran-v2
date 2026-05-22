import { BookOpen, Building2, CheckCircle2, Users } from "lucide-react";
import { motion } from "framer-motion";

interface CirclesKpiProps {
  isLoading: boolean;
  totalCircles: number;
  activeCircles: number;
  totalStudents: number;
  filteredCount: number;
  selectedCenterId: number | undefined;
  ar: boolean;
}

export default function CirclesKpis({
  isLoading,
  totalCircles,
  activeCircles,
  totalStudents,
  filteredCount,
  selectedCenterId,
  ar
}: CirclesKpiProps) {
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
      <CtrKpi icon={BookOpen} cls="brand" val={totalCircles} label={ar ? "إجمالي الحلقات" : "Total Circles"} />
      <CtrKpi icon={CheckCircle2} cls="emerald" val={activeCircles} label={ar ? "الحلقات النشطة" : "Active"} />
      <CtrKpi icon={Users} cls="violet" val={totalStudents} label={ar ? "إجمالي الطلاب" : "Students"} />
      {selectedCenterId ? (
        <CtrKpi icon={Building2} cls="amber" val={filteredCount} label={ar ? "في المركز المحدد" : "In Center"} />
      ) : (
        <CtrKpi icon={Building2} cls="amber" val={totalCircles - activeCircles} label={ar ? "الحلقات المعطلة" : "Inactive"} />
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
