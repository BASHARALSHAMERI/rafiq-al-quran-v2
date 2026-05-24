import { 
  Banknote,
  FileText,
  Wallet, 
  Plus, 
  RefreshCw, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Send,
  FileCheck,
  Ban,
  ChevronLeft,
  ChevronRight,
  Printer,
  AlertCircle,
  Hash,
  StickyNote,
  Coins,
  Calendar,
  ArrowLeftRight,
  Building2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "../../app/i18n";
import { useAuthStore } from "../../features/auth/auth.store";
import { Button } from "../../components/ui/Button";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";
import { notifyError, notifySuccess } from "../../shared/ui/feedback";
import {
  useApproveFinanceV2VoucherMutation,
  useApproveFinanceV2VoucherVoidMutation,
  useCreateFinanceV2VoucherMutation,
  useCurrenciesQuery,
  useFinanceV2AccountsQuery,
  useFinanceV2VouchersQuery,
  useLatestExchangeRateQuery,
  usePostFinanceV2VoucherMutation,
  useRejectFinanceV2VoucherMutation,
  useRequestFinanceV2VoucherVoidMutation,
  useSubmitFinanceV2VoucherMutation
} from "../../features/finance-v2/finance-v2.hooks";
import type {
  CreateFinanceVoucherV2Payload,
  FinanceVoucherV2,
  PaymentMethodV2,
  VoucherStatusV2,
  VoucherTypeV2
} from "../../features/finance-v2/types";
import {
  FinanceConfirmModal,
  FinanceDataTable,
  FinanceEmptyState,
  FinanceMoney,
  FinancePageHeader,
  FinancePageShell,
  FinanceStatusBadge,
  financeActionsColumn,
  type FinanceDataTableColumn
} from "../../features/finance-v2/design";
import Modal from "../../components/ui/Modal";

import { printVoucherReceipt } from "../../features/accounting/printAccounting";
import { FINANCE_YEMEN_MODE } from "../../features/finance-v2/config";
import "../../styles/pages/centers-modern.css";
import "../../styles/pages/finance-premium.css";
import "../../styles/pages/vouchers-premium.css";
import "../../styles/pages/finance-v4.css";

// Status types for KPI filtering
type VoucherStatusFilter = VoucherStatusV2 | "ALL";

const statusLabels: Record<VoucherStatusV2, { ar: string; en: string }> = {
  DRAFT: { ar: "مسودة", en: "Draft" },
  SUBMITTED: { ar: "مُرسل", en: "Submitted" },
  APPROVED: { ar: "مُعتمد", en: "Approved" },
  REJECTED: { ar: "مرفوض", en: "Rejected" },
  POSTED: { ar: "مُرحَّل", en: "Posted" },
  VOID_REQUESTED: { ar: "طلب إلغاء", en: "Void Requested" },
  VOIDED: { ar: "ملغي", en: "Voided" },
  CANCELLED: { ar: "ملغى", en: "Cancelled" }
};

const methodLabels: Record<PaymentMethodV2, string> = {
  CASH: "نقدي",
  TRANSFER: "تحويل"
};

// Accounting category labels (FA-3.2.1 enum). Uses a dedicated map so the
// table cell does not collide with the voucher status labels.
type AccountingCategoryKey =
  | "DONATION"
  | "STUDENT_CONTRIBUTION"
  | "OTHER_INCOME"
  | "OPERATING_EXPENSE"
  | "EDUCATIONAL_EXPENSE"
  | "CENTER_EXPENSE"
  | "REWARD";

const categoryLabels: Record<AccountingCategoryKey, { ar: string; en: string }> = {
  DONATION: { ar: "تبرعات", en: "Donation" },
  STUDENT_CONTRIBUTION: { ar: "مساهمات طلابية", en: "Student Contribution" },
  OTHER_INCOME: { ar: "إيرادات أخرى", en: "Other Income" },
  OPERATING_EXPENSE: { ar: "مصاريف تشغيلية", en: "Operating Expense" },
  EDUCATIONAL_EXPENSE: { ar: "مصاريف تعليمية", en: "Educational Expense" },
  CENTER_EXPENSE: { ar: "مصاريف المركز", en: "Center Expense" },
  REWARD: { ar: "مكافآت", en: "Reward" }
};

function VouchersKpi({
  icon: Icon,
  cls,
  val,
  label
}: {
  icon: React.ElementType;
  cls: string;
  val: React.ReactNode;
  label: string;
}) {
  return (
    <motion.div
      className={`ctr-kpi-modern ${cls}`}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
    >
      <div className="ctr-kpi-icon-wrap">
        <Icon size={24} />
      </div>
      <div className="ctr-kpi-content">
        <span className="ctr-kpi-val">{val}</span>
        <span className="ctr-kpi-label">{label}</span>
      </div>
    </motion.div>
  );
}

export default function FinanceVouchersPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const isCoreAdmin = user?.role === "SUPER_ADMIN" || user?.role === "CENTER_ADMIN";
  const canCreateVoucher = isCoreAdmin || user?.role === "ACCOUNTANT";

  // Search and filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VoucherStatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Voucher form state
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    voucherType: "RECEIPT" as VoucherTypeV2,
    accountId: "",
    manualReferenceNo: "",
    originalAmount: "",
    originalCurrencyCode: "YER",
    exchangeRateToBase: "1",
    paymentMethod: (FINANCE_YEMEN_MODE ? "CASH" : "TRANSFER") as PaymentMethodV2,
    accountingCategory: "" as CreateFinanceVoucherV2Payload["accountingCategory"] | "",
    externalTransferRef: "",
    description: "",
    beneficiary: "",
    voucherDate: new Date().toISOString().slice(0, 10),
    notes: ""
  });
  const [voucherError, setVoucherError] = useState<string | null>(null);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    tone: "danger" | "warning" | "info";
    action: () => Promise<void>;
    reasonRequired?: boolean;
    reasonPlaceholder?: string;
  } | null>(null);
  const [reasonValue, setReasonValue] = useState("");

  // Data queries
  const vouchersQ = useFinanceV2VouchersQuery(undefined);
  const vouchers = useMemo(() => vouchersQ.data?.rows ?? [], [vouchersQ.data]);
  const accountsQ = useFinanceV2AccountsQuery(undefined);
  const accounts = useMemo(() => accountsQ.data ?? [], [accountsQ.data]);
  const currenciesQ = useCurrenciesQuery();
  const currencyOptions = useMemo(() => {
    const active = (currenciesQ.data ?? []).filter((c) => c.isActive);
    if (active.some((c) => c.code === "YER")) return active;
    return [{ code: "YER", nameAr: "الريال اليمني", nameEn: "Yemeni Rial", isActive: true } as any, ...active];
  }, [currenciesQ.data]);

  // FX rate auto-fill
  const isYer = (voucherForm.originalCurrencyCode || "YER").toUpperCase() === "YER";
  const latestRateQ = useLatestExchangeRateQuery(isYer ? undefined : voucherForm.originalCurrencyCode);
  useEffect(() => {
    if (isYer) {
      if (voucherForm.exchangeRateToBase !== "1") {
        setVoucherForm((prev) => ({ ...prev, exchangeRateToBase: "1" }));
      }
      return;
    }
    if (voucherForm.exchangeRateToBase) return;
    const latest = latestRateQ.data?.rateToBase;
    if (latest && Number(latest) > 0) {
      setVoucherForm((prev) => ({ ...prev, exchangeRateToBase: String(latest) }));
    }
  }, [isYer, voucherForm.originalCurrencyCode, voucherForm.exchangeRateToBase, latestRateQ.data]);

  // Derived amounts
  const baseAmountPreview = useMemo(() => {
    const amt = Number(voucherForm.originalAmount);
    const rate = Number(voucherForm.exchangeRateToBase || (isYer ? 1 : 0));
    if (!Number.isFinite(amt) || !Number.isFinite(rate) || amt <= 0 || rate <= 0) return null;
    return Math.round(amt * rate * 100) / 100;
  }, [voucherForm.originalAmount, voucherForm.exchangeRateToBase, isYer]);

  // Mutations
  const createVoucherM = useCreateFinanceV2VoucherMutation();
  const submitVoucherM = useSubmitFinanceV2VoucherMutation();
  const approveVoucherM = useApproveFinanceV2VoucherMutation();
  const rejectVoucherM = useRejectFinanceV2VoucherMutation();
  const postVoucherM = usePostFinanceV2VoucherMutation();
  const requestVoucherVoidM = useRequestFinanceV2VoucherVoidMutation();
  const approveVoucherVoidM = useApproveFinanceV2VoucherVoidMutation();

  // Filtered vouchers
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (statusFilter !== "ALL" && v.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        v.voucherNo.toLowerCase().includes(q) ||
        (v.center?.name ?? "").toLowerCase().includes(q) ||
        String(v.amount).includes(q)
      );
    });
  }, [vouchers, statusFilter, search]);

  const totalFilteredCount = filteredVouchers.length;
  const pages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const currentPage = Math.min(page, pages);
  const rowsToDisplay = useMemo(() => {
    return filteredVouchers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredVouchers, currentPage, pageSize]);

  // KPIs by status
  const kpis = useMemo(() => {
    const counts = {
      DRAFT: { count: 0, amount: 0 },
      SUBMITTED: { count: 0, amount: 0 },
      APPROVED: { count: 0, amount: 0 },
      POSTED: { count: 0, amount: 0 }
    };
    for (const v of vouchers) {
      if (counts[v.status as keyof typeof counts]) {
        counts[v.status as keyof typeof counts].count++;
        counts[v.status as keyof typeof counts].amount += v.amount;
      }
    }
    return counts;
  }, [vouchers]);

  // Close modals
  const closeVoucherModal = () => {
    if (createVoucherM.isPending) return;
    setShowVoucherForm(false);
    setVoucherError(null);
    setReasonValue("");
  };

  const closeConfirmModal = () => {
    setConfirmModal(null);
    setReasonValue("");
  };

  // Open voucher form with specific type
  const handleOpenNewVoucher = (type: VoucherTypeV2) => {
    setVoucherForm({
      voucherType: type,
      accountId: "",
      manualReferenceNo: "",
      originalAmount: "",
      originalCurrencyCode: "YER",
      exchangeRateToBase: "1",
      paymentMethod: (FINANCE_YEMEN_MODE ? "CASH" : "TRANSFER") as PaymentMethodV2,
      accountingCategory: type === "RECEIPT" ? "STUDENT_CONTRIBUTION" : "OPERATING_EXPENSE",
      externalTransferRef: "",
      description: "",
      beneficiary: "",
      voucherDate: new Date().toISOString().slice(0, 10),
      notes: ""
    });
    setVoucherError(null);
    setShowVoucherForm(true);
  };

  // Create voucher handler
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError(null);
    try {
      const accountId = Number(voucherForm.accountId);
      const originalAmount = Number(voucherForm.originalAmount);
      const currencyCode = (voucherForm.originalCurrencyCode || "YER").toUpperCase();
      const isYerLocal = currencyCode === "YER";
      const exchangeRateToBase = isYerLocal ? 1 : Number(voucherForm.exchangeRateToBase);
      const baseAmount = Math.round(originalAmount * exchangeRateToBase * 100) / 100;
      const manualReferenceNo = voucherForm.manualReferenceNo.trim();
      const description = voucherForm.description.trim();

      if (!accountId) throw new Error(ar ? "اختر الحساب" : "Select account");
      if (!Number.isFinite(originalAmount) || originalAmount <= 0) throw new Error(ar ? "المبلغ غير صحيح" : "Invalid amount");
      if (!isYerLocal && (!Number.isFinite(exchangeRateToBase) || exchangeRateToBase <= 0))
        throw new Error(ar ? "سعر الصرف غير صحيح" : "Invalid exchange rate");

      if (!description) throw new Error(ar ? "أدخل الوصف" : "Enter description");

      // Compose description, beneficiary and extra notes into the notes column
      // (capped to the schema's 500 chars). voucherDate is now a proper DB field.
      const composedNotes =
        [
          description,
          voucherForm.beneficiary.trim()
            ? `${ar ? "المستفيد" : "Beneficiary"}: ${voucherForm.beneficiary.trim()}`
            : "",
          voucherForm.notes.trim()
        ]
          .filter(Boolean)
          .join(" - ")
          .slice(0, 500) || undefined;

      await createVoucherM.mutateAsync({
        accountId,
        voucherType: voucherForm.voucherType,
        manualReferenceNo: manualReferenceNo || undefined,
        amount: baseAmount,
        originalAmount,
        originalCurrencyCode: currencyCode,
        exchangeRateToBase,
        paymentMethod: voucherForm.paymentMethod,
        accountingCategory: voucherForm.accountingCategory || undefined,
        voucherDate: voucherForm.voucherDate || undefined,
        externalTransferRef:
          voucherForm.paymentMethod === "TRANSFER"
            ? voucherForm.externalTransferRef.trim() || undefined
            : undefined,
        notes: composedNotes
      });

      notifySuccess(ar ? "تم إنشاء السند" : "Voucher created");
      setVoucherForm((prev) => ({
        ...prev,
        originalAmount: "",
        manualReferenceNo: "",
        description: "",
        beneficiary: "",
        notes: ""
      }));
      setShowVoucherForm(false);
    } catch (error) {
      const msg = getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "فشل إنشاء السند" : "Failed to create voucher" });
      setVoucherError(msg);
      notifyError(msg);
    }
  };

  // Row actions
  const handlePrint = (v: FinanceVoucherV2) => {
    printVoucherReceipt(v, ar);
  };

  const handleSubmit = (v: FinanceVoucherV2) => {
    setConfirmModal({
      isOpen: true,
      title: ar ? "إرسال السند للاعتماد؟" : "Submit voucher for approval?",
      message: `${ar ? "سند" : "Voucher"}: ${v.voucherNo}`,
      tone: "info",
      action: async () => {
        await submitVoucherM.mutateAsync({ voucherId: v.id });
        closeConfirmModal();
      }
    });
  };

  const handleApprove = (v: FinanceVoucherV2) => {
    setConfirmModal({
      isOpen: true,
      title: ar ? "اعتماد السند؟" : "Approve voucher?",
      message: `${ar ? "سند" : "Voucher"}: ${v.voucherNo}`,
      tone: "info",
      action: async () => {
        await approveVoucherM.mutateAsync({ voucherId: v.id });
        closeConfirmModal();
      }
    });
  };

  const handleReject = (v: FinanceVoucherV2) => {
    setConfirmModal({
      isOpen: true,
      title: ar ? "رفض السند؟" : "Reject voucher?",
      message: `${ar ? "سند" : "Voucher"}: ${v.voucherNo}`,
      tone: "danger",
      reasonRequired: true,
      reasonPlaceholder: ar ? "سبب الرفض..." : "Rejection reason...",
      action: async () => {
        await rejectVoucherM.mutateAsync({ voucherId: v.id, reason: reasonValue });
        closeConfirmModal();
      }
    });
  };

  const handlePost = (v: FinanceVoucherV2) => {
    setConfirmModal({
      isOpen: true,
      title: ar ? "ترحيل السند؟" : "Post voucher?",
      message: ar
        ? "سيتم إنشاء قيد محاسبي ولا يمكن التراجع إلا بالإلغاء."
        : "A journal entry will be created and can only be reversed by voiding.",
      tone: "warning",
      action: async () => {
        await postVoucherM.mutateAsync({ voucherId: v.id });
        closeConfirmModal();
      }
    });
  };

  const handleRequestVoid = (v: FinanceVoucherV2) => {
    setConfirmModal({
      isOpen: true,
      title: ar ? "طلب إلغاء السند؟" : "Request voucher void?",
      message: `${ar ? "سند" : "Voucher"}: ${v.voucherNo}`,
      tone: "danger",
      reasonRequired: true,
      reasonPlaceholder: ar ? "سبب طلب الإلغاء..." : "Void request reason...",
      action: async () => {
        await requestVoucherVoidM.mutateAsync({ voucherId: v.id, reason: reasonValue });
        closeConfirmModal();
      }
    });
  };

  const handleApproveVoid = (v: FinanceVoucherV2) => {
    setConfirmModal({
      isOpen: true,
      title: ar ? "اعتماد إلغاء السند؟" : "Approve voucher void?",
      message: `${ar ? "سند" : "Voucher"}: ${v.voucherNo}`,
      tone: "warning",
      action: async () => {
        await approveVoucherVoidM.mutateAsync({ voucherId: v.id });
        closeConfirmModal();
      }
    });
  };

  // Table columns
  const columns: FinanceDataTableColumn<FinanceVoucherV2>[] = useMemo(
    () => [
      {
        id: "voucherNo",
        header: ar ? "رقم السند" : "Voucher No",
        cell: (v) => <strong className="text-slate-900 dark:text-slate-100">{v.voucherNo}</strong>
      },
      {
        id: "description",
        header: ar ? "البيان" : "Description",
        cell: (v) => (
          <span
            className="text-slate-600 dark:text-slate-400 font-medium block max-w-[280px] truncate"
            title={v.notes ?? ""}
          >
            {v.notes && v.notes.trim() ? v.notes : "-"}
          </span>
        )
      },
      {
        id: "category",
        header: ar ? "الفئة" : "Category",
        cell: (v) => {
          const key = v.accountingCategory as AccountingCategoryKey | null | undefined;
          const label = key && categoryLabels[key] ? (ar ? categoryLabels[key].ar : categoryLabels[key].en) : null;
          return (
            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700">
              {label ?? "-"}
            </span>
          );
        }
      },
      {
        id: "date",
        header: ar ? "التاريخ" : "Date",
        cell: (v) => <span className="opacity-70 font-medium">{(v.voucherDate ?? v.createdAt)?.slice(0, 10) ?? "-"}</span>
      },
      {
        id: "type",
        header: ar ? "النوع" : "Type",
        cell: (v) => (
          <span className={`fin-status-pill ${
            v.voucherType === "RECEIPT" ? "fin-status--success" : "fin-status--error"
          }`}>
            {v.voucherType === "RECEIPT" ? (ar ? "قبض" : "Receipt") : (ar ? "صرف" : "Disbursement")}
          </span>
        )
      },
      {
        id: "amount",
        header: ar ? "المبلغ" : "Amount",
        cell: (v) => (
          <div className="font-bold">
            <FinanceMoney
              amount={v.amount}
              originalAmount={v.originalAmount}
              originalCurrencyCode={v.originalCurrencyCode}
              exchangeRateToBase={v.exchangeRateToBase}
              baseCurrency="YER"
            />
          </div>
        )
      },
      {
        id: "center",
        header: ar ? "المركز" : "Center",
        cell: (v) => v.center?.name ?? (ar ? "الصندوق العام" : "General Fund")
      },
      {
        id: "status",
        header: ar ? "الحالة" : "Status",
        cell: (v) => <FinanceStatusBadge status={v.status} />
      },
      financeActionsColumn(ar ? "إجراءات" : "Actions", (v: FinanceVoucherV2) => {
        return (
          <div className="flex items-center gap-3">
            {/* View/Print Action */}
            <button
              type="button"
              onClick={() => handlePrint(v)}
              className="fin-action-btn view"
              title={ar ? "عرض وطباعة السند" : "View & Print Voucher"}
            >
              <Printer size={16} />
            </button>

            {/* Status-specific actions */}
            {isCoreAdmin && v.status === "DRAFT" && (
              <button
                type="button"
                onClick={() => handleSubmit(v)}
                className="fin-action-btn approve"
                title={ar ? "إرسال للاعتماد" : "Submit for Approval"}
              >
                <Send size={16} />
              </button>
            )}

            {isCoreAdmin && v.status === "SUBMITTED" && (
              <>
                <button
                  type="button"
                  onClick={() => handleApprove(v)}
                  className="fin-action-btn approve"
                  title={ar ? "اعتماد" : "Approve"}
                >
                  <CheckCircle size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(v)}
                  className="fin-action-btn delete"
                  title={ar ? "رفض" : "Reject"}
                >
                  <XCircle size={16} />
                </button>
              </>
            )}

            {isCoreAdmin && v.status === "APPROVED" && (
              <button
                type="button"
                onClick={() => handlePost(v)}
                className="fin-action-btn approve"
                title={ar ? "ترحيل السند" : "Post Voucher"}
              >
                <FileCheck size={16} />
              </button>
            )}

            {isCoreAdmin && v.status === "POSTED" && (
              <button
                type="button"
                onClick={() => handleRequestVoid(v)}
                className="fin-action-btn delete"
                title={ar ? "طلب إلغاء" : "Request Void"}
              >
                <Ban size={16} />
              </button>
            )}

            {isCoreAdmin && v.status === "VOID_REQUESTED" && (
              <button
                type="button"
                onClick={() => handleApproveVoid(v)}
                className="fin-action-btn approve"
                title={ar ? "اعتماد الإلغاء" : "Approve Void"}
              >
                <CheckCircle size={16} />
              </button>
            )}
          </div>
        );
      })
    ],
    [ar, isCoreAdmin]
  );

  return (
    <FinancePageShell
      className="fin-premium-container ctr-page-modern"
      dir={ar ? "rtl" : "ltr"}
      header={
        <div className="fin-premium-header">
          <FinancePageHeader
            title={ar ? "سندات القبض والصرف" : "Receipt & Disbursement Vouchers"}
            subtitle={ar ? "إدارة دورة حياة السندات من الإنشاء إلى الترحيل" : "Manage voucher lifecycle from creation to posting"}
            icon={<Banknote className="w-6 h-6 text-brand-600" />}
            actions={
              <div className="flex items-center gap-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="glass-btn" 
                  leftIcon={<RefreshCw className={`w-4 h-4 ${vouchersQ.isLoading ? "animate-spin" : ""}`} />} 
                  onClick={() => vouchersQ.refetch()}
                  title={ar ? "تحديث البيانات" : "Refresh Data"}
                >
                  {ar ? "تحديث" : "Refresh"}
                </Button>
                {canCreateVoucher ? (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      className="shadow-lg shadow-emerald-500/20"
                      leftIcon={<Plus className="w-4 h-4" />}
                      onClick={() => handleOpenNewVoucher("RECEIPT")}
                      title={ar ? "سند قبض" : "Receipt Voucher"}
                    >
                      {ar ? "سند قبض" : "Receipt"}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="shadow-lg shadow-rose-500/20"
                      leftIcon={<Plus className="w-4 h-4" />}
                      onClick={() => handleOpenNewVoucher("DISBURSEMENT")}
                      title={ar ? "سند صرف" : "Disbursement Voucher"}
                    >
                      {ar ? "سند صرف" : "Disbursement"}
                    </Button>
                  </>
                ) : null}
              </div>
            }
          />
        </div>
      }
      kpis={
        <div className="ctr-kpis-modern">
          <VouchersKpi 
            icon={FileText} 
            cls="amber" 
            val={<FinanceMoney amount={kpis.DRAFT.amount} baseCurrency="YER" />} 
            label={ar ? "المسودات" : "Drafts"} 
          />
          <VouchersKpi 
            icon={Send} 
            cls="brand" 
            val={<FinanceMoney amount={kpis.SUBMITTED.amount} baseCurrency="YER" />} 
            label={ar ? "بانتظار الاعتماد" : "Awaiting Approval"} 
          />
          <VouchersKpi 
            icon={CheckCircle} 
            cls="emerald" 
            val={<FinanceMoney amount={kpis.APPROVED.amount} baseCurrency="YER" />} 
            label={ar ? "معتمد" : "Approved"} 
          />
          <VouchersKpi 
            icon={Banknote} 
            cls="violet" 
            val={<FinanceMoney amount={kpis.POSTED.amount} baseCurrency="YER" />} 
            label={ar ? "المرحلة" : "Posted"} 
          />
        </div>
      }
      toolbar={
        <div className="ctr-controls">
          <div className="ctr-search-wrap">
            <Search className="ctr-search-icon" size={18} />
            <input 
              className="ctr-search-input"
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder={ar ? "بحث برقم السند أو المركز..." : "Search by No or Center..."} 
            />
          </div>
          <div className="ctr-filters-group">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border-none shadow-sm">
              <Filter size={16} className="text-slate-400 ms-2" />
              <select 
                className="ctr-filter-select border-none bg-transparent h-8 min-w-[140px] focus:ring-0 outline-none"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as VoucherStatusFilter)}
              >
                <option value="ALL">{ar ? "كل الحالات" : "All Statuses"}</option>
                {(Object.keys(statusLabels) as VoucherStatusV2[]).map((s) => (
                  <option key={s} value={s}>{ar ? statusLabels[s].ar : statusLabels[s].en}</option>
                ))}
              </select>
            </div>
            {(search || statusFilter !== "ALL") && (
              <button 
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline px-2"
                onClick={() => { setSearch(""); setStatusFilter("ALL"); }}
              >
                {ar ? "تصفير" : "Reset"}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="fin-premium-panel animate-premium">
        <div className="fin-premium-panel__content" style={{ padding: 0 }}>
          {vouchersQ.isLoading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
              <span className="text-slate-500 font-medium">{ar ? "جاري جلب السندات..." : "Fetching vouchers..."}</span>
            </div>
          ) : rowsToDisplay.length === 0 ? (
            <FinanceEmptyState
              variant={search || statusFilter !== "ALL" ? "filtered" : "first-time"}
              title={search || statusFilter !== "ALL" ? (ar ? "لا توجد نتائج" : "No results") : undefined}
              description={search || statusFilter !== "ALL" ? (ar ? "جرب تعديل البحث أو الفلتر" : "Try adjusting search or filters") : undefined}
              action={search || statusFilter !== "ALL" ? (
                <Button variant="secondary" onClick={() => { setSearch(""); setStatusFilter("ALL"); }}>
                  {ar ? "مسح الفلاتر" : "Clear Filters"}
                </Button>
              ) : canCreateVoucher ? (
                <div className="flex items-center gap-3 justify-center">
                  <Button variant="success" leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenNewVoucher("RECEIPT")}>
                    {ar ? "سند قبض" : "Receipt"}
                  </Button>
                  <Button variant="danger" leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenNewVoucher("DISBURSEMENT")}>
                    {ar ? "سند صرف" : "Disbursement"}
                  </Button>
                </div>
              ) : null}
            />
          ) : (
            <FinanceDataTable<FinanceVoucherV2>
              rows={rowsToDisplay}
              columns={columns}
              rowKey="id"
              className="fin-premium-table"
              rowClassName={(v) => `fin-floating-row ${v.voucherType === "RECEIPT" ? "receipt" : "disbursement"}`}
            />
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      {filteredVouchers.length > 0 && (
        <div className="ctr-footer">
          <div className="ctr-page-size">
            <span>{ar ? "الصفوف:" : "Rows:"}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="ctr-page-info">
            {ar ? (
              <>
                عرض {Math.min(totalFilteredCount, (currentPage - 1) * pageSize + 1)} -{" "}
                {Math.min(totalFilteredCount, currentPage * pageSize)} من {totalFilteredCount}
              </>
            ) : (
              <>
                Showing {Math.min(totalFilteredCount, (currentPage - 1) * pageSize + 1)} -{" "}
                {Math.min(totalFilteredCount, currentPage * pageSize)} of {totalFilteredCount}
              </>
            )}
          </div>

          <div className="ctr-page-controls">
            <button className="ctr-page-btn" disabled={currentPage === 1} onClick={() => setPage((prev) => prev - 1)}>
              {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              let p = currentPage;
              if (currentPage <= 3) p = i + 1;
              else if (currentPage >= pages - 2) p = pages - 4 + i;
              else p = currentPage - 2 + i;

              if (p <= 0 || p > pages) return null;

              return (
                <button
                  key={p}
                  className={`ctr-page-btn ${currentPage === p ? "active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              );
            })}

            <button className="ctr-page-btn" disabled={currentPage === pages} onClick={() => setPage((prev) => prev + 1)}>
              {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showVoucherForm}
        onClose={closeVoucherModal}
        title={voucherForm.voucherType === "RECEIPT" ? (ar ? "سند قبض" : "Receipt Voucher") : (ar ? "سند صرف" : "Disbursement Voucher")}
        titleIcon={
          <div className="circlemod-head-icon">
            <Banknote className="w-4 h-4" />
          </div>
        }
        size="lg"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={closeVoucherModal} disabled={createVoucherM.isPending}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" form="voucher-form" isLoading={createVoucherM.isPending}>
              {ar ? "إنشاء" : "Create"}
            </Button>
          </div>
        }
      >
        <form id="voucher-form" onSubmit={handleCreateVoucher} className="circlemod-form">

          {/* Section 1: Account & Voucher No */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Building2 size={15} className="circlemod-section-icon" />
              <span>{ar ? "بيانات الحساب" : "Account Info"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="v-account">{ar ? "الحساب / الصندوق *" : "Account / Fund *"}</label>
                <select
                  id="v-account"
                  className="circlemod-select"
                  value={voucherForm.accountId}
                  onChange={(e) => setVoucherForm((prev) => ({ ...prev, accountId: e.target.value }))}
                  required
                >
                  <option value="">{ar ? "اختر الحساب..." : "Select account..."}</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name || (a.center?.name ?? (ar ? "صندوق الجمعية" : "Org Fund"))}
                    </option>
                  ))}
                </select>
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="v-no">
                  <Hash size={12} className="inline-block ml-1 opacity-60" />
                  {ar ? "رقم مرجعي إضافي (اختياري)" : "Manual Ref (Opt)"}
                </label>
                <input
                  id="v-no"
                  className="circlemod-input"
                  value={voucherForm.manualReferenceNo}
                  onChange={(e) => setVoucherForm((prev) => ({ ...prev, manualReferenceNo: e.target.value }))}
                  placeholder={ar ? "رقم مرجعي إن وجد" : "Ex: TR-100"}
                />
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="v-category">{ar ? "الفئة المحاسبية" : "Accounting Category"}</label>
                <select
                  id="v-category"
                  className="circlemod-select"
                  value={voucherForm.accountingCategory}
                  onChange={(e) => setVoucherForm((prev) => ({ ...prev, accountingCategory: e.target.value as any }))}
                >
                  <option value="">{ar ? "اختر الفئة..." : "Select category..."}</option>
                  {voucherForm.voucherType === "RECEIPT" ? (
                    <>
                      <option value="DONATION">{ar ? "تبرعات" : "Donation"}</option>
                      <option value="STUDENT_CONTRIBUTION">{ar ? "مساهمات طلابية" : "Student Contribution"}</option>
                      <option value="OTHER_INCOME">{ar ? "إيرادات أخرى" : "Other Income"}</option>
                    </>
                  ) : (
                    <>
                      <option value="OPERATING_EXPENSE">{ar ? "مصاريف تشغيلية" : "Operating Expense"}</option>
                      <option value="EDUCATIONAL_EXPENSE">{ar ? "مصاريف تعليمية" : "Educational Expense"}</option>
                      <option value="CENTER_EXPENSE">{ar ? "مصاريف المركز" : "Center Expense"}</option>
                      <option value="REWARD">{ar ? "مكافآت" : "Reward"}</option>
                    </>
                  )}
                </select>
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="v-date">
                  <Calendar size={12} className="inline-block ml-1 opacity-60" />
                  {ar ? "تاريخ السند" : "Voucher Date"}
                </label>
                <input
                  id="v-date"
                  className="circlemod-input"
                  type="date"
                  value={voucherForm.voucherDate}
                  onChange={(e) => setVoucherForm((prev) => ({ ...prev, voucherDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Amount & Currency */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Coins size={15} className="circlemod-section-icon" />
              <span>{ar ? "المبلغ والعملة" : "Amount & Currency"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="v-amount">{ar ? "المبلغ *" : "Amount *"}</label>
                <input
                  id="v-amount"
                  className="circlemod-input"
                  type="number"
                  step="any"
                  value={voucherForm.originalAmount}
                  onChange={(e) => setVoucherForm((prev) => ({ ...prev, originalAmount: e.target.value }))}
                  placeholder={ar ? "المبلغ" : "Amount"}
                  required
                />
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="v-currency">{ar ? "العملة" : "Currency"}</label>
                <select
                  id="v-currency"
                  className="circlemod-select"
                  value={voucherForm.originalCurrencyCode}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase();
                    setVoucherForm((prev) => ({
                      ...prev,
                      originalCurrencyCode: code,
                      exchangeRateToBase: code === "YER" ? "1" : ""
                    }));
                  }}
                >
                  {currencyOptions.map((c) => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
              </div>
              {!isYer && (
                <div className="circlemod-field circlemod-field--sm">
                  <label htmlFor="v-rate">
                    <ArrowLeftRight size={12} className="inline-block ml-1 opacity-60" />
                    {ar ? "سعر الصرف" : "Exchange Rate"}
                  </label>
                  <input
                    id="v-rate"
                    className="circlemod-input"
                    type="number"
                    step="any"
                    value={voucherForm.exchangeRateToBase}
                    onChange={(e) => setVoucherForm((prev) => ({ ...prev, exchangeRateToBase: e.target.value }))}
                    placeholder={ar ? "سعر الصرف" : "Exchange Rate"}
                    disabled={isYer}
                  />
                </div>
              )}
            </div>
            {baseAmountPreview !== null && (
              <div className="text-[11px] opacity-70 mt-1 px-1" role="note">
                {ar
                  ? `المبلغ المعادل: ${baseAmountPreview.toLocaleString("ar-YE-u-nu-latn")} ر.ي`
                  : `Equivalent: ${baseAmountPreview.toLocaleString("en-US")} YER`}
              </div>
            )}
          </div>

          {/* Section 3: Payment & Beneficiary */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Wallet size={15} className="circlemod-section-icon" />
              <span>{ar ? "بيانات الصرف" : "Payment Info"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="v-beneficiary">
                  {voucherForm.voucherType === "RECEIPT"
                    ? (ar ? "يستلم من (الجهة / الشخص)" : "Received from")
                    : (ar ? "يصرف لـ (المستفيد)" : "Pay to (Beneficiary)")}
                </label>
                <input
                  id="v-beneficiary"
                  className="circlemod-input"
                  value={voucherForm.beneficiary}
                  onChange={(e) => setVoucherForm((prev) => ({ ...prev, beneficiary: e.target.value }))}
                  placeholder={voucherForm.voucherType === "RECEIPT"
                    ? (ar ? "اسم الجهة أو الشخص" : "Entity or person name")
                    : (ar ? "اسم المستفيد" : "Beneficiary name")}
                />
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="v-method">{ar ? "طريقة الدفع" : "Payment Method"}</label>
                <select
                  id="v-method"
                  className="circlemod-select"
                  value={voucherForm.paymentMethod}
                  onChange={(e) => setVoucherForm((prev) => ({ ...prev, paymentMethod: e.target.value as PaymentMethodV2 }))}
                >
                  <option value="CASH">{methodLabels.CASH}</option>
                  <option value="TRANSFER">{methodLabels.TRANSFER}</option>
                </select>
              </div>
            </div>
            {voucherForm.paymentMethod === "TRANSFER" && (
              <div className="circlemod-row">
                <div className="circlemod-field circlemod-field--lg">
                  <label htmlFor="v-ref">{ar ? "رقم المرجع (التحويل)" : "Transfer Reference No"}</label>
                  <input
                    id="v-ref"
                    className="circlemod-input"
                    value={voucherForm.externalTransferRef}
                    onChange={(e) => setVoucherForm((prev) => ({ ...prev, externalTransferRef: e.target.value }))}
                    placeholder={ar ? "رقم مرجع التحويل" : "External transfer ref"}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Description & Notes */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <StickyNote size={15} className="circlemod-section-icon" />
              <span>{ar ? "البيان والملاحظات" : "Description & Notes"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="v-desc">{ar ? "الوصف *" : "Description *"}</label>
                <input
                  id="v-desc"
                  className="circlemod-input"
                  value={voucherForm.description}
                  onChange={(e) => setVoucherForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={ar ? "وصف السند" : "Voucher description"}
                  required
                />
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="v-notes">{ar ? "ملاحظات" : "Notes"}</label>
                <input
                  id="v-notes"
                  className="circlemod-input"
                  value={voucherForm.notes}
                  onChange={(e) => setVoucherForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder={ar ? "ملاحظات إضافية" : "Additional notes"}
                />
              </div>
            </div>
          </div>

          {voucherError ? (
            <div className="circlemod-error" role="alert">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{voucherError}</span>
            </div>
          ) : null}
        </form>
      </Modal>

      {/* Confirm Modal */}
      {confirmModal && (
        <FinanceConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirmModal}
          onConfirm={async () => {
            if (confirmModal.reasonRequired && !reasonValue.trim()) return;
            await confirmModal.action();
          }}
          title={confirmModal.title}
          message={confirmModal.message}
          tone={confirmModal.tone}
          confirmLabel={ar ? "تأكيد" : "Confirm"}
          cancelLabel={ar ? "إلغاء" : "Cancel"}
          confirmDisabled={confirmModal.reasonRequired ? !reasonValue.trim() : false}
          reason={
            confirmModal.reasonRequired
              ? {
                  value: reasonValue,
                  onChange: setReasonValue,
                  placeholder: confirmModal.reasonPlaceholder,
                  required: true
                }
              : undefined
          }
        />
      )}
    </FinancePageShell>
  );
}
