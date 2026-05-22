import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "../../app/i18n";
import { commonFeedback, text } from "../../shared/ui/feedback";
import Button, { type ButtonVariant } from "./Button";
import Modal, { type ModalProps } from "./Modal";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: ReactNode;
  message?: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  isConfirming?: boolean;
  confirmDisabled?: boolean;
  persistent?: boolean;
  size?: ModalProps["size"];
  icon?: ReactNode;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  children,
  confirmLabel,
  cancelLabel,
  confirmVariant = "danger",
  isConfirming = false,
  confirmDisabled = false,
  persistent = false,
  size = "sm",
  icon
}: ConfirmModalProps) {
  const { language } = useI18n();
  const ar = language === "ar";
  const resolvedConfirmLabel = confirmLabel ?? text(ar, commonFeedback.confirm);
  const resolvedCancelLabel = cancelLabel ?? text(ar, commonFeedback.cancel);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      persistent={persistent}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isConfirming}>
            {resolvedCancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={() => void onConfirm()}
            isLoading={isConfirming}
            disabled={confirmDisabled}
          >
            {resolvedConfirmLabel}
          </Button>
        </>
      }
    >
      <div className="confirm-modal">
        <div className="confirm-modal__icon">
          {icon ?? <AlertTriangle className="w-5 h-5" />}
        </div>
        <div className="confirm-modal__content">{message || children}</div>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
