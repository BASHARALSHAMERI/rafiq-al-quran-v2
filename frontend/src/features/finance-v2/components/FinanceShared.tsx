import { CheckCircle, Clock, AlertTriangle, Banknote, CreditCard } from "lucide-react";
import type { ElementType } from "react";
import type { InvoiceStatusV2, PaymentMethodV2 } from "../types";
import { FINANCE_YEMEN_MODE } from "../config";
import { FinanceTableFooter } from "../design";

export const posInt = (v: string): number | undefined => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export const money = (v: number, ar: boolean) => `${Math.round(v).toLocaleString(ar ? "ar-YE-u-nu-latn" : "en-US")} ${ar ? "ر.ي" : "YER"}`;

export const shortDate = (v: string | null | undefined, ar: boolean) => {
  if (!v) return "-";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(ar ? "ar-SA-u-nu-latn" : "en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
};

export const statusMeta: Record<InvoiceStatusV2, { cls: string; icon: ElementType }> = {
  PENDING: { cls: "fin-status--amber", icon: Clock },
  PARTIAL: { cls: "fin-status--blue", icon: AlertTriangle },
  PAID:    { cls: "fin-status--emerald", icon: CheckCircle },
  CANCELLED: { cls: "fin-status--rose", icon: AlertTriangle },
};

export const methodIcons: Record<PaymentMethodV2, ElementType> = {
  CASH: Banknote,
  TRANSFER: CreditCard,
};

export const methodLabels: Record<PaymentMethodV2, string> = {
  CASH: "نقدي (Cash)",
  TRANSFER: "حوالة بنكية (Transfer)",
};

export const statusLabels: Record<InvoiceStatusV2, string> = {
  PENDING: "قيد الانتظار",
  PARTIAL: "مدفوع جزئياً",
  PAID: "مدفوع بالكامل",
  CANCELLED: "ملغاة",
};

export const voucherStatusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  SUBMITTED: "قيد المراجعة",
  APPROVED: "معتمد",
  POSTED: "مرحل",
  REJECTED: "مرفوض",
  CANCELLED: "ملغى",
  PAID: "مدفوع",
  PARTIALLY_PAID: "مدفوع جزئياً",
  IN_PROGRESS: "قيد التنفيذ",
  CLOSED: "مغلق",
};

export const getYemenModeStatus = (status: string, ar: boolean) => {
  if (!FINANCE_YEMEN_MODE) return status;
  switch (status) {
    case "DRAFT":
    case "REJECTED":
      return ar ? "قيد الإعداد" : "Preparing";
    case "SUBMITTED":
    case "VOID_REQUESTED":
      return ar ? "بانتظار الاعتماد" : "Pending Approval";
    case "APPROVED":
      return ar ? "معتمد" : "Approved";
    case "POSTED":
    case "VOIDED":
    case "CANCELLED":
      return ar ? "مُرحّل/منتهي" : "Posted/Ended";
    case "IN_PROGRESS":
    case "PARTIALLY_PAID":
      return ar ? "قيد التنفيذ" : "In Progress";
    case "CLOSED":
      return ar ? "مغلق" : "Closed";
    default:
      return status;
  }
};

export type FinStepItem = {
  title: string;
  hint?: string;
};

export function FinStepGuide({
  ar,
  steps,
  currentStep = 0,
  title
}: {
  ar: boolean;
  steps: FinStepItem[];
  currentStep?: number;
  title?: string;
}) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <section className="fin-steps" aria-label={title ?? (ar ? "خطوات التنفيذ" : "Execution steps")}>
      <div className="fin-steps__head">
        <h3 className="fin-steps__title">{title ?? (ar ? "خطوات التنفيذ" : "Execution Steps")}</h3>
        <span className="fin-steps__count">
          {steps.length} {ar ? "خطوات" : "steps"}
        </span>
      </div>
      <ol className="fin-steps__list">
        {steps.map((step, index) => {
          const state = index < currentStep ? "done" : index === currentStep ? "active" : "idle";
          return (
            <li key={`${step.title}-${index}`} className={`fin-step fin-step--${state}`}>
              <span className="fin-step__index">{index + 1}</span>
              <div className="fin-step__content">
                <p className="fin-step__title">{step.title}</p>
                {step.hint && <p className="fin-step__hint">{step.hint}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function FinEmpty({ icon: Icon, text }: { icon: ElementType; text: string }) {
  return (
    <div className="fin-empty">
      <Icon className="w-10 h-10" />
      <p>{text}</p>
    </div>
  );
}

export function FinSkeleton({ rows }: { rows: number }) {
  return (
    <div className="fin-skeleton">{Array.from({ length: rows }).map((_, i) => <div key={i} className="fin-skeleton__row" />)}</div>
  );
}

export function FinancePaginationFooter({
  ar,
  pageSize,
  setPageSize,
  currentPage,
  setPage,
  totalFilteredCount,
  pages
}: {
  ar: boolean;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setPage: (page: number | ((p: number) => number)) => void;
  totalFilteredCount: number;
  pages: number;
}) {
  return (
    <FinanceTableFooter
      ar={ar}
      pageSize={pageSize}
      setPageSize={setPageSize}
      currentPage={currentPage}
      setPage={setPage}
      totalFilteredCount={totalFilteredCount}
      pages={pages}
    />
  );
}
