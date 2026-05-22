/**
 * FinancePageHeader — thin wrapper around the shared PageHeader with a strict
 * single-line subtitle rule. Keeps all finance pages visually aligned and
 * blocks multi-paragraph explanatory text from leaking into page headers.
 */
import type { ReactNode } from "react";
import { PageHeader } from "../../../components/ui/PageHeader";

export interface FinancePageHeaderProps {
  title: string;
  /** One short line. Longer text is intentionally not supported. */
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function FinancePageHeader({ title, subtitle, icon, actions, className }: FinancePageHeaderProps) {
  return (
    <div className={className}>
      <PageHeader
        title={title}
        description={subtitle}
        icon={icon}
        actions={actions}
      />
    </div>
  );
}

export default FinancePageHeader;
