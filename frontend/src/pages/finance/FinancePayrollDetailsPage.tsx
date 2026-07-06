import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Receipt, CreditCard, Check, Shield, AlertCircle, Users, Banknote, ShieldMinus, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "../../features/auth/auth.store";
import { useI18n } from "../../app/i18n";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { LoadingState } from "../../components/ui/LoadingState";
import { FinancePageShell, FinancePageHeader, FinanceMoney, FinanceStatusBadge } from "../../features/finance-v2/design";
import { FinanceDataTable } from "../../features/finance-v2/design/FinanceDataTable";
import { methodLabels } from "../../features/finance-v2/components/FinanceShared";
import { 
  useFinanceV2PayrollBatchQuery, 
  useFailFinanceV2PayrollItemMutation,
  usePayFinanceV2PayrollBatchMutation
} from "../../features/finance-v2/finance-v2.hooks";
import type { PaymentMethodV2, PayrollItemV2 } from "../../features/finance-v2/types";

const PAYABLE_BATCH_STATUSES = new Set(["APPROVED", "IN_PROGRESS", "PARTIALLY_PAID"]);

function PayrollKpi({
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

export default function FinancePayrollDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useI18n();
  const ar = language === "ar";
  
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "TREASURER";

  const batchId = parseInt(id || "0", 10);
  const { data: batch, isLoading, refetch, isFetching } = useFinanceV2PayrollBatchQuery(batchId);

  const [paymentDraft, setPaymentDraft] = useState<{
    item: PayrollItemV2;
    method: PaymentMethodV2;
    reference: string;
  } | null>(null);

  const [failureDraft, setFailureDraft] = useState<{
    item: PayrollItemV2;
    reason: string;
  } | null>(null);

  const payBatchM = usePayFinanceV2PayrollBatchMutation();
  const failItemM = useFailFinanceV2PayrollItemMutation();

  const handlePayItem = async () => {
    if (!batch || !paymentDraft) return;
    try {
      await payBatchM.mutateAsync({
        batchId: batch.id,
        payments: [
          {
            itemId: paymentDraft.item.id,
            method: paymentDraft.method,
            externalTransferRef: paymentDraft.reference || undefined,
          }
        ]
      });
      setPaymentDraft(null);
    } catch (err) {
      // Error is handled by API interceptors
    }
  };

  const handleFailItem = async () => {
    if (!failureDraft) return;
    try {
      await failItemM.mutateAsync({
        itemId: failureDraft.item.id,
        failureReason: failureDraft.reason
      });
      setFailureDraft(null);
    } catch (err) {
      // Error handled by API interceptors
    }
  };

  const roleMap: Record<string, string> = {
    SUPER_ADMIN: ar ? "مدير نظام" : "Super Admin",
    CENTER_ADMIN: ar ? "مدير مركز" : "Center Admin",
    TEACHER: ar ? "معلم" : "Teacher",
    SUPERVISOR: ar ? "مشرف" : "Supervisor",
    ACCOUNTANT: ar ? "محاسب" : "Accountant",
    TREASURER: ar ? "أمين صندوق" : "Treasurer",
    FINANCE_MANAGER: ar ? "مدير مالي" : "Finance Manager"
  };

  const summary = useMemo(() => {
    if (!batch) return null;
    let totalBase = 0, totalBonus = 0, totalDeduction = 0, totalNet = 0;
    let paidCount = 0, paidAmount = 0;
    let excludedCount = 0, excludedAmount = 0;
    for (const item of batch.items || []) {
      totalBase += item.baseAmount;
      totalBonus += item.bonusAmount;
      totalDeduction += item.deductionAmount;
      totalNet += item.netAmount;
      if (item._duplicatePaid) {
        excludedCount++;
        excludedAmount += item.netAmount;
      } else if (item.status === "PAID") {
        paidCount++;
        paidAmount += item.netAmount;
      }
    }
    return { 
      totalBase, totalBonus, totalDeduction, totalNet, 
      count: batch.items?.length || 0,
      paidCount,
      paidAmount,
      excludedCount,
      excludedAmount,
      remainingCount: (batch.items?.length || 0) - paidCount - excludedCount,
      remainingAmount: totalNet - paidAmount - excludedAmount
    };
  }, [batch]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!batch) {
    return (
      <div className="flex justify-center items-center h-96 flex-col gap-4">
        <h2 className="text-xl font-bold text-slate-600">{ar ? "المسير غير موجود" : "Batch not found"}</h2>
        <Button variant="secondary" onClick={() => navigate("/finance/payroll")}>
          {ar ? "العودة للقائمة" : "Back to list"}
        </Button>
      </div>
    );
  }

  return (
    <FinancePageShell
      className="fin-premium-container ctr-page-modern"
      dir={ar ? "rtl" : "ltr"}
      header={
        <FinancePageHeader
          title={ar ? `تفاصيل مسير الرواتب #${batch.id}` : `Payroll Batch #${batch.id} Details`}
          subtitle={ar ? `الفترة: ${batch.periodMonth}/${batch.periodYear}` : `Period: ${batch.periodMonth}/${batch.periodYear}`}
          icon={<Receipt className="w-6 h-6 text-brand-600" />}
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="glass-btn"
                leftIcon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}
                onClick={() => refetch()}
              >
                {ar ? "تحديث" : "Refresh"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => navigate("/finance/payroll")}
              >
                {ar ? "رجوع" : "Back"}
              </Button>
            </div>
          }
        />
      }
      kpis={
        summary ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-800 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                {ar ? "تنبيه: الصرف الجزئي يعني صرف رواتب بعض الموظفين من المسير (وتأجيل البقية)، ولا يعني تقسيط راتب الموظف الواحد. يتم صرف صافي الراتب للموظف دفعة واحدة." 
                    : "Notice: Partial payment means paying some employees from the batch, not paying an installment of one employee's salary. The employee's net salary is paid in full."}
              </p>
            </div>
            <div className="ctr-kpis-modern">
              <PayrollKpi 
                icon={Users} 
                cls="amber" 
                val={summary.count} 
                label={ar ? "إجمالي الموظفين" : "Total Employees"} 
              />
              <PayrollKpi 
                icon={Coins} 
                cls="emerald" 
                val={<FinanceMoney amount={summary.totalNet} baseCurrency="YER" />} 
                label={ar ? "إجمالي المسير" : "Total Batch"} 
              />
              {(batch.status === "PARTIALLY_PAID" || batch.status === "PAID") && (
                <PayrollKpi 
                  icon={Check} 
                  cls="brand" 
                  val={<FinanceMoney amount={summary.paidAmount} baseCurrency="YER" />} 
                  label={ar ? `المصروف فعلياً (${summary.paidCount})` : `Actually Paid (${summary.paidCount})`} 
                />
              )}
              {summary.excludedCount > 0 && (
                <PayrollKpi 
                  icon={ShieldMinus} 
                  cls="rose" 
                  val={<FinanceMoney amount={summary.excludedAmount} baseCurrency="YER" />} 
                  label={ar ? `المستبعد/المكرر (${summary.excludedCount})` : `Excluded/Duplicate (${summary.excludedCount})`} 
                />
              )}
              {summary.remainingCount >= 0 && (
                <PayrollKpi 
                  icon={Banknote} 
                  cls="amber" 
                  val={<FinanceMoney amount={summary.remainingAmount} baseCurrency="YER" />} 
                  label={ar ? `متبقي لـ ${summary.remainingCount} موظف` : `Remaining for ${summary.remainingCount}`} 
                />
              )}
            </div>
          </div>
        ) : undefined
      }
    >
      <div className="fin-premium-panel animate-premium">
        <div className="fin-premium-panel__content" style={{ padding: 0 }}>
          <FinanceDataTable<PayrollItemV2>
          rows={batch.items || []}
          columns={[
            {
              header: ar ? "الموظف" : "Employee",
              render: (item) => (
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">{item.beneficiary?.fullName || "---"}</span>
                  <span className="text-xs text-slate-500">{item.beneficiary?.role ? (roleMap[item.beneficiary.role] || item.beneficiary.role) : ""}</span>
                </div>
              )
            },
            {
              header: ar ? "الأساسي" : "Base",
              render: (item) => <FinanceMoney amount={item.baseAmount} baseCurrency="YER" className="text-sm font-semibold text-slate-600" />
            },
            {
              header: ar ? "البدلات" : "Bonuses",
              render: (item) => <FinanceMoney amount={item.bonusAmount} baseCurrency="YER" className="text-sm font-semibold text-blue-600" />
            },
            {
              header: ar ? "الاستقطاعات" : "Deductions",
              render: (item) => <FinanceMoney amount={item.deductionAmount} baseCurrency="YER" className="text-sm font-semibold text-rose-600" />
            },
            {
              header: ar ? "الصافي" : "Net",
              render: (item) => <FinanceMoney amount={item.netAmount} baseCurrency="YER" className="text-lg font-black text-brand-600" />
            },
            {
              header: ar ? "الحالة" : "Status",
              render: (item) => {
                if (item._duplicatePaid) {
                  return (
                    <div className="flex flex-col gap-1">
                      <FinanceStatusBadge status="FAILED" label={ar ? "مكرر / مستبعد" : "Duplicate / Excluded"} />
                      <span className="text-xs text-rose-600 max-w-[150px] truncate" title={ar ? "تم الصرف مسبقاً" : "Already Paid"}>
                        {ar ? "تم الصرف في مسير آخر" : "Paid in another batch"}
                      </span>
                    </div>
                  );
                }
                return (
                  <div className="flex flex-col gap-1">
                    <FinanceStatusBadge status={item.status} label={item.status === 'PAID' ? (ar ? 'مصروف' : 'Paid') : item.status === 'FAILED' ? (ar ? 'فشل الصرف' : 'Failed') : (ar ? 'بانتظار الصرف' : 'Pending')} />
                    {item.failureReason && (
                      <span className="text-xs text-rose-600 max-w-[150px] truncate" title={item.failureReason}>
                        {item.status === 'FAILED' ? (ar ? `فشل: ${item.failureReason}` : `Failed: ${item.failureReason}`) : item.failureReason}
                      </span>
                    )}
                  </div>
                );
              }
            },
            {
              header: ar ? "الصرف/السند" : "Payment/Voucher",
              render: (item) => (
                <div className="flex flex-col gap-1 text-xs">
                  {item._duplicatePaid ? (
                    <div className="flex items-center gap-1 font-bold text-slate-500" title={ar ? "لا يدخل هذا المبلغ ضمن المتبقي للصرف" : "This amount is not included in the remaining amount"}>
                      <Receipt size={14} />
                      {ar ? `صُرف سابقاً في مسير #${item._duplicatePaid.batchId}` : `Paid previously in batch #${item._duplicatePaid.batchId}`}
                      {item._duplicatePaid.voucherId ? ` — السند #${item._duplicatePaid.voucherId}` : ''}
                    </div>
                  ) : item.status === "PAID" && item.voucherId ? (
                    <div className="flex items-center gap-1 font-bold text-emerald-600">
                      <Receipt size={14} />
                      {item.voucher?.voucherNo ?? `#${item.voucherId}`}
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                  {item.paymentMethod && <span className="font-semibold text-slate-600">{methodLabels[item.paymentMethod]}</span>}
                </div>
              )
            },
            {
              header: ar ? "الإجراءات" : "Actions",
              render: (item) => {
                if (item._duplicatePaid) {
                  return (
                    <div className="text-xs text-slate-500 font-medium">
                      {ar ? `مكرر (مسير #${item._duplicatePaid.batchId})` : `Duplicate (Batch #${item._duplicatePaid.batchId})`}
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-2">
                    {isAdmin && PAYABLE_BATCH_STATUSES.has(batch.status) && (item.status === "PENDING" || item.status === "FAILED") && (
                      <>
                        <button
                          type="button"
                          className="fin-action-btn approve"
                          title={ar ? "صرف الراتب" : "Pay Salary"}
                          onClick={() => setPaymentDraft({ item, method: "TRANSFER", reference: "" })}
                        >
                          <CreditCard size={16} />
                        </button>
                        <button
                          type="button"
                          className="fin-action-btn delete"
                          title={ar ? "تسجيل فشل الصرف" : "Mark as Failed"}
                          onClick={() => setFailureDraft({ item, reason: "" })}
                        >
                          <AlertCircle size={16} />
                        </button>
                      </>
                    )}
                  </div>
                );
              }
            }
          ]}
          rowKey="id"
        />
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={Boolean(paymentDraft)}
        onClose={() => setPaymentDraft(null)}
        title={ar ? "تأكيد صرف الراتب" : "Confirm Salary Payment"}
        description={paymentDraft?.item.beneficiary?.fullName}
        size="md"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setPaymentDraft(null)} disabled={payBatchM.isPending}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handlePayItem} isLoading={payBatchM.isPending} leftIcon={<Check className="w-4 h-4" />}>
              {ar ? "تأكيد الصرف" : "Confirm Payment"}
            </Button>
          </div>
        }
      >
        {paymentDraft && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
              <span className="text-sm font-bold text-emerald-800 block mb-1">{ar ? "صافي المبلغ للصرف" : "Net amount to pay"}</span>
              <FinanceMoney amount={paymentDraft.item.netAmount} baseCurrency="YER" className="text-2xl font-black text-emerald-600" />
            </div>

            {/* Currency Note if different */}
            {paymentDraft.item.originalCurrencyCode && paymentDraft.item.originalCurrencyCode !== "YER" && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                <div className="font-semibold">{ar ? "تفاصيل العملة الأجنبية:" : "Foreign Currency Details:"}</div>
                <div className="flex justify-between mt-1">
                  <span>{ar ? "المبلغ الأصلي:" : "Original Amount:"}</span>
                  <span className="font-bold">{paymentDraft.item.originalAmount} {paymentDraft.item.originalCurrencyCode}</span>
                </div>
                <div className="flex justify-between">
                  <span>{ar ? "سعر الصرف:" : "Exchange Rate:"}</span>
                  <span className="font-bold">{paymentDraft.item.exchangeRateToBase}</span>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex gap-2 items-start text-sm text-slate-600">
              <Shield className="w-5 h-5 text-brand-500 shrink-0" />
              <p>{ar ? "ملاحظة: سيتم توليد السند المحاسبي وسحب المبلغ تلقائياً من صندوق/حساب المركز المعتمد." : "Note: Voucher and journal entry will be automatically generated from the center's fund account."}</p>
            </div>

            <label className="circlemod-field">
              <span>{ar ? "طريقة الصرف" : "Payment method"}</span>
              <select
                className="circlemod-select"
                value={paymentDraft.method}
                onChange={(e) => setPaymentDraft(c => c ? { ...c, method: e.target.value as PaymentMethodV2 } : c)}
              >
                <option value="CASH">{methodLabels.CASH}</option>
                <option value="TRANSFER">{methodLabels.TRANSFER}</option>
              </select>
            </label>

            <label className="circlemod-field">
              <span>{ar ? "المرجع/رقم الحوالة" : "Reference / transfer no."}</span>
              <input
                className="circlemod-input"
                value={paymentDraft.reference}
                onChange={(e) => setPaymentDraft(c => c ? { ...c, reference: e.target.value } : c)}
                placeholder={ar ? "اختياري" : "Optional"}
              />
            </label>
          </div>
        )}
      </Modal>

      {/* Failure Modal */}
      <Modal
        isOpen={Boolean(failureDraft)}
        onClose={() => setFailureDraft(null)}
        title={ar ? "تسجيل فشل صرف راتب" : "Mark Salary Payment as Failed"}
        description={failureDraft?.item.beneficiary?.fullName}
        size="sm"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setFailureDraft(null)} disabled={failItemM.isPending}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button variant="danger" onClick={handleFailItem} isLoading={failItemM.isPending} disabled={!failureDraft?.reason.trim()}>
              {ar ? "تسجيل فشل" : "Mark Failed"}
            </Button>
          </div>
        }
      >
        {failureDraft && (
          <div className="space-y-4">
            <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800 flex gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <p>{ar ? "لن يتم توليد أي سند محاسبي وسيبقى الراتب معلقاً حتى يتم إعادة صرفه بنجاح." : "No voucher will be generated and salary remains pending until successfully paid."}</p>
            </div>
            
            <label className="circlemod-field">
              <span>{ar ? "سبب فشل الصرف (مطلوب)" : "Failure reason (Required)"}</span>
              <textarea
                className="circlemod-input min-h-[80px]"
                value={failureDraft.reason}
                onChange={(e) => setFailureDraft(c => c ? { ...c, reason: e.target.value } : c)}
                placeholder={ar ? "مثال: رقم الحساب البنكي غير صحيح" : "e.g. Invalid bank account number"}
                required
              />
            </label>
          </div>
        )}
      </Modal>

    </FinancePageShell>
  );
}
