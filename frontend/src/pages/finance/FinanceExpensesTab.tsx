import { useState, useEffect } from "react";
import { Check, CreditCard, FileText } from "lucide-react";
import { useExpenseInvoicesQuery, useApproveExpenseInvoiceMutation, usePayExpenseInvoiceMutation, useFinanceV2AccountsQuery, useCreateExpenseInvoiceMutation, useSuppliersQuery, useExpenseCategoriesQuery } from "../../features/finance-v2/finance-v2.hooks";
import { FinanceDataTable } from "../../features/finance-v2/design";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";

export function FinanceExpensesTab({ ar, externalShowForm, onExternalFormClose }: { ar: boolean; externalShowForm?: boolean; onExternalFormClose?: () => void }) {
  const [centerId] = useState<number>();
  const [supplierId] = useState<number>();
  const [status] = useState<string>();

  const invoicesQ = useExpenseInvoicesQuery({ centerId, supplierId, status });
  const accountsQ = useFinanceV2AccountsQuery(centerId);
  const approveM = useApproveExpenseInvoiceMutation();
  const payM = usePayExpenseInvoiceMutation();

  const suppliersQ = useSuppliersQuery();
  const categoriesQ = useExpenseCategoriesQuery();
  const createM = useCreateExpenseInvoiceMutation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
    if (!categoryId || !amount || !createForm.description.trim()) return;
    await createM.mutateAsync({
      supplierId: createForm.supplierId ? Number(createForm.supplierId) : undefined,
      categoryId,
      invoiceNo: createForm.invoiceNo.trim() || undefined,
      invoiceDate: createForm.invoiceDate,
      dueDate: createForm.dueDate || undefined,
      description: createForm.description.trim(),
      amount
    });
    handleCreateClose();
    setCreateForm({ supplierId: "", categoryId: "", invoiceNo: "", invoiceDate: new Date().toISOString().slice(0, 10), dueDate: "", description: "", amount: "" });
  };

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payAccountId, setPayAccountId] = useState<number>(0);
  const [payNotes, setPayNotes] = useState("");

  const handleApprove = async (id: number) => {
    if (confirm(ar ? "هل أنت متأكد من الاعتماد؟" : "Are you sure you want to approve?")) {
      await approveM.mutateAsync(id);
    }
  };

  const handlePay = async () => {
    if (!selectedInvoice) return;
    await payM.mutateAsync({
      id: selectedInvoice.id,
      payload: { amount: payAmount, financeAccountId: payAccountId, notes: payNotes }
    });
    setIsPayModalOpen(false);
  };

  return (
    <div className="fin-premium-panel animate-premium">
      <div className="fin-premium-panel__content p-0">

      <FinanceDataTable
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
                {(row.status === "DRAFT" || row.status === "PENDING_APPROVAL") && (
                  <Button size="sm" variant="secondary" onClick={() => handleApprove(row.id)}>
                    <Check className="w-4 h-4 mr-1" /> {ar ? "اعتماد" : "Approve"}
                  </Button>
                )}
                {(row.status === "APPROVED" || row.status === "PARTIALLY_PAID") && (
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
        rows={invoicesQ.data || []}
        rowKey="id"
        loading={invoicesQ.isLoading}
        density="dense"
      />
    </div>

      {/* Create Expense Invoice Modal */}
      <Modal
        isOpen={isCreateModalOpen}
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
                <select className="circlemod-select" value={createForm.categoryId} onChange={(e) => setCreateForm((p) => ({ ...p, categoryId: e.target.value }))}>
                  <option value="">{ar ? "اختر التصنيف..." : "Select category..."}</option>
                  {(categoriesQ.data ?? []).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "المبلغ" : "Amount"} *</label>
                <input type="number" className="circlemod-input" min={1} step="any" value={createForm.amount} onChange={(e) => setCreateForm((p) => ({ ...p, amount: e.target.value }))} />
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
                <input type="date" className="circlemod-input" value={createForm.invoiceDate} onChange={(e) => setCreateForm((p) => ({ ...p, invoiceDate: e.target.value }))} required />
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "تاريخ الاستحقاق" : "Due Date"}</label>
                <input type="date" className="circlemod-input" value={createForm.dueDate} onChange={(e) => setCreateForm((p) => ({ ...p, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label>{ar ? "الوصف" : "Description"} *</label>
                <textarea className="circlemod-input" value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} placeholder={ar ? "وصف الفاتورة..." : "Invoice description..."} />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isPayModalOpen} 
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
                <input type="number" className="circlemod-input" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} />
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "حساب الصندوق/البنك" : "Finance Account"}</label>
                <select className="circlemod-input" value={payAccountId} onChange={(e) => setPayAccountId(Number(e.target.value))}>
                  <option value={0}>{ar ? "اختر الحساب..." : "Select Account..."}</option>
                  {accountsQ.data?.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountingAccount?.name || `Account ${acc.id}`} - {acc.accountType} ({acc.currencyCode}) - {acc.currentBalance}
                    </option>
                  ))}
                </select>
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
    </div>
  );
}
