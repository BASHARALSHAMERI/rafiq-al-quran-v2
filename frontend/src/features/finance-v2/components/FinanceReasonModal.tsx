import { useId, useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, MessageSquare } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";

type FinanceReasonModalProps = {
  isOpen: boolean;
  title: string;
  placeholder: string;
  submitLabel: string;
  cancelLabel: string;
  requiredMessage: string;
  isSubmitting?: boolean;
  errorMessage?: string;
  onSubmit: (reason: string) => Promise<void> | void;
  onClose: () => void;
};

export default function FinanceReasonModal({
  isOpen,
  ...props
}: FinanceReasonModalProps) {
  if (!isOpen) {
    return null;
  }

  return <FinanceReasonModalContent key="finance-reason-modal" isOpen={isOpen} {...props} />;
}

function FinanceReasonModalContent({
  isOpen,
  title,
  placeholder,
  submitLabel,
  cancelLabel,
  requiredMessage,
  isSubmitting = false,
  errorMessage,
  onSubmit,
  onClose
}: FinanceReasonModalProps) {
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState("");
  const formId = useId();

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    setReason("");
    setLocalError("");
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setLocalError(requiredMessage);
      return;
    }
    setLocalError("");
    await onSubmit(trimmedReason);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      titleIcon={
        <div className="circlemod-head-icon">
          <MessageSquare className="w-4 h-4" />
        </div>
      }
      size="md"
      panelClassName="circlemod-panel"
      bodyClassName="circlemod-body"
      footerClassName="circlemod-footer-wrap"
      footer={
        <div className="circlemod-footer">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button type="submit" form={formId} isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      }
    >
      <form id={formId} className="circlemod-form" onSubmit={handleSubmit}>
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <MessageSquare size={15} className="circlemod-section-icon" />
            <span>{placeholder}</span>
          </div>
          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <input
                className="circlemod-input"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={placeholder}
                autoFocus
              />
            </div>
          </div>
        </div>
        {(localError || errorMessage) && (
          <div className="circlemod-error" role="alert">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{localError || errorMessage}</span>
          </div>
        )}
      </form>
    </Modal>
  );
}
