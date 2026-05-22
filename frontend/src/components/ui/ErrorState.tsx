import { AlertTriangle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "../../app/i18n";
import { commonFeedback, text } from "../../shared/ui/feedback";
import Button from "./Button";

const resolveErrorMessage = (error: unknown) => {
  if (!error) {
    return undefined;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const candidate = (error as { message?: unknown }).message;
    if (typeof candidate === "string") {
      return candidate;
    }
  }

  return undefined;
};

export interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: unknown;
  action?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title,
  description,
  error,
  action,
  onRetry,
  retryLabel,
  className = ""
}: ErrorStateProps) {
  const { language } = useI18n();
  const ar = language === "ar";
  const resolvedTitle = title ?? text(ar, commonFeedback.errorTitle);
  const resolvedRetryLabel = retryLabel ?? text(ar, commonFeedback.retry);
  const message =
    description ?? resolveErrorMessage(error) ?? text(ar, commonFeedback.errorDescription);

  return (
    <section className={`app-error-state ${className}`.trim()} role="alert">
      <div className="app-error-state__icon">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="app-error-state__content">
        <h3 className="app-error-state__title">{resolvedTitle}</h3>
        <p className="app-error-state__description">{message}</p>
      </div>
      <div className="app-error-state__actions">
        {action}
        {onRetry ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={onRetry}
          >
            {resolvedRetryLabel}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export default ErrorState;
