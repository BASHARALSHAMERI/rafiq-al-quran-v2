import React, { useCallback, useMemo } from "react";
import {
  AlertCircle,
  Building2,
  Briefcase,
  CalendarClock,
  ImagePlus,
  UserPlus,
  Users,
  MapPin
} from "lucide-react";

import type { CenterGender } from "../../../org/types";
import CircleScheduleEditor from "../../CircleScheduleEditor";
import { Button } from "../../../../components/ui/Button";
import ImageUploadField from "../../../../components/ui/ImageUploadField";
import Modal from "../../../../components/ui/Modal";
import type { FormMode, CenterDraft, QuickRole } from "./centers.types";

interface CenterFormModalProps {
  isOpen: boolean;
  mode: FormMode;
  draft: CenterDraft;
  setDraft: React.Dispatch<React.SetStateAction<CenterDraft>>;
  pending: boolean;
  formErr: string | null;
  ar: boolean;
  canManage: boolean;
  adminOpts: { id: number; label: string }[];
  supOpts: { id: number; label: string }[];
  onClose: () => void;
  onSubmit: () => void;
  onOpenQuick: (r: QuickRole) => void;
}

const copyByLanguage = {
  ar: {
    modalTitleCreate: "\u0625\u0646\u0634\u0627\u0621 \u0645\u0631\u0643\u0632 \u062c\u062f\u064a\u062f",
    modalTitleEdit: "\u062a\u0639\u062f\u064a\u0644 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0631\u0643\u0632",
    overviewEyebrow: "\u0645\u0633\u0627\u062d\u0629 \u0625\u062f\u0627\u0631\u064a\u0629 \u0645\u062a\u0643\u0627\u0645\u0644\u0629",
    overviewTitle: "\u062a\u062c\u0647\u064a\u0632 \u0645\u0631\u0643\u0632 \u0628\u0628\u0646\u064a\u0629 \u0648\u0627\u0636\u062d\u0629 \u0648\u0647\u0648\u064a\u0629 \u0645\u0624\u0633\u0633\u064a\u0629",
    overviewText:
      "\u064a\u062a\u0645 \u0627\u0644\u062d\u0641\u0638 \u0628\u0646\u0641\u0633 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0631\u062a\u0628\u0637\u0629 \u062d\u0627\u0644\u064a\u064b\u0627 \u0628\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0646\u0638\u0627\u0645\u060c \u0645\u0639 \u0639\u0631\u0636 \u062a\u0646\u0638\u064a\u0645\u064a \u0623\u0648\u0636\u062d \u0644\u0644\u0641\u0631\u0642 \u0627\u0644\u0645\u0624\u0633\u0633\u064a\u0629.",
    statMode: "\u0646\u0648\u0639 \u0627\u0644\u0639\u0645\u0644\u064a\u0629",
    statModeCreate: "\u0625\u0646\u0634\u0627\u0621",
    statModeEdit: "\u062a\u062d\u062f\u064a\u062b",
    statAdmin: "\u0627\u0644\u0625\u062f\u0627\u0631\u0629",
    statAdminAssigned: "\u0645\u0639\u064a\u0646",
    statAdminMissing: "\u0642\u064a\u062f \u0627\u0644\u0627\u062e\u062a\u064a\u0627\u0631",
    statSupervisors: "\u0627\u0644\u0645\u0634\u0631\u0641\u0648\u0646",
    statSupervisorsValue: "\u0645\u0634\u0631\u0641",
    identityTitle: "\u0647\u0648\u064a\u0629 \u0627\u0644\u0645\u0631\u0643\u0632",
    identityHint:
      "\u0623\u062f\u062e\u0644 \u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0645\u0648\u0642\u0639 \u0648\u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641\u0629 \u0628\u0635\u064a\u0627\u063a\u0629 \u0648\u0627\u0636\u062d\u0629.",
    nameLabel: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u0643\u0632 (\u0639\u0631\u0628\u064a) *",
    namePlaceholder: "\u0645\u062b\u0627\u0644: \u0645\u0631\u0643\u0632 \u0627\u0644\u0641\u0631\u0642\u0627\u0646 \u0644\u062a\u062d\u0641\u064a\u0638 \u0627\u0644\u0642\u0631\u0622\u0646",
    nameHelper: "\u064a\u0638\u0647\u0631 \u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u0643\u0632 \u0641\u064a \u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0648\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631.",
    mosqueLabel: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062c\u062f \u0623\u0648 \u0627\u0644\u0645\u0648\u0642\u0639",
    mosquePlaceholder: "\u0645\u062b\u0627\u0644: \u0645\u0633\u062c\u062f \u0627\u0644\u0647\u062f\u0649 \u2014 \u062d\u064a \u0627\u0644\u0646\u0648\u0631",
    mosqueHelper: "\u0645\u0639\u0644\u0648\u0645\u0629 \u062a\u0638\u0647\u0631 \u0644\u0644\u0627\u0633\u062a\u062f\u0644\u0627\u0644 \u0648\u0627\u0644\u062a\u0645\u064a\u064a\u0632 \u0628\u064a\u0646 \u0627\u0644\u0645\u0631\u0627\u0643\u0632.",
    genderLabel: "\u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641\u0629 *",
    genderPlaceholder: "\u0627\u062e\u062a\u0631 \u0627\u0644\u0641\u0626\u0629",
    genderMale: "\u0627\u0644\u0630\u0643\u0648\u0631 \u0641\u0642\u0637",
    genderFemale: "\u0627\u0644\u0625\u0646\u0627\u062b \u0641\u0642\u0637",
    genderHelper: "\u064a\u0624\u062b\u0631 \u0647\u0630\u0627 \u0627\u0644\u062a\u0635\u0646\u064a\u0641 \u0639\u0644\u0649 \u0627\u0644\u0639\u0631\u0636 \u0648\u0627\u0644\u0625\u0644\u062d\u0627\u0642.",
    governanceTitle: "\u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0648\u0627\u0644\u062d\u0648\u0643\u0645\u0629",
    governanceHint:
      "\u062d\u062f\u0651\u062f \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0623\u0648\u0644 \u0648\u0627\u0644\u0625\u0633\u0646\u0627\u062f \u0627\u0644\u0625\u0634\u0631\u0627\u0641\u064a \u0628\u0634\u0643\u0644 \u0642\u0627\u0628\u0644 \u0644\u0644\u062a\u0648\u0633\u0639.",
    adminLabel: "\u0645\u062f\u064a\u0631 \u0627\u0644\u0645\u0631\u0643\u0632 *",
    adminPlaceholder: "\u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u062f\u064a\u0631 \u0627\u0644\u0645\u0633\u0624\u0648\u0644",
    adminHelper: "\u0647\u0648 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u062a\u0646\u0638\u064a\u0645\u064a \u0627\u0644\u0623\u0648\u0644 \u0639\u0646 \u0627\u0644\u0645\u0631\u0643\u0632.",
    adminQuick: "\u0625\u0636\u0627\u0641\u0629 \u0633\u0631\u064a\u0639\u0629",
    supervisorsLabel: "\u0627\u0644\u0645\u0634\u0631\u0641\u0648\u0646",
    supervisorsHelper:
      "\u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u0634\u0631\u0641\u064a\u0646 \u0627\u0644\u0630\u064a\u0646 \u064a\u062a\u0627\u0628\u0639\u0648\u0646 \u0647\u0630\u0627 \u0627\u0644\u0645\u0631\u0643\u0632. \u064a\u0645\u0643\u0646\u0643 \u062a\u062d\u062f\u064a\u062f \u0623\u0643\u062b\u0631 \u0645\u0646 \u0627\u0633\u0645.",
    supervisorsQuick: "\u0625\u0636\u0627\u0641\u0629 \u0645\u0634\u0631\u0641",
    multiHint: "\u0627\u0633\u062a\u062e\u062f\u0645 Ctrl + \u0646\u0642\u0631\u0629 \u0644\u062a\u062d\u062f\u064a\u062f \u0623\u0643\u062b\u0631 \u0645\u0646 \u0645\u0634\u0631\u0641.",
    brandingTitle: "\u0627\u0644\u0647\u0648\u064a\u0629 \u0627\u0644\u0628\u0635\u0631\u064a\u0629",
    brandingHint:
      "\u0627\u062e\u062a\u0631 \u0634\u0639\u0627\u0631\u064b\u0627 \u0648\u0627\u0636\u062d\u064b\u0627 \u064a\u0638\u0647\u0631 \u0641\u064a \u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0645\u0631\u0643\u0632 \u0648\u0648\u0627\u062c\u0647\u0627\u062a \u0627\u0644\u0625\u062f\u0627\u0631\u0629.",
    brandingLabel: "\u0634\u0639\u0627\u0631 \u0627\u0644\u0645\u0631\u0643\u0632",
    brandingHelper: "\u064a\u064f\u0641\u0636\u0644 \u0635\u0648\u0631\u0629 \u0645\u0631\u0628\u0639\u0629 \u0628\u062e\u0644\u0641\u064a\u0629 \u0648\u0627\u0636\u062d\u0629.",
    previewTitle: "\u0645\u0639\u0627\u064a\u0646\u0629 \u0641\u0648\u0631\u064a\u0629",
    previewHint:
      "\u0647\u0630\u0647 \u0627\u0644\u062e\u0644\u0627\u0635\u0629 \u062a\u0633\u062d\u0628 \u0645\u0646 \u0646\u0641\u0633 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0646\u0645\u0648\u0630\u062c \u0642\u0628\u0644 \u0627\u0644\u062d\u0641\u0638.",
    previewName: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u0643\u0632",
    previewLocation: "\u0627\u0644\u0645\u0648\u0642\u0639",
    previewGender: "\u0627\u0644\u0641\u0626\u0629",
    previewManager: "\u0627\u0644\u0645\u062f\u064a\u0631",
    previewSupervisors: "\u0627\u0644\u0645\u0634\u0631\u0641\u0648\u0646",
    previewEmpty: "\u0644\u0645 \u064a\u062d\u062f\u062f \u0628\u0639\u062f",
    previewNoSupervisors: "\u0628\u0644\u0627 \u0645\u0634\u0631\u0641\u064a\u0646 \u062d\u0627\u0644\u064a\u064b\u0627",
    previewSupervisorCount: "\u0645\u0634\u0631\u0641",
    footerNote:
      "\u0633\u064a\u062a\u0645 \u0627\u0639\u062a\u0645\u0627\u062f \u0647\u0630\u0647 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0645\u0628\u0627\u0634\u0631\u0629 \u0641\u064a \u0633\u062c\u0644\u0627\u062a \u0627\u0644\u0645\u0631\u0643\u0632 \u0628\u0639\u062f \u0627\u0644\u062d\u0641\u0638.",
    cancel: "\u0625\u0644\u063a\u0627\u0621",
    create: "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0631\u0643\u0632",
    save: "\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a",
    errorTitle: "\u062a\u0639\u0630\u0631 \u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u062d\u0641\u0638",
    maleShort: "\u0630\u0643\u0648\u0631",
    femaleShort: "\u0625\u0646\u0627\u062b"
  },
  en: {
    modalTitleCreate: "Create New Center",
    modalTitleEdit: "Edit Center",
    overviewEyebrow: "Enterprise workspace",
    overviewTitle: "Prepare the center with a clear institutional structure",
    overviewText:
      "All fields below remain connected to the same create and update payloads already used by the system.",
    statMode: "Operation",
    statModeCreate: "Create",
    statModeEdit: "Update",
    statAdmin: "Manager",
    statAdminAssigned: "Assigned",
    statAdminMissing: "Pending",
    statSupervisors: "Supervisors",
    statSupervisorsValue: "selected",
    identityTitle: "Center identity",
    identityHint:
      "Capture the official center name, location reference, and target audience with a clean structure.",
    nameLabel: "Center Name (Arabic) *",
    namePlaceholder: "Example: Al-Furqan Quran Center",
    nameHelper: "This name appears across management lists and operational reports.",
    mosqueLabel: "Mosque or location name",
    mosquePlaceholder: "Example: Al-Huda Mosque - Al Noor District",
    mosqueHelper: "Used as a recognizable location reference for teams and reports.",
    genderLabel: "Target audience *",
    genderPlaceholder: "Select target audience",
    genderMale: "Males only",
    genderFemale: "Females only",
    genderHelper: "This affects listing, assignment, and filtering behavior.",
    governanceTitle: "Governance and ownership",
    governanceHint:
      "Assign the primary manager and connect supervising roles in a structure that can scale.",
    adminLabel: "Center Manager *",
    adminPlaceholder: "Select the assigned manager",
    adminHelper: "This role owns the administrative operation of the center.",
    adminQuick: "Quick add",
    supervisorsLabel: "Supervisors",
    supervisorsHelper:
      "Choose the supervisors who oversee this center. Multiple selection is supported.",
    supervisorsQuick: "Add supervisor",
    multiHint: "Use Ctrl + Click to select multiple supervisors.",
    brandingTitle: "Visual identity",
    brandingHint:
      "Upload a clean logo that appears consistently across center cards and administrative views.",
    brandingLabel: "Center logo",
    brandingHelper: "A square image with a clean background works best.",
    previewTitle: "Live preview",
    previewHint: "This summary is generated from the same draft data before saving.",
    previewName: "Center name",
    previewLocation: "Location",
    previewGender: "Audience",
    previewManager: "Manager",
    previewSupervisors: "Supervisors",
    previewEmpty: "Not provided yet",
    previewNoSupervisors: "No supervisors selected",
    previewSupervisorCount: "supervisors",
    footerNote: "These changes will be stored directly in the center record after confirmation.",
    cancel: "Cancel",
    create: "Create Center",
    save: "Save Changes",
    errorTitle: "Unable to complete save",
    maleShort: "Male",
    femaleShort: "Female"
  }
} as const;


export function CenterFormModal({
  isOpen,
  mode,
  draft,
  setDraft,
  pending,
  formErr,
  ar,
  canManage,
  adminOpts,
  supOpts,
  onClose,
  onSubmit,
  onOpenQuick
}: CenterFormModalProps) {
  const copy = copyByLanguage[ar ? "ar" : "en"];
  const scheduleTitle = ar ? "جدول دوام مدير المركز" : "Center Admin Duty Schedule";
  const scheduleHint = ar
    ? "حدد وقت بدء الدوام لكل يوم. يمكنك نسخ اليوم على بقية الأيام المفعلة."
    : "Define center-admin duty slots. You can copy one configured day to all enabled days.";

  const handleChange = useCallback(
    <K extends keyof CenterDraft,>(field: K, value: CenterDraft[K]) => {
      setDraft((previous) => ({ ...previous, [field]: value }));
    },
    [setDraft]
  );

  const modalFooter = useMemo(
    () => (
      <div className="circlemod-footer">
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          {copy.cancel}
        </Button>
        <Button variant="primary" isLoading={pending} onClick={onSubmit}>
          {mode === "edit" ? copy.save : copy.create}
        </Button>
      </div>
    ),
    [copy.cancel, copy.create, copy.save, mode, onClose, onSubmit, pending]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "edit" ? copy.modalTitleEdit : copy.modalTitleCreate}
      titleIcon={
        <div className="circlemod-head-icon">
          <Building2 className="w-4 h-4" />
        </div>
      }
      size="lg"
      panelClassName="circlemod-panel"
      bodyClassName="circlemod-body"
      footerClassName="circlemod-footer-wrap"
      footer={modalFooter}
    >
      <div className="circlemod-form">
        {/* Section 1: Center Identity */}
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <Building2 size={15} className="circlemod-section-icon" />
            <span>{copy.identityTitle}</span>
          </div>
          
          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="ctr-name-ar">{copy.nameLabel}</label>
              <input
                id="ctr-name-ar"
                className="circlemod-input"
                value={draft.nameAr}
                onChange={(e) => handleChange("nameAr", e.target.value)}
                placeholder={copy.namePlaceholder}
                disabled={pending}
              />
            </div>
            <div className="circlemod-field circlemod-field--sm">
              <label htmlFor="ctr-gender">{copy.genderLabel}</label>
              <select
                id="ctr-gender"
                className="circlemod-select"
                value={draft.gender}
                onChange={(e) => handleChange("gender", (e.target.value as CenterGender | "") || "")}
                disabled={pending}
              >
                <option value="">{copy.genderPlaceholder}</option>
                <option value="MALE">{copy.genderMale}</option>
                <option value="FEMALE">{copy.genderFemale}</option>
              </select>
            </div>
          </div>

          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <label htmlFor="ctr-mosque">
                <MapPin size={12} className="inline-block ml-1 opacity-60" />
                {copy.mosqueLabel}
              </label>
              <input
                id="ctr-mosque"
                className="circlemod-input"
                value={draft.mosqueName}
                onChange={(e) => handleChange("mosqueName", e.target.value)}
                placeholder={copy.mosquePlaceholder}
                disabled={pending}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Governance & Team */}
        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <Briefcase size={15} className="circlemod-section-icon" />
            <span>{copy.governanceTitle}</span>
          </div>

          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="ctr-admin" className="mb-0">{copy.adminLabel}</label>
                {canManage && (
                  <button
                    type="button"
                    className="circlemod-inline-action"
                    onClick={() => onOpenQuick("CENTER_ADMIN")}
                  >
                    <UserPlus size={11} />
                    <span>{copy.adminQuick}</span>
                  </button>
                )}
              </div>
              <select
                id="ctr-admin"
                className="circlemod-select"
                value={draft.centerAdminUserId === "" ? "" : String(draft.centerAdminUserId)}
                onChange={(e) => handleChange("centerAdminUserId", e.target.value ? Number(e.target.value) : "")}
                disabled={pending}
              >
                <option value="">{copy.adminPlaceholder}</option>
                {adminOpts.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="circlemod-row">
            <div className="circlemod-field circlemod-field--lg">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="ctr-supervisors" className="mb-0">{copy.supervisorsLabel}</label>
                {canManage && (
                  <button
                    type="button"
                    className="circlemod-inline-action"
                    onClick={() => onOpenQuick("SUPERVISOR")}
                  >
                    <Users size={11} />
                    <span>{copy.supervisorsQuick}</span>
                  </button>
                )}
              </div>
              <select
                id="ctr-supervisors"
                className="circlemod-select h-auto"
                multiple
                size={3}
                value={draft.supervisorUserIds.map(String)}
                onChange={(e) => handleChange("supervisorUserIds", Array.from(e.target.selectedOptions).map(o => Number(o.value)))}
                disabled={pending}
              >
                {supOpts.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              <span className="circlemod-help">{copy.multiHint}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Schedule & Visuals */}
        <div className="circlemod-section circlemod-section--schedule">
          <div className="circlemod-section-head">
            <CalendarClock size={15} className="circlemod-section-icon" />
            <span>{scheduleTitle}</span>
            <span className="circlemod-section-hint">{scheduleHint}</span>
          </div>
          <CircleScheduleEditor
            rows={draft.scheduleRows}
            onChange={(rows) => handleChange("scheduleRows", rows)}
            ar={ar}
            disabled={pending || !draft.centerAdminUserId}
          />
        </div>

        <div className="circlemod-section">
          <div className="circlemod-section-head">
            <ImagePlus size={15} className="circlemod-section-icon" />
            <span>{copy.brandingTitle}</span>
          </div>
          <div className="circlemod-row">
             <div className="circlemod-field circlemod-field--lg">
                <ImageUploadField
                  label={copy.brandingLabel}
                  value={draft.logoUrl}
                  onChange={(next: string) => handleChange("logoUrl", next)}
                  kind="CENTER_LOGO"
                  ar={ar}
                  helperText={copy.brandingHelper}
                  previewAlt={draft.nameAr || "Logo"}
                  disabled={pending}
                />
             </div>
          </div>
        </div>

        {formErr && (
          <div className="circlemod-error" role="alert">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{formErr}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
