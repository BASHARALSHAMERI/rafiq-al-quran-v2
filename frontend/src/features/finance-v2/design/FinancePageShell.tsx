/**
 * FinancePageShell — the outermost wrapper for every finance page.
 *
 * Responsibilities:
 * - Apply the `finance-surface` design-token scope.
 * - Stack: header → kpi-strip → toolbar → content in a vertical rhythm.
 * - Consumers pass children in slots rather than positional order, so layout
 *   stays consistent even if a slot is omitted (e.g. a page without KPIs).
 */
import type { ReactNode } from "react";
import "./tokens.css";

export interface FinancePageShellProps {
  header: ReactNode;
  kpis?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  dir?: "rtl" | "ltr";
}

export function FinancePageShell({
  header,
  kpis,
  toolbar,
  children,
  className = "",
  dir
}: FinancePageShellProps) {
  return (
    <div className={`finance-surface ${className}`.trim()} dir={dir}>
      {header}
      {kpis}
      {toolbar}
      <div className="finance-surface__content">{children}</div>
    </div>
  );
}

export default FinancePageShell;
