/**
 * FinanceKPIStrip — responsive grid of 3–4 KPI cards shown above a toolbar.
 *
 * Design rules (hard):
 * - Maximum of 4 KPIs per strip. Consumers who need more must split by tab.
 * - Each KPI reports one number, not a story. No sparklines yet (deferred).
 * - Tone ("success" / "warning" / "danger" / "info" / "neutral") only accents
 *   the inline-start border; the number itself stays neutral for scannability.
 */
import type { ReactNode } from "react";

export type FinanceKPITone = "neutral" | "success" | "warning" | "danger" | "info";

export interface FinanceKPI {
  id: string;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: FinanceKPITone;
}

export interface FinanceKPIStripProps {
  items: FinanceKPI[];
  className?: string;
}

const toneClass: Record<FinanceKPITone, string> = {
  neutral: "",
  success: "finance-kpi-card--success",
  warning: "finance-kpi-card--warning",
  danger: "finance-kpi-card--danger",
  info: "finance-kpi-card--info"
};

export function FinanceKPIStrip({ items, className = "" }: FinanceKPIStripProps) {
  if (!items.length) return null;
  return (
    <div className={`finance-kpi-strip ${className}`.trim()} role="group">
      {items.slice(0, 4).map((kpi) => (
        <div
          key={kpi.id}
          className={`finance-kpi-card ${toneClass[kpi.tone ?? "neutral"]}`.trim()}
        >
          <div className="finance-kpi-card__label">{kpi.label}</div>
          <div className="finance-kpi-card__value">{kpi.value}</div>
          {kpi.sub ? <div className="finance-kpi-card__sub">{kpi.sub}</div> : null}
        </div>
      ))}
    </div>
  );
}

export default FinanceKPIStrip;
