import { useCallback } from "react";
import { User, Building2, Phone, Mail, MapPin, StickyNote, UserCheck } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import type { DonorTypeV2 } from "../types";

interface DonorFormState {
  id?: number;
  centerId: string;
  name: string;
  donorType: DonorTypeV2;
  phone: string;
  email: string;
  address: string;
  contactPerson: string;
  notes: string;
  isActive: boolean;
}

interface DonorFormModalProps {
  ar: boolean;
  isOpen: boolean;
  onClose: () => void;
  form: DonorFormState;
  setForm: React.Dispatch<React.SetStateAction<DonorFormState>>;
  pending: boolean;
  error: string | null;
  centers: Array<{ id: number; name: string }>;
  donorTypeLabels: Record<DonorTypeV2, { ar: string; en: string }>;
  onSave: (e: React.FormEvent) => void;
  onDelete?: () => void;
}

export default function DonorFormModal({
  ar,
  isOpen,
  onClose,
  form,
  setForm,
  pending,
  centers,
  donorTypeLabels,
  onSave,
  onDelete
}: DonorFormModalProps) {
  const handleChange = useCallback(
    (field: keyof DonorFormState, value: any) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [setForm]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={form.id ? (ar ? "تعديل بيانات المتبرع" : "Edit Donor Details") : (ar ? "إضافة متبرع جديد" : "Add New Donor")}
      titleIcon={
        <div className="circlemod-head-icon">
          <User className="w-4 h-4" />
        </div>
      }
      size="lg"
      panelClassName="circlemod-panel"
      bodyClassName="circlemod-body"
      footerClassName="circlemod-footer-wrap"
      footer={
        <div className="circlemod-footer flex justify-between w-full">
          {form.id && onDelete ? (
            <Button variant="danger" onClick={onDelete} disabled={pending}>
              {ar ? "حذف" : "Delete"}
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={pending}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button variant="primary" type="submit" form="finance-donor-form" isLoading={pending}>
              {ar ? "حفظ المتبرع" : "Save Donor"}
            </Button>
          </div>
        </div>
      }
    >
      <form id="finance-donor-form" className="circlemod-form" noValidate onSubmit={onSave}>
        {/* Section 1: Identity */}
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <User size={15} className="circlemod-section-icon" />
            <span>{ar ? "هوية المتبرع" : "Donor Identity"}</span>
          </div>
          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="dn-name">{ar ? "الاسم الكامل *" : "Full Name *"}</label>
              <input
                id="dn-name"
                className="circlemod-input"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={ar ? "الاسم الكامل" : "Full Name"}
                pattern="^[\p{L}]+(?:\s+[\p{L}]+){2,}.*$"
                title={ar ? "الاسم يجب أن يكون ثلاثياً على الأقل ويحتوي على أحرف فقط" : "Name must be at least 3 parts and contain only letters"}
                required
              />
            </div>
            <div className="circlemod-field circlemod-field--sm">
              <label htmlFor="dn-type">{ar ? "نوع المتبرع" : "Donor Type"}</label>
              <select
                id="dn-type"
                className="circlemod-select"
                value={form.donorType}
                onChange={(e) => handleChange("donorType", e.target.value as DonorTypeV2)}
              >
                {Object.entries(donorTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label[ar ? "ar" : "en"]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Center & Status */}
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <Building2 size={15} className="circlemod-section-icon" />
            <span>{ar ? "المركز والحالة" : "Center & Status"}</span>
          </div>
          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="dn-center">{ar ? "المركز المرتبط" : "Linked Center"}</label>
              <select
                id="dn-center"
                className="circlemod-select"
                value={form.centerId}
                onChange={(e) => handleChange("centerId", e.target.value)}
              >
                <option value="">{ar ? "عام (بدون مركز)" : "General (No Center)"}</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="circlemod-field circlemod-field--sm">
              <label htmlFor="dn-status">
                <UserCheck size={12} className="inline-block ml-1 opacity-60" />
                {ar ? "الحالة" : "Status"}
              </label>
              <select
                id="dn-status"
                className="circlemod-select"
                value={form.isActive ? "true" : "false"}
                onChange={(e) => handleChange("isActive", e.target.value === "true")}
              >
                <option value="true">{ar ? "نشط" : "Active"}</option>
                <option value="false">{ar ? "غير نشط" : "Inactive"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Contact Info */}
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <Phone size={15} className="circlemod-section-icon" />
            <span>{ar ? "معلومات التواصل" : "Contact Information"}</span>
          </div>
          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="dn-phone">
                <Phone size={12} className="inline-block ml-1 opacity-60" />
                {ar ? "رقم الهاتف *" : "Phone Number *"}
              </label>
              <input
                id="dn-phone"
                className="circlemod-input"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder={ar ? "رقم الهاتف" : "Phone Number"}
                pattern="^\+?[0-9]{8,15}$"
                title={ar ? "رقم الهاتف يجب أن يحتوي على أرقام فقط (8 إلى 15 رقماً)، يمكن أن يبدأ بـ +" : "Phone must contain digits only (8-15 digits), can start with +"}
                required
              />
            </div>
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="dn-email">
                <Mail size={12} className="inline-block ml-1 opacity-60" />
                {ar ? "البريد الإلكتروني" : "Email Address"}
              </label>
              <input
                id="dn-email"
                className="circlemod-input"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder={ar ? "البريد الإلكتروني" : "Email Address"}
              />
            </div>
          </div>
          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="dn-address">
                <MapPin size={12} className="inline-block ml-1 opacity-60" />
                {ar ? "العنوان *" : "Address *"}
              </label>
              <input
                id="dn-address"
                className="circlemod-input"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder={ar ? "العنوان" : "Address"}
                required
              />
            </div>
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="dn-contact">
                {ar ? "شخص التواصل (ممثل المتبرع إن وجد)" : "Contact Person (Representative if any)"}
              </label>
              <input
                id="dn-contact"
                className="circlemod-input"
                value={form.contactPerson}
                onChange={(e) => handleChange("contactPerson", e.target.value)}
                placeholder={ar ? "الاسم الذي سيتم التواصل معه" : "Name of person to contact"}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Notes */}
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <StickyNote size={15} className="circlemod-section-icon" />
            <span>{ar ? "ملاحظات" : "Notes"}</span>
            <span className="circlemod-section-hint">{ar ? "اختياري" : "Optional"}</span>
          </div>
          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="dn-notes">{ar ? "ملاحظات إضافية" : "Additional Notes"}</label>
              <input
                id="dn-notes"
                className="circlemod-input"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder={ar ? "ملاحظات" : "Notes"}
              />
            </div>
          </div>
        </div>

      </form>
    </Modal>
  );
}
