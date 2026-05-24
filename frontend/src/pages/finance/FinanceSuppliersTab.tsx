import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useSuppliersQuery, useCreateSupplierMutation } from "../../features/finance-v2/finance-v2.hooks";
import { FinanceDataTable } from "../../features/finance-v2/design";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";

export function FinanceSuppliersTab({ 
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
  const suppliersQ = useSuppliersQuery();
  const createM = useCreateSupplierMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (externalShowForm && canManage) setIsModalOpen(true);
  }, [externalShowForm, canManage]);

  const handleClose = () => {
    setIsModalOpen(false);
    onExternalFormClose?.();
  };

  const handleCreate = async () => {
    if (!name) return;
    await createM.mutateAsync({ name, phone, address, notes });
    handleClose();
    setName(""); setPhone(""); setAddress(""); setNotes("");
  };

  return (
    <div className="fin-premium-panel animate-premium">
      <div className="fin-premium-panel__content p-0">

      <FinanceDataTable
        columns={[
          { id: "id", header: "#", render: (row: any) => row.id },
          { id: "name", header: ar ? "الاسم" : "Name", render: (row: any) => row.name },
          { id: "phone", header: ar ? "الهاتف" : "Phone", render: (row: any) => row.phone || "-" },
          { id: "address", header: ar ? "العنوان" : "Address", render: (row: any) => row.address || "-" },
          { id: "isActive", header: ar ? "نشط" : "Active", render: (row: any) => row.isActive ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No") }
        ]}
        rows={suppliersQ.data || []}
        rowKey="id"
        loading={suppliersQ.isLoading}
        density="dense"
      />
    </div>

      <Modal 
        isOpen={Boolean(isModalOpen && canManage)}
        onClose={handleClose} 
        title={ar ? "إضافة مورد" : "Add Supplier"}
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
              <span>{ar ? "بيانات المورد" : "Supplier Details"}</span>
            </div>
            <div className="circlemod-row">
              <div className="circlemod-field circlemod-field--lg">
                <label>{ar ? "اسم المورد" : "Supplier Name"} *</label>
                <input type="text" className="circlemod-input" value={name} onChange={(e) => setName(e.target.value)} />
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
    </div>
  );
}
