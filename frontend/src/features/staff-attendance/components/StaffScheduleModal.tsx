import { useState, useMemo, useEffect } from "react";
import { Clock, Calendar, Briefcase } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { useCentersQuery } from "../../org/org.hooks";
import CircleScheduleEditor from "../../org/CircleScheduleEditor";
import type { PrayerName } from "../../org/types";
import {
  createEmptyScheduleDraftRows,
  serializeScheduleDraftRows,
  validateScheduleDraftRows,
  type CircleScheduleDraftRow,
} from "../../org/circleSchedule";
import {
  useStaffUsersByRole,
  useCreateStaffSchedule,
  useUpdateStaffSchedule,
  type StaffScheduleAssignment,
  type CreateSchedulePayload,
} from "../staff-attendance.api";

const SCHEDULABLE_ROLES = [
  { value: "CENTER_ADMIN",    labelAr: "مدير مركز",    labelEn: "Center Admin" },
  { value: "ACCOUNTANT",      labelAr: "محاسب",        labelEn: "Accountant" },
  { value: "FINANCE_MANAGER", labelAr: "مدير مالي",   labelEn: "Finance Manager" },
  { value: "TREASURER",       labelAr: "أمين صندوق",  labelEn: "Treasurer" },
  { value: "AUDITOR",         labelAr: "مدقق حسابات", labelEn: "Auditor" },
];

const copyByLanguage = {
  ar: {
    modalTitleCreate: "إضافة جدول جديد",
    modalTitleEdit: "تعديل الجدول",
    sectionIdentity: "معلومات الجدول الأساسية",
    roleLabel: "الدور الوظيفي *",
    rolePlaceholder: "اختر الدور",
    centerLabel: "المركز *",
    centerPlaceholder: "اختر المركز",
    userLabel: "الموظف *",
    userPlaceholder: "اختر الموظف",
    userPlaceholderWait: "اختر الدور أولاً",
    effectiveFromLabel: "تاريخ البدء *",
    effectiveToLabel: "تاريخ الانتهاء (اختياري)",
    sectionSchedule: "أوقات الدوام",
    cancel: "إلغاء",
    save: "حفظ التغييرات",
    create: "إضافة الجدول",
    saveFailed: "فشل الحفظ. حاول مرة أخرى.",
  },
  en: {
    modalTitleCreate: "New Schedule Assignment",
    modalTitleEdit: "Edit Schedule",
    sectionIdentity: "Basic Schedule Information",
    roleLabel: "Staff Role *",
    rolePlaceholder: "Select role",
    centerLabel: "Center *",
    centerPlaceholder: "Select center",
    userLabel: "Staff member *",
    userPlaceholder: "Select staff",
    userPlaceholderWait: "Choose role first",
    effectiveFromLabel: "Effective From *",
    effectiveToLabel: "Effective To (optional)",
    sectionSchedule: "Work Schedule",
    cancel: "Cancel",
    save: "Save Changes",
    create: "Create Schedule",
    saveFailed: "Save failed. Please try again.",
  }
};

export interface StaffScheduleModalProps {
  ar: boolean;
  isOpen: boolean;
  existing?: StaffScheduleAssignment | null;
  onClose: () => void;
}

export function StaffScheduleModal({ ar, isOpen, existing, onClose }: StaffScheduleModalProps) {
  const copy = copyByLanguage[ar ? "ar" : "en"];
  
  const centersQ = useCentersQuery();
  const centers = centersQ.data?.items ?? [];

  const [staffRole, setStaffRole] = useState(existing?.staffRole ?? "");
  const [centerId, setCenterId] = useState<number | "">(existing?.centerId ?? "");
  const [userId, setUserId] = useState<number | "">(existing?.userId ?? "");
  const [effectiveFrom, setEffectiveFrom] = useState(existing?.effectiveFrom?.slice(0, 10) ?? "");
  const [effectiveTo, setEffectiveTo] = useState(existing?.effectiveTo?.slice(0, 10) ?? "");
  
  const [rows, setRows] = useState<CircleScheduleDraftRow[]>(() => {
    const emptyRows = createEmptyScheduleDraftRows();
    if (existing?.slots?.length) {
      return emptyRows.map((emptyRow) => {
        const slot = existing.slots.find(s => s.dayOfWeek === emptyRow.day);
        if (slot) {
          return {
            ...emptyRow,
            enabled: true,
            mode: slot.mode as "CLOCK" | "PRAYER",
            fromTime: slot.fromTime ?? "",
            toTime: slot.toTime ?? "",
            fromPrayer: (slot.fromPrayer ?? "MAGHRIB") as PrayerName,
            toPrayer: (slot.toPrayer ?? "ISHA") as PrayerName,
          };
        }
        return emptyRow;
      });
    }
    return emptyRows;
  });
  
  const [slotError, setSlotError] = useState<string | null>(null);

  const usersQ = useStaffUsersByRole(staffRole || undefined);
  const users = usersQ.data ?? [];

  const createM = useCreateStaffSchedule();
  const updateM = useUpdateStaffSchedule();
  const isPending = createM.isPending || updateM.isPending;
  const isError = createM.isError || updateM.isError;

  // Sync internal state with props when modal opens or existing assignment changes
  useEffect(() => {
    if (isOpen) {
      setStaffRole(existing?.staffRole ?? "");
      setCenterId(existing?.centerId ?? "");
      setUserId(existing?.userId ?? "");
      setEffectiveFrom(existing?.effectiveFrom?.slice(0, 10) ?? "");
      setEffectiveTo(existing?.effectiveTo?.slice(0, 10) ?? "");
      
      const emptyRows = createEmptyScheduleDraftRows();
      if (existing?.slots?.length) {
        setRows(emptyRows.map((emptyRow) => {
          const slot = existing.slots.find(s => s.dayOfWeek === emptyRow.day);
          if (slot) {
            return {
              ...emptyRow,
              enabled: true,
              mode: slot.mode as "CLOCK" | "PRAYER",
              fromTime: slot.fromTime ?? "",
              toTime: slot.toTime ?? "",
              fromPrayer: (slot.fromPrayer ?? "MAGHRIB") as PrayerName,
              toPrayer: (slot.toPrayer ?? "ISHA") as PrayerName,
            };
          }
          return emptyRow;
        }));
      } else {
        setRows(emptyRows);
      }
      setSlotError(null);
    }
  }, [isOpen, existing]);

  const handleSubmit = () => {
    const slotsError = validateScheduleDraftRows(rows, ar);
    if (slotsError) { setSlotError(slotsError); return; }
    setSlotError(null);
    
    const circleRows = serializeScheduleDraftRows(rows);
    const slots = circleRows.map((row) => ({
      dayOfWeek: row.day,
      mode: row.mode,
      fromTime: row.mode === "CLOCK" ? row.fromTime : null,
      toTime: row.mode === "CLOCK" ? row.toTime : null,
      fromPrayer: row.mode === "PRAYER" ? row.fromPrayer : null,
      toPrayer: row.mode === "PRAYER" ? row.toPrayer : null,
    }));

    if (existing) {
      updateM.mutate(
        { id: existing.id, payload: { effectiveTo: effectiveTo || null, slots } },
        { onSuccess: onClose }
      );
    } else {
      if (!staffRole || !centerId || !userId || !effectiveFrom) return;
      const payload: CreateSchedulePayload = {
        userId: Number(userId),
        staffRole,
        centerId: Number(centerId),
        effectiveFrom,
        effectiveTo: effectiveTo || null,
        slots,
      };
      createM.mutate(payload, { onSuccess: onClose });
    }
  };

  const isFormValid = existing 
    ? true 
    : (staffRole && centerId && userId && effectiveFrom);

  const modalFooter = useMemo(
    () => (
      <div className="circlemod-footer">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          {copy.cancel}
        </Button>
        <Button variant="primary" isLoading={isPending} disabled={!isFormValid} onClick={handleSubmit}>
          {existing ? copy.save : copy.create}
        </Button>
      </div>
    ),
    [copy, onClose, isPending, isFormValid, handleSubmit, existing]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existing ? copy.modalTitleEdit : copy.modalTitleCreate}
      titleIcon={
        <div className="circlemod-head-icon">
          <Clock className="w-4 h-4" />
        </div>
      }
      size="lg"
      panelClassName="circlemod-panel"
      bodyClassName="circlemod-body"
      footerClassName="circlemod-footer-wrap"
      footer={modalFooter}
    >
      <div className="circlemod-form" dir={ar ? "rtl" : "ltr"}>
        {/* Section 1: Basic Info */}
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <Briefcase size={15} className="circlemod-section-icon" />
            <span>{copy.sectionIdentity}</span>
          </div>
          
          <div className="circlemod-row">
            {/* Role select */}
            <div className="circlemod-field circlemod-field--sm">
              <label htmlFor="sched-role">{copy.roleLabel}</label>
              <select
                id="sched-role"
                className={`circlemod-select ${existing ? "circlemod-select--readonly" : ""}`}
                value={staffRole}
                onChange={(e) => { setStaffRole(e.target.value); setUserId(""); }}
                disabled={!!existing || isPending}
              >
                {existing ? (
                  <option value={existing.staffRole}>
                    {ar 
                      ? SCHEDULABLE_ROLES.find(r => r.value === existing.staffRole)?.labelAr 
                      : SCHEDULABLE_ROLES.find(r => r.value === existing.staffRole)?.labelEn}
                  </option>
                ) : (
                  <>
                    <option value="">{copy.rolePlaceholder}</option>
                    {SCHEDULABLE_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{ar ? r.labelAr : r.labelEn}</option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Center select */}
            <div className="circlemod-field circlemod-field--sm">
              <label htmlFor="sched-center">{copy.centerLabel}</label>
              <select
                id="sched-center"
                className={`circlemod-select ${existing ? "circlemod-select--readonly" : ""}`}
                value={centerId}
                onChange={(e) => setCenterId(Number(e.target.value) || "")}
                disabled={!!existing || isPending}
              >
                {existing ? (
                  <option value={existing.centerId}>{existing.center.name}</option>
                ) : (
                  <>
                    <option value="">{copy.centerPlaceholder}</option>
                    {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Location info for selected center */}
          {(() => {
            const selectedCenter = centers.find((c) => c.id === centerId);
            if (!selectedCenter) return null;
            const hasCoords = selectedCenter.latitude != null && selectedCenter.longitude != null;
            return (
              <div className="circlemod-location-bar" style={{ margin: "8px 0 12px", padding: "8px 12px", borderRadius: "6px", background: hasCoords ? "#ecfdf5" : "#fef2f2", border: `1px solid ${hasCoords ? "#a7f3d0" : "#fecaca"}`, fontSize: "13px" }}>
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                  {ar ? "📍 الموقع" : "📍 Location"}: {selectedCenter.mosqueName || selectedCenter.name || (ar ? "غير محدد" : "Unnamed")}
                </div>
                {hasCoords ? (
                  <div style={{ color: "#065f46" }}>
                    {ar ? "الإحداثيات" : "Coordinates"}: {Number(selectedCenter.latitude).toFixed(5)}, {Number(selectedCenter.longitude).toFixed(5)}
                  </div>
                ) : (
                  <div style={{ color: "#991b1b" }}>
                    {ar ? "⚠️ لا يوجد إحداثيات GPS — مواقيت الصلاة قد لا تكون دقيقة" : "⚠️ No GPS coordinates — prayer times may be inaccurate"}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="circlemod-row">
            {/* User select */}
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="sched-user">{copy.userLabel}</label>
              <select
                id="sched-user"
                className={`circlemod-select ${existing ? "circlemod-select--readonly" : ""}`}
                value={userId}
                onChange={(e) => setUserId(Number(e.target.value) || "")}
                disabled={!!existing || !staffRole || isPending}
              >
                {existing ? (
                  <option value={existing.userId}>{existing.user.fullName}</option>
                ) : (
                  <>
                    <option value="">{staffRole ? copy.userPlaceholder : copy.userPlaceholderWait}</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="circlemod-row">
            {/* Start Date */}
            <div className="circlemod-field circlemod-field--sm">
              <label htmlFor="sched-from">{copy.effectiveFromLabel}</label>
              <input
                id="sched-from"
                type="date"
                className={`circlemod-input ${existing ? "circlemod-select--readonly" : ""}`}
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                disabled={!!existing || isPending}
              />
            </div>
            
            {/* End Date */}
            <div className="circlemod-field circlemod-field--sm">
              <label htmlFor="sched-to">{copy.effectiveToLabel}</label>
              <input
                id="sched-to"
                type="date"
                className="circlemod-input"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Schedule */}
        <div className="circlemod-section">
          <div className="circlemod-section-head flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Calendar size={15} className="circlemod-section-icon" />
              <span>{copy.sectionSchedule}</span>
            </div>
          </div>
          <div className="mt-2">
            <CircleScheduleEditor rows={rows} onChange={setRows} ar={ar} error={slotError} />
          </div>
        </div>

        {isError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold mt-4">
            {copy.saveFailed}
          </div>
        )}
      </div>
    </Modal>
  );
}
