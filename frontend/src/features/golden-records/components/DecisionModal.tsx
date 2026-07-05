import type { ReactNode } from "react";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import type { ButtonVariant } from "../../../components/ui/Button";

type DecisionModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  note: string;
  noteLabel: string;
  notePlaceholder: string;
  requireNote?: boolean;
  summary?: ReactNode;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  onNoteChange: (value: string) => void;
};

export function DecisionModal({
  isOpen,
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel,
  confirmVariant,
  note,
  noteLabel,
  notePlaceholder,
  requireNote = false,
  summary,
  isLoading,
  onClose,
  onConfirm,
  onNoteChange
}: DecisionModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      confirmVariant={confirmVariant}
      isConfirming={isLoading}
      confirmDisabled={requireNote && !note.trim()}
      cancelLabel={cancelLabel}
      size="md"
    >
      <div className="golden-records-decision-modal">
        {summary}
        <div className="golden-records-field">
          <label className="golden-records-field__label">
            {noteLabel}
            {requireNote ? <span className="golden-records-field__required">*</span> : null}
          </label>
          <textarea
            className="golden-records-textarea"
            rows={4}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={notePlaceholder}
          />
        </div>
      </div>
    </ConfirmModal>
  );
}
