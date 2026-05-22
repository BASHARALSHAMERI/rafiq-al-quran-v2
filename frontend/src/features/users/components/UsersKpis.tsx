import { Users, UserMinus, ShieldCheck, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { KpiSkeleton } from "../../../components/ui/Skeleton";
import type { Role } from "../../auth/types";

type UsersKpiMetric = {
  icon: LucideIcon;
  value: number | string;
  label: string;
  tone?: "primary" | "success" | "warning" | "info";
};

interface UsersKpisProps {
  ar: boolean;
  role: Role;
  isLoading: boolean;
  total: number;
  active: number;
  inactive: number;
  extraMetrics?: UsersKpiMetric[];
}

function metricLabel(role: Role, ar: boolean) {
  if (role === "TEACHER") {
    return {
      total: ar ? "إجمالي المعلمين" : "Total Teachers",
      active: ar ? "المعلمون النشطون" : "Active Teachers",
      inactive: ar ? "الحسابات غير النشطة" : "Inactive Accounts"
    };
  }

  return {
    total: ar ? "إجمالي المستخدمين" : "Total Users",
    active: ar ? "الحسابات النشطة" : "Active",
    inactive: ar ? "الحسابات غير النشطة" : "Inactive"
  };
}

export function UsersKpis({
  ar,
  role,
  isLoading,
  total,
  active,
  inactive,
  extraMetrics
}: UsersKpisProps) {
  const labels = metricLabel(role, ar);
  const cards = [
    { icon: Users, value: total, label: labels.total, tone: "primary" as const },
    { icon: ShieldCheck, value: active, label: labels.active, tone: "success" as const },
    { icon: UserMinus, value: inactive, label: labels.inactive, tone: "warning" as const },
    ...(extraMetrics ?? [])
  ];

  if (isLoading) {
    return <KpiSkeleton items={cards.length} />;
  }

  return (
    <div className={`users-kpis-grid users-kpis-grid--${cards.length}`}>
      {cards.map((card) => (
        <UserKpiCard
          key={card.label}
          icon={card.icon}
          tone={card.tone ?? "primary"}
          val={card.value}
          label={card.label}
        />
      ))}
    </div>
  );
}

function UserKpiCard({
  icon: Icon,
  tone,
  val,
  label
}: {
  icon: LucideIcon;
  tone: "primary" | "success" | "warning" | "info";
  val: number | string;
  label: string;
}) {
  return (
    <motion.div
      className={`users-kpi-card users-kpi-card--${tone}`}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="users-kpi-card__icon">
        <Icon className="w-5 h-5" />
      </div>
      <div className="users-kpi-card__body">
        <span className="users-kpi-card__value">{val}</span>
        <span className="users-kpi-card__label">{label}</span>
      </div>
    </motion.div>
  );
}
