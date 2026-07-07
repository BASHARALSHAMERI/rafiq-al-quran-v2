import { useMemo, useState, useEffect } from "react";
import { Plus, Edit2, Power, Trash2 } from "lucide-react";
import { useSuppliersQuery, useCreateSupplierMutation, useUpdateSupplierMutation, useDeleteSupplierMutation } from "../../features/finance-v2/finance-v2.hooks";
import { FinanceDataTable, FinanceTableFooter } from "../../features/finance-v2/design";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { ErrorState } from "../../components/ui/ErrorState";
import { getLocalizedApiErrorMessage } from "../../shared/api/error";
import { notifyError, notifyRequiredFields, notifySuccess } from "../../shared/ui/feedback";
import useClientPagination from "../../shared/ui/useClientPagination";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { Badge } from "../../components/ui/Badge";

export function FinanceSuppliersTab({ 
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
  const suppliersQ = useSuppliersQuery();
  const createM = useCreateSupplierMutation();
  const updateM = useUpdateSupplierMutation();
  const deleteM = useDeleteSupplierMutation();

  const suppliers = useMemo(() => suppliersQ.data ?? [], [suppliersQ.data]);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredSuppliers = useMemo(() => {
    let result = suppliers;
    if (statusFilter && statusFilter !== "ALL") {
      if (statusFilter === "ACTIVE") result = result.filter((s: any) => s.isActive !== false);
      else if (statusFilter === "INACTIVE") result = result.filter((s: any) => s.isActive === false);
    }
    if (!normalizedSearch) return result;
    return result.filter((supplier: any) =>
      supplier.name?.toLowerCase().includes(normalizedSearch) ||
      supplier.phone?.toLowerCase().includes(normalizedSearch) ||
      supplier.address?.toLowerCase().includes(normalizedSearch) ||
      supplier.notes?.toLowerCase().includes(normalizedSearch)
    );
  }, [suppliers, normalizedSearch, statusFilter]);
  const pagination = useClientPagination(filteredSuppliers, { initialPageSize: 10, resetKey: normalizedSearch });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (externalShowForm && canManage) {
      setEditingId(null);
      setName(""); setPhone(""); setAddress(""); setNotes("");
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
    setPhone(row.phone || "");
    setAddress(row.address || "");
    setNotes(row.notes || "");
    setIsModalOpen(true);
  };

  const handleToggleActive = async (row: any) => {
    try {
      await updateM.mutateAsync({ id: row.id, payload: { isActive: !row.isActive } });
      notifySuccess(ar ? "تم تحديث حالة المورد بنجاح" : "Supplier status updated successfully");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر تحديث حالة المورد" : "Unable to update supplier status" }));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteM.mutateAsync(deleteConfirmId);
      notifySuccess(ar ? "تم حذف المورد بنجاح" : "Supplier deleted successfully");
      setDeleteConfirmId(null);
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, { ar, fallback: ar ? "تعذر حذف المورد" : "Unable to delete supplier" }));
      setDeleteConfirmId(null);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      notifyRequiredFields(ar);
      requestAnimationFrame(() => document.getElementById("supplier-name")?.focus());
      return;
    }
    try {
      if (editingId) {
        await updateM.mutateAsync({ id: editingId, payload: { name: name.trim(), phone, address, notes } });
        notifySuccess(ar ? "تم تعديل المورد بنجاح" : "Supplier updated successfully");
      } else {
        await createM.mutateAsync({ name: name.trim(), phone, address, notes });
        notifySuccess(ar ? "تمت إضافة المورد بنجاح" : "Supplier added successfully");
      }
      handleClose();
      setName(""); setPhone(""); setAddress(""); setNotes("");
    } catch (error) {
      notifyError(getLocalizedApiErrorMessage(error, {
        ar,
        fallback: ar ? "تعذر حفظ المورد." : "Unable to save the supplier."
      }));
    }
  };

  return (
    <div className="fin-premium-panel animate-premium">
      <div className="fin-premium-panel__content p-0">

      {suppliersQ.isError ? <ErrorState
        title={ar ? "تعذر تحميل الموردين" : "Unable to load suppliers"}
        description={getLocalizedApiErrorMessage(suppliersQ.error, {
          ar,
          fallback: ar ? "تعذر تحميل الموردين. حاول مرة أخرى." : "Unable to load suppliers."
        })}
        onRetry={() => void suppliersQ.refetch()}
      /> : <FinanceDataTable
        columns={[
          { id: "id", header: "#", render: (row: any) => row.id },
          { id: "name", header: ar ? "الاسم" : "Name", render: (row: any) => row.name },
          { id: "phone", header: ar ? "الهاتف" : "Phone", render: (row: any) => row.phone || "-" },
          { id: "address", header: ar ? "العنوان" : "Address", render: (row: any) => row.address || "-" },
          { id: "isActive", header: ar ? "الحالة" : "Status", render: (row: any) => row.isActive ? <Badge variant="success">{ar ? "نشط" : "Active"}</Badge> : <Badge variant="secondary">{ar ? "غير نشط" : "Inactive"}</Badge> },
          {
            id: "actions",
            header: ar ? "الإجراءات" : "Actions",
            stickyRight: true,
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
        loading={suppliersQ.isLoading}
        density="dense"
        className="fin-premium-table"
        rowClassName={(row: any) => (row.isActive ? "receipt" : "disbursement opacity-60")}
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
        title={editingId ? (ar ? "تعديل مورد" : "Edit Supplier") : (ar ? "إضافة مورد" : "Add Supplier")}
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
              <span>{ar ? "بيانات المورد" : "Supplier Details"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label>{ar ? "اسم المورد" : "Supplier Name"} *</label>
                <input id="supplier-name" type="text" className="circlemod-input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "رقم الهاتف" : "Phone"}</label>
                <input type="text" className="circlemod-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="circlemod-field circlemod-field--sm">
                <label>{ar ? "العنوان" : "Address"}</label>
                <input type="text" className="circlemod-input" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label>{ar ? "ملاحظات" : "Notes"}</label>
                <textarea className="circlemod-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title={ar ? "حذف المورد" : "Delete Supplier"}
        message={ar ? "هل أنت متأكد من رغبتك في حذف هذا المورد؟ لا يمكن التراجع عن هذه العملية." : "Are you sure you want to delete this supplier? This action cannot be undone."}
        confirmText={ar ? "حذف" : "Delete"}
        cancelText={ar ? "إلغاء" : "Cancel"}
        isDestructive={true}
        isLoading={deleteM.isPending}
      />
    </div>
  );
}
