import { useEffect, useMemo, useState } from "react";
import { Calculator, Printer, Users, Eye, TrendingDown, TrendingUp, User, Calendar, CreditCard, Receipt, RefreshCcw } from "lucide-react";
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
import { useDeductionEvents } from "../../../staff-attendance/staff-attendance.api";
import { useAccountingJournalEntriesQuery } from "../../../../pages/accounting/accounting.hooks";
import { useFinanceV2VouchersQuery } from "../../finance-v2.hooks";

type Props = {
  centerId: number | undefined;
  year: number;
  month: number;
  status?: string;
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

const getTriggerLabel = (trigger: string, ar: boolean) => {
  switch (trigger) {
    case "UNEXCUSED_ABSENCE":
      return ar ? "غياب غير مبرر" : "Unexcused Absence";
    case "LATE_THRESHOLD":
      return ar ? "تجاوز حد التأخير" : "Late Threshold";
    case "EARLY_DEPARTURE":
      return ar ? "انصراف مبكر" : "Early Departure";
    case "UNPAID_LEAVE":
      return ar ? "إجازة غير مدفوعة" : "Unpaid Leave";
    case "MISSED_VISIT":
      return ar ? "زيارة فائتة" : "Missed Visit";
    default:
      return trigger;
  }
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
  status,
  isAdmin,
  isSuperAdmin,
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
  
  const [batchForm, setBatchForm] = useState({
    year: propYear,
    month: propMonth
  });

  const [selectedDeductionItem, setSelectedDeductionItem] = useState<PayrollItemV2 | null>(null);
  const [selectedVoucherItem, setSelectedVoucherItem] = useState<PayrollItemV2 | null>(null);

  const deductionsQuery = useDeductionEvents(
    selectedDeductionItem && selectedBatch
      ? {
          month: selectedBatch.periodMonth,
          year: selectedBatch.periodYear,
          centerId: selectedBatch.centerId ?? undefined
        }
      : undefined
  );

  const employeeDeductionEvents = useMemo(() => {
    if (!selectedDeductionItem || !deductionsQuery.data?.records) return [];
    return deductionsQuery.data.records.filter(
      (ev) => ev.userId === selectedDeductionItem.beneficiaryUserId
    );
  }, [selectedDeductionItem, deductionsQuery.data]);

  const vouchersQ = useFinanceV2VouchersQuery(selectedBatch?.centerId ?? undefined);
  const journalEntriesQ = useAccountingJournalEntriesQuery();

  const selectedVoucher = useMemo(() => {
    if (!selectedVoucherItem || !vouchersQ.data) return null;
    return vouchersQ.data.rows.find((v: any) => v.id === selectedVoucherItem.voucherId);
  }, [selectedVoucherItem, vouchersQ.data]);

  const selectedJournalEntry = useMemo(() => {
    if (!selectedVoucherItem || !journalEntriesQ.data) return null;
    return journalEntriesQ.data.find(
      (entry) =>
        entry.sourceType === "VOUCHER" && entry.sourceId === selectedVoucherItem.voucherId
    );
  }, [selectedVoucherItem, journalEntriesQ.data]);

  useEffect(() => {
    if (externalShowBatchForm) {
      setShowBatchForm(true);
    }
  }, [externalShowBatchForm]);

  useEffect(() => {
    setBatchForm({ year: propYear, month: propMonth });
  }, [propYear, propMonth]);

  const brandingQ = useOrgBrandingQuery();
  const batchesQ = useFinanceV2PayrollBatchesQuery(centerId, propYear, propMonth);
  const batches = useMemo(
    () => (batchesQ.data?.rows ?? []).filter((batch) => !status || batch.status === status),
    [batchesQ.data?.rows, status]
  );
  const pagination = useClientPagination(batches, { initialPageSize: 10 });

  const createBatchM = useCreateFinanceV2PayrollBatchMutation();
  const submitBatchM = useSubmitFinanceV2PayrollBatchMutation();
  const payBatchM = usePayFinanceV2PayrollBatchMutation();
  const failItemM = useFailFinanceV2PayrollItemMutation();
  const selectedBatchSummary = useMemo(() => getPayrollSummary(selectedBatch), [selectedBatch]);

  const closeBatchModal = () => {
    if (createBatchM.isPending) return;
    setShowBatchForm(false);
    onExternalBatchFormClose?.();
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerId && !isSuperAdmin) {
      notifyError(ar ? "المركز مطلوب لإنشاء دفعة الرواتب." : "A center is required to create a payroll batch.");
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
      notifySuccess(ar ? "تم إرسال دفعة الرواتب للاعتماد" : "Payroll batch submitted for approval");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر إرسال دفعة الرواتب للاعتماد." : "Unable to submit the payroll batch for approval."
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
            </div>
          </div>

        </form>
      </Modal>

      {/* Batch Details Modal (The "Inspection" Modal) */}
      <Modal
        isOpen={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        title={ar ? "فحص تفاصيل الرواتب" : "Payroll Inspection"}
        description={ar ? `كشف تفصيلي للدفعة #${selectedBatch?.id} - ${selectedBatch?.periodMonth}/${selectedBatch?.periodYear}` : `Detailed breakdown for batch #${selectedBatch?.id}`}
        size="lg"
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
                          <button
                            type="button"
                            onClick={() => setSelectedDeductionItem(item)}
                            className="text-[0.65rem] font-bold text-rose-500 hover:underline hover:text-rose-700 text-start flex items-center gap-0.5"
                          >
                            <span>{ar ? "تفاصيل الخصم" : "Deduction details"} ({item.deductionEventIds.length})</span>
                          </button>
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
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline hover:text-brand-800"
                        onClick={() => setSelectedVoucherItem(item)}
                        title={ar ? "عرض السند والقيود" : "View voucher & journal"}
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
                          <Button size="sm" variant="ghost" onClick={() => setSelectedVoucherItem(item)}>
                            {ar ? "عرض السند والقيود" : "View voucher & journal"}
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
                            {ar ? "إرسال للاعتماد" : "Submit for approval"}
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

      {/* 1. Deduction Events Modal */}
      <Modal
        isOpen={Boolean(selectedDeductionItem)}
        onClose={() => setSelectedDeductionItem(null)}
        title={
          ar
            ? `خصومات حضور الموظف: ${selectedDeductionItem?.beneficiary?.fullName || ""}`
            : `Attendance Deductions for: ${selectedDeductionItem?.beneficiary?.fullName || ""}`
        }
        titleIcon={
          <div className="circlemod-head-icon bg-rose-50 text-rose-600">
            <TrendingDown className="w-4 h-4" />
          </div>
        }
        size="lg"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
      >
        <div className="p-4" dir={ar ? "rtl" : "ltr"}>
          {deductionsQuery.isLoading ? (
            <div className="py-12 text-center text-slate-500 font-semibold animate-pulse">
              {ar ? "جاري تحميل تفاصيل الخصومات..." : "Loading deduction details..."}
            </div>
          ) : employeeDeductionEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-semibold">
              {ar ? "لا توجد خصومات حضور معتمدة مسجلة لهذا الشهر." : "No approved attendance deductions recorded for this month."}
            </div>
          ) : (
            <div className="overflow-hidden border border-slate-100 rounded-xl">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-4 py-3 text-start font-bold text-slate-700">{ar ? "نوع المخالفة" : "Violation Type"}</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-700">{ar ? "التكرار" : "Occurrences"}</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-700">{ar ? "مبلغ الخصم" : "Deduction Amount"}</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-700">{ar ? "الحالة" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {employeeDeductionEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {getTriggerLabel(ev.triggerType, ar)}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-slate-600">
                        {ev.occurrences} {ar ? "مرات" : "times"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-rose-600">
                        <FinanceMoney amount={ev.amount} baseCurrency="YER" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          ev.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : ev.status === "WAIVED"
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                          {ev.status === "APPROVED" ? (ar ? "معتمد" : "Approved") : ev.status === "WAIVED" ? (ar ? "معفى" : "Waived") : ev.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-rose-50/30 px-4 py-3 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-rose-800">
                <span>{ar ? "إجمالي خصومات الحضور المستقطعة:" : "Total Deductions Deducted:"}</span>
                <span className="text-sm font-black text-rose-600">
                  <FinanceMoney amount={selectedDeductionItem?.deductionAmount ?? 0} baseCurrency="YER" />
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 2. Voucher & Journal Entries Modal */}
      <Modal
        isOpen={Boolean(selectedVoucherItem)}
        onClose={() => setSelectedVoucherItem(null)}
        title={
          ar
            ? `عرض السند المحاسبي والقيود اليومية`
            : `Accounting Voucher & Journal Double-Entry`
        }
        titleIcon={
          <div className="circlemod-head-icon bg-emerald-50 text-emerald-600">
            <Receipt className="w-4 h-4" />
          </div>
        }
        size="xl"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
      >
        <div className="p-5" dir={ar ? "rtl" : "ltr"}>
          {vouchersQ.isLoading || journalEntriesQ.isLoading ? (
            <div className="py-16 text-center text-slate-500 font-semibold flex flex-col items-center gap-3 animate-pulse">
              <RefreshCcw className="w-6 h-6 animate-spin text-brand-500" />
              <span>{ar ? "جاري تحميل تفاصيل السند والقيود المحاسبية..." : "Loading voucher and accounting details..."}</span>
            </div>
          ) : !selectedVoucher ? (
            <div className="py-12 text-center text-slate-500 font-semibold">
              {ar ? "تعذر تحميل تفاصيل هذا السند. يرجى التحقق من لوحة السندات." : "Could not load voucher details. Please check the vouchers dashboard."}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Voucher Core details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">{ar ? "بيانات السند المحاسبي" : "Voucher Specifications"}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{ar ? "رقم السند:" : "Voucher No:"}</span>
                      <span className="font-bold text-slate-900">{selectedVoucher.voucherNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{ar ? "تاريخ السند:" : "Voucher Date:"}</span>
                      <span className="font-semibold text-slate-800">{selectedVoucher.voucherDate ? new Date(selectedVoucher.voucherDate as string).toLocaleDateString(ar ? "ar-SA-u-nu-latn" : "en-US") : ""}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{ar ? "الحساب / الصندوق:" : "Debit Account / Fund:"}</span>
                      <span className="font-semibold text-slate-800">
                        {(selectedVoucher as any).account?.name || (ar ? "الصندوق الرئيسي" : "Main Fund")} ({(selectedVoucher as any).account?.accountingAccount?.code})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{ar ? "المصدر:" : "Source:"}</span>
                      <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                        {selectedVoucher.sourceType === "PAYROLL" ? (ar ? "مسير الرواتب" : "Payroll Batch") : selectedVoucher.sourceType} #{selectedVoucher.sourceId}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">{ar ? "الدفعة والصرف" : "Payment Information"}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{ar ? "المبلغ المصروف:" : "Amount Disbursed:"}</span>
                      <span className="font-black text-brand-600 text-base"><FinanceMoney amount={selectedVoucher.amount} baseCurrency="YER" /></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{ar ? "طريقة الصرف:" : "Payment Method:"}</span>
                      <span className="font-semibold text-slate-800">{selectedVoucher.paymentMethod ? methodLabels[selectedVoucher.paymentMethod as PaymentMethodV2] : "-"}</span>
                    </div>
                    {selectedVoucher.externalTransferRef && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">{ar ? "رقم الحوالة/المرجع:" : "Transfer Reference:"}</span>
                        <span className="font-mono text-slate-800 text-xs">{selectedVoucher.externalTransferRef}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">{ar ? "حالة السند:" : "Voucher Status:"}</span>
                      <FinanceStatusBadge status={selectedVoucher.status} label={voucherStatusLabels[selectedVoucher.status as string] || selectedVoucher.status} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Journal Entry Double Entry Table */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{ar ? "قيود اليومية المزدوجة المتولدة (القيد المحاسبي)" : "Double-Entry Journal Movements"}</h4>
                  {selectedJournalEntry && (
                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      {ar ? "ترحيل آلي" : "Auto-Posted"} · {selectedJournalEntry.entryNo}
                    </span>
                  )}
                </div>

                {selectedJournalEntry ? (
                  <div className="overflow-hidden border border-slate-100 rounded-xl">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th className="px-4 py-3 text-start font-bold text-slate-700">{ar ? "رمز واسم الحساب المحاسبي" : "Account Code & Name"}</th>
                          <th className="px-4 py-3 text-center font-bold text-slate-700 w-32">{ar ? "مدين (Debit)" : "Debit (Dr)"}</th>
                          <th className="px-4 py-3 text-center font-bold text-slate-700 w-32">{ar ? "دائن (Credit)" : "Credit (Cr)"}</th>
                          <th className="px-4 py-3 text-start font-bold text-slate-700">{ar ? "البيان / شرح القيد" : "Memo / Description"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedJournalEntry.lines.map((line) => (
                          <tr key={line.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              <span className="text-brand-600 font-mono text-xs block mb-0.5">{line.account?.code}</span>
                              <span className="text-xs">{line.account?.name}</span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/10">
                              {Number(line.debit) > 0 ? <FinanceMoney amount={Number(line.debit)} baseCurrency="YER" /> : "-"}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-rose-600 bg-rose-50/10">
                              {Number(line.credit) > 0 ? <FinanceMoney amount={Number(line.credit)} baseCurrency="YER" /> : "-"}
                            </td>
                            <td className="px-4 py-3 text-start text-xs text-slate-600">
                              {line.memo || selectedJournalEntry.description || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50/50 font-bold border-t border-slate-100">
                        <tr>
                          <td className="px-4 py-3 text-start text-slate-700 font-bold">{ar ? "الإجمالي" : "Total"}</td>
                          <td className="px-4 py-3 text-center text-emerald-600 font-black text-sm bg-emerald-50/20">
                            <FinanceMoney 
                              amount={selectedJournalEntry.lines.reduce((sum, l) => sum + Number(l.debit || 0), 0)} 
                              baseCurrency="YER" 
                            />
                          </td>
                          <td className="px-4 py-3 text-center text-rose-600 font-black text-sm bg-rose-50/20">
                            <FinanceMoney 
                              amount={selectedJournalEntry.lines.reduce((sum, l) => sum + Number(l.credit || 0), 0)} 
                              baseCurrency="YER" 
                            />
                          </td>
                          <td className="px-4 py-3 text-start text-slate-500 font-normal text-xs">{ar ? "القيد متوازن ومتطابق ✅" : "Journal is Balanced ✅"}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-500 font-semibold bg-slate-50/30">
                    <Receipt className="mx-auto mb-2 text-amber-500 w-6 h-6" />
                    <span>
                      {ar
                        ? "السند الحالي لم يُرحَّل للحسابات بعد. يتم توليد القيود المزدوجة تلقائياً فور اعتماد ترحيل السند."
                        : "Voucher has not been posted to Ledger yet. Double-entry is recorded automatically upon posting."}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
