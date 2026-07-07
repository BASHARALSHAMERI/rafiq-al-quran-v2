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
import { notifyError, notifySuccess } from "../../../shared/ui/feedback";
import { getLocalizedApiErrorMessage, getApiFieldErrors, translateZodToAr } from "../../../shared/api/error";

const SCHEDULABLE_ROLES = [
  { value: "CENTER_ADMIN",    labelAr: "مدير مركز",    labelEn: "Center Admin" },
  { value: "ACCOUNTANT",      labelAr: "محاسب",        labelEn: "Accountant" },
  { value: "FINANCE_MANAGER", labelAr: "مدير مالي",   labelEn: "Finance Manager" },
  { value: "TREASURER",       labelAr: "أمين صندوق",  labelEn: "Treasurer" },
  { value: "AUDITOR",         labelAr: "مدقق حسابات", labelEn: "Auditor" },
  { value: "TEACHER",         labelAr: "معلم",        labelEn: "Teacher" },
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
  const [centerId, setCenterId] = useState<number | "hq" | "">(existing?.isHeadquarters ? "hq" : (existing?.centerId ?? ""));
  const [userId, setUserId] = useState<number | "">(existing?.userId ?? "");
  const [effectiveFrom, setEffectiveFrom] = useState(existing?.effectiveFrom?.slice(0, 10) ?? "");
  const [effectiveTo, setEffectiveTo] = useState(existing?.effectiveTo?.slice(0, 10) ?? "");
  const [useCustomLocation, setUseCustomLocation] = useState(
    existing?.latitude != null && existing?.longitude != null
  );
  const [latitude, setLatitude] = useState<number | "">(existing?.latitude ?? "");
  const [longitude, setLongitude] = useState<number | "">(existing?.longitude ?? "");
  const [allowedRadiusMeters, setAllowedRadiusMeters] = useState<number | "">(
    existing?.allowedRadiusMeters ?? 100
  );
  const [locationText, setLocationText] = useState(existing?.locationText ?? "");
  
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
  


  const usersQ = useStaffUsersByRole(staffRole || undefined);
  const users = usersQ.data ?? [];

  const createM = useCreateStaffSchedule();
  const updateM = useUpdateStaffSchedule();
  const isPending = createM.isPending || updateM.isPending;

  // Sync internal state with props when modal opens or existing assignment changes
  useEffect(() => {
    if (isOpen) {
      setStaffRole(existing?.staffRole ?? "");
      setCenterId(existing?.centerId ?? "");
      setUserId(existing?.userId ?? "");
      setEffectiveFrom(existing?.effectiveFrom?.slice(0, 10) ?? "");
      setEffectiveTo(existing?.effectiveTo?.slice(0, 10) ?? "");
      const hasCoords = existing?.latitude != null && existing?.longitude != null;
      setUseCustomLocation(hasCoords);
      setLatitude(existing?.latitude ?? "");
      setLongitude(existing?.longitude ?? "");
      setAllowedRadiusMeters(existing?.allowedRadiusMeters ?? 100);
      setLocationText(existing?.locationText ?? "");
      
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
    }
  }, [isOpen, existing]);

  const handleSubmit = () => {
    const enabledRows = rows.filter(r => r.enabled);
    if (enabledRows.length === 0) {
      notifyError(ar ? "يجب اختيار يوم دوام واحد على الأقل" : "At least one working day must be selected");
      return;
    }

    const slotsError = validateScheduleDraftRows(rows, ar);
    if (slotsError) {
      notifyError(slotsError);
      return;
    }
    
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
        {
          id: existing.id,
          payload: {
            effectiveTo: effectiveTo || null,
            latitude: useCustomLocation ? Number(latitude) : null,
            longitude: useCustomLocation ? Number(longitude) : null,
            allowedRadiusMeters: useCustomLocation ? Number(allowedRadiusMeters) : null,
            locationText: useCustomLocation ? locationText || null : null,
            slots
          }
        },
        {
          onSuccess: () => {
            notifySuccess(ar ? "تم تحديث الجدول بنجاح" : "Schedule updated successfully");
            onClose();
          },
          onError: (error) => {
            const fieldErrors = getApiFieldErrors(error);
            const fieldErrorMessages = Object.values(fieldErrors);
            
            if (fieldErrorMessages.length > 0) {
              fieldErrorMessages.forEach(msg => notifyError(ar ? translateZodToAr(msg) : msg));
            } else {
              notifyError(
                getLocalizedApiErrorMessage(error, {
                  ar,
                  fallback: ar ? "فشل تحديث الجدول. حاول مرة أخرى." : "Failed to update schedule. Please try again."
                })
              );
            }
          }
        }
      );
    } else {
      if (!staffRole || !centerId || !userId || !effectiveFrom) return;
      const payload: CreateSchedulePayload = {
        userId: Number(userId),
        staffRole,
        isHeadquarters: centerId === "hq",
        centerId: centerId === "hq" ? null : Number(centerId),
        effectiveFrom,
        effectiveTo: effectiveTo || null,
        latitude: useCustomLocation ? Number(latitude) : null,
        longitude: useCustomLocation ? Number(longitude) : null,
        allowedRadiusMeters: useCustomLocation ? Number(allowedRadiusMeters) : null,
        locationText: useCustomLocation ? locationText || null : null,
        slots,
      };
      createM.mutate(payload, {
        onSuccess: () => {
          notifySuccess(ar ? "تم إضافة الجدول بنجاح" : "Schedule created successfully");
          onClose();
        },
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);
          const fieldErrorMessages = Object.values(fieldErrors);
          
          if (fieldErrorMessages.length > 0) {
            fieldErrorMessages.forEach(msg => notifyError(ar ? translateZodToAr(msg) : msg));
          } else {
            notifyError(
              getLocalizedApiErrorMessage(error, {
                ar,
                fallback: ar ? "فشل حفظ الجدول. حاول مرة أخرى." : "Failed to save schedule. Please try again."
              })
            );
          }
        }
      });
    }
  };

  const isFormValid = existing
    ? (useCustomLocation ? (latitude !== "" && longitude !== "" && allowedRadiusMeters !== "") : true)
    : (staffRole && centerId && userId && effectiveFrom && (useCustomLocation ? (latitude !== "" && longitude !== "" && allowedRadiusMeters !== "") : true));

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
                onChange={(e) => setCenterId(e.target.value === "hq" ? "hq" : (Number(e.target.value) || ""))}
                disabled={!!existing || isPending}
              >
                {existing ? (
                  <option value={existing.isHeadquarters ? "hq" : (existing.centerId ?? "")}>
                    {existing.isHeadquarters ? (ar ? "المقر الرئيسي للجمعية" : "Association Headquarters") : (existing.center?.name ?? "")}
                  </option>
                ) : (
                  <>
                    <option value="">{copy.centerPlaceholder}</option>
                    <option value="hq">{ar ? "المقر الرئيسي للجمعية" : "Association Headquarters"}</option>
                    {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Location info for selected center */}
          {(() => {
            if (centerId === "hq") {
              return (
                <div className="circlemod-location-bar" style={{ margin: "8px 0 12px", padding: "8px 12px", borderRadius: "6px", background: "#f8fafc", border: `1px solid #e2e8f0`, fontSize: "13px" }}>
                  <div style={{ fontWeight: 600 }}>{ar ? "المقر الرئيسي (تم ضبط الإحداثيات في إعدادات الجمعية)" : "Headquarters (Coordinates configured in Association Settings)"}</div>
                </div>
              );
            }
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

          {/* Custom Geo Location checkbox & inputs */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-text-secondary text-sm">
              <input
                type="checkbox"
                className="circlemod-checkbox rounded text-brand-600 focus:ring-brand-500"
                checked={useCustomLocation}
                onChange={(e) => setUseCustomLocation(e.target.checked)}
                disabled={isPending}
              />
              <span>{ar ? "تحديد موقع جغرافي مخصص (مستقل) لهذا الموظف" : "Define a custom GPS location for this employee"}</span>
            </label>

            {useCustomLocation && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="circlemod-field">
                  <label htmlFor="sched-lat">{ar ? "خط العرض (Latitude) *" : "Latitude *"}</label>
                  <input
                    id="sched-lat"
                    type="number"
                    step="any"
                    placeholder="e.g. 15.35222"
                    className="circlemod-input"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value ? Number(e.target.value) : "")}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="circlemod-field">
                  <label htmlFor="sched-lng">{ar ? "خط الطول (Longitude) *" : "Longitude *"}</label>
                  <input
                    id="sched-lng"
                    type="number"
                    step="any"
                    placeholder="e.g. 44.20911"
                    className="circlemod-input"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value ? Number(e.target.value) : "")}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="circlemod-field">
                  <label htmlFor="sched-radius">{ar ? "نطاق السماح الجغرافي (بالمتر) *" : "Allowed Radius (meters) *"}</label>
                  <input
                    id="sched-radius"
                    type="number"
                    placeholder="e.g. 100"
                    className="circlemod-input"
                    value={allowedRadiusMeters}
                    onChange={(e) => setAllowedRadiusMeters(e.target.value ? Number(e.target.value) : "")}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="circlemod-field">
                  <label htmlFor="sched-loc-text">{ar ? "اسم/وصف الموقع (مثال: البيت، المكتب)" : "Location Description (e.g. Home, Office)"}</label>
                  <input
                    id="sched-loc-text"
                    type="text"
                    placeholder={ar ? "أدخل اسم الموقع المخصص" : "Enter location name"}
                    className="circlemod-input"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>
            )}
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
            <CircleScheduleEditor rows={rows} onChange={setRows} ar={ar} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
