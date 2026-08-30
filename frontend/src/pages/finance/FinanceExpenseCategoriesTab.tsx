import { useMemo, useState, useEffect } from "react";
import { Plus, Edit2, Power, Trash2 } from "lucide-react";
import { useExpenseCategoriesQuery, useCreateExpenseCategoryMutation, useUpdateExpenseCategoryMutation, useDeleteExpenseCategoryMutation } from "../../features/finance-v2/finance-v2.hooks";
import { FinanceDataTable, FinanceTableFooter } from "../../features/finance-v2/design";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useAccountingAccountsQuery } from "../accounting/accounting.hooks";
import { ErrorState } from "../../components/ui/ErrorState";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";
import { notifyError, notifyRequiredFields, notifySuccess } from "../../shared/ui/feedback";
import useClientPagination from "../../shared/ui/useClientPagination";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { Badge } from "../../components/ui/Badge";

export function FinanceExpenseCategoriesTab({ 
  ar,
  canManage = true,
  searchTerm = "",
  statusFilter = "ALL",
  externalShowForm,
  onExternalFormClose
}: { 
  ar: boolean,
  canManage?: boolean;
  searchTerm?: string;
  statusFilter?: string;
  externalShowForm?: boolean;
  onExternalFormClose?: () => void;
}) {
  const categoriesQ = useExpenseCategoriesQuery();
  const createM = useCreateExpenseCategoryMutation();
  const updateM = useUpdateExpenseCategoryMutation();
  const deleteM = useDeleteExpenseCategoryMutation();

  const categories = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data]);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCategories = useMemo(() => {
    let result = categories;
    if (statusFilter && statusFilter !== "ALL") {
      if (statusFilter === "ACTIVE") result = result.filter((c: any) => c.isActive !== false);
      else if (statusFilter === "INACTIVE") result = result.filter((c: any) => c.isActive === false);
    }
    if (!normalizedSearch) return result;
    return result.filter((category: any) =>
      category.name?.toLowerCase().includes(normalizedSearch) ||
      category.type?.toLowerCase().includes(normalizedSearch) ||
      category.accountingAccount?.code?.toLowerCase().includes(normalizedSearch) ||
      category.accountingAccount?.name?.toLowerCase().includes(normalizedSearch)
    );
  }, [categories, normalizedSearch, statusFilter]);
  const pagination = useClientPagination(filteredCategories, { initialPageSize: 10, resetKey: normalizedSearch });
  
  const accountingAccountsQ = useAccountingAccountsQuery();
  const accountingAccounts = accountingAccountsQ.data ?? [];
  const parentAccountIds = new Set(accountingAccounts.map((acc: any) => acc.parentId).filter(Boolean));
  const expensePostingAccounts = accountingAccounts.filter(
    (acc: any) => acc.type === "EXPENSE" && acc.isActive && !parentAccountIds.has(acc.id)
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [accountId, setAccountId] = useState<number | "">("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (externalShowForm && canManage) {
      setEditingId(null);
      setName(""); setType(""); setAccountId("");
      setIsModalOpen(true);
    }
  }, [externalShowForm, canManage]);

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingId(null);
    onExternalFormClose?.();
  };

  const handleOpenEdit = (row: any) => {
    setEditingId(row.id);
    setName(row.name || "");
    setType(row.type || "");
    setAccountId(row.accountingAccountId || "");
    setIsModalOpen(true);
  };

  const handleToggleActive = async (row: any) => {
    try {
      await updateM.mutateAsync({ id: row.id, payload: { isActive: !row.isActive } });
      notifySuccess(ar ? "تم تحديث حالة التصنيف بنجاح" : "Category status updated successfully");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر تحديث حالة التصنيف" : "Unable to update category status" }));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteM.mutateAsync(deleteConfirmId);
      notifySuccess(ar ? "تم حذف التصنيف بنجاح" : "Category deleted successfully");
      setDeleteConfirmId(null);
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر حذف التصنيف" : "Unable to delete category" }));
      setDeleteConfirmId(null);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      notifyRequiredFields(ar);
      requestAnimationFrame(() => document.getElementById("expense-category-name")?.focus());
      return;
    }
    try {
      if (editingId) {
        await updateM.mutateAsync({ id: editingId, payload: { name: name.trim(), type, accountingAccountId: accountId ? Number(accountId) : null } });
        notifySuccess(ar ? "تم تعديل التصنيف بنجاح" : "Category updated successfully");
      } else {
        await createM.mutateAsync({ name: name.trim(), type, accountingAccountId: accountId ? Number(accountId) : undefined });
        notifySuccess(ar ? "تمت إضافة تصنيف المصروف بنجاح" : "Expense category added successfully");
      }
      handleClose();
      setName(""); setType(""); setAccountId("");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر حفظ التصنيف." : "Unable to save category."
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
          { id: "account", header: ar ? "رقم الحساب المحاسبي" : "Account ID", render: (row: any) => row.accountingAccount ? `${row.accountingAccount.code} - ${row.accountingAccount.name}` : "-" },
          { id: "isActive", header: ar ? "الحالة" : "Status", render: (row: any) => row.isActive ? <Badge variant="success">{ar ? "نشط" : "Active"}</Badge> : <Badge variant="secondary">{ar ? "غير نشط" : "Inactive"}</Badge> },
          {
            id: "actions",
            header: ar ? "الإجراءات" : "Actions",
            isActions: true,
            render: (row: any) => (
              <div className="flex gap-2">
                {canManage && (
                  <>
                    <Button variant="secondary" size="sm" className="btn-icon" onClick={() => handleOpenEdit(row)} title={ar ? "تعديل" : "Edit"}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm" className="btn-icon" onClick={() => handleToggleActive(row)} title={row.isActive ? (ar ? "تعطيل" : "Deactivate") : (ar ? "تفعيل" : "Activate")}>
                      <Power className={`w-4 h-4 ${row.isActive ? "text-red-500" : "text-green-500"}`} />
                    </Button>
                    <Button variant="danger" size="sm" className="btn-icon" onClick={() => setDeleteConfirmId(row.id)} title={ar ? "حذف" : "Delete"}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            )
          }
        ]}
        rows={pagination.pagedRows}
        rowKey="id"
        loading={categoriesQ.isLoading}
        density="dense"
        className="fin-premium-table"
        rowClassName={(row: any) => (row.isActive ? "receipt" : "receipt opacity-60")}
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

      <Modal 
        isOpen={Boolean(isModalOpen && canManage)}
        onClose={handleClose} 
        title={editingId ? (ar ? "تعديل تصنيف" : "Edit Category") : (ar ? "إضافة تصنيف" : "Add Category")}
        titleIcon={
          <div className="circlemod-head-icon">
            {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </div>
        }
        size="md"
        panelClassName="circlemod-panel"
        bodyClassName="circlemod-body"
        footerClassName="circlemod-footer-wrap"
        footer={
          <div className="circlemod-footer">
            <Button variant="secondary" onClick={handleClose}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button variant="primary" onClick={handleSave} isLoading={createM.isPending || updateM.isPending}>{ar ? "حفظ" : "Save"}</Button>
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

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title={ar ? "حذف التصنيف" : "Delete Category"}
        message={ar ? "هل أنت متأكد من رغبتك في حذف هذا التصنيف؟ لا يمكن التراجع عن هذه العملية." : "Are you sure you want to delete this category? This action cannot be undone."}
        confirmLabel={ar ? "حذف" : "Delete"}
        cancelLabel={ar ? "إلغاء" : "Cancel"}
        confirmVariant="danger"
        isConfirming={deleteM.isPending}
      />
    </div>
  );
}
