/**
 * FinanceFormModal — composable form modal used by all finance create/edit
 * dialogs. Wraps the shared Modal with:
 *
 * - A single top-of-form error banner (consumer passes the message; we render
 *   the frame and styling).
 * - A sticky footer with Cancel + Submit, where Submit is wired by `formId`
 *   (the consumer owns the <form id={formId}> inside `children`).
 * - Optional `FormSection` slots to visually group fields without importing a
 *   different primitive.
 *
 * The modal intentionally does not render explanatory paragraphs. Any hint
 * belongs to the field itself (helper text / tooltip).
 */
import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import Modal, { type ModalProps } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { useI18n } from "../../../app/i18n";

export interface FinanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** The id used on the <form> element inside children; wires the footer submit. */
  formId: string;
  children: ReactNode;
  /** Short error string shown at the top of the form. Long multi-line text is discouraged. */
  error?: string | null;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  size?: ModalProps["size"];
  /** Prevents close-on-backdrop while submitting. */
  persistent?: boolean;
  panelClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

export function FinanceFormModal({
  isOpen,
  onClose,
  title,
  subtitle,
  formId,
  children,
  error,
  submitLabel,
  cancelLabel,
  isSubmitting = false,
  submitDisabled = false,
  size = "md",
  persistent = false,
  panelClassName = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = ""
}: FinanceFormModalProps) {
  const { language } = useI18n();
  const ar = language === "ar";
  const resolvedSubmit = submitLabel ?? (ar ? "حفظ" : "Save");
  const resolvedCancel = cancelLabel ?? (ar ? "إلغاء" : "Cancel");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={subtitle}
      size={size}
      persistent={persistent || isSubmitting}
      panelClassName={panelClassName}
      headerClassName={headerClassName}
      bodyClassName={bodyClassName}
      footerClassName={footerClassName}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {resolvedCancel}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            isLoading={isSubmitting}
            disabled={submitDisabled}
          >
            {resolvedSubmit}
          </Button>
        </>
      }
    >
      {error ? (
        <div className="finance-form-modal__error-banner" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}
      {children}
    </Modal>
  );
}

/**
 * FinanceFormSection — lightweight visual grouper inside a form modal.
 * Consumers call it directly: <FinanceFormSection title="...">...</FinanceFormSection>
 */
export function FinanceFormSection({
  title,
  children,
  className = ""
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`finance-form-modal__section ${className}`.trim()}>
      {title ? <div className="finance-form-modal__section-title">{title}</div> : null}
      {children}
    </div>
  );
}

export default FinanceFormModal;
