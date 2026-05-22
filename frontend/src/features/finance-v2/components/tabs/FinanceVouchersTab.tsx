import { useEffect, useMemo, useState } from "react";
import { FolderKanban, Plus, Printer, Banknote, Building2, Coins, Wallet, ArrowLeftRight, StickyNote, Hash, AlertCircle, Calendar } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { FinanceDataTable } from "../../design/FinanceDataTable";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { ErrorState } from "../../../../components/ui/ErrorState";
import Modal from "../../../../components/ui/Modal";
import { getLocalizedApiErrorMessage } from "../../../../shared/api/error";
import { entityFeedback, notifyError, notifySuccess, type LocalizedLabel } from "../../../../shared/ui/feedback";
import {
  buildPaginationLabels,
  useClientPagination
} from "../../../../shared/ui/useClientPagination";
import { FinanceReasonConfirmModal } from "../FinanceReasonConfirmModal";
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
} from "../../finance-v2.hooks";
import { FINANCE_YEMEN_MODE } from "../../config";
import type { CreateFinanceVoucherV2Payload, FinanceVoucherV2, PaymentMethodV2, VoucherTypeV2 } from "../../types";
import { getYemenModeStatus, money, posInt } from "../FinanceShared";
import { VoucherAccountingStatus, VoucherCategoryBadge, VoucherTypeBadge } from "../../../../pages/accounting/AccountingShared";
import { printVoucherReceipt } from "../../../accounting/printAccounting";

type Props = {
  centerId: number | undefined;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  ar: boolean;
  methodLabels: Record<PaymentMethodV2, string>;
};

type ReasonAction = "reject" | "void";

const VOUCHER_ENTITY: LocalizedLabel = { ar: "السند", en: "voucher" };
const VOUCHERS_ENTITY: LocalizedLabel = { ar: "السندات", en: "vouchers" };

export default function FinanceVouchersTab({
  centerId,
  isAdmin,
  isSuperAdmin,
  ar,
  methodLabels
}: Props) {
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  // FA-UX-4B: voucher amount is captured as the (originalAmount, currency, rate) triple.
  // amount on the wire is computed = originalAmount × exchangeRateToBase (YER base).
  const [voucherForm, setVoucherForm] = useState({
    accountId: "",
    voucherType: "DISBURSEMENT" as VoucherTypeV2,
    manualReferenceNo: "",
    originalAmount: "",
    originalCurrencyCode: "YER",
    exchangeRateToBase: "1",
    method: (FINANCE_YEMEN_MODE ? "CASH" : "TRANSFER") as PaymentMethodV2,
    accountingCategory: "OPERATING_EXPENSE",
    beneficiary: "",
    description: "",
    voucherDate: new Date().toISOString().slice(0, 10),
    attachmentStorageKey: "",
    externalTransferRef: "",
    notes: ""
  });
  const [voucherError, setVoucherError] = useState("");
  const [reasonAction, setReasonAction] = useState<ReasonAction | null>(null);
  const [reasonVoucherId, setReasonVoucherId] = useState<number | null>(null);
  const [reasonValue, setReasonValue] = useState("");

  const accountsQ = useFinanceV2AccountsQuery(centerId);
  const accounts = useMemo(() => accountsQ.data ?? [], [accountsQ.data]);

  // FA-UX-4B: organization currencies for the picker. YER is always offered as a fallback.
  const currenciesQ = useCurrenciesQuery();
  const currencyOptions = useMemo(() => {
    const active = (currenciesQ.data ?? []).filter((c) => c.isActive);
    if (active.some((c) => c.code === "YER")) return active;
    return [
      { code: "YER", nameAr: "الريال اليمني", nameEn: "Yemeni Rial", isActive: true } as any,
      ...active
    ];
  }, [currenciesQ.data]);

  const isYer = (voucherForm.originalCurrencyCode || "YER").toUpperCase() === "YER";

  // FA-UX-4B: pre-fill latest stored rate for non-YER currencies when the user has no manual override.
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

  const baseAmountPreview = useMemo(() => {
    const amt = Number(voucherForm.originalAmount);
    const rate = Number(voucherForm.exchangeRateToBase || (isYer ? 1 : 0));
    if (!Number.isFinite(amt) || !Number.isFinite(rate) || amt <= 0 || rate <= 0) return null;
    return Math.round(amt * rate * 100) / 100;
  }, [voucherForm.originalAmount, voucherForm.exchangeRateToBase, isYer]);

  const vouchersQ = useFinanceV2VouchersQuery(centerId);
  const vouchers = useMemo(() => vouchersQ.data?.rows ?? [], [vouchersQ.data?.rows]);
  const pagination = useClientPagination(vouchers);

  const createVoucherM = useCreateFinanceV2VoucherMutation();
  const submitVoucherM = useSubmitFinanceV2VoucherMutation();
  const approveVoucherM = useApproveFinanceV2VoucherMutation();
  const rejectVoucherM = useRejectFinanceV2VoucherMutation();
  const postVoucherM = usePostFinanceV2VoucherMutation();
  const requestVoucherVoidM = useRequestFinanceV2VoucherVoidMutation();
  const approveVoucherVoidM = useApproveFinanceV2VoucherVoidMutation();

  const closeVoucherModal = () => {
    if (createVoucherM.isPending) {
      return;
    }
    setShowVoucherForm(false);
    setVoucherError("");
  };

  const closeReasonModal = () => {
    setReasonAction(null);
    setReasonVoucherId(null);
    setReasonValue("");
  };

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
    errorMessage: string
  ) => {
    try {
      await action();
      notifySuccess(successMessage);
      return true;
    } catch (error) {
      notifyError(
        getLocalizedApiErrorMessage(error, {
          ar,
          fallback: errorMessage
        })
      );
      return false;
    }
  };

  const handleCreateVoucher = async (event: React.FormEvent) => {
    event.preventDefault();
    setVoucherError("");

    try {
      const accountId = posInt(voucherForm.accountId);
      // FA-UX-4B: derive YER base amount from the currency triple. The backend
      // recomputes it for safety and validates against the Currency table.
      const originalAmount = Number(voucherForm.originalAmount);
      const currencyCode = (voucherForm.originalCurrencyCode || "YER").toUpperCase();
      const isYerLocal = currencyCode === "YER";
      const exchangeRateToBase = isYerLocal ? 1 : Number(voucherForm.exchangeRateToBase);
      const baseAmount = Math.round(originalAmount * exchangeRateToBase * 100) / 100;
      const manualReferenceNo = voucherForm.manualReferenceNo.trim();
      const description = voucherForm.description.trim();

      if (!accountId) throw new Error(ar ? "اختر الحساب" : "Select account");
      if (!Number.isFinite(originalAmount) || originalAmount <= 0) {
        throw new Error(ar ? "المبلغ الأصلي غير صحيح" : "Invalid original amount");
      }
      if (!isYerLocal && (!Number.isFinite(exchangeRateToBase) || exchangeRateToBase <= 0)) {
        throw new Error(ar ? "سعر الصرف غير صحيح" : "Invalid exchange rate");
      }
      if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
        throw new Error(ar ? "مبلغ غير صحيح" : "Invalid amount");
      }
      if (!voucherForm.accountingCategory) throw new Error(ar ? "اختر التصنيف المحاسبي" : "Select accounting category");
      if (!voucherForm.method) throw new Error(ar ? "اختر طريقة الدفع" : "Select payment method");
      if (!description) throw new Error(ar ? "أدخل الوصف" : "Enter description");
      if (
        FINANCE_YEMEN_MODE &&
        voucherForm.method === "TRANSFER" &&
        !voucherForm.attachmentStorageKey.trim()
      ) {
        throw new Error(
          ar ? "المرفق إلزامي عند التحويل البنكي" : "Attachment required for transfers"
        );
      }

      await createVoucherM.mutateAsync({
        accountId,
        voucherType: voucherForm.voucherType,
        manualReferenceNo: manualReferenceNo || undefined,
        amount: baseAmount,
        originalAmount,
        originalCurrencyCode: currencyCode,
        exchangeRateToBase,
        paymentMethod: voucherForm.method,
        accountingCategory: voucherForm.accountingCategory as CreateFinanceVoucherV2Payload["accountingCategory"],
        voucherDate: voucherForm.voucherDate || undefined,
        attachmentStorageKey: voucherForm.attachmentStorageKey.trim() || undefined,
        externalTransferRef: voucherForm.externalTransferRef.trim() || undefined,
        notes: [
          description,
          voucherForm.beneficiary.trim() ? `${ar ? "المستفيد" : "Beneficiary"}: ${voucherForm.beneficiary.trim()}` : "",
          voucherForm.notes.trim()
        ].filter(Boolean).join(" - ") || undefined
      });

      notifySuccess(entityFeedback.success(ar, "create", VOUCHER_ENTITY));
      setVoucherForm((previous) => ({
        ...previous,
        originalAmount: "",
        manualReferenceNo: "",
        beneficiary: "",
        description: "",
        attachmentStorageKey: "",
        externalTransferRef: "",
        notes: ""
      }));
      setShowVoucherForm(false);
    } catch (error) {
      const message = getLocalizedApiErrorMessage(error, {
        ar,
        fallback: entityFeedback.error(ar, "create", VOUCHER_ENTITY)
      });
      setVoucherError(message);
      notifyError(message);
    }
  };

  const handleConfirmReason = async (reason: string) => {
    if (!reasonVoucherId || !reasonAction) {
      return;
    }

    if (reasonAction === "reject") {
      const didSucceed = await runAction(
        () => rejectVoucherM.mutateAsync({ voucherId: reasonVoucherId, reason }),
        ar ? "تم رفض السند" : "Voucher rejected successfully",
        ar ? "تعذر رفض السند" : "Failed to reject voucher"
      );
      if (didSucceed) {
        closeReasonModal();
      }
    }

    if (reasonAction === "void") {
      const didSucceed = await runAction(
        () =>
          requestVoucherVoidM.mutateAsync({
            voucherId: reasonVoucherId,
            reason
        }),
        ar ? "تم إرسال طلب العكس" : "Void request submitted successfully",
        ar ? "تعذر إرسال طلب العكس" : "Failed to submit void request"
      );
      if (didSucceed) {
        closeReasonModal();
      }
    }
  };

  const columns = useMemo(
    () => [
      {
        id: "voucherNo",
        header: ar ? "رقم السند" : "Voucher No",
        cell: (voucher: FinanceVoucherV2) => <strong>{voucher.voucherNo}</strong>
      },
      {
        id: "type",
        header: ar ? "النوع" : "Type",
        cell: (voucher: FinanceVoucherV2) => (
          <VoucherTypeBadge type={voucher.voucherType} ar={ar} />
        )
      },
      {
        id: "category",
        header: ar ? "الفئة" : "Category",
        cell: (voucher: FinanceVoucherV2) => (
          <VoucherCategoryBadge category={voucher.accountingCategory} />
        )
      },
      {
        id: "status",
        header: ar ? "الحالة" : "Status",
        cell: (voucher: FinanceVoucherV2) => (
          <div className="flex flex-col gap-1">
            {getYemenModeStatus(voucher.status, ar)}
            <VoucherAccountingStatus
              status={voucher.status}
              type={voucher.voucherType}
              sourceType={voucher.sourceType}
              ar={ar}
            />
          </div>
        )
      },
      {
        id: "amount",
        header: ar ? "المبلغ" : "Amount",
        // FA-UX-4B: show YER base + a thin secondary line with the original currency.
        cell: (voucher: FinanceVoucherV2) => (
          <div className="leading-tight">
            <div>{money(voucher.amount, ar)}</div>
            {voucher.originalCurrencyCode &&
            voucher.originalCurrencyCode.toUpperCase() !== "YER" &&
            voucher.originalAmount &&
            voucher.exchangeRateToBase ? (
              <div className="text-[10px] opacity-70">
                {Number(voucher.originalAmount).toLocaleString(ar ? "ar-YE-u-nu-latn" : "en-US")}{" "}
                {voucher.originalCurrencyCode} ×{" "}
                {Number(voucher.exchangeRateToBase).toLocaleString(ar ? "ar-YE-u-nu-latn" : "en-US")}
              </div>
            ) : null}
          </div>
        )
      },
      {
        id: "method",
        header: ar ? "طريقة الدفع" : "Method",
        cell: (voucher: FinanceVoucherV2) => (
          voucher.paymentMethod ? (
            <span className={`fin-status-pill ${voucher.paymentMethod === 'CASH' ? 'fin-status--info' : 'fin-status--success'}`}>
              {methodLabels[voucher.paymentMethod]}
            </span>
          ) : <span className="text-gray-400">—</span>
        )
      },
      {
        id: "date",
        header: ar ? "التاريخ" : "Date",
        cell: (voucher: FinanceVoucherV2) => (
          <span className="text-xs text-text-tertiary">
            {(voucher.voucherDate ?? voucher.createdAt)?.slice(0, 10) ?? "-"}
          </span>
        )
      },
      {
        id: "center",
        header: ar ? "المركز" : "Center",
        cell: (voucher: FinanceVoucherV2) => voucher.center?.name ?? "-"
      },
      {
        id: "actions",
        header: ar ? "الإجراءات" : "Actions",
        isActions: true,
        cell: (voucher: FinanceVoucherV2) => (
          <div className="fin-inline-actions">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => printVoucherReceipt(voucher, ar)}
              title={ar ? "طباعة" : "Print"}
            >
              <Printer className="w-4 h-4" />
            </Button>

            {isAdmin && !FINANCE_YEMEN_MODE && (
              <>
                {voucher.status === "DRAFT" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    isLoading={submitVoucherM.isPending}
                    onClick={() =>
                      void runAction(
                        () => submitVoucherM.mutateAsync({ voucherId: voucher.id }),
                        ar ? "تم إرسال السند" : "Voucher submitted successfully",
                        ar ? "تعذر إرسال السند" : "Failed to submit voucher"
                      )
                    }
                  >
                    {ar ? "إرسال" : "Submit"}
                  </Button>
                ) : null}
                {voucher.status === "SUBMITTED" && isSuperAdmin ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      isLoading={approveVoucherM.isPending}
                      onClick={() =>
                        void runAction(
                          () => approveVoucherM.mutateAsync({ voucherId: voucher.id }),
                          ar ? "تم اعتماد السند" : "Voucher approved successfully",
                          ar ? "تعذر اعتماد السند" : "Failed to approve voucher"
                        )
                      }
                    >
                      {ar ? "اعتماد" : "Approve"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      isLoading={rejectVoucherM.isPending}
                      onClick={() => {
                        setReasonAction("reject");
                        setReasonVoucherId(voucher.id);
                      }}
                    >
                      {ar ? "رفض" : "Reject"}
                    </Button>
                  </>
                ) : null}
                {voucher.status === "APPROVED" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    isLoading={postVoucherM.isPending}
                    onClick={() =>
                      void runAction(
                        () => postVoucherM.mutateAsync({ voucherId: voucher.id }),
                        ar ? "تم ترحيل السند" : "Voucher posted successfully",
                        ar ? "تعذر ترحيل السند" : "Failed to post voucher"
                      )
                    }
                  >
                    {ar ? "ترحيل" : "Post"}
                  </Button>
                ) : null}
                {voucher.status === "POSTED" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    isLoading={requestVoucherVoidM.isPending}
                    onClick={() => {
                      setReasonAction("void");
                      setReasonVoucherId(voucher.id);
                    }}
                  >
                    {ar ? "طلب عكس" : "Void Request"}
                  </Button>
                ) : null}
                {voucher.status === "VOID_REQUESTED" && isSuperAdmin ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    isLoading={approveVoucherVoidM.isPending}
                    onClick={() =>
                      void runAction(
                        () => approveVoucherVoidM.mutateAsync({ voucherId: voucher.id }),
                        ar ? "تم اعتماد عكس السند" : "Voucher void approved successfully",
                        ar ? "تعذر اعتماد عكس السند" : "Failed to approve voucher void"
                      )
                    }
                  >
                    {ar ? "اعتماد العكس" : "Approve Void"}
                  </Button>
                ) : null}
              </>
            )}

            {isAdmin && FINANCE_YEMEN_MODE && (
              <span className="text-[10px] text-gray-400 italic">
                {ar ? "الاعتمادات في تبويب مستقل" : "Approvals in separate tab"}
              </span>
            )}
          </div>
        )
      }
    ],
    [
      approveVoucherM.isPending,
      approveVoucherVoidM.isPending,
      ar,
      isAdmin,
      isSuperAdmin,
      postVoucherM.isPending,
      rejectVoucherM.isPending,
      requestVoucherVoidM.isPending,
      submitVoucherM.isPending
    ]
  );

  const kpis = useMemo(() => {
    return vouchers.reduce(
      (acc, v) => {
        acc.total++;
        if (v.voucherType === "RECEIPT") {
          acc.receipts++;
          acc.receiptsAmount += v.amount;
        } else {
          acc.disbursements++;
          acc.disbursementsAmount += v.amount;
        }
        return acc;
      },
      { total: 0, receipts: 0, disbursements: 0, receiptsAmount: 0, disbursementsAmount: 0 }
    );
  }, [vouchers]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="fin-kpi-card">
          <div className="fin-kpi-card__content">
            <span className="fin-kpi-card__label">{ar ? "إجمالي السندات" : "Total Vouchers"}</span>
            <span className="fin-kpi-card__value">{kpis.total}</span>
          </div>
        </div>
        <div className="fin-kpi-card">
          <div className="fin-kpi-card__content">
            <span className="fin-kpi-card__label">{ar ? "عدد القبض" : "Receipts Count"}</span>
            <span className="fin-kpi-card__value text-emerald-600">{kpis.receipts}</span>
          </div>
        </div>
        <div className="fin-kpi-card">
          <div className="fin-kpi-card__content">
            <span className="fin-kpi-card__label">{ar ? "عدد الصرف" : "Disbursements Count"}</span>
            <span className="fin-kpi-card__value text-red-600">{kpis.disbursements}</span>
          </div>
        </div>
        <div className="fin-kpi-card">
          <div className="fin-kpi-card__content">
            <span className="fin-kpi-card__label">{ar ? "إجمالي القبض" : "Total Receipts"}</span>
            <span className="fin-kpi-card__value text-emerald-600">
              {money(kpis.receiptsAmount, ar)}
            </span>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <div className="fin-panel__toolbar">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setVoucherForm((previous) => ({
                ...previous,
                voucherType: "RECEIPT",
                accountingCategory: "STUDENT_CONTRIBUTION"
              }));
              setShowVoucherForm(true);
            }}
          >
            {ar ? "سند قبض جديد" : "New Receipt Voucher"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setVoucherForm((previous) => ({
                ...previous,
                voucherType: "DISBURSEMENT",
                accountingCategory: "OPERATING_EXPENSE"
              }));
              setShowVoucherForm(true);
            }}
          >
            {ar ? "سند صرف جديد" : "New Disbursement Voucher"}
          </Button>
        </div>
      ) : null}

      <Modal
        isOpen={Boolean(showVoucherForm && isAdmin)}
        onClose={closeVoucherModal}
        title={
          voucherForm.voucherType === "RECEIPT"
            ? ar ? "سند قبض جديد" : "Create Receipt Voucher"
            : ar ? "سند صرف جديد" : "Create Disbursement Voucher"
        }
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
            <Button type="submit" form="finance-voucher-form" isLoading={createVoucherM.isPending}>
              {ar ? "حفظ السند" : "Save Voucher"}
            </Button>
          </div>
        }
      >
        <form id="finance-voucher-form" className="circlemod-form" onSubmit={handleCreateVoucher}>

          {/* Section 1: Account & Type */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Building2 size={15} className="circlemod-section-icon" />
              <span>{ar ? "بيانات الحساب" : "Account Info"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="vt-account">{ar ? "الحساب *" : "Account *"}</label>
                <select
                  id="vt-account"
                  className="circlemod-select"
                  value={voucherForm.accountId}
                  onChange={(event) => setVoucherForm((previous) => ({ ...previous, accountId: event.target.value }))}
                  required
                >
                  <option value="">{ar ? "الحساب المالي" : "Finance Account"}</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      #{account.id} · {account.center?.name ?? (ar ? "صندوق الجمعية" : "Org Fund")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="vt-type">{ar ? "نوع السند *" : "Voucher Type *"}</label>
                <select
                  id="vt-type"
                  className="circlemod-select"
                  value={voucherForm.voucherType}
                  onChange={(event) => setVoucherForm((previous) => ({
                    ...previous,
                    voucherType: event.target.value as VoucherTypeV2,
                    accountingCategory: event.target.value === "DISBURSEMENT" ? "OPERATING_EXPENSE" : "STUDENT_CONTRIBUTION"
                  }))}
                  required
                >
                  <option value="DISBURSEMENT">{ar ? "صرف" : "Disbursement"}</option>
                  <option value="RECEIPT">{ar ? "قبض" : "Receipt"}</option>
                </select>
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="vt-category">{ar ? "التصنيف المحاسبي *" : "Accounting Category *"}</label>
                <select
                  id="vt-category"
                  className="circlemod-select"
                  value={voucherForm.accountingCategory}
                  onChange={(event) => setVoucherForm((previous) => ({ ...previous, accountingCategory: event.target.value }))}
                  required
                >
                  {voucherForm.voucherType === "DISBURSEMENT" ? (
                    <>
                      <option value="OPERATING_EXPENSE">{ar ? "مصروف تشغيلي" : "Operating expense"}</option>
                      <option value="EDUCATIONAL_EXPENSE">{ar ? "مصروف تعليمي" : "Educational expense"}</option>
                      <option value="CENTER_EXPENSE">{ar ? "مصروف مركز" : "Center expense"}</option>
                      <option value="REWARD">{ar ? "مكافأة" : "Reward"}</option>
                    </>
                  ) : (
                    <>
                      <option value="STUDENT_CONTRIBUTION">{ar ? "مساهمة طالب" : "Student contribution"}</option>
                      <option value="OTHER_INCOME">{ar ? "إيراد آخر" : "Other income"}</option>
                    </>
                  )}
                </select>
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="vt-no">
                  <Hash size={12} className="inline-block ml-1 opacity-60" />
                  {ar ? "الرقم المرجعي (اختياري)" : "Manual Ref (Opt)"}
                </label>
                <input
                  id="vt-no"
                  className="circlemod-input"
                  value={voucherForm.manualReferenceNo}
                  onChange={(event) => setVoucherForm((previous) => ({ ...previous, manualReferenceNo: event.target.value }))}
                  placeholder={ar ? "أدخل رقم مرجعي" : "Ex: TR-100"}
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
                <label htmlFor="vt-amount">{ar ? "المبلغ *" : "Amount *"}</label>
                <input
                  id="vt-amount"
                  className="circlemod-input"
                  type="number"
                  min={1}
                  step="any"
                  value={voucherForm.originalAmount}
                  onChange={(event) => setVoucherForm((previous) => ({ ...previous, originalAmount: event.target.value }))}
                  placeholder={ar ? "المبلغ" : "Amount"}
                  required
                />
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="vt-currency">{ar ? "العملة" : "Currency"}</label>
                <select
                  id="vt-currency"
                  className="circlemod-select"
                  value={voucherForm.originalCurrencyCode || "YER"}
                  onChange={(event) => {
                    const code = event.target.value.toUpperCase();
                    setVoucherForm((previous) => ({
                      ...previous,
                      originalCurrencyCode: code,
                      exchangeRateToBase: code === "YER" ? "1" : ""
                    }));
                  }}
                  required
                >
                  {currencyOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {ar ? c.nameAr : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              {!isYer && (
                <div className="circlemod-field circlemod-field--sm">
                  <label htmlFor="vt-rate">
                    <ArrowLeftRight size={12} className="inline-block ml-1 opacity-60" />
                    {ar ? "سعر الصرف" : "Exchange Rate"}
                  </label>
                  <input
                    id="vt-rate"
                    className="circlemod-input"
                    type="number"
                    min={0}
                    step="any"
                    value={voucherForm.exchangeRateToBase}
                    onChange={(event) => setVoucherForm((previous) => ({ ...previous, exchangeRateToBase: event.target.value }))}
                    placeholder={isYer ? "1" : ar ? "سعر الصرف" : "Exchange Rate"}
                    disabled={isYer}
                    required={!isYer}
                  />
                </div>
              )}
            </div>
            <div className="text-[11px] opacity-70 mt-1 px-1" role="note">
              {baseAmountPreview === null
                ? ar ? "أدخل المبلغ والعملة لعرض المعادل بالريال اليمني" : "Enter amount and currency to see YER equivalent"
                : ar ? `المبلغ المعادل: ${baseAmountPreview.toLocaleString("ar-YE-u-nu-latn")} ر.ي` : `Equivalent: ${baseAmountPreview.toLocaleString("en-US")} YER`}
            </div>
          </div>

          {/* Section 3: Payment & Beneficiary */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Wallet size={15} className="circlemod-section-icon" />
              <span>{ar ? "بيانات الدفع" : "Payment Details"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="vt-method">{ar ? "طريقة الدفع *" : "Payment Method *"}</label>
                <select
                  id="vt-method"
                  className="circlemod-select"
                  value={voucherForm.method}
                  onChange={(event) => setVoucherForm((previous) => ({ ...previous, method: event.target.value as PaymentMethodV2 }))}
                >
                  <option value="CASH">{methodLabels.CASH}</option>
                  <option value="TRANSFER">{methodLabels.TRANSFER}</option>
                </select>
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="vt-date">
                  <Calendar size={12} className="inline-block ml-1 opacity-60" />
                  {ar ? "تاريخ السند *" : "Voucher Date *"}
                </label>
                <input
                  id="vt-date"
                  className="circlemod-input"
                  type="date"
                  value={voucherForm.voucherDate}
                  onChange={(event) => setVoucherForm((previous) => ({ ...previous, voucherDate: event.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="vt-beneficiary">
                  {voucherForm.voucherType === "RECEIPT" ? (ar ? "يستلم من" : "Received from") : (ar ? "يصرف لـ (المستفيد)" : "Pay to (Beneficiary)")}
                </label>
                <input
                  id="vt-beneficiary"
                  className="circlemod-input"
                  value={voucherForm.beneficiary}
                  onChange={(event) => setVoucherForm((previous) => ({ ...previous, beneficiary: event.target.value }))}
                  placeholder={ar ? "اسم المستفيد / الجهة" : "Beneficiary / Entity"}
                />
              </div>
            </div>
            {voucherForm.method === "TRANSFER" && (
              <div className="circlemod-row">
                <div className="circlemod-field circlemod-field--lg">
                  <label htmlFor="vt-ref">{ar ? "مرجع التحويل" : "Transfer Reference"}</label>
                  <input
                    id="vt-ref"
                    className="circlemod-input"
                    value={voucherForm.externalTransferRef}
                    onChange={(event) => setVoucherForm((previous) => ({ ...previous, externalTransferRef: event.target.value }))}
                    placeholder={ar ? "رقم مرجع التحويل" : "External transfer ref"}
                  />
                </div>
                {/* TODO: FINANCE-ATTACHMENTS-1: implement voucher attachment upload — replace this text input with a real file-upload component once a general upload service is available */}
                <div className="circlemod-field circlemod-field--lg">
                  <label htmlFor="vt-attach">{ar ? "مرجع / رابط المرفق" : "Attachment ref / link"}</label>
                  <input
                    id="vt-attach"
                    className="circlemod-input"
                    value={voucherForm.attachmentStorageKey}
                    onChange={(event) => setVoucherForm((previous) => ({ ...previous, attachmentStorageKey: event.target.value }))}
                    placeholder={ar ? "أدخل رابط أو مرجع المرفق (مؤقت)" : "Enter attachment link or reference (interim)"}
                    required={FINANCE_YEMEN_MODE}
                  />
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block">
                    {ar ? "⚠ حقل مؤقت — سيتم استبداله برفع ملفات فعلي لاحقاً" : "⚠ Interim field — will be replaced with actual file upload"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Description & Notes */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <StickyNote size={15} className="circlemod-section-icon" />
              <span>{ar ? "الوصف والملاحظات" : "Description & Notes"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="vt-desc">{ar ? "الوصف *" : "Description *"}</label>
                <input
                  id="vt-desc"
                  className="circlemod-input"
                  value={voucherForm.description}
                  onChange={(event) => setVoucherForm((previous) => ({ ...previous, description: event.target.value }))}
                  placeholder={ar ? "وصف السند" : "Voucher description"}
                  required
                />
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="vt-notes">{ar ? "ملاحظات" : "Notes"}</label>
                <input
                  id="vt-notes"
                  className="circlemod-input"
                  value={voucherForm.notes}
                  onChange={(event) => setVoucherForm((previous) => ({ ...previous, notes: event.target.value }))}
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

      <FinanceReasonConfirmModal
        isOpen={Boolean(reasonAction && reasonVoucherId)}
        title={
          reasonAction === "reject"
            ? ar
              ? "رفض السند"
              : "Reject Voucher"
            : ar
              ? "طلب عكس السند"
              : "Request Voucher Void"
        }
        description={
          reasonAction === "reject"
            ? ar
              ? "أدخل سبب رفض السند قبل المتابعة."
              : "Provide a rejection reason before continuing."
            : ar
              ? "أدخل سبب طلب العكس قبل المتابعة."
              : "Provide a void-request reason before continuing."
        }
        value={reasonValue}
        onValueChange={setReasonValue}
        onClose={closeReasonModal}
        onConfirm={handleConfirmReason}
        confirmLabel={
          reasonAction === "reject"
            ? ar
              ? "تأكيد الرفض"
              : "Confirm Reject"
            : ar
              ? "إرسال الطلب"
              : "Submit Request"
        }
        cancelLabel={ar ? "إلغاء" : "Cancel"}
        placeholder={ar ? "اكتب السبب" : "Enter reason"}
        label={ar ? "السبب" : "Reason"}
        isConfirming={rejectVoucherM.isPending || requestVoucherVoidM.isPending}
      />

      {vouchersQ.isError ? (
        <ErrorState
          title={ar ? "تعذر تحميل السندات" : "Unable to load vouchers"}
          description={getLocalizedApiErrorMessage(vouchersQ.error, {
            ar,
            fallback: entityFeedback.error(ar, "load", VOUCHERS_ENTITY)
          })}
          onRetry={() => void vouchersQ.refetch()}
        />
      ) : (
        <FinanceDataTable<FinanceVoucherV2>
          columns={columns}
          rows={pagination.pagedRows}
          rowKey="id"
          caption={ar ? "السندات المالية" : "Finance vouchers"}
          loading={vouchersQ.isLoading}
          emptyState={
            <EmptyState
              title={ar ? "لا توجد سندات" : "No vouchers"}
              description={
                ar
                  ? "لم يتم العثور على سندات لهذا النطاق."
                  : "No vouchers were found for the current scope."
              }
              icon={<FolderKanban className="w-10 h-10" />}
            />
          }
          pagination={
            pagination.totalItems > 0
              ? pagination.getPaginationProps({
                  labels: buildPaginationLabels(ar),
                  rtl: ar
                })
              : undefined
          }
          className="fin-premium-table"
        />
      )}
    </>
  );
}
