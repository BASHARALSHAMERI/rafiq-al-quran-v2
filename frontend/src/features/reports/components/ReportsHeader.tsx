import type { ReactNode } from "react";
import { useI18n } from "../../../app/i18n";

export type ReportsHeaderProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: ReactNode;
};

export function ReportsHeader({ title, description, icon, actions }: ReportsHeaderProps) {
  const { language } = useI18n();
  const ar = language === "ar";

  return (
    <header className={`mb-4 ${ar ? "text-right" : "text-left"}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shadow-sm">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export default ReportsHeader;
