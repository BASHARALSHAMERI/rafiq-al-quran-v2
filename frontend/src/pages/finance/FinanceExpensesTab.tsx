import { useMemo, useState, useEffect } from "react";
import { Check, CreditCard, FileText } from "lucide-react";
import { useExpenseInvoicesQuery, useApproveExpenseInvoiceMutation, usePayExpenseInvoiceMutation, useFinanceV2AccountsQuery, useCreateExpenseInvoiceMutation, useSuppliersQuery, useExpenseCategoriesQuery } from "../../features/finance-v2/finance-v2.hooks";
import { FinanceDataTable, FinanceTableFooter } from "../../features/finance-v2/design";
import { Button } from "../../components/ui/Button";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { ErrorState } from "../../components/ui/ErrorState";
import { Modal } from "../../components/ui/Modal";
import { getApiFieldErrors, getLocalizedApiErrorMessage } from "../../shared/api/error";
import {
  notifyError,
  notifyRequiredFields,
  notifySuccess
} from "../../shared/ui/feedback";
import useClientPagination from "../../shared/ui/useClientPagination";

export function FinanceExpensesTab({ ar, canManage = true, searchTerm = "", externalShowForm, onExternalFormClose }: { ar: boolean; canManage?: boolean; searchTerm?: string; externalShowForm?: boolean; onExternalFormClose?: () => void }) {
  const [centerId] = useState<number>();
  const [supplierId] = useState<number>();
  const [status] = useState<string>();

  const invoicesQ = useExpenseInvoicesQuery({ centerId, supplierId, status });
  const invoices = useMemo(() => invoicesQ.data ?? [], [invoicesQ.data]);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredInvoices = useMemo(() => {
    if (!normalizedSearch) return invoices;
    return invoices.filter((invoice: any) =>
      String(invoice.id).includes(normalizedSearch) ||
      invoice.invoiceNo?.toLowerCase().includes(normalizedSearch) ||
      invoice.description?.toLowerCase().includes(normalizedSearch) ||
      invoice.supplier?.name?.toLowerCase().includes(normalizedSearch) ||
      invoice.category?.name?.toLowerCase().includes(normalizedSearch) ||
      invoice.status?.toLowerCase().includes(normalizedSearch)
    );
  }, [invoices, normalizedSearch]);
  const pagination = useClientPagination(filteredInvoices, { initialPageSize: 10, resetKey: normalizedSearch });
  const accountsQ = useFinanceV2AccountsQuery(centerId);
  const approveM = useApproveExpenseInvoiceMutation();
  const payM = usePayExpenseInvoiceMutation();

  const suppliersQ = useSuppliersQuery();
  const categoriesQ = useExpenseCategoriesQuery();
  const createM = useCreateExpenseInvoiceMutation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [approveInvoiceId, setApproveInvoiceId] = useState<number | null>(null);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [payErrors, setPayErrors] = useState<Record<string, string>>({});
  const [createForm, setCreateForm] = useState({
    supplierId: "",
    categoryId: "",
    invoiceNo: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    description: "",
    amount: ""
  });

  useEffect(() => {
    if (externalShowForm) setIsCreateModalOpen(true);
  }, [externalShowForm]);

  const handleCreateClose = () => {
    setIsCreateModalOpen(false);
    onExternalFormClose?.();
  };

  const handleCreate = async () => {
    const categoryId = Number(createForm.categoryId);
    const amount = Number(createForm.amount);
    const errors: Record<string, string> = {};
    if (!categoryId) errors.categoryId = ar ? "التصنيف مطلوب" : "Category is required";
    if (!Number.isFinite(amount) || amount <= 0) errors.amount = ar ? "أدخل مبلغًا صحيحًا" : "Enter a valid amount";
    if (!createForm.invoiceDate) errors.invoiceDate = ar ? "تاريخ الفاتورة مطلوب" : "Invoice date is required";
    if (!createForm.description.trim()) errors.description = ar ? "الوصف مطلوب" : "Description is required";

    if (Object.keys(errors).length) {
      setCreateErrors(errors);
      notifyRequiredFields(ar);
      requestAnimationFrame(() => document.getElementById(`expense-${Object.keys(errors)[0]}`)?.focus());
      return;
    }

    try {
      await createM.mutateAsync({
        supplierId: createForm.supplierId ? Number(createForm.supplierId) : undefined,
        categoryId,
        invoiceNo: createForm.invoiceNo.trim() || undefined,
        invoiceDate: createForm.invoiceDate,
        dueDate: createForm.dueDate || undefined,
        description: createForm.description.trim(),
        amount
      });
      notifySuccess(ar ? "تم إنشاء فاتورة المصروف بنجاح" : "Expense invoice created successfully");
      handleCreateClose();
      setCreateErrors({});
      setCreateForm({ supplierId: "", categoryId: "", invoiceNo: "", invoiceDate: new Date().toISOString().slice(0, 10), dueDate: "", description: "", amount: "" });
    } catch (error) {
      const message = getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر إنشاء فاتورة المصروف." : "Unable to create the expense invoice."
      });
      setCreateErrors(getApiFieldErrors(error));
      notifyError(message);
    }
  };

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payAccountId, setPayAccountId] = useState<number>(0);
  const [payNotes, setPayNotes] = useState("");

  const handleApprove = async (id: number) => {
    try {
      await approveM.mutateAsync(id);
      notifySuccess(ar ? "تم اعتماد المصروف بنجاح" : "Expense approved successfully");
      setApproveInvoiceId(null);
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر اعتماد المصروف." : "Unable to approve the expense."
      }));
    }
  };

  const handlePay = async () => {
    if (!selectedInvoice) return;
    const errors: Record<string, string> = {};
    if (!Number.isFinite(payAmount) || payAmount <= 0) errors.amount = ar ? "أدخل مبلغًا صحيحًا" : "Enter a valid amount";
    if (!payAccountId) errors.financeAccountId = ar ? "حساب الصندوق أو البنك مطلوب" : "Finance account is required";
    if (Object.keys(errors).length) {
      setPayErrors(errors);
      notifyRequiredFields(ar);
      requestAnimationFrame(() => document.getElementById(`expense-pay-${Object.keys(errors)[0]}`)?.focus());
      return;
    }

    try {
      await payM.mutateAsync({
        id: selectedInvoice.id,
        payload: { amount: payAmount, financeAccountId: payAccountId, notes: payNotes }
      });
      notifySuccess(ar ? "تم تسجيل دفع المصروف بنجاح" : "Expense payment recorded successfully");
      setPayErrors({});
      setIsPayModalOpen(false);
    } catch (error) {
      setPayErrors(getApiFieldErrors(error));
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر تسجيل دفع المصروف." : "Unable to record the expense payment."
      }));
    }
  };

  return (
    <div className="fin-premium-panel animate-premium">
      <div className="fin-premium-panel__content p-0">

      {invoicesQ.isError ? (
        <ErrorState
          title={ar ? "تعذر تحميل المصروفات" : "Unable to load expenses"}
          description={getLocalizedApiErrorMessage(invoicesQ.error, {
            ar,
            fallback: ar ? "تعذر تحميل المصروفات. حاول مرة أخرى." : "Unable to load expenses. Please try again."
          })}
          onRetry={() => void invoicesQ.refetch()}
        />
      ) : <FinanceDataTable
        columns={[
          { id: "id", header: "#", render: (row: any) => row.id },
          { id: "date", header: ar ? "التاريخ" : "Date", render: (row: any) => new Date(row.invoiceDate).toLocaleDateString() },
          { id: "supplier", header: ar ? "المورد" : "Supplier", render: (row: any) => row.supplier?.name || "-" },
          { id: "category", header: ar ? "التصنيف" : "Category", render: (row: any) => row.category?.name || "-" },
          { id: "amount", header: ar ? "المبلغ" : "Amount", render: (row: any) => row.amount },
          { id: "status", header: ar ? "الحالة" : "Status", render: (row: any) => <span className={`fin-badge ${row.status.toLowerCase()}`}>{row.status}</span> },
          {
            id: "actions",
            header: ar ? "إجراءات" : "Actions",
            render: (row: any) => (
              <div className="flex gap-2">
                {canManage && (row.status === "DRAFT" || row.status === "PENDING_APPROVAL") && (
                  <Button size="sm" variant="secondary" onClick={() => setApproveInvoiceId(row.id)}>
                    <Check className="w-4 h-4 mr-1" /> {ar ? "اعتماد" : "Approve"}
                  </Button>
                )}
                {canManage && (row.status === "APPROVED" || row.status === "PARTIALLY_PAID") && (
                  <Button size="sm" variant="primary" onClick={() => {
                    setSelectedInvoice(row);
                    setPayAmount(row.amount); // assuming full payment as default
                    setIsPayModalOpen(true);
                  }}>
                    <CreditCard className="w-4 h-4 mr-1" /> {ar ? "دفع" : "Pay"}
                  </Button>
                )}
              </div>
            )
          }
        ]}
        rows={pagination.pagedRows}
        rowKey="id"
        loading={invoicesQ.isLoading}
        density="dense"
        className="fin-premium-table"
        rowClassName={(row: any) => (row.status === "PAID" ? "receipt" : "disbursement")}
      />}
      <FinanceTableFooter
        ar={ar}
        pageSize={pagination.pageSize}
        setPageSize={pagination.setPageSize}
        currentPage={pagination.currentPage}
        setPage={pagination.setCurrentPage}
        totalFilteredCount={pagination.totalItems}
        pages={pagination.totalPages}
      />
    </div>

      {/* Create Expense Invoice Modal */}
      <Modal
        isOpen={Boolean(isCreateModalOpen && canManage)}
        onClose={handleCreateClose}
        title={ar ? "فاتورة مصروف جديدة" : "New Expense Invoice"}
        titleIcon={
          <div className="circlemod-head-icon">
            <FileText className="w-4 h-4" />
          </div>
        }
        size="md"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={handleCreateClose}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button variant="primary" onClick={handleCreate} isLoading={createM.isPending}>{ar ? "حفظ" : "Save"}</Button>
          </div>
        }
      >
        <div className="circlemod-form">
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <FileText size={15} className="circlemod-section-icon" />
              <span>{ar ? "بيانات الفاتورة" : "Invoice Details"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label>{ar ? "التصنيف" : "Category"} *</label>
                <select id="expense-categoryId" className="circlemod-select" aria-invalid={Boolean(createErrors.categoryId)} value={createForm.categoryId} onChange={(e) => {
                  setCreateErrors((current) => ({ ...current, categoryId: "" }));
                  setCreateForm((p) => ({ ...p, categoryId: e.target.value }));
                }}>
                  <option value="">{ar ? "اختر التصنيف..." : "Select category..."}</option>
                  {(categoriesQ.data ?? []).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {createErrors.categoryId ? <span className="input-error-text" role="alert">{createErrors.categoryId}</span> : null}
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "المبلغ" : "Amount"} *</label>
                <input id="expense-amount" type="number" className="circlemod-input" aria-invalid={Boolean(createErrors.amount)} min={1} step="any" value={createForm.amount} onChange={(e) => {
                  setCreateErrors((current) => ({ ...current, amount: "" }));
                  setCreateForm((p) => ({ ...p, amount: e.target.value }));
                }} />
                {createErrors.amount ? <span className="input-error-text" role="alert">{createErrors.amount}</span> : null}
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label>{ar ? "المورد" : "Supplier"}</label>
                <select className="circlemod-select" value={createForm.supplierId} onChange={(e) => setCreateForm((p) => ({ ...p, supplierId: e.target.value }))}>
                  <option value="">{ar ? "بدون مورد" : "No supplier"}</option>
                  {(suppliersQ.data ?? []).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "رقم الفاتورة" : "Invoice No"}</label>
                <input type="text" className="circlemod-input" value={createForm.invoiceNo} onChange={(e) => setCreateForm((p) => ({ ...p, invoiceNo: e.target.value }))} placeholder={ar ? "اختياري" : "Optional"} />
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "تاريخ الفاتورة" : "Invoice Date"} *</label>
                <input id="expense-invoiceDate" type="date" className="circlemod-input" aria-invalid={Boolean(createErrors.invoiceDate)} value={createForm.invoiceDate} onChange={(e) => {
                  setCreateErrors((current) => ({ ...current, invoiceDate: "" }));
                  setCreateForm((p) => ({ ...p, invoiceDate: e.target.value }));
                }} required />
                {createErrors.invoiceDate ? <span className="input-error-text" role="alert">{createErrors.invoiceDate}</span> : null}
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "تاريخ الاستحقاق" : "Due Date"}</label>
                <input type="date" className="circlemod-input" value={createForm.dueDate} onChange={(e) => setCreateForm((p) => ({ ...p, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label>{ar ? "الوصف" : "Description"} *</label>
                <textarea id="expense-description" className="circlemod-input" aria-invalid={Boolean(createErrors.description)} value={createForm.description} onChange={(e) => {
                  setCreateErrors((current) => ({ ...current, description: "" }));
                  setCreateForm((p) => ({ ...p, description: e.target.value }));
                }} placeholder={ar ? "وصف الفاتورة..." : "Invoice description..."} />
                {createErrors.description ? <span className="input-error-text" role="alert">{createErrors.description}</span> : null}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={Boolean(isPayModalOpen && canManage)}
        onClose={() => setIsPayModalOpen(false)} 
        title={ar ? "دفع المصروف" : "Pay Expense"}
        titleIcon={
          <div className="circlemod-head-icon">
            <CreditCard className="w-4 h-4" />
          </div>
        }
        size="md"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={() => setIsPayModalOpen(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button variant="primary" onClick={handlePay} isLoading={payM.isPending}>{ar ? "تأكيد الدفع" : "Confirm Payment"}</Button>
          </div>
        }
      >
        <div className="circlemod-form">
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <CreditCard size={15} className="circlemod-section-icon" />
              <span>{ar ? "بيانات الدفع" : "Payment Details"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "المبلغ" : "Amount"}</label>
                <input id="expense-pay-amount" type="number" className="circlemod-input" aria-invalid={Boolean(payErrors.amount)} value={payAmount} onChange={(e) => {
                  setPayErrors((current) => ({ ...current, amount: "" }));
                  setPayAmount(Number(e.target.value));
                }} />
                {payErrors.amount ? <span className="input-error-text" role="alert">{payErrors.amount}</span> : null}
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "حساب الصندوق/البنك" : "Finance Account"}</label>
                <select id="expense-pay-financeAccountId" className="circlemod-input" aria-invalid={Boolean(payErrors.financeAccountId)} value={payAccountId} onChange={(e) => {
                  setPayErrors((current) => ({ ...current, financeAccountId: "" }));
                  setPayAccountId(Number(e.target.value));
                }}>
                  <option value={0}>{ar ? "اختر الحساب..." : "Select Account..."}</option>
                  {accountsQ.data?.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountingAccount?.name || `Account ${acc.id}`} - {acc.accountType} ({acc.currencyCode}) - {acc.currentBalance}
                    </option>
                  ))}
                </select>
                {payErrors.financeAccountId ? <span className="input-error-text" role="alert">{payErrors.financeAccountId}</span> : null}
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label>{ar ? "ملاحظات" : "Notes"}</label>
                <textarea className="circlemod-input" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </Modal>
      <ConfirmModal
        isOpen={approveInvoiceId !== null}
        onClose={() => setApproveInvoiceId(null)}
        onConfirm={() => approveInvoiceId !== null ? handleApprove(approveInvoiceId) : undefined}
        title={ar ? "اعتماد المصروف" : "Approve expense"}
        message={ar ? "سيتم اعتماد المصروف وإتاحته للدفع. هل تريد المتابعة؟" : "The expense will be approved and made available for payment. Continue?"}
        confirmLabel={ar ? "اعتماد" : "Approve"}
        confirmVariant="primary"
        isConfirming={approveM.isPending}
      />
    </div>
  );
}
