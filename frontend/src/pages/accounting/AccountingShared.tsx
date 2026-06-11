import { BookOpen, CalendarClock, FileText, Landmark, Scale, Table2 } from "lucide-react";
import type { DataTableColumn } from "../../components/ui/DataTable";
import type { AccountingAccountType, AccountingNormalBalance, JournalEntryStatus, JournalSourceType } from "./accounting.api";
import "./accounting-preview.css";
import { Badge } from "../../components/ui/Badge";

export const accountTypeLabels: Record<AccountingAccountType, string> = {
  ASSET: "أصول",
  LIABILITY: "خصوم",
  NET_ASSET: "صافي الأصول",
  REVENUE: "إيرادات",
  EXPENSE: "مصروفات"
};

export const normalBalanceLabels: Record<AccountingNormalBalance, string> = {
  DEBIT: "مدين",
  CREDIT: "دائن"
};

export const journalStatusLabels: Record<JournalEntryStatus, string> = {
  DRAFT: "مسودة",
  POSTED: "مرحل",
  VOID: "ملغى"
};

export const sourceTypeLabels: Record<JournalSourceType, string> = {
  INVOICE: "فاتورة",
  PAYMENT: "دفعة",
  VOUCHER: "سند",
  FUND_TRANSFER: "تحويل",
  MANUAL: "يدوي",
  PAYROLL: "رواتب",
  REWARD: "مكافآت",
  DEDUCTION: "استقطاع",
  EXPENSE_INVOICE: "فاتورة مصروف",
  EXPENSE_PAYMENT: "دفع مصروف",
  ASSET_ACQUISITION: "اقتناء أصل",
  ASSET_DEPRECIATION: "إهلاك أصل"
};

export const accountingLinks = [
  { to: "/finance/accounting/accounts", label: "شجرة الحسابات", icon: Table2 },
  { to: "/finance/accounting/journal-entries", label: "القيود اليومية", icon: FileText },
  { to: "/finance/accounting/ledger", label: "دفتر الأستاذ", icon: BookOpen },
  { to: "/finance/accounting/trial-balance", label: "ميزان المراجعة", icon: Scale },
  { to: "/finance/accounting/fiscal-periods", label: "الفترات المالية", icon: CalendarClock }
];

export const toDisplayText = (value: unknown, fallback = "-"): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value || fallback;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? fallback : value.toISOString();
  return fallback;
};

export const formatDate = (value?: unknown) => {
  if (!value) return "-";
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ar-YE-u-nu-latn", { dateStyle: "medium" }).format(date);
};

export const formatMoney = (value: unknown) => {
  const numeric = Number(value ?? 0);
  return `${Math.round(Number.isFinite(numeric) ? numeric : 0).toLocaleString("ar-YE-u-nu-latn")} ر.ي`;
};

export const statusClassName = (status: JournalEntryStatus) => {
  if (status === "POSTED") return "acc-chip acc-chip--success";
  if (status === "DRAFT") return "acc-chip acc-chip--warning";
  return "acc-chip acc-chip--muted";
};


export function AccountTypeBadge({ type }: { type: AccountingAccountType }) {
  const variants: Record<AccountingAccountType, any> = {
    ASSET: "primary",
    LIABILITY: "error",
    NET_ASSET: "info",
    REVENUE: "success",
    EXPENSE: "warning"
  };
  return (
    <Badge variant={variants[type] || "default"} size="sm">
      {accountTypeLabels[type]}
    </Badge>
  );
}

export function ClassificationBadge({ isMain }: { isMain: boolean }) {
  return (
    <Badge variant={isMain ? "default" : "secondary"} size="sm" dot={isMain}>
      {isMain ? "تجميعي" : "قابل للترحيل"}
    </Badge>
  );
}

export function VoucherAccountingStatus({
  status,
  type,
  sourceType,
  ar
}: {
  status: string;
  type: string;
  sourceType?: string;
  ar: boolean;
}) {
  if (status !== "POSTED") {
    return (
      <span className="text-[10px] text-gray-400 font-medium">
        {ar ? "غير مرحل" : "Not Posted"}
      </span>
    );
  }

  if (type === "RECEIPT") {
    if (sourceType === "PAYMENT") {
      return (
        <span className="text-[10px] text-blue-600 font-bold">
          {ar ? "✓ القيد مسجل عبر الدفعة" : "✓ Entry registered via payment"}
        </span>
      );
    }
    return (
      <span className="text-[10px] text-green-600 font-bold">
        {ar ? "✓ تم إنشاء قيد محاسبي" : "✓ Accounting entry created"}
      </span>
    );
  }

  if (type === "DISBURSEMENT") {
    return (
      <span className="text-[10px] text-amber-600 font-bold">
        {ar ? "✓ تم إنشاء قيد محاسبي" : "✓ Accounting entry created"}
      </span>
    );
  }

  return null;
}

export function VoucherTypeBadge({ type, ar }: { type: string; ar: boolean }) {
  const isReceipt = type === "RECEIPT";
  return (
    <span className={`acc-chip ${isReceipt ? "acc-chip--success" : "acc-chip--danger"}`}>
      {isReceipt ? (ar ? "سند قبض" : "Receipt") : (ar ? "سند صرف" : "Disbursement")}
    </span>
  );
}

export function VoucherCategoryBadge({ category }: { category?: string | null }) {
  if (!category) return null;
  return (
    <span className="acc-chip acc-chip--muted">
      {category}
    </span>
  );
}


export type AccountingColumn<TRow> = DataTableColumn<TRow>;

export const accountingTitleIcon = <Landmark className="w-6 h-6" />;
