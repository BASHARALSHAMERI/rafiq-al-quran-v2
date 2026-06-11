import { BarChart3, CheckCircle2, Star, Wallet2 } from "lucide-react";
import { useI18n } from "../../../app/i18n";

export type SummaryStats = {
  total: number;
  ready: number;
  finance: number;
  needsBackend: number;
};

export type ReportsSummaryCardsProps = {
  stats: SummaryStats;
};

export function ReportsSummaryCards({ stats }: ReportsSummaryCardsProps) {
  const { language } = useI18n();
  const ar = language === "ar";

  const cards = [
    {
      label: ar ? "إجمالي التقارير" : "Total Reports",
      value: stats.total,
      icon: BarChart3,
      cls: "brand",
    },
    {
      label: ar ? "التقارير الجاهزة" : "Ready Reports",
      value: stats.ready,
      icon: CheckCircle2,
      cls: "emerald",
    },
    {
      label: ar ? "التقارير المالية" : "Financial Reports",
      value: stats.finance,
      icon: Wallet2,
      cls: "violet",
    },
    {
      label: ar ? "يحتاج ربط" : "Needs Backend",
      value: stats.needsBackend,
      icon: Star,
      cls: "amber",
    },
  ];

  return (
    <section className="ctr-kpis-modern">
      {cards.map((card) => (
        <div key={card.label} className={`ctr-kpi-modern ${card.cls}`}>
          <div className="ctr-kpi-icon-wrap">
            <card.icon size={24} />
          </div>
          <div className="ctr-kpi-content">
            <span className="ctr-kpi-val">{card.value}</span>
            <span className="ctr-kpi-label">{card.label}</span>
          </div>
        </div>
      ))}
    </section>
  );
}

export default ReportsSummaryCards;
