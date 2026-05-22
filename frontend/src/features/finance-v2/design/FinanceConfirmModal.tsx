/**
 * FinanceConfirmModal — confirm dialogs for sensitive finance actions:
 * Post, Void, Reject, Delete, Approve-void-request, etc.
 *
 * Builds on the shared ConfirmModal and adds:
 * - Optional "reason" text area (shown when a caller passes `onReasonChange`).
 * - Mandatory tone: danger for destructive, warning for reversible, info for info.
 *
 * No long explanations inside the modal; the caller passes a one-line
 * `message`, and any field-level hint belongs to the reason input’s label.
 */
import type { ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";
import ConfirmModal, { type ConfirmModalProps } from "../../../components/ui/ConfirmModal";
import { useI18n } from "../../../app/i18n";

export type FinanceConfirmTone = "danger" | "warning" | "info";

export interface FinanceConfirmModalProps
  extends Omit<ConfirmModalProps, "icon" | "confirmVariant" | "children"> {
  tone: FinanceConfirmTone;
  message: ReactNode;
  /** If provided, the modal renders a reason textarea above the buttons. */
  reason?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    required?: boolean;
  };
}

const toneIcon: Record<FinanceConfirmTone, ReactNode> = {
  danger: <AlertTriangle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />
};

const toneVariant: Record<FinanceConfirmTone, ConfirmModalProps["confirmVariant"]> = {
  danger: "danger",
  warning: "warning",
  info: "primary"
};

export function FinanceConfirmModal({
  tone,
  message,
  reason,
  ...rest
}: FinanceConfirmModalProps) {
  const { language } = useI18n();
  const ar = language === "ar";

  return (
    <ConfirmModal
      {...rest}
      icon={toneIcon[tone]}
      confirmVariant={toneVariant[tone]}
      size="sm"
      confirmDisabled={rest.confirmDisabled || (!!reason?.required && !reason.value.trim())}
    >
      <div className="text-sm leading-relaxed">{message}</div>
      {reason ? (
        <div className="mt-3">
          <label className="block text-xs font-semibold mb-1 opacity-80">
            {ar ? "السبب (اختياري)" : "Reason (optional)"}
            {reason.required ? (
              <span className="text-red-600 ms-1">*</span>
            ) : null}
          </label>
          <textarea
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900"
            rows={2}
            value={reason.value}
            onChange={(e) => reason.onChange(e.target.value)}
            placeholder={reason.placeholder ?? (ar ? "اكتب السبب..." : "Enter reason...")}
          />
        </div>
      ) : null}
    </ConfirmModal>
  );
}

export default FinanceConfirmModal;
