import type { ReactNode } from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import "../../styles/components/inline-alert.css";

export type InlineAlertVariant = "info" | "success" | "warning" | "error";

export interface InlineAlertProps {
  variant: InlineAlertVariant;
  title?: string;
  message?: string;
  children?: ReactNode;
  className?: string;
  action?: ReactNode;
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

export function InlineAlert({
  variant,
  title,
  message,
  children,
  className = "",
  action,
}: InlineAlertProps) {
  const Icon = icons[variant];
  const role = variant === "error" || variant === "warning" ? "alert" : "status";
  const ariaLive = role === "status" ? "polite" : "assertive";

  return (
    <div
      className={`inline-alert inline-alert--${variant} ${className}`}
      role={role}
      aria-live={ariaLive}
    >
      <div className="inline-alert__icon">
        <Icon className="h-5 w-5" />
      </div>
      <div className="inline-alert__content">
        {title && <h4 className="inline-alert__title">{title}</h4>}
        <div className="inline-alert__body">{children || message}</div>
      </div>
      {action && <div className="inline-alert__action">{action}</div>}
    </div>
  );
}
