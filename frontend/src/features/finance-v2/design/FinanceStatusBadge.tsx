/**
 * FinanceStatusBadge — a single source of truth for status pills used across
 * every finance table (vouchers, donations, pledges, invoices, payments,
 * payroll/reward batches, transfers, void requests).
 *
 * The `status` input is the raw backend enum value (e.g. "POSTED", "DRAFT").
 * The component maps it to a stable colour + a bilingual label, so pages never
 * hand-roll their own pills.
 *
 * If a caller passes a status we do not know yet, we fall back to a neutral
 * pill with the raw value — this preserves forward-compatibility when a new
 * state is added on the backend.
 */
import { useI18n } from "../../../app/i18n";

export type FinanceStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "POSTED"
  | "REJECTED"
  | "VOIDED"
  | "VOID_REQUESTED"
  | "CANCELLED"
  | "PAID"
  | "PARTIALLY_PAID"
  | "ISSUED"
  | "OVERDUE"
  | "RECEIVED"
  | "PLEDGED"
  | "COMPLETED"
  | "FAILED"
  | "PENDING";

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "muted";

const TABLE: Record<FinanceStatus, { tone: Tone; ar: string; en: string }> = {
  DRAFT:           { tone: "muted",   ar: "مسودة",          en: "Draft" },
  SUBMITTED:       { tone: "info",    ar: "مُرسل",           en: "Submitted" },
  APPROVED:        { tone: "info",    ar: "مُعتمد",          en: "Approved" },
  POSTED:          { tone: "success", ar: "مُرحَّل",           en: "Posted" },
  REJECTED:        { tone: "danger",  ar: "مرفوض",          en: "Rejected" },
  VOIDED:          { tone: "danger",  ar: "ملغي",            en: "Voided" },
  VOID_REQUESTED:  { tone: "warning", ar: "طلب إلغاء",      en: "Void requested" },
  CANCELLED:       { tone: "muted",   ar: "ملغي",            en: "Cancelled" },
  PAID:            { tone: "success", ar: "مدفوع",           en: "Paid" },
  PARTIALLY_PAID:  { tone: "warning", ar: "مدفوع جزئيًا",    en: "Partially paid" },
  ISSUED:          { tone: "info",    ar: "صادر",            en: "Issued" },
  OVERDUE:         { tone: "danger",  ar: "متأخر",           en: "Overdue" },
  RECEIVED:        { tone: "success", ar: "مستلم",           en: "Received" },
  PLEDGED:         { tone: "warning", ar: "تعهد",            en: "Pledged" },
  COMPLETED:       { tone: "success", ar: "مكتمل",           en: "Completed" },
  FAILED:          { tone: "danger",  ar: "فشل",             en: "Failed" },
  PENDING:         { tone: "warning", ar: "قيد الانتظار",    en: "Pending" }
};

export interface FinanceStatusBadgeProps {
  status: FinanceStatus | string | null | undefined;
  /** Optional override for the rendered label (e.g. to include the voucher no). */
  label?: string;
  className?: string;
}

export function FinanceStatusBadge({ status, label, className = "" }: FinanceStatusBadgeProps) {
  const { language } = useI18n();
  const ar = language === "ar";
  const key = String(status ?? "").toUpperCase() as FinanceStatus;
  const entry = TABLE[key];
  const tone: Tone = entry?.tone ?? "neutral";
  const text = label ?? (entry ? (ar ? entry.ar : entry.en) : String(status ?? "-"));

  return (
    <span className={`finance-status-badge finance-status-badge--${tone} ${className}`.trim()}>
      {text}
    </span>
  );
}

export default FinanceStatusBadge;
