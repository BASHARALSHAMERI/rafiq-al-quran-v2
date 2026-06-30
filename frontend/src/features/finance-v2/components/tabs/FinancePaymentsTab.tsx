import { useEffect, useMemo, useState, useCallback } from "react";
import { 
  Plus, 
  Receipt, 
  History,
  Printer,
  AlertCircle,
  CreditCard,
  DollarSign,
  Hash,
  Calendar,
  StickyNote
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  useCreateFinanceV2PaymentMutation, 
  useFinanceV2InvoicesQuery, 
  useFinanceV2InvoicePaymentsQuery 
} from "../../finance-v2.hooks";
import { 
  FinSkeleton, 
  shortDate, 
  methodLabels,
  voucherStatusLabels,
  FinancePaginationFooter
} from "../FinanceShared";
import { 
  FinanceMoney, 
  FinanceStatusBadge 
} from "../../design";
import Modal from "../../../../components/ui/Modal";
import { FinanceDataTable } from "../../design/FinanceDataTable";
import useClientPagination from "../../../../shared/ui/useClientPagination";
import { notifySuccess, notifyError, entityFeedback } from "../../../../shared/ui/feedback";
import { getLocalizedApiErrorMessage } from "../../../../shared/api/error";
import type { PaymentMethodV2, FinanceInvoiceV2, FinancePaymentV2 } from "../../types";
import { Button } from "../../../../components/ui/Button";
import { printFinanceReport, formatYemeniCurrency } from "../../../accounting/printAccounting";

type Props = {
  centerId: number | undefined;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  ar: boolean;
  initialInvoiceId?: number | null;
  externalShowPaymentForm?: boolean;
  onExternalPaymentFormClose?: () => void;
};

const PAYMENT_ENTITY = { ar: "الدفعة", en: "payment" };

export default function FinancePaymentsTab({ 
  centerId, 
  isAdmin,
  ar,
  initialInvoiceId,
  externalShowPaymentForm,
  onExternalPaymentFormClose
}: Props) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [historyInvoiceId, setHistoryInvoiceId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: "",
    amount: "",
    method: "CASH" as PaymentMethodV2,
    manualReferenceNo: "",
    receivedAt: new Date().toISOString().split('T')[0],
    notes: ""
  });

  useEffect(() => {
    if (externalShowPaymentForm) {
      setShowPaymentForm(true);
    }
  }, [externalShowPaymentForm]);

  useEffect(() => {
    if (initialInvoiceId != null) {
      setPaymentForm(p => ({ ...p, invoiceId: String(initialInvoiceId) }));
    }
  }, [initialInvoiceId]);

  const invoicesQ = useFinanceV2InvoicesQuery({
    centerId,
    page: 1,
    pageSize: 100
  });
  const invoices = useMemo(() => invoicesQ.data?.rows ?? [], [invoicesQ.data?.rows]);

  const paymentsQ = useFinanceV2InvoicePaymentsQuery(
    historyInvoiceId ? parseInt(historyInvoiceId) : null,
    Boolean(historyInvoiceId)
  );
  const payments = useMemo(() => paymentsQ.data ?? [], [paymentsQ.data]);

  const invoicesPagination = useClientPagination(invoices, { initialPageSize: 10 });
  const paymentsPagination = useClientPagination(payments, { initialPageSize: 10 });

  const createPaymentM = useCreateFinanceV2PaymentMutation();

  const closePaymentModal = () => {
    if (createPaymentM.isPending) return;
    setShowPaymentForm(false);
    setPaymentError("");
    onExternalPaymentFormClose?.();
  };

  const handlePrintPayment = useCallback((p: FinancePaymentV2) => {
    printFinanceReport({
      title: ar ? "إيصال دفع" : "Payment Receipt",
      subtitle: ar ? `رقم: #${p.id}` : `Receipt #${p.id}`,
      rows: [p],
      columns: [
        { label: ar ? "الفاتورة" : "Invoice", render: (r) => `#${r.invoiceId}` },
        { label: ar ? "المبلغ" : "Amount", render: (r) => formatYemeniCurrency(r.amount) },
        { label: ar ? "الوسيلة" : "Method", render: (r) => methodLabels[r.method as PaymentMethodV2] || r.method },
        { label: ar ? "التاريخ" : "Date", render: (r) => shortDate(r.receivedAt, ar) },
        { label: ar ? "سند القبض" : "Voucher", render: (r) => r.voucher?.voucherNo || "-" },
      ],
      kpis: [
        { label: ar ? "المبلغ" : "Amount", value: formatYemeniCurrency(p.amount) },
      ],
      ar,
      orientation: "portrait",
    });
  }, [ar]);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    try {
      const invId = parseInt(paymentForm.invoiceId);
      const amt = parseFloat(paymentForm.amount);
      
      if (isNaN(invId)) throw new Error(ar ? "يجب اختيار فاتورة" : "Invoice is required");
      if (isNaN(amt) || amt <= 0) throw new Error(ar ? "مبلغ غير صحيح" : "Invalid amount");

      const selectedInv = invoices.find(inv => inv.id === invId);
      if (selectedInv && amt > selectedInv.remainingAmount) {
        throw new Error(ar ? `المبلغ المدفوع (${amt}) أكبر من المتبقي للفاتورة (${selectedInv.remainingAmount})` : `Amount paid (${amt}) exceeds remaining (${selectedInv.remainingAmount})`);
      }

      await createPaymentM.mutateAsync({
        invoiceId: invId,
        amount: amt,
        method: paymentForm.method,
        manualReferenceNo: paymentForm.manualReferenceNo.trim() || undefined,
        receivedAt: paymentForm.receivedAt,
        notes: paymentForm.notes.trim() || undefined
      });

      notifySuccess(entityFeedback.success(ar, "record", PAYMENT_ENTITY));
      setPaymentForm(p => ({ ...p, amount: "", manualReferenceNo: "", notes: "" }));
      closePaymentModal();
    } catch (err) {
      const msg = getLocalizedApiErrorMessage(err, { ar, fallback: "Error" });
      setPaymentError(msg);
      notifyError(msg);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-premium mt-4">
      <Modal
        isOpen={Boolean(showPaymentForm && isAdmin)}
        onClose={closePaymentModal}
        title={ar ? "تسجيل دفعة جديدة" : "Record New Payment"}
        titleIcon={
          <div className="circlemod-head-icon">
            <CreditCard className="w-4 h-4" />
          </div>
        }
        size="lg"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={closePaymentModal} disabled={createPaymentM.isPending}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" form="finance-payment-form" isLoading={createPaymentM.isPending}>
              {ar ? "حفظ الدفعة" : "Save Payment"}
            </Button>
          </div>
        }
      >
        <form id="finance-payment-form" className="circlemod-form" onSubmit={handleCreatePayment}>
          {/* Section 1: Invoice Selection */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Receipt size={15} className="circlemod-section-icon" />
              <span>{ar ? "اختيار الفاتورة" : "Invoice Selection"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="pay-invoice">{ar ? "الفاتورة *" : "Invoice *"}</label>
                <select
                  id="pay-invoice"
                  className="circlemod-select"
                  value={paymentForm.invoiceId}
                  onChange={(e) => {
                    const invId = e.target.value;
                    const selectedInv = invoices.find((inv) => inv.id.toString() === invId);
                    setPaymentForm(p => ({ 
                      ...p, 
                      invoiceId: invId,
                      amount: selectedInv ? selectedInv.remainingAmount.toFixed(2) : ""
                    }));
                  }}
                  required
                >
                  <option value="">{ar ? "اختر الفاتورة..." : "Select invoice..."}</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      #{inv.id} - {inv.student?.fullName} ({inv.month}/{inv.year}) - {inv.remainingAmount} YER
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Payment Details */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <DollarSign size={15} className="circlemod-section-icon" />
              <span>{ar ? "تفاصيل الدفعة" : "Payment Details"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="pay-amount">{ar ? "المبلغ المدفوع *" : "Amount Paid *"}</label>
                <input
                  id="pay-amount"
                  className="circlemod-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder={ar ? "المبلغ" : "Amount"}
                  required
                />
              </div>
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="pay-manual-ref">
                  <Hash size={12} className="inline-block ml-1 opacity-60" />
                  {ar ? "رقم مرجعي إضافي (اختياري)" : "Manual Ref (Optional)"}
                </label>
                <input
                  id="pay-manual-ref"
                  className="circlemod-input"
                  value={paymentForm.manualReferenceNo}
                  onChange={(e) => setPaymentForm(p => ({ ...p, manualReferenceNo: e.target.value }))}
                  placeholder={ar ? "أدخل رقم مرجعي إن وجد" : "Ex: TR-100"}
                />
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="pay-method">{ar ? "وسيلة الدفع *" : "Payment Method *"}</label>
                <select
                  id="pay-method"
                  className="circlemod-select"
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm(p => ({ ...p, method: e.target.value as PaymentMethodV2 }))}
                  required
                >
                  <option value="CASH">{ar ? "نقداً" : "Cash"}</option>
                  <option value="TRANSFER">{ar ? "حوالة بنكية" : "Bank Transfer"}</option>
                </select>
                <p className="text-[10px] text-text-tertiary mt-1">
                  {paymentForm.method === "CASH" ? (ar ? "سيتم إنشاء سند قبض نقدي تلقائياً." : "A cash receipt voucher will be generated automatically.") : (ar ? "حوالة بنكية تتطلب مراجعة من المشرف المالي." : "Bank transfers require financial supervisor review.")}
                </p>
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label htmlFor="pay-date">
                  <Calendar size={12} className="inline-block ml-1 opacity-60" />
                  {ar ? "تاريخ الاستلام *" : "Received At *"}
                </label>
                <input
                  id="pay-date"
                  className="circlemod-input"
                  type="date"
                  value={paymentForm.receivedAt}
                  onChange={(e) => setPaymentForm(p => ({ ...p, receivedAt: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Notes */}
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <StickyNote size={15} className="circlemod-section-icon" />
              <span>{ar ? "ملاحظات" : "Notes"}</span>
              <span className="circlemod-section-hint">{ar ? "اختياري" : "Optional"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label htmlFor="pay-notes">{ar ? "ملاحظات إضافية" : "Additional Notes"}</label>
                <input
                  id="pay-notes"
                  className="circlemod-input"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder={ar ? "ملاحظات اختيارية" : "Optional notes"}
                />
              </div>
            </div>
          </div>

          {paymentError ? (
            <div className="circlemod-error" role="alert">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{paymentError}</span>
            </div>
          ) : null}
        </form>
      </Modal>

      {invoicesQ.isLoading ? <FinSkeleton rows={5} /> : (
        <div className="animate-premium">
          <FinanceDataTable<FinanceInvoiceV2>
            rows={invoicesPagination.pagedRows}
                columns={[
                  {
                    header: ar ? "الفاتورة / الطالب" : "Invoice / Student",
                    render: (inv) => (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                          <Receipt size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-text-primary">{inv.student?.fullName}</span>
                          <span className="text-[0.7rem] text-text-tertiary uppercase tracking-wider">#{inv.id} · {inv.month}/{inv.year}</span>
                        </div>
                      </div>
                    )
                  },
                  {
                    header: ar ? "المبلغ" : "Amount",
                    render: (inv) => <FinanceMoney amount={inv.amount} baseCurrency="YER" className="font-semibold" />
                  },
                  {
                    header: ar ? "المسدد" : "Paid",
                    render: (inv) => <FinanceMoney amount={inv.totalPaid} baseCurrency="YER" className="text-emerald-600 font-bold" />
                  },
                  {
                    header: ar ? "المتبقي" : "Remaining",
                    render: (inv) => <FinanceMoney amount={inv.remainingAmount} baseCurrency="YER" className="text-rose-600 font-bold" />
                  },
                  {
                    header: ar ? "الحالة" : "Status",
                    render: (inv) => <FinanceStatusBadge status={inv.status} label={ar ? (inv.status === 'PAID' ? 'تم السداد' : 'مستحقة') : inv.status} />
                  },
                  {
                    header: ar ? "الإجراءات" : "Actions",
                    render: (inv) => (
                      <div className="flex items-center gap-2">
                        {/* The collect payment button was moved to the top bar */}
                        <button className="fin-action-btn view group" onClick={() => setHistoryInvoiceId(inv.id.toString())}>
                          <History size={16} />
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
                pageSize={invoicesPagination.pageSize}
                setPageSize={invoicesPagination.setPageSize}
                currentPage={invoicesPagination.currentPage}
                setPage={invoicesPagination.setCurrentPage}
                totalFilteredCount={invoicesPagination.totalItems}
                pages={invoicesPagination.totalPages}
              />
              <Modal
                isOpen={Boolean(historyInvoiceId)}
                onClose={() => setHistoryInvoiceId(null)}
                title={ar ? `تاريخ الدفعات للفاتورة #${historyInvoiceId}` : `Payment History for Invoice #${historyInvoiceId}`}
                titleIcon={
                  <div className="circlemod-head-icon">
                    <History className="w-4 h-4" />
                  </div>
                }
                size="xl"
                footer={
                  <div className="flex justify-end gap-2 w-full">
                    <Button variant="secondary" onClick={() => setHistoryInvoiceId(null)}>
                      {ar ? "إغلاق" : "Close"}
                    </Button>
                  </div>
                }
              >
                <div className="bg-white dark:bg-[#1a1f2e] border border-border-light rounded-2xl shadow-sm overflow-hidden mt-2">
                  <FinanceDataTable<any>
                    rows={paymentsPagination.pagedRows}
                    loading={paymentsQ.isLoading}
                    columns={[
                      {
                        header: ar ? "رقم الدفعة" : "Payment ID",
                        render: (p) => <span className="font-bold text-brand-600">#{p.id}</span>
                      },
                      {
                        header: ar ? "المبلغ" : "Amount",
                        render: (p) => <FinanceMoney amount={p.amount} baseCurrency="YER" className="font-extrabold" />
                      },
                      {
                        header: ar ? "التاريخ" : "Date",
                        render: (p) => <span className="text-sm text-text-secondary">{shortDate(p.receivedAt, ar)}</span>
                      },
                      {
                        header: ar ? "الوسيلة" : "Method",
                        render: (p) => (
                          <span className={`fin-status-pill ${p.method === 'CASH' ? 'fin-status--info' : 'fin-status--success'}`}>
                            {methodLabels[p.method as PaymentMethodV2] || p.method}
                          </span>
                        )
                      },
                      {
                        header: ar ? "سند القبض" : "Voucher",
                        render: (p) => (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">#{p.voucher?.voucherNo || "-"}</span>
                            {p.voucher && <FinanceStatusBadge status={p.voucher.status} label={voucherStatusLabels[p.voucher.status as string] || p.voucher.status} />}
                          </div>
                        )
                      },
                      {
                        header: ar ? "الإجراءات" : "Actions",
                        render: (p) => (
                          <div className="flex items-center gap-2">
                            <button
                              className="fin-action-btn view"
                              title={ar ? "طباعة الإيصال" : "Print Receipt"}
                              onClick={() => handlePrintPayment(p as FinancePaymentV2)}
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
                  <div className="p-4 border-t border-border-light">
                    <FinancePaginationFooter
                      ar={ar}
                      pageSize={paymentsPagination.pageSize}
                      setPageSize={paymentsPagination.setPageSize}
                      currentPage={paymentsPagination.currentPage}
                      setPage={paymentsPagination.setCurrentPage}
                      totalFilteredCount={paymentsPagination.totalItems}
                      pages={paymentsPagination.totalPages}
                    />
                  </div>
                </div>
              </Modal>
        </div>
      )}
    </div>
  );
}
