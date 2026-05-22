import type { ReactNode } from "react";
import { useI18n } from "../../app/i18n";
import { commonFeedback, text } from "../../shared/ui/feedback";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  const { language } = useI18n();
  const ar = language === "ar";
  const resolvedTitle = title ?? text(ar, commonFeedback.emptyTitle);
  const resolvedDescription = description ?? text(ar, commonFeedback.emptyDescription);

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon || (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7" />
            <path d="M8 20v-7" />
            <path d="M12 20V10" />
            <path d="M16 20v-5" />
            <path d="M22 20H2" />
          </svg>
        )}
      </div>
      <h3 className="empty-state-title">{resolvedTitle}</h3>
      <p className="empty-state-description">{resolvedDescription}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export default EmptyState;
