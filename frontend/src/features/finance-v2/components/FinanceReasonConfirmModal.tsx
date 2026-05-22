import type { ReactNode } from "react";
import type { ButtonVariant } from "../../../components/ui/Button";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { Input } from "../../../components/ui/Input";

type FinanceReasonConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description?: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  placeholder?: string;
  label?: string;
  isConfirming?: boolean;
  confirmVariant?: ButtonVariant;
  confirmDisabled?: boolean;
};

export function FinanceReasonConfirmModal({
  isOpen,
  title,
  description,
  value,
  onValueChange,
  onClose,
  onConfirm,
  confirmLabel,
  cancelLabel,
  placeholder,
  label,
  isConfirming,
  confirmVariant = "danger",
  confirmDisabled = false
}: FinanceReasonConfirmModalProps) {
  const trimmedValue = value.trim();

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => onConfirm(trimmedValue)}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      confirmVariant={confirmVariant}
      isConfirming={isConfirming}
      confirmDisabled={confirmDisabled || trimmedValue.length === 0}
    >
      <Input
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        label={label}
        placeholder={placeholder}
        autoFocus
      />
    </ConfirmModal>
  );
}

export default FinanceReasonConfirmModal;
