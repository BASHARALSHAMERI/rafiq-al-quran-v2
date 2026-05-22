/**
 * FinanceEmptyState — three explicit states:
 * - first-time: no records created yet (icon + compact headline + primary CTA).
 * - filtered-no-results: a filter returned nothing (icon + compact text + clear button).
 * - forbidden: user lacks permission (minimal, no CTA).
 *
 * No paragraphs of explanation. One line of text max.
 */
import type { ReactNode } from "react";
import { Inbox, FileSearch, ShieldAlert } from "lucide-react";
import { useI18n } from "../../../app/i18n";

export type FinanceEmptyVariant = "first-time" | "filtered" | "forbidden";

export interface FinanceEmptyStateProps {
  variant: FinanceEmptyVariant;
  /** Override the default icon. */
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const defaults: Record<
  FinanceEmptyVariant,
  { icon: ReactNode; title: (ar: boolean) => string; desc: (ar: boolean) => string }
> = {
  "first-time": {
    icon: <Inbox className="finance-empty-state__icon" aria-hidden />,
    title: (ar) => (ar ? "لا توجد بيانات" : "No data yet"),
    desc: (ar) => (ar ? "أضف السجل الأول لبدء التتبع." : "Add the first record to start tracking.")
  },
  filtered: {
    icon: <FileSearch className="finance-empty-state__icon" aria-hidden />,
    title: (ar) => (ar ? "لا توجد نتائج" : "No results"),
    desc: (ar) => (ar ? "جرب تعديل الفلاتر أو البحث." : "Try adjusting filters or search.")
  },
  forbidden: {
    icon: <ShieldAlert className="finance-empty-state__icon" aria-hidden />,
    title: (ar) => (ar ? "غير مصرّح" : "Not authorized"),
    desc: (ar) => (ar ? "ليس لديك صلاحية الوصول." : "You do not have permission to access this.")
  }
};

export function FinanceEmptyState({
  variant,
  icon,
  title,
  description,
  action,
  className = ""
}: FinanceEmptyStateProps) {
  const { language } = useI18n();
  const ar = language === "ar";
  const preset = defaults[variant];

  return (
    <div className={`finance-empty-state ${className}`.trim()}>
      {icon ?? preset.icon}
      <div className="finance-empty-state__title">{title ?? preset.title(ar)}</div>
      <div className="finance-empty-state__description">
        {description ?? preset.desc(ar)}
      </div>
      {action ? <div className="finance-empty-state__action">{action}</div> : null}
    </div>
  );
}

export default FinanceEmptyState;
