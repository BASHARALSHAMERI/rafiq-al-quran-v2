import type { CSSProperties, ElementType } from "react";
import { Building2, CircleDot, Users } from "lucide-react";

import "../../../styles/pages/dashboard-v3.css";

type CenterSummaryRow = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  circlesCount: number;
  staffCount: number;
};

type OrganizationOverviewData = {
  rows: CenterSummaryRow[];
  kpis: {
    totalCenters: number;
    activeCenters: number;
    inactiveCenters: number;
    totalCircles: number;
    totalStaff: number;
  };
};

type Tone = "primary" | "success" | "warning" | "danger" | "neutral";

export function OrganizationOverviewSummary({
  data,
  ar,
}: {
  data: OrganizationOverviewData;
  ar: boolean;
}) {
  const { rows, kpis } = data;
  const activeRate = kpis.totalCenters
    ? Math.round((kpis.activeCenters / kpis.totalCenters) * 100)
    : 0;
  const tone: Tone = !kpis.totalCenters
    ? "neutral"
    : activeRate >= 80
      ? "success"
      : activeRate >= 50
        ? "warning"
        : "danger";
  const averageCircles = kpis.totalCenters
    ? (kpis.totalCircles / kpis.totalCenters).toFixed(1)
    : "0";
  const averageStaff = kpis.totalCenters
    ? (kpis.totalStaff / kpis.totalCenters).toFixed(1)
    : "0";
  const leadingCenters = [...rows]
    .sort((a, b) => b.circlesCount - a.circlesCount)
    .slice(0, 5);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const cards: Array<{
    label: string;
    value: number;
    icon: ElementType;
    tone: Tone;
  }> = [
    {
      label: ar ? "إجمالي المراكز" : "Total centers",
      value: kpis.totalCenters,
      icon: Building2,
      tone: "primary",
    },
    {
      label: ar ? "المراكز النشطة" : "Active centers",
      value: kpis.activeCenters,
      icon: Building2,
      tone: "success",
    },
    {
      label: ar ? "إجمالي الحلقات" : "Total circles",
      value: kpis.totalCircles,
      icon: CircleDot,
      tone: "primary",
    },
    {
      label: ar ? "إجمالي الكادر" : "Total staff",
      value: kpis.totalStaff,
      icon: Users,
      tone: "warning",
    },
  ];

  return (
    <section
      className="flex flex-col gap-5"
      style={{ "--dash-gap": "1.25rem" } as CSSProperties}
      aria-label={ar ? "ملخص نظرة عامة على الجمعية" : "Organization overview summary"}
    >
      <div className="dash-kpis">
        {cards.map((card) => (
          <article key={card.label} className={`dash-kpi-card dash-kpi-card--${card.tone}`}>
            <span className="dash-kpi-card__blob dash-kpi-card__blob--tl" aria-hidden />
            <span className="dash-kpi-card__blob dash-kpi-card__blob--br" aria-hidden />
            <div className="dash-kpi-card__content">
              <div className="dash-kpi-card__text">
                <span className="dash-kpi-card__label">{card.label}</span>
                <span className="dash-kpi-card__value">{card.value}</span>
              </div>
              <span className="dash-kpi-card__icon">
                <card.icon size={20} aria-hidden />
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="dash-main-grid">
        <section className="dash-panel">
          <div className="dash-panel__head">
            <h2 className="dash-panel__title">
              <span className="dash-panel__title-bar" data-tone="success" />
              {ar ? "أعلى المراكز من حيث عدد الحلقات" : "Centers with the most circles"}
            </h2>
            <span className="dash-panel__sub">
              {ar ? `${rows.length} مركز` : `${rows.length} centers`}
            </span>
          </div>
          <div className="dash-panel__body">
            {leadingCenters.length ? (
              <div className="dash-priorities">
                {leadingCenters.map((center) => (
                  <div key={center.id} className="dash-circle-row">
                    <div className="dash-circle-row__text">
                      <span className="dash-circle-row__name">{center.name}</span>
                      <span className="dash-circle-row__sub">{center.code}</span>
                    </div>
                    <div className="dash-circle-row__meta">
                      <span className="dash-circle-row__rate dash-circle-row__rate--success">
                        {center.circlesCount} {ar ? "حلقة" : "circles"}
                      </span>
                      <span className="dash-circle-row__count">
                        {center.staffCount} {ar ? "من الكادر" : "staff"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dash-compare__empty">
                {ar ? "لا توجد مراكز مسجلة." : "No centers are registered."}
              </p>
            )}
          </div>
        </section>

        <section className="dash-panel">
          <div className="dash-panel__head">
            <h2 className="dash-panel__title">
              <span className="dash-panel__title-bar" data-tone={tone} />
              {ar ? "حالة تشغيل المراكز" : "Center operations"}
            </h2>
            <span className={`dash-pill dash-pill--${tone}`}>
              <span className="dash-pill__dot" />
              {activeRate}% {ar ? "نشطة" : "active"}
            </span>
          </div>
          <div className="dash-panel__body">
            <div className="dash-ops dash-ops--vertical">
              <div className="dash-ops__ring">
                <div className={`dash-ring dash-ring--${tone}`} role="img" aria-label={`${activeRate}%`}>
                  <svg viewBox="0 0 72 72" width="72" height="72">
                    <circle cx="36" cy="36" r={radius} className="dash-ring__track" fill="none" strokeWidth="6" />
                    <circle
                      cx="36"
                      cy="36"
                      r={radius}
                      className="dash-ring__progress"
                      fill="none"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference - (circumference * activeRate) / 100}
                      transform="rotate(-90 36 36)"
                    />
                  </svg>
                  <span className="dash-ring__value">{activeRate}%</span>
                </div>
                <div className="dash-ops__ring-meta">
                  <span className="dash-ops__ring-label">{ar ? "المراكز النشطة" : "Active centers"}</span>
                  <span className="dash-ops__ring-sub">
                    {kpis.activeCenters} / {kpis.totalCenters}
                  </span>
                </div>
              </div>
              <div className="dash-ops__bars dash-ops__bars--stack">
                <OverviewMetric
                  label={ar ? "متوسط الحلقات لكل مركز" : "Average circles per center"}
                  value={averageCircles}
                  icon={CircleDot}
                />
                <OverviewMetric
                  label={ar ? "متوسط الكادر لكل مركز" : "Average staff per center"}
                  value={averageStaff}
                  icon={Users}
                />
                {kpis.inactiveCenters > 0 && (
                  <OverviewMetric
                    label={ar ? "مراكز غير نشطة" : "Inactive centers"}
                    value={kpis.inactiveCenters}
                    icon={Building2}
                    tone="danger"
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function OverviewMetric({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: number | string;
  icon: ElementType;
  tone?: Tone;
}) {
  return (
    <div className="dash-prio">
      <span className={`dash-prio__icon dash-prio__icon--${tone}`}>
        <Icon size={18} aria-hidden />
      </span>
      <span className="dash-prio__text">
        <span className="dash-prio__title">{label}</span>
      </span>
      <strong className={`dash-prio__value dash-prio__value--${tone}`}>{value}</strong>
    </div>
  );
}
