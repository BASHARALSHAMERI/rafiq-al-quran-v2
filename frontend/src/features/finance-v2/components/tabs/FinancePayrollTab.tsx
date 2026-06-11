import { useEffect, useMemo, useState } from "react";
import { Calculator, Printer, Users, Eye, TrendingDown, TrendingUp, User, AlertCircle, Calendar, StickyNote, CreditCard, Receipt, RefreshCcw } from "lucide-react";
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
  useCreateFinanceV2PayrollBatchMutation,
  useFailFinanceV2PayrollItemMutation,
  useFinanceV2PayrollBatchesQuery,
  usePayFinanceV2PayrollBatchMutation,
  useSubmitFinanceV2PayrollBatchMutation
} from "../../finance-v2.hooks";
import type { PaymentMethodV2, PayrollBatchV2, PayrollItemV2 } from "../../types";
import { FinSkeleton, voucherStatusLabels, FinancePaginationFooter } from "../FinanceShared";
import { 
  FinanceMoney,
  FinanceStatusBadge
} from "../../design";
import { FinanceDataTable } from "../../design/FinanceDataTable";
import Modal from "../../../../components/ui/Modal";
import useClientPagination from "../../../../shared/ui/useClientPagination";
import { useOrgBrandingQuery } from "../../../org/org.hooks";

type Props = {
  centerId: number | undefined;
  year: number;
  month: number;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canCreateBatch?: boolean;
  ar: boolean;
  methodLabels: Record<PaymentMethodV2, string>;
  centers: { id: number; name: string }[];
  externalShowBatchForm?: boolean;
  onExternalBatchFormClose?: () => void;
};

const PAYROLL_BATCH_ENTITY: LocalizedLabel = { ar: "دفعة الرواتب", en: "payroll batch" };

const PAYABLE_BATCH_STATUSES = new Set(["APPROVED", "IN_PROGRESS", "PARTIALLY_PAID"]);

const getPayrollItemStatusLabel = (status: PayrollItemV2["status"], ar: boolean) => {
  if (!ar) return status;
  switch (status) {
    case "PAID":
      return "مصروف";
    case "FAILED":
      return "فشل الصرف";
    case "VOIDED":
      return "ملغى";
    case "PENDING":
    default:
      return "بانتظار الصرف";
  }
};

const getPayrollSummary = (batch: PayrollBatchV2 | null) => {
  const items = batch?.items ?? [];
  return items.reduce(
    (summary, item) => {
      const isPaid = item.status === "PAID";
      const isFailed = item.status === "FAILED";
      const isPending = item.status === "PENDING";
      summary.totalBase += item.baseAmount;
      summary.totalBonus += item.bonusAmount;
      summary.totalDeduction += item.deductionAmount;
      summary.totalNet += item.netAmount;
      summary.paidAmount += isPaid ? item.netAmount : 0;
      summary.remainingAmount += isPending || isFailed ? item.netAmount : 0;
      summary.paidCount += isPaid ? 1 : 0;
      summary.pendingCount += isPending ? 1 : 0;
      summary.failedCount += isFailed ? 1 : 0;
      return summary;
    },
    {
      totalBase: 0,
      totalBonus: 0,
      totalDeduction: 0,
      totalNet: 0,
      paidAmount: 0,
      remainingAmount: 0,
      paidCount: 0,
      pendingCount: 0,
      failedCount: 0,
      totalCount: items.length
    }
  );
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const printPayrollReport = (
  batch: PayrollBatchV2,
  ar: boolean,
  methodLabels: Record<PaymentMethodV2, string>,
  logoUrl?: string,
  orgName?: string
) => {
  const accentColor = "#2D9B7A";
  const accentLight = "#E4F4EE";
  const accentBg = "#F2FAF6";
  const resolvedLogoUrl = logoUrl || "/brand/rafiq-logo.svg";
  const resolvedOrgName = orgName || (ar ? "جمعية رفقاء القرآن" : "Rafiq Al-Quran Association");

  const summary = getPayrollSummary(batch);
  const rows = (batch.items ?? []).map((item) => `
    <tr>
      <td>${escapeHtml(item.beneficiary?.fullName)}</td>
      <td class="text-left">${item.baseAmount.toFixed(2)}</td>
      <td class="text-left">${item.bonusAmount.toFixed(2)}</td>
      <td class="text-left">${item.deductionAmount.toFixed(2)}</td>
      <td class="text-left">${item.netAmount.toFixed(2)}</td>
      <td class="text-center">${escapeHtml(getPayrollItemStatusLabel(item.status, ar))}</td>
      <td class="text-center">${escapeHtml(item.paymentMethod ? methodLabels[item.paymentMethod] : "-")}</td>
      <td class="text-center">${escapeHtml(item.paymentReference || "-")}</td>
      <td class="text-center">${escapeHtml(item.voucher?.voucherNo ?? (item.voucherId ? `#${item.voucherId}` : "-"))}</td>
    </tr>
  `).join("");
  const reportWindow = window.open("", "_blank", "width=1100,height=800");
  if (!reportWindow) return;
  reportWindow.opener = null;
  reportWindow.document.write(`
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>${ar ? "كشف رواتب" : "Payroll report"} #${batch.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; padding: 36px; color: #2D3748; background: #F7FAFC; }
          .wrap { max-width: 1100px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; position: relative; }
          .wrap::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, ${accentColor}, ${accentColor}99, ${accentColor}); }
          .inner { padding: 32px 36px 28px; }
          .header { display: flex; align-items: center; gap: 16px; padding-bottom: 18px; border-bottom: 2px solid ${accentLight}; margin-bottom: 22px; }
          .header-logo { width: 52px; height: 52px; flex-shrink: 0; }
          .header-center { flex: 1; }
          .header-org-name { font-size: 17px; font-weight: 900; color: #1A365D; line-height: 1.3; }
          .header-sub { font-size: 11px; color: ${accentColor}; font-weight: 600; }
          .header-left { text-align: left; font-size: 11px; color: #718096; font-weight: 600; flex-shrink: 0; }
          .title-section { text-align: center; margin-bottom: 22px; }
          .title-section h1 { font-size: 22px; font-weight: 900; color: #1A365D; display: inline-block; position: relative; }
          .title-section h1::after { content: ''; display: block; width: 50%; height: 4px; background: linear-gradient(90deg, transparent, ${accentColor}, transparent); margin: 8px auto 0; border-radius: 2px; }
          .title-sub { font-size: 13px; color: #718096; font-weight: 600; margin-top: 4px; }
          .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 22px; }
          .metric { background: ${accentBg}; border: 1px solid ${accentLight}; border-radius: 10px; padding: 12px 14px; text-align: center; }
          .metric-label { font-size: 11px; font-weight: 700; color: #718096; display: block; margin-bottom: 4px; }
          .metric-value { font-size: 17px; font-weight: 900; color: ${accentColor}; }
          table { width: 100%; border-collapse: collapse; }
          th { background: ${accentBg}; color: ${accentColor}; font-size: 11px; font-weight: 800; border: 1px solid ${accentLight}; padding: 10px 8px; white-space: nowrap; }
          td { border: 1px solid #E2E8F0; padding: 7px 8px; font-size: 12px; color: #2D3748; }
          tr:nth-child(even) td { background: #FAFBFC; }
          .text-right { text-align: right; } .text-center { text-align: center; } .text-left { text-align: left; }
          .footer { text-align: center; margin-top: 20px; padding-top: 12px; border-top: 1px solid #E2E8F0; }
          .footer-text { font-size: 10px; color: #A0AEC0; font-weight: 600; }
          @media print {
            body { background: #FFFFFF; padding: 0; }
            .wrap { box-shadow: none; border-radius: 0; }
            .inner { padding: 20px 24px; }
            @page { margin: 12mm 10mm; size: A4 landscape; }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="inner">
            <div class="header">
              <img class="header-logo" src="${resolvedLogoUrl}" alt="Logo" />
              <div class="header-center">
                <div class="header-org-name">${resolvedOrgName}</div>
                <div class="header-sub">${ar ? "إدارة الشؤون المالية" : "Financial Affairs Department"}</div>
              </div>
              <div class="header-left">${ar ? "تاريخ الطباعة:" : "Print date:"} ${new Date().toLocaleDateString("ar-YE-u-nu-latn")}</div>
            </div>
            <div class="title-section">
              <h1>${ar ? "كشف رواتب" : "Payroll Report"}</h1>
              <div class="title-sub">${ar ? "دفعة رقم" : "Batch"} #${batch.id} · ${batch.periodMonth}/${batch.periodYear}</div>
            </div>
            <div class="summary-grid">
              <div class="metric"><span class="metric-label">${ar ? "إجمالي الرواتب" : "Gross Payroll"}</span><span class="metric-value">${(summary.totalBase + summary.totalBonus).toFixed(2)}</span></div>
              <div class="metric"><span class="metric-label">${ar ? "الخصومات" : "Deductions"}</span><span class="metric-value">${summary.totalDeduction.toFixed(2)}</span></div>
              <div class="metric"><span class="metric-label">${ar ? "الصافي" : "Net"}</span><span class="metric-value">${summary.totalNet.toFixed(2)}</span></div>
              <div class="metric"><span class="metric-label">${ar ? "المصروف" : "Paid"}</span><span class="metric-value">${summary.paidAmount.toFixed(2)}</span></div>
              <div class="metric"><span class="metric-label">${ar ? "المتبقي" : "Remaining"}</span><span class="metric-value">${summary.remainingAmount.toFixed(2)}</span></div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>${ar ? "الموظف" : "Employee"}</th>
                  <th class="text-left">${ar ? "الأساسي" : "Base"}</th>
                  <th class="text-left">${ar ? "البدلات" : "Bonus"}</th>
                  <th class="text-left">${ar ? "الخصومات" : "Deductions"}</th>
                  <th class="text-left">${ar ? "الصافي" : "Net"}</th>
                  <th class="text-center">${ar ? "الحالة" : "Status"}</th>
                  <th class="text-center">${ar ? "طريقة الصرف" : "Method"}</th>
                  <th class="text-center">${ar ? "المرجع" : "Reference"}</th>
                  <th class="text-center">${ar ? "السند" : "Voucher"}</th>
                </tr>
              </thead>
              <tbody>${rows || `<tr><td colspan="9" class="text-center" style="padding:24px;color:#A0AEC0;">${ar ? "لا توجد بيانات" : "No data"}</td></tr>`}</tbody>
            </table>
            <div class="footer">
              <div class="footer-text">${ar ? "نظام رفقاء القرآن - برنامج إدارة الجمعيات القرآنية" : "Rafiq Al-Quran System - Quranic Society Management"}</div>
            </div>
          </div>
        </div>
        <script>window.onload = function () { window.focus(); setTimeout(function () { window.print(); }, 300); };</script>
      </body>
    </html>
  `);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
};

export default function FinancePayrollTab({ 
  centerId, 
  year: propYear, 
  month: propMonth,
  isAdmin,
  canCreateBatch = isAdmin,
  ar, 
  methodLabels,
  externalShowBatchForm, 
  onExternalBatchFormClose 
}: Props) {
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<PayrollBatchV2 | null>(null);
  const [paymentDraft, setPaymentDraft] = useState<{
    batch: PayrollBatchV2;
    item: PayrollItemV2;
    method: PaymentMethodV2;
    reference: string;
    failureReason: string;
  } | null>(null);
  const [payrollError, setPayrollError] = useState("");
  
  const [batchForm, setBatchForm] = useState({
    year: propYear,
    month: propMonth,
    description: ""
  });

  useEffect(() => {
    if (externalShowBatchForm) {
      setShowBatchForm(true);
    }
  }, [externalShowBatchForm]);

  useEffect(() => {
    setBatchForm({
      year: propYear,
      month: propMonth,
      description: ar ? `رواتب شهر ${propMonth}/${propYear}` : `Payroll for ${propMonth}/${propYear}`
    });
  }, [propYear, propMonth, ar]);

  const brandingQ = useOrgBrandingQuery();
  const batchesQ = useFinanceV2PayrollBatchesQuery(centerId, propYear, propMonth);
  const batches = useMemo(() => batchesQ.data?.rows ?? [], [batchesQ.data?.rows]);
  const pagination = useClientPagination(batches, { initialPageSize: 10 });

  const createBatchM = useCreateFinanceV2PayrollBatchMutation();
  const submitBatchM = useSubmitFinanceV2PayrollBatchMutation();
  const payBatchM = usePayFinanceV2PayrollBatchMutation();
  const failItemM = useFailFinanceV2PayrollItemMutation();
  const selectedBatchSummary = useMemo(() => getPayrollSummary(selectedBatch), [selectedBatch]);

  const closeBatchModal = () => {
    if (createBatchM.isPending) return;
    setShowBatchForm(false);
    setPayrollError("");
    onExternalBatchFormClose?.();
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerId) {
      setPayrollError(ar ? "المركز مطلوب لإنشاء دفعة الرواتب." : "A center is required to create a payroll batch.");
      notifyRequiredFields(ar);
      return;
    }

    try {
      await createBatchM.mutateAsync({
        centerId,
        periodYear: batchForm.year,
        periodMonth: batchForm.month
      });
      notifySuccess(entityFeedback.success(ar, "create", PAYROLL_BATCH_ENTITY));
      closeBatchModal();
    } catch (err) {
      const message = getLocalizedApiErrorMessage(err, {
        ar,
        fallback: ar ? "تعذر إنشاء دفعة الرواتب." : "Unable to create the payroll batch."
      });
      setPayrollError(message);
      notifyError(message);
    }
  };

  const handleOpenPayment = (batch: PayrollBatchV2, item: PayrollItemV2) => {
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
      notifySuccess(ar ? "تم صرف راتب الموظف" : "Employee salary paid");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر صرف راتب الموظف." : "Unable to pay the employee salary."
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
      notifySuccess(ar ? "تم تسجيل فشل الصرف" : "Payment failure recorded");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر تسجيل فشل صرف الراتب." : "Unable to record the payroll payment failure."
      }));
    }
  };

  const handleSubmitBatch = async (batchId: number) => {
    try {
      await submitBatchM.mutateAsync({ batchId });
      notifySuccess(ar ? "تم اعتماد دفعة الرواتب بنجاح" : "Payroll batch approved successfully");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر اعتماد دفعة الرواتب." : "Unable to approve the payroll batch."
      }));
    }
  };

  return (
    <>
      <Modal
        isOpen={Boolean(showBatchForm && canCreateBatch)}
        onClose={closeBatchModal}
        title={ar ? "إنشاء دفعة رواتب" : "Create Payroll Batch"}
        titleIcon={
          <div className="circlemod-head-icon">
            <Calculator className="w-4 h-4" />
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
            <Button type="submit" form="fin-payroll-batch-form" isLoading={createBatchM.isPending}>
              {ar ? "إنشاء الدفعة" : "Create Batch"}
            </Button>
          </div>
        }
      >
        <form id="fin-payroll-batch-form" className="circlemod-form" onSubmit={handleCreateBatch}>
          {/* Section 1: Period */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Calendar size={15} className="circlemod-section-icon" />
              <span>{ar ? "الفترة الزمنية" : "Payroll Period"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="pr-year">{ar ? "السنة" : "Year"}</label>
                <select
                  id="pr-year"
                  className="circlemod-select"
                  value={batchForm.year}
                  onChange={(e) => setBatchForm(p => ({ ...p, year: parseInt(e.target.value) }))}
                >
                  {[propYear - 1, propYear, propYear + 1].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="pr-month">{ar ? "الشهر" : "Month"}</label>
                <select
                  id="pr-month"
                  className="circlemod-select"
                  value={batchForm.month}
                  onChange={(e) => setBatchForm(p => ({ ...p, month: parseInt(e.target.value) }))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Description */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <StickyNote size={15} className="circlemod-section-icon" />
              <span>{ar ? "الوصف" : "Description"}</span>
              <span className="circlemod-section-hint">{ar ? "للعرض فقط" : "Display only"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="pr-desc">{ar ? "وصف الدفعة" : "Batch Description"}</label>
                <input
                  id="pr-desc"
                  className="circlemod-input"
                  value={batchForm.description}
                  onChange={(e) => setBatchForm(p => ({ ...p, description: e.target.value }))}
                  placeholder={ar ? "وصف الدفعة" : "Batch Description"}
                />
              </div>
            </div>
          </div>

          {payrollError ? (
            <div className="circlemod-error" role="alert">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{payrollError}</span>
            </div>
          ) : null}
        </form>
      </Modal>

      {/* Batch Details Modal (The "Inspection" Modal) */}
      <Modal
        isOpen={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        title={ar ? "فحص تفاصيل الرواتب" : "Payroll Inspection"}
        description={ar ? `كشف تفصيلي للدفعة #${selectedBatch?.id} - ${selectedBatch?.periodMonth}/${selectedBatch?.periodYear}` : `Detailed breakdown for batch #${selectedBatch?.id}`}
        size="xl"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            {selectedBatch ? (
              <Button
                variant="secondary"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => printPayrollReport(selectedBatch, ar, methodLabels, brandingQ.data?.logoUrl || undefined, brandingQ.data?.name || undefined)}
              >
                {ar ? "طباعة كشف الرواتب" : "Print payroll report"}
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => setSelectedBatch(null)}>
            {ar ? "إغلاق" : "Close"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-text-tertiary uppercase block mb-1">{ar ? "إجمالي الأساسي" : "Total Base"}</span>
              <FinanceMoney amount={(selectedBatch?.items || []).reduce((acc, i) => acc + i.baseAmount, 0)} baseCurrency="YER" className="text-lg font-black text-text-primary" />
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <span className="text-xs font-bold text-rose-600 uppercase block mb-1">{ar ? "إجمالي الاستقطاعات" : "Total Deductions"}</span>
              <FinanceMoney amount={(selectedBatch?.items || []).reduce((acc, i) => acc + i.deductionAmount, 0)} baseCurrency="YER" className="text-lg font-black text-rose-700" />
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-xs font-bold text-emerald-600 uppercase block mb-1">{ar ? "صافي الصرف" : "Net Payable"}</span>
              <FinanceMoney amount={(selectedBatch?.items || []).reduce((acc, i) => acc + i.netAmount, 0)} baseCurrency="YER" className="text-lg font-black text-emerald-700" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="rounded-lg border border-slate-100 bg-white p-3">
              <span className="block text-[0.68rem] font-bold uppercase text-text-tertiary">{ar ? "إجمالي الرواتب" : "Gross payroll"}</span>
              <FinanceMoney amount={selectedBatchSummary.totalBase + selectedBatchSummary.totalBonus} baseCurrency="YER" className="text-sm font-black text-text-primary" />
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <span className="block text-[0.68rem] font-bold uppercase text-emerald-700">{ar ? "المصروف" : "Paid"}</span>
              <FinanceMoney amount={selectedBatchSummary.paidAmount} baseCurrency="YER" className="text-sm font-black text-emerald-700" />
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
              <span className="block text-[0.68rem] font-bold uppercase text-amber-700">{ar ? "المتبقي" : "Remaining"}</span>
              <FinanceMoney amount={selectedBatchSummary.remainingAmount} baseCurrency="YER" className="text-sm font-black text-amber-700" />
            </div>
            <div className="rounded-lg border border-slate-100 bg-white p-3">
              <span className="block text-[0.68rem] font-bold uppercase text-text-tertiary">{ar ? "تم الصرف / الكل" : "Paid / all"}</span>
              <strong className="text-lg text-text-primary">{selectedBatchSummary.paidCount}/{selectedBatchSummary.totalCount}</strong>
            </div>
            <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
              <span className="block text-[0.68rem] font-bold uppercase text-rose-700">{ar ? "فشل الصرف" : "Failed"}</span>
              <strong className="text-lg text-rose-700">{selectedBatchSummary.failedCount}</strong>
            </div>
          </div>

          <FinanceDataTable<any>
            rows={selectedBatch?.items || []}
                columns={[
                  {
                    header: ar ? "الموظف" : "Employee",
                    render: (item) => (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-text-primary">{item.beneficiary?.fullName}</span>
                          <span className="text-[0.65rem] text-text-tertiary font-medium">{item.beneficiary?.role}</span>
                        </div>
                      </div>
                    )
                  },
                  {
                    header: ar ? "الأساسي" : "Base",
                    render: (item) => <FinanceMoney amount={item.baseAmount} baseCurrency="YER" className="text-sm font-semibold" />
                  },
                  {
                    header: ar ? "إضافي" : "Bonus",
                    render: (item) => (
                      <div className="flex items-center gap-1 text-emerald-600 font-bold">
                        <TrendingUp size={12} />
                        <FinanceMoney amount={item.bonusAmount} baseCurrency="YER" className="text-sm" />
                      </div>
                    )
                  },
                  {
                    header: ar ? "خصومات الحضور" : "Attendance deductions",
                    render: (item) => (
                      <div
                        className="flex flex-col gap-0.5"
                        title={
                          item.deductionEventIds?.length
                            ? ar
                              ? "تم جلب هذا الخصم تلقائيًا من أحداث حضور الموظف المعتمدة."
                              : "This deduction was pulled automatically from approved employee attendance deduction events."
                            : ar
                              ? "لا توجد خصومات حضور مرتبطة."
                              : "No linked attendance deduction events."
                        }
                      >
                        <div className="flex items-center gap-1 text-rose-600 font-bold">
                          <TrendingDown size={12} />
                          <FinanceMoney amount={item.deductionAmount} baseCurrency="YER" className="text-sm" />
                        </div>
                        {item.deductionEventIds?.length ? (
                          <span className="text-[0.65rem] font-semibold text-rose-500">
                            {ar ? "من الحضور" : "From attendance"} · {item.deductionEventIds.length}
                          </span>
                        ) : null}
                      </div>
                    )
                  },
                  {
                    header: ar ? "الصافي" : "Net",
                    render: (item) => <FinanceMoney amount={item.netAmount} baseCurrency="YER" className="text-sm font-black text-brand-600" />
                  },
                  {
                    header: ar ? "الحالة" : "Status",
                    render: (item) => (
                      <div className="flex flex-col gap-1">
                        <FinanceStatusBadge status={item.status} label={getPayrollItemStatusLabel(item.status, ar)} />
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
                    render: (item) => (
                      <span className="text-xs font-bold text-text-secondary">
                        {item.paymentMethod ? methodLabels[item.paymentMethod as PaymentMethodV2] : "-"}
                      </span>
                    )
                  },
                  {
                    header: ar ? "المرجع/الحوالة" : "Reference",
                    render: (item) => (
                      <span className="max-w-[120px] truncate text-xs font-semibold text-text-secondary" title={item.paymentReference ?? undefined}>
                        {item.paymentReference || "-"}
                      </span>
                    )
                  },
                  {
                    header: ar ? "السند" : "Voucher",
                    render: (item) => item.voucherId ? (
                      <button
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
                        onClick={() => { window.location.href = "/finance/vouchers"; }}
                        title={ar ? "عرض السند" : "View voucher"}
                      >
                        <Receipt size={13} />
                        {item.voucher?.voucherNo ?? `#${item.voucherId}`}
                      </button>
                    ) : <span className="text-xs font-semibold text-text-tertiary">-</span>
                  },
                  {
                    header: ar ? "الإجراء" : "Action",
                    render: (item) => (
                      <div className="flex items-center gap-2">
                        {isAdmin && selectedBatch && PAYABLE_BATCH_STATUSES.has(selectedBatch.status) && item.status !== "PAID" ? (
                          <Button
                            size="sm"
                            variant={item.status === "FAILED" ? "secondary" : "primary"}
                            leftIcon={item.status === "FAILED" ? <RefreshCcw className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                            onClick={() => selectedBatch && handleOpenPayment(selectedBatch, item)}
                          >
                            {item.status === "FAILED" ? (ar ? "إعادة محاولة" : "Retry") : (ar ? "صرف" : "Pay")}
                          </Button>
                        ) : null}
                        {item.voucherId ? (
                          <Button size="sm" variant="ghost" onClick={() => { window.location.href = "/finance/vouchers"; }}>
                            {ar ? "عرض السند" : "View voucher"}
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
        title={ar ? "صرف راتب موظف" : "Pay employee salary"}
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
              <span className="text-xs font-bold text-text-tertiary">{ar ? "صافي الصرف" : "Net amount"}</span>
              <FinanceMoney amount={paymentDraft.item.netAmount} baseCurrency="YER" className="block text-lg font-black text-brand-600" />
            </div>
            <label className="circlemod-field">
              <span>{ar ? "طريقة الصرف" : "Payment method"}</span>
              <select
                className="circlemod-select"
                value={paymentDraft.method}
                onChange={(event) => setPaymentDraft((current) => current ? { ...current, method: event.target.value as PaymentMethodV2 } : current)}
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
                placeholder={ar ? "يستخدم فقط عند تسجيل الفشل" : "Used only when marking this payment as failed"}
              />
            </label>
          </div>
        ) : null}
      </Modal>

      {batchesQ.isLoading ? <FinSkeleton rows={5} /> : null}

      {!batchesQ.isLoading && batches.length === 0 ? (
        <EmptyState 
          title={ar ? "لا توجد دفعات رواتب" : "No payroll batches"} 
          description={ar ? "أنشئ كشف رواتب جديد لهذا الشهر للبدء." : "Create a new payroll batch for this month to start."} 
          icon={<Calculator className="w-10 h-10" />} 
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
                    header: ar ? "الفترة" : "Period",
                    render: (b) => <span className="font-semibold">{b.periodMonth}/{b.periodYear}</span>
                  },
                  {
                    header: ar ? "الموظفين" : "Staff",
                    render: (b) => (
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-text-tertiary" />
                        <span className="text-sm font-medium text-text-secondary">{b.items?.length || 0}</span>
                      </div>
                    )
                  },
                  {
                    header: ar ? "الاستقطاعات" : "Deductions",
                    render: (b) => (
                      <FinanceMoney 
                        amount={(b.items || []).reduce((acc: number, item: any) => acc + item.deductionAmount, 0)} 
                        baseCurrency="YER" 
                        className="text-sm font-bold text-rose-600" 
                      />
                    )
                  },
                  {
                    header: ar ? "صافي الصرف" : "Total Net",
                    render: (b) => (
                      <FinanceMoney 
                        amount={(b.items || []).reduce((acc: number, item: any) => acc + item.netAmount, 0)} 
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
                            leftIcon={<Calculator className="w-4 h-4" />}
                            onClick={() => void handleSubmitBatch(b.id)}
                            isLoading={submitBatchM.isPending}
                          >
                            {ar ? "اعتماد" : "Approve"}
                          </Button>
                        )}
                        <button 
                          className="fin-action-btn view" 
                          onClick={() => setSelectedBatch(b)}
                          title={ar ? "فحص التفاصيل" : "Inspect Details"}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="fin-action-btn view" 
                          onClick={() => printPayrollReport(b, ar, methodLabels, brandingQ.data?.logoUrl || undefined, brandingQ.data?.name || undefined)}
                          title={ar ? "طباعة الكشف" : "Print Payroll"}
                        >
                          <Printer size={16} />
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
