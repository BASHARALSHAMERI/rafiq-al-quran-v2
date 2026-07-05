import { useEffect, useMemo, useState } from "react";
import { Gift, ArrowRight, Printer, Calendar, Eye, CreditCard, Receipt, RefreshCcw, User } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { getLocalizedApiErrorMessage } from "../../../../shared/api/error";
import {
  entityFeedback,
  notifyError,
  notifyRequiredFields,
  notifySuccess,
  type LocalizedLabel
} from "../../../../shared/ui/feedback";
import {
  useCreateFinanceV2RewardBatchMutation,
  useFailFinanceV2RewardItemMutation,
  useFinanceV2RewardBatchesQuery,
  usePayFinanceV2RewardBatchMutation,
  useSubmitFinanceV2RewardBatchMutation
} from "../../finance-v2.hooks";
import type { PaymentMethodV2, RewardBatchV2, RewardCycleV2, RewardItemV2, RewardTypeV2 } from "../../types";
import { printRewardsReport } from "../../../accounting/printAccounting";
import { useOrgBrandingQuery } from "../../../org/org.hooks";
import { FinSkeleton, voucherStatusLabels, FinancePaginationFooter } from "../FinanceShared";
import { 
  FinanceMoney,
  FinanceStatusBadge
} from "../../design";
import { FinanceDataTable } from "../../design/FinanceDataTable";
import Modal from "../../../../components/ui/Modal";
import useClientPagination from "../../../../shared/ui/useClientPagination";

type Props = {
  centerId: number | undefined;
  year: number;
  month: number;
  status?: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canCreateBatch?: boolean;
  ar: boolean;
  centers: { id: number; name: string }[];
  externalShowBatchForm?: boolean;
  onExternalBatchFormClose?: () => void;
};

const REWARD_BATCH_ENTITY: LocalizedLabel = { ar: "دفعة المكافآت", en: "reward batch" };

const REWARD_METHOD_LABELS: Record<PaymentMethodV2, string> = {
  CASH: "Cash",
  TRANSFER: "Transfer"
};

const REWARD_TYPE_LABELS: Record<RewardTypeV2, { ar: string; en: string }> = {
  GENERAL: { ar: "عامة", en: "General" },
  PERFORMANCE: { ar: "أداء", en: "Performance" },
  ATTENDANCE: { ar: "حضور", en: "Attendance" },
  COMPETITION: { ar: "مسابقة", en: "Competition" },
  OTHER: { ar: "أخرى", en: "Other" }
};

const PAYABLE_REWARD_STATUSES = new Set(["APPROVED", "IN_PROGRESS", "PARTIALLY_PAID"]);

const rewardStatusLabel = (status: RewardItemV2["status"], ar: boolean) => {
  if (!ar) return status;
  if (status === "PAID") return "مصروف";
  if (status === "FAILED") return "فشل الصرف";
  if (status === "VOIDED") return "ملغى";
  return "بانتظار الصرف";
};

const rewardSummary = (batch: RewardBatchV2 | null) => {
  const items = batch?.items ?? [];
  return items.reduce(
    (summary, item) => {
      const paid = item.status === "PAID";
      const failed = item.status === "FAILED";
      const pending = item.status === "PENDING";
      summary.total += item.amount;
      summary.paidAmount += paid ? item.amount : 0;
      summary.remainingAmount += pending || failed ? item.amount : 0;
      summary.paidCount += paid ? 1 : 0;
      summary.failedCount += failed ? 1 : 0;
      summary.pendingCount += pending ? 1 : 0;
      return summary;
    },
    { total: 0, paidAmount: 0, remainingAmount: 0, paidCount: 0, failedCount: 0, pendingCount: 0, totalCount: items.length }
  );
};

export default function FinanceRewardsTab({ 
  centerId, 
  year, 
  month,
  status,
  isAdmin,
  isSuperAdmin,
  canCreateBatch = isAdmin,
  ar, 
  externalShowBatchForm, 
  onExternalBatchFormClose 
}: Props) {
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<RewardBatchV2 | null>(null);
  const [paymentDraft, setPaymentDraft] = useState<{
    batch: RewardBatchV2;
    item: RewardItemV2;
    method: PaymentMethodV2;
    reference: string;
    failureReason: string;
  } | null>(null);

  useEffect(() => {
    if (externalShowBatchForm) {
      setShowBatchForm(true);
    }
  }, [externalShowBatchForm]);

  const [batchForm, setBatchForm] = useState({
    cycle: "MONTHLY" as RewardCycleV2,
    rewardType: "GENERAL" as RewardTypeV2,
    periodMonth: month,
    periodQuarter: 1
  });

  useEffect(() => {
    setBatchForm(prev => ({ ...prev, periodMonth: month }));
  }, [month]);

  const brandingQ = useOrgBrandingQuery();
  const batchesQ = useFinanceV2RewardBatchesQuery(centerId, year);
  const batches = useMemo(
    () => (batchesQ.data?.rows ?? []).filter((batch) =>
      (!status || batch.status === status) &&
      (batch.cycle !== "MONTHLY" || batch.periodMonth === month)
    ),
    [batchesQ.data?.rows, month, status]
  );
  const pagination = useClientPagination(batches, { initialPageSize: 10 });

  const createBatchM = useCreateFinanceV2RewardBatchMutation();
  const submitBatchM = useSubmitFinanceV2RewardBatchMutation();
  const payBatchM = usePayFinanceV2RewardBatchMutation();
  const failItemM = useFailFinanceV2RewardItemMutation();
  const selectedSummary = useMemo(() => rewardSummary(selectedBatch), [selectedBatch]);

  const closeBatchModal = () => {
    if (createBatchM.isPending) return;
    setShowBatchForm(false);
    onExternalBatchFormClose?.();
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerId && !isSuperAdmin) {
      notifyError(ar ? "المركز مطلوب لإنشاء دفعة المكافآت." : "A center is required to create a reward batch.");
      return;
    }

    try {
      await createBatchM.mutateAsync({
        centerId,
        periodYear: year,
        cycle: batchForm.cycle,
        rewardType: batchForm.rewardType,
        periodMonth: batchForm.cycle === "MONTHLY" ? batchForm.periodMonth : undefined,
        periodQuarter: batchForm.cycle === "QUARTERLY" ? batchForm.periodQuarter : undefined
      });
      notifySuccess(entityFeedback.success(ar, "create", REWARD_BATCH_ENTITY));
      closeBatchModal();
    } catch (err) {
      const message = getLocalizedApiErrorMessage(err, {
        ar,
        fallback: ar ? "تعذر إنشاء دفعة المكافآت." : "Unable to create the reward batch."
      });
      notifyError(message);
    }
  };

  const handleOpenPayment = (batch: RewardBatchV2, item: RewardItemV2) => {
    setPaymentDraft({
      batch,
      item,
      method: item.paymentMethod ?? "CASH",
      reference: item.paymentReference ?? "",
      failureReason: item.failureReason ?? ""
    });
  };

  const handlePayItem = async () => {
    if (!paymentDraft) return;
    try {
      const updated = await payBatchM.mutateAsync({
        batchId: paymentDraft.batch.id,
        payments: [{
          itemId: paymentDraft.item.id,
          method: paymentDraft.method,
          manualReferenceNo: paymentDraft.reference || undefined,
          externalTransferRef: paymentDraft.method === "TRANSFER" ? paymentDraft.reference || undefined : undefined
        }]
      });
      setSelectedBatch(updated);
      setPaymentDraft(null);
      notifySuccess(ar ? "تم صرف المكافأة" : "Reward paid");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر صرف المكافأة." : "Unable to pay the reward."
      }));
    }
  };

  const handleFailItem = async () => {
    if (!paymentDraft || !paymentDraft.failureReason.trim()) {
      notifyRequiredFields(ar);
      return;
    }
    try {
      const updated = await failItemM.mutateAsync({
        itemId: paymentDraft.item.id,
        failureReason: paymentDraft.failureReason
      });
      setSelectedBatch(updated);
      setPaymentDraft(null);
      notifySuccess(ar ? "تم تسجيل فشل الصرف" : "Reward payment failure recorded");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر تسجيل فشل صرف المكافأة." : "Unable to record the reward payment failure."
      }));
    }
  };

  const handleSubmitBatch = async (batchId: number) => {
    try {
      await submitBatchM.mutateAsync({ batchId });
      notifySuccess(ar ? "تم إرسال دفعة المكافآت للاعتماد" : "Reward batch submitted for approval");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر إرسال دفعة المكافآت للاعتماد." : "Unable to submit the reward batch for approval."
      }));
    }
  };

  return (
    <>
      <Modal
        isOpen={Boolean(showBatchForm && canCreateBatch)}
        onClose={closeBatchModal}
        title={ar ? "إنشاء دفعة مكافآت" : "Create Reward Batch"}
        titleIcon={
          <div className="circlemod-head-icon">
            <Gift className="w-4 h-4" />
          </div>
        }
        size="lg"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={closeBatchModal} disabled={createBatchM.isPending}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" form="fin-reward-batch-form" isLoading={createBatchM.isPending}>
              {ar ? "إنشاء الدفعة" : "Create Batch"}
            </Button>
          </div>
        }
      >
        <form id="fin-reward-batch-form" className="circlemod-form" onSubmit={handleCreateBatch}>
          {/* Section 1: Period */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Calendar size={15} className="circlemod-section-icon" />
              <span>{ar ? "الفترة الزمنية" : "Period"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="rw-year">{ar ? "السنة" : "Year"}</label>
                <div id="rw-year" className="circlemod-input flex items-center font-bold" style={{ cursor: 'default' }}>
                  {year}
                </div>
              </div>
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="rw-cycle">{ar ? "دورة المكافأة" : "Reward Cycle"}</label>
                <select
                  id="rw-cycle"
                  className="circlemod-select"
                  value={batchForm.cycle}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, cycle: e.target.value as RewardCycleV2 }))}
                >
                  <option value="MONTHLY">{ar ? "شهري" : "Monthly"}</option>
                  <option value="QUARTERLY">{ar ? "ربع سنوي" : "Quarterly"}</option>
                  <option value="ANNUAL">{ar ? "سنوي" : "Annual"}</option>
                </select>
              </div>
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="rw-type">{ar ? "نوع المكافأة" : "Reward Type"}</label>
                <select
                  id="rw-type"
                  className="circlemod-select"
                  value={batchForm.rewardType}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, rewardType: e.target.value as RewardTypeV2 }))}
                >
                  {(Object.keys(REWARD_TYPE_LABELS) as RewardTypeV2[]).map((type) => (
                    <option key={type} value={type}>{ar ? REWARD_TYPE_LABELS[type].ar : REWARD_TYPE_LABELS[type].en}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="circlemod-row">
              {batchForm.cycle === "MONTHLY" ? (
                <div className="circlemod-field circlemod-field--lg">
                  <label htmlFor="rw-month">{ar ? "الشهر" : "Month"}</label>
                  <select
                    id="rw-month"
                    className="circlemod-select"
                    value={batchForm.periodMonth}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, periodMonth: parseInt(e.target.value) }))}
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
                      const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                      return (
                        <option key={i + 1} value={i + 1}>
                          {ar ? arabicMonths[i] : englishMonths[i]}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : batchForm.cycle === "QUARTERLY" ? (
                <div className="circlemod-field circlemod-field--lg">
                  <label htmlFor="rw-quarter">{ar ? "الربع" : "Quarter"}</label>
                  <select
                    id="rw-quarter"
                    className="circlemod-select"
                    value={batchForm.periodQuarter}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, periodQuarter: parseInt(e.target.value) }))}
                  >
                    <option value={1}>{ar ? "الربع الأول" : "Q1"}</option>
                    <option value={2}>{ar ? "الربع الثاني" : "Q2"}</option>
                    <option value={3}>{ar ? "الربع الثالث" : "Q3"}</option>
                    <option value={4}>{ar ? "الربع الرابع" : "Q4"}</option>
                  </select>
                </div>
              ) : (
                <div className="circlemod-field circlemod-field--lg">
                  <label>{ar ? "النطاق" : "Scope"}</label>
                  <div className="circlemod-input flex items-center font-bold" style={{ cursor: "default" }}>
                    {ar ? "كامل السنة" : "Full year"}
                  </div>
                </div>
              )}
            </div>
          </div>

        </form>
      </Modal>

      <Modal
        isOpen={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        title={ar ? "تفاصيل دفعة المكافآت" : "Reward Batch Details"}
        description={selectedBatch ? `${selectedBatch.periodYear} · ${selectedBatch.cycle}` : undefined}
        size="xl"
        footer={
          <Button variant="ghost" onClick={() => setSelectedBatch(null)}>
            {ar ? "إغلاق" : "Close"}
          </Button>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-100 bg-white p-3">
              <span className="block text-[0.68rem] font-bold uppercase text-text-tertiary">{ar ? "إجمالي المكافآت" : "Total rewards"}</span>
              <FinanceMoney amount={selectedSummary.total} baseCurrency="YER" className="text-sm font-black text-text-primary" />
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <span className="block text-[0.68rem] font-bold uppercase text-emerald-700">{ar ? "المصروف" : "Paid"}</span>
              <FinanceMoney amount={selectedSummary.paidAmount} baseCurrency="YER" className="text-sm font-black text-emerald-700" />
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
              <span className="block text-[0.68rem] font-bold uppercase text-amber-700">{ar ? "المتبقي" : "Remaining"}</span>
              <FinanceMoney amount={selectedSummary.remainingAmount} baseCurrency="YER" className="text-sm font-black text-amber-700" />
            </div>
            <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
              <span className="block text-[0.68rem] font-bold uppercase text-rose-700">{ar ? "فشل الصرف" : "Failed"}</span>
              <strong className="text-lg text-rose-700">{selectedSummary.failedCount}</strong>
            </div>
          </div>

          <FinanceDataTable<any>
            rows={selectedBatch?.items ?? []}
            columns={[
              {
                header: ar ? "المستفيد" : "Beneficiary",
                render: (item) => (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <User size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-text-primary">{item.beneficiary?.fullName}</span>
                      <span className="text-[0.65rem] text-text-tertiary font-medium">{item.beneficiaryRole}</span>
                    </div>
                  </div>
                )
              },
              {
                header: ar ? "النوع" : "Type",
                render: (item) => (
                  <span className="text-xs font-bold text-text-secondary">
                    {item.rewardType ? (ar ? REWARD_TYPE_LABELS[item.rewardType as RewardTypeV2].ar : REWARD_TYPE_LABELS[item.rewardType as RewardTypeV2].en) : "-"}
                  </span>
                )
              },
              {
                header: ar ? "المبلغ" : "Amount",
                render: (item) => <FinanceMoney amount={item.amount} baseCurrency="YER" className="text-sm font-black text-brand-600" />
              },
              {
                header: ar ? "الحالة" : "Status",
                render: (item) => (
                  <div className="flex flex-col gap-1">
                    <FinanceStatusBadge status={item.status} label={rewardStatusLabel(item.status, ar)} />
                    {item.failureReason ? (
                      <span className="max-w-[140px] truncate text-[0.65rem] font-semibold text-rose-500" title={item.failureReason}>
                        {item.failureReason}
                      </span>
                    ) : null}
                  </div>
                )
              },
              {
                header: ar ? "طريقة الصرف" : "Payment method",
                render: (item) => <span className="text-xs font-bold text-text-secondary">{item.paymentMethod ? REWARD_METHOD_LABELS[item.paymentMethod as PaymentMethodV2] : "-"}</span>
              },
              {
                header: ar ? "المرجع" : "Reference",
                render: (item) => <span className="max-w-[120px] truncate text-xs font-semibold text-text-secondary" title={item.paymentReference ?? undefined}>{item.paymentReference || "-"}</span>
              },
              {
                header: ar ? "السند" : "Voucher",
                render: (item) => item.voucherId ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600">
                    <Receipt size={13} />
                    {item.voucher?.voucherNo ?? `#${item.voucherId}`}
                  </span>
                ) : <span className="text-xs font-semibold text-text-tertiary">-</span>
              },
              {
                header: ar ? "الإجراء" : "Action",
                render: (item) => (
                  <div className="flex items-center gap-2">
                    {isAdmin && selectedBatch && PAYABLE_REWARD_STATUSES.has(selectedBatch.status) && item.status !== "PAID" ? (
                      <Button
                        size="sm"
                        variant={item.status === "FAILED" ? "secondary" : "primary"}
                        leftIcon={item.status === "FAILED" ? <RefreshCcw className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenPayment(selectedBatch, item)}
                      >
                        {item.status === "FAILED" ? (ar ? "إعادة محاولة" : "Retry") : (ar ? "صرف" : "Pay")}
                      </Button>
                    ) : null}
                  </div>
                )
              }
            ]}
            rowKey="id"
            className="fin-premium-table--compact"
          />
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(paymentDraft && isAdmin)}
        onClose={() => setPaymentDraft(null)}
        title={ar ? "صرف مكافأة" : "Pay reward"}
        description={paymentDraft?.item.beneficiary?.fullName}
        size="md"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setPaymentDraft(null)} disabled={payBatchM.isPending || failItemM.isPending}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button variant="danger" onClick={handleFailItem} isLoading={failItemM.isPending} disabled={!paymentDraft?.failureReason.trim()}>
              {ar ? "تسجيل فشل" : "Mark failed"}
            </Button>
            <Button onClick={handlePayItem} isLoading={payBatchM.isPending} leftIcon={<CreditCard className="w-4 h-4" />}>
              {ar ? "صرف" : "Pay"}
            </Button>
          </div>
        }
      >
        {paymentDraft ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="text-xs font-bold text-text-tertiary">{ar ? "مبلغ المكافأة" : "Reward amount"}</span>
              <FinanceMoney amount={paymentDraft.item.amount} baseCurrency="YER" className="block text-lg font-black text-brand-600" />
            </div>
            <label className="circlemod-field">
              <span>{ar ? "طريقة الصرف" : "Payment method"}</span>
              <select
                className="circlemod-select"
                value={paymentDraft.method}
                onChange={(event) => setPaymentDraft((current) => current ? { ...current, method: event.target.value as PaymentMethodV2 } : current)}
              >
                <option value="CASH">{REWARD_METHOD_LABELS.CASH}</option>
                <option value="TRANSFER">{REWARD_METHOD_LABELS.TRANSFER}</option>
              </select>
            </label>
            <label className="circlemod-field">
              <span>{ar ? "المرجع/رقم الحوالة" : "Reference / transfer no."}</span>
              <input
                className="circlemod-input"
                value={paymentDraft.reference}
                onChange={(event) => setPaymentDraft((current) => current ? { ...current, reference: event.target.value } : current)}
                placeholder={ar ? "اختياري" : "Optional"}
              />
            </label>
            <label className="circlemod-field">
              <span>{ar ? "سبب فشل الصرف" : "Failure reason"}</span>
              <textarea
                className="circlemod-input min-h-[80px]"
                value={paymentDraft.failureReason}
                onChange={(event) => setPaymentDraft((current) => current ? { ...current, failureReason: event.target.value } : current)}
                placeholder={ar ? "يستخدم فقط عند تسجيل الفشل" : "Used only when marking this reward as failed"}
              />
            </label>
          </div>
        ) : null}
      </Modal>

      {batchesQ.isLoading ? <FinSkeleton rows={5} /> : null}

      {!batchesQ.isLoading && batches.length === 0 ? (
        <EmptyState 
          title={ar ? "لا توجد مكافآت" : "No rewards"} 
          description={ar ? "أنشئ دفعة مكافآت جديدة للبدء." : "Create a new reward batch to start."} 
          icon={<Gift className="w-10 h-10" />} 
        />
      ) : null}

      {!batchesQ.isLoading && batches.length > 0 ? (
        <div className="animate-premium mt-4">
          <FinanceDataTable<any>
            rows={pagination.pagedRows}
                columns={[
                  {
                    header: ar ? "رقم الدفعة" : "Batch ID",
                    render: (b) => <span className="font-bold text-brand-600">#{b.id}</span>
                  },
                  {
                    header: ar ? "العام" : "Year",
                    render: (b) => <span className="font-semibold">{b.periodYear}</span>
                  },
                  {
                    header: ar ? "الدورة" : "Cycle",
                    render: (b) => <span className="text-sm font-bold text-text-secondary">{b.cycle}</span>
                  },
                  {
                    header: ar ? "النوع" : "Type",
                    render: (b) => (
                      <span className="text-sm font-bold text-text-secondary">
                        {b.rewardType ? (ar ? REWARD_TYPE_LABELS[b.rewardType as RewardTypeV2].ar : REWARD_TYPE_LABELS[b.rewardType as RewardTypeV2].en) : "-"}
                      </span>
                    )
                  },
                  {
                    header: ar ? "عدد المستفيدين" : "Beneficiaries",
                    render: (b) => <span className="text-sm font-medium text-text-secondary">{b.items?.length || 0}</span>
                  },
                  {
                    header: ar ? "إجمالي المبلغ" : "Total Amount",
                    render: (b) => (
                      <FinanceMoney 
                        amount={(b.items || []).reduce((acc: number, item: any) => acc + item.amount, 0)} 
                        baseCurrency="YER" 
                        className="!text-lg !font-extrabold" 
                      />
                    )
                  },
                  {
                    header: ar ? "الحالة" : "Status",
                    render: (b) => <FinanceStatusBadge status={b.status} label={voucherStatusLabels[b.status as string] || b.status} />
                  },
                  {
                    header: ar ? "الإجراءات" : "Actions",
                    render: (b) => (
                      <div className="flex items-center gap-2">
                        {canCreateBatch && b.status === "DRAFT" && (
                          <Button 
                            size="sm" 
                            variant="primary" 
                            className="shadow-sm"
                            leftIcon={<Gift className="w-4 h-4" />}
                            onClick={() => void handleSubmitBatch(b.id)}
                            isLoading={submitBatchM.isPending}
                          >
                            {ar ? "إرسال للاعتماد" : "Submit for approval"}
                          </Button>
                        )}
                        <button 
                          className="fin-action-btn view" 
                          onClick={() => setSelectedBatch(b)}
                          title={ar ? "عرض التفاصيل" : "View details"}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="fin-action-btn view" 
                          onClick={() => printRewardsReport(batches, ar, brandingQ.data?.logoUrl || undefined, brandingQ.data?.name || undefined)}
                          title={ar ? "طباعة الكشف" : "Print Rewards"}
                        >
                          <Printer size={16} />
                        </button>
                        <button className="fin-action-btn view group" onClick={() => setSelectedBatch(b)}>
                          <ArrowRight size={16} className="transition-transform group-hover:translate-x-[-4px] rtl:group-hover:translate-x-[4px]" />
                        </button>
                      </div>
                    )
                  }
                ]}
                rowKey="id"
                className="fin-premium-table"
              />
              <FinancePaginationFooter
                ar={ar}
                pageSize={pagination.pageSize}
                setPageSize={pagination.setPageSize}
                currentPage={pagination.currentPage}
                setPage={pagination.setCurrentPage}
                totalFilteredCount={pagination.totalItems}
                pages={pagination.totalPages}
              />
        </div>
      ) : null}
    </>
  );
}
