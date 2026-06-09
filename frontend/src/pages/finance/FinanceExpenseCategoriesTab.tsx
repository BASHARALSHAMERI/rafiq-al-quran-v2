import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useExpenseCategoriesQuery, useCreateExpenseCategoryMutation } from "../../features/finance-v2/finance-v2.hooks";
import { FinanceDataTable } from "../../features/finance-v2/design";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useAccountingAccountsQuery } from "../accounting/accounting.hooks";
import { ErrorState } from "../../components/ui/ErrorState";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";
import { notifyError, notifyRequiredFields, notifySuccess } from "../../shared/ui/feedback";

export function FinanceExpenseCategoriesTab({ 
  ar,
  canManage = true,
  externalShowForm,
  onExternalFormClose
}: { 
  ar: boolean,
  canManage?: boolean;
  externalShowForm?: boolean;
  onExternalFormClose?: () => void;
}) {
  const categoriesQ = useExpenseCategoriesQuery();
  const createM = useCreateExpenseCategoryMutation();
  const accountingAccountsQ = useAccountingAccountsQuery();
  const accountingAccounts = accountingAccountsQ.data ?? [];
  const parentAccountIds = new Set(accountingAccounts.map((acc: any) => acc.parentId).filter(Boolean));
  const expensePostingAccounts = accountingAccounts.filter(
    (acc: any) => acc.type === "EXPENSE" && acc.isActive && !parentAccountIds.has(acc.id)
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [accountId, setAccountId] = useState<number | "">("");

  useEffect(() => {
    if (externalShowForm && canManage) setIsModalOpen(true);
  }, [externalShowForm, canManage]);

  const handleClose = () => {
    setIsModalOpen(false);
    onExternalFormClose?.();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      notifyRequiredFields(ar);
      requestAnimationFrame(() => document.getElementById("expense-category-name")?.focus());
      return;
    }
    try {
      await createM.mutateAsync({ name: name.trim(), type, accountingAccountId: accountId ? Number(accountId) : undefined });
      notifySuccess(ar ? "تمت إضافة تصنيف المصروف بنجاح" : "Expense category added successfully");
      handleClose();
      setName(""); setType(""); setAccountId("");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر إضافة تصنيف المصروف." : "Unable to add the expense category."
      }));
    }
  };

  return (
    <div className="fin-premium-panel animate-premium">
      <div className="fin-premium-panel__content p-0">

      {categoriesQ.isError ? <ErrorState
        title={ar ? "تعذر تحميل تصنيفات المصروفات" : "Unable to load expense categories"}
        description={getLocalizedApiErrorMessage(categoriesQ.error, {
          ar,
          fallback: ar ? "تعذر تحميل تصنيفات المصروفات. حاول مرة أخرى." : "Unable to load expense categories."
        })}
        onRetry={() => void categoriesQ.refetch()}
      /> : <FinanceDataTable
        columns={[
          { id: "id", header: "#", render: (row: any) => row.id },
          { id: "name", header: ar ? "الاسم" : "Name", render: (row: any) => row.name },
          { id: "type", header: ar ? "النوع" : "Type", render: (row: any) => row.type || "-" },
          { id: "account", header: ar ? "رقم الحساب المحاسبي" : "Account ID", render: (row: any) => row.accountingAccount ? `${row.accountingAccount.code} - ${row.accountingAccount.name}` : "-" }
        ]}
        rows={categoriesQ.data || []}
        rowKey="id"
        loading={categoriesQ.isLoading}
        density="dense"
      />}
    </div>

      <Modal 
        isOpen={Boolean(isModalOpen && canManage)}
        onClose={handleClose} 
        title={ar ? "إضافة تصنيف" : "Add Category"}
        titleIcon={
          <div className="circlemod-head-icon">
            <Plus className="w-4 h-4" />
          </div>
        }
        size="md"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={handleClose}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button variant="primary" onClick={handleCreate} isLoading={createM.isPending}>{ar ? "حفظ" : "Save"}</Button>
          </div>
        }
      >
        <div className="circlemod-form">
          <div className="circlemod-section">
            <div className="circlemod-section-head">
              <Plus size={15} className="circlemod-section-icon" />
              <span>{ar ? "بيانات التصنيف" : "Category Details"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label>{ar ? "اسم التصنيف" : "Category Name"} *</label>
                <input id="expense-category-name" type="text" className="circlemod-input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "النوع (مثال: تشغيلي، تعليمي)" : "Type"}</label>
                <input type="text" className="circlemod-input" value={type} onChange={(e) => setType(e.target.value)} />
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "الحساب المحاسبي" : "Ledger Account"}</label>
                <select className="circlemod-input" value={accountId} onChange={(e) => setAccountId(e.target.value === "" ? "" : Number(e.target.value))}>
                  <option value="">{ar ? "اختر الحساب..." : "Select Account..."}</option>
                  {expensePostingAccounts.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
