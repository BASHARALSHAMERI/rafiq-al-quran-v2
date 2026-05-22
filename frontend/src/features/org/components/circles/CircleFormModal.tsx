import { useCallback, useMemo } from "react";
import {
  BookOpen,
  GraduationCap,
  LayoutGrid,
  MapPin,
  AlertCircle,
  CalendarDays
} from "lucide-react";
import type { FormMode, CircleDraft } from "./circles.types";
import type { CircleType } from "../../types";
import CircleScheduleEditor from "../../CircleScheduleEditor";
import { Button } from "../../../../components/ui/Button";
import Modal from "../../../../components/ui/Modal";

interface CircleFormModalProps {
  ar: boolean;
  modal: { mode: FormMode; circle?: import("../../types").Circle } | null;
  setModal: (v: null) => void;
  draft: CircleDraft;
  setDraft: React.Dispatch<React.SetStateAction<CircleDraft>>;
  pending: boolean;
  formErr: string | null;
  setFormErr: (v: string | null) => void;
  centerOpts: { id: number; label: string }[];
  teacherOpts: { id: number; label: string }[];
  selectedDraftCenter: { gender?: string } | undefined;
  submitCircle: () => void;
}

const T = {
  ar: {
    titleCreate: "إنشاء حلقة جديدة",
    titleEdit: "تعديل بيانات الحلقة",
    cancel: "إلغاء",
    create: "إنشاء الحلقة",
    save: "حفظ التغييرات",
    identitySection: "هوية الحلقة",
    teamSection: "الإسناد والموقع",
    scheduleSection: "جدول المواعيد",
    centerLabel: "المركز *",
    centerPh: "اختر المركز",
    typeLabel: "نوع المسار *",
    typePh: "اختر النوع",
    nameLabel: "اسم الحلقة *",
    namePh: "مثال: حلقة النور",
    genderLabel: "الجنس",
    genderAuto: "آلي",
    teacherLabel: "المعلم الأساسي *",
    teacherPh: "اختر المعلم",
    locationLabel: "الموقع/المسجد",
    locationPh: "رحبة المسجد...",
    hifz: "حفظ",
    review: "مراجعة",
    hifzReview: "حفظ + مراجعة",
    maleOnly: "ذكور",
    femaleOnly: "إناث",
    scheduleHint: "حدد مواعيد الحلقة لكل يوم بدقة",
    errorTitle: "تنبيه"
  },
  en: {
    titleCreate: "Create New Circle",
    titleEdit: "Edit Circle",
    cancel: "Cancel",
    create: "Create Circle",
    save: "Save Changes",
    identitySection: "Circle Identity",
    teamSection: "Assignment & Location",
    scheduleSection: "Weekly Schedule",
    centerLabel: "Center *",
    centerPh: "Select center",
    typeLabel: "Circle Type *",
    typePh: "Select type",
    nameLabel: "Circle Name *",
    namePh: "e.g., Al-Noor Circle",
    genderLabel: "Gender",
    genderAuto: "Auto",
    teacherLabel: "Primary Teacher *",
    teacherPh: "Select teacher",
    locationLabel: "Location / Mosque",
    locationPh: "Mosque hall...",
    hifz: "Hifz",
    review: "Review",
    hifzReview: "Hifz + Review",
    maleOnly: "Male",
    femaleOnly: "Female",
    scheduleHint: "Set precise daily schedule for this circle",
    errorTitle: "Alert"
  }
} as const;

export function CircleFormModal({
  ar,
  modal,
  setModal,
  draft,
  setDraft,
  pending,
  formErr,
  setFormErr,
  centerOpts,
  teacherOpts,
  selectedDraftCenter,
  submitCircle,
}: CircleFormModalProps) {
  const isOpen = Boolean(modal);
  const mode = modal?.mode || "create";
  const t = T[ar ? "ar" : "en"];

  const handleClose = useCallback(() => {
    if (!pending) {
      setModal(null);
      setFormErr(null);
    }
  }, [pending, setModal, setFormErr]);

  const handleChange = useCallback(
    (field: keyof CircleDraft, value: string | number | import("../../circleSchedule").CircleScheduleDraftRow[]) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
    },
    [setDraft]
  );

  const modalFooter = useMemo(
    () => (
      <div className="circlemod-footer">
        <Button variant="secondary" onClick={handleClose} disabled={pending}>
          {t.cancel}
        </Button>
        <Button variant="primary" isLoading={pending} onClick={submitCircle}>
          {mode === "edit" ? t.save : t.create}
        </Button>
      </div>
    ),
    [t, handleClose, pending, submitCircle, mode]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === "edit" ? t.titleEdit : t.titleCreate}
      titleIcon={
        <div className="circlemod-head-icon">
          <BookOpen className="w-4 h-4" />
        </div>
      }
      size="lg"
      panelClassName="circlemod-panel"
      bodyClassName="circlemod-body"
      footerClassName="circlemod-footer-wrap"
      footer={modalFooter}
    >
      <div className="circlemod-form">

        {/* ── Section 1: Identity ── */}
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <LayoutGrid size={15} className="circlemod-section-icon" />
            <span>{t.identitySection}</span>
          </div>

          <div className="circlemod-row">
            {/* Center */}
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="cir-center">{t.centerLabel}</label>
              <select
                id="cir-center"
                className="circlemod-select"
                value={draft.centerId === "" ? "" : String(draft.centerId)}
                disabled={mode === "edit"}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : "";
                  setDraft((p) => ({ ...p, centerId: val, primaryTeacherUserId: "" }));
                }}
              >
                <option value="">{t.centerPh}</option>
                {centerOpts.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="circlemod-field circlemod-field--sm">
              <label htmlFor="cir-type">{t.typeLabel}</label>
              <select
                id="cir-type"
                className="circlemod-select"
                value={draft.circleType}
                onChange={(e) => handleChange("circleType", e.target.value as CircleType | "")}
              >
                <option value="">{t.typePh}</option>
                <option value="HIFZ">{t.hifz}</option>
                <option value="REVIEW">{t.review}</option>
                <option value="HIFZ_REVIEW">{t.hifzReview}</option>
              </select>
            </div>
          </div>

          <div className="circlemod-row">
            {/* Name */}
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="cir-name">{t.nameLabel}</label>
              <input
                id="cir-name"
                className="circlemod-input"
                value={draft.nameAr}
                onChange={(e) => handleChange("nameAr", e.target.value)}
                placeholder={t.namePh}
                disabled={pending}
              />
            </div>

            {/* Gender (read-only) */}
            <div className="circlemod-field circlemod-field--sm">
              <label htmlFor="cir-gender">{t.genderLabel}</label>
              <select
                id="cir-gender"
                className="circlemod-select circlemod-select--readonly"
                value={selectedDraftCenter?.gender ?? ""}
                disabled
              >
                <option value="">{t.genderAuto}</option>
                <option value="MALE">{t.maleOnly}</option>
                <option value="FEMALE">{t.femaleOnly}</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 2: Assignment & Location ── */}
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <GraduationCap size={15} className="circlemod-section-icon" />
            <span>{t.teamSection}</span>
          </div>

          <div className="circlemod-row">
            {/* Teacher */}
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="cir-teacher">{t.teacherLabel}</label>
              <select
                id="cir-teacher"
                className="circlemod-select"
                value={draft.primaryTeacherUserId === "" ? "" : String(draft.primaryTeacherUserId)}
                onChange={(e) => handleChange("primaryTeacherUserId", e.target.value ? Number(e.target.value) : "")}
                disabled={pending}
              >
                <option value="">{t.teacherPh}</option>
                {teacherOpts.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="cir-loc">
                <MapPin size={12} className="inline-block ml-1 opacity-60" />
                {t.locationLabel}
              </label>
              <input
                id="cir-loc"
                className="circlemod-input"
                value={draft.mosqueName}
                onChange={(e) => handleChange("mosqueName", e.target.value)}
                placeholder={t.locationPh}
                disabled={pending}
              />
            </div>
          </div>
        </div>

        {/* ── Section 3: Schedule ── */}
        <div className="circlemod-section circlemod-section--schedule">
          <div className="circlemod-section-head">
            <CalendarDays size={15} className="circlemod-section-icon" />
            <span>{t.scheduleSection}</span>
            <span className="circlemod-section-hint">{t.scheduleHint}</span>
          </div>
          <CircleScheduleEditor
            rows={draft.scheduleRows}
            onChange={(rows) => handleChange("scheduleRows", rows)}
            ar={ar}
            disabled={pending}
          />
        </div>

        {/* Error Banner */}
        {formErr && (
          <div className="circlemod-error" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{formErr}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default CircleFormModal;

