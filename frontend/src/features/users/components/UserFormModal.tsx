import { useEffect, useState, useMemo, useCallback } from "react";
import { User, Briefcase, Link as LinkIcon, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import ImageUploadField from "../../../components/ui/ImageUploadField";
import { notifyError } from "../../../shared/ui/feedback";
import type { Role } from "../../auth/types";
import type {
  KhatmType,
  ParentProfileRelationType,
  ParentRelationType,
  RiwayaType,
  StudentLevel,
  StudentProfileStatus,
  SupervisorProfileStatus,
  UserListItem
} from "../types";
import {
  type UserFormMode,
  type RoleAwareUserFormState,
  PARENT_PROFILE_RELATIONS,
  GENDER_OPTIONS,
  KHATM_OPTIONS,
  RIWAYA_OPTIONS,
  SUPERVISOR_STATUS_OPTIONS,
  STUDENT_LEVEL_OPTIONS,
  STUDENT_STATUS_OPTIONS,
  roleLabel,
  profileGenderLabel,
  khatmLabel,
  supervisorStatusLabel,
  studentLevelLabel,
  studentStatusLabel,
  parentRelationLabel,
  toggleIdInArray,
  buildRoleAwareInitialState
} from "../users.helpers";



/* ═══════════════════════════════════════════════════════════════
   RoleAwareUserFormModal — Multi-step user create/edit wizard
   ═══════════════════════════════════════════════════════════════ */
export function RoleAwareUserFormModal({
  open,
  mode,
  role,
  allowedRoles,
  ar,
  initialUser,
  centers,
  circles,
  students,
  busy,
  onClose,
  onSubmit
}: {
  open: boolean;
  mode: UserFormMode;
  role: Role;
  allowedRoles?: Role[];
  ar: boolean;
  initialUser?: UserListItem;
  centers: Array<{ id: number; name: string }>;
  circles: Array<{ id: number; name: string; centerId?: number; teacherId?: number | null }>;
  students: Array<{ id: number; fullName: string }>;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [selectedRole, setSelectedRole] = useState<Role>(() => role);
  const [state, setState] = useState<RoleAwareUserFormState>(() =>
    buildRoleAwareInitialState(role, mode, initialUser)
  );
  const [activeCenterId, setActiveCenterId] = useState<number | null>(() => {
    if (state.links.centerIds.length > 0) return state.links.centerIds[0];
    return null;
  });


  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setSelectedRole(role);
      setState(buildRoleAwareInitialState(role, mode, initialUser));
    }, 0);
    return () => clearTimeout(t);
  }, [open, role, mode, initialUser]);

  const supportsCenterLinks = role === "CENTER_ADMIN" || role === "SUPERVISOR" || role === "TEACHER";
  const supportsCircleLinks = role === "SUPERVISOR" || role === "TEACHER";
  const supportsParentLinks = role === "PARENT";
  const supportsEnrollments = role === "STUDENT";

  const validateStep = useCallback(() => {
    if (!state.account.fullName.trim()) return ar ? "الاسم الرباعي مطلوب" : "Full Name is required";
    
    const nameParts = state.account.fullName.trim().split(/\s+/);
    if (nameParts.length < 3) {
      return ar ? "الاسم الرباعي يجب أن يتكون من 3 أسماء على الأقل" : "Full Name must contain at least 3 names";
    }
    for (const part of nameParts) {
      if (part.length < 2) {
        return ar ? "يجب ألا يقل كل اسم عن حرفين (حرف واحد غير مقبول)" : "Each name must be at least 2 characters long (1 char is not acceptable)";
      }
    }

    if (!state.account.email.trim()) return ar ? "البريد الإلكتروني مطلوب" : "Email is required";
    if (!state.profile.gender) return ar ? "النوع مطلوب" : "Gender is required";

    if (role !== "STUDENT" && !state.profile.phone.trim()) {
      return ar ? "رقم الهاتف مطلوب" : "Phone number is required";
    }

    if (state.profile.phone.trim() && !/^7[0-9]{8}$/.test(state.profile.phone.trim())) {
      return ar ? "رقم الهاتف يجب أن يكون 9 أرقام ويبدأ بـ 7" : "Phone number must be 9 digits and start with 7";
    }

    if (!state.profile.birthDate) {
      return ar ? "تاريخ الميلاد مطلوب" : "Birth Date is required";
    }

    if (role === "STUDENT") {
      if (!state.studentProfile.joinDate) {
        return ar ? "تاريخ الالتحاق بالمركز مطلوب" : "Center Join date is required";
      }
      if (supportsEnrollments && state.links.enrollmentCircleIds.length > 0 && !state.links.enrollmentStartDate) {
        return ar ? "تاريخ بداية الالتحاق بالحلقة مطلوب" : "Circle Enrollment Start Date is required";
      }
    }

    return null;
  }, [state.account, state.profile, ar, role]);

  const submit = useCallback(async () => {
    const ve = validateStep();
    if (ve) {
      notifyError(ve);
      return;
    }

    const payload: Record<string, unknown> = {
      email: state.account.email.trim(),
      ...(state.account.username.trim() ? { username: state.account.username.trim() } : { username: null }),
      role: selectedRole,
      ...(mode === "create" ? { isActive: state.account.isActive } : {}),
      ...(mode === "create" ? { sendInvitation: state.account.sendInvitation } : {}),
      profile: {
        fullName: state.account.fullName.trim(),
        gender: state.profile.gender,
        ...(state.profile.birthDate ? { birthDate: state.profile.birthDate } : {}),
        ...(state.profile.phone.trim() ? { phone: state.profile.phone.trim() } : {}),
        ...(state.profile.address.trim() ? { address: state.profile.address.trim() } : {}),
        ...(mode === "edit"
          ? { avatarUrl: state.profile.avatarUrl.trim() ? state.profile.avatarUrl.trim() : null }
          : state.profile.avatarUrl.trim()
            ? { avatarUrl: state.profile.avatarUrl.trim() }
            : {})
      }
    };

    if (mode === "edit") {
      payload.fullName = state.account.fullName.trim(); // legacy compatibility
    }

    if (role === "TEACHER") {
      payload.teacherProfile = {
        ...(state.teacherProfile.hireDate ? { hireDate: state.teacherProfile.hireDate } : {}),
        ...(state.teacherProfile.khatmType ? { khatmType: state.teacherProfile.khatmType } : {}),
        ...(state.teacherProfile.riwaya ? { riwaya: state.teacherProfile.riwaya } : {}),
        ...(state.teacherProfile.educationLevel.trim()
          ? { educationLevel: state.teacherProfile.educationLevel.trim() }
          : {}),
        ...(state.teacherProfile.yearsExperience.trim()
          ? { yearsExperience: Number(state.teacherProfile.yearsExperience) }
          : {})
      };
    }

    if (role === "SUPERVISOR") {
      payload.supervisorProfile = {
        ...(state.supervisorProfile.assignedAt ? { assignedAt: state.supervisorProfile.assignedAt } : {}),
        status: state.supervisorProfile.status,
        ...(state.supervisorProfile.educationLevel ? { educationLevel: state.supervisorProfile.educationLevel } : {}),
        ...(state.supervisorProfile.yearsExperience ? { yearsExperience: Number(state.supervisorProfile.yearsExperience) } : {}),
        ...(state.supervisorProfile.quranQualification ? { quranQualification: state.supervisorProfile.quranQualification } : {}),
        ...(state.supervisorProfile.professionalNotes ? { professionalNotes: state.supervisorProfile.professionalNotes } : {})
      };
    }

    if (role === "CENTER_ADMIN") {
      payload.centerAdminProfile = {
        ...(state.centerAdminProfile.assignedAt ? { assignedAt: state.centerAdminProfile.assignedAt } : {}),
        ...(state.centerAdminProfile.educationLevel ? { educationLevel: state.centerAdminProfile.educationLevel } : {}),
        ...(state.centerAdminProfile.yearsExperience ? { yearsExperience: Number(state.centerAdminProfile.yearsExperience) } : {}),
        ...(state.centerAdminProfile.administrativeExperienceYears ? { administrativeExperienceYears: Number(state.centerAdminProfile.administrativeExperienceYears) } : {}),
        ...(state.centerAdminProfile.professionalNotes ? { professionalNotes: state.centerAdminProfile.professionalNotes } : {})
      };
    }

    if (role === "STUDENT") {
      payload.studentProfile = {
        level: state.studentProfile.level,
        studentStatus: state.studentProfile.studentStatus,
        ...(state.studentProfile.joinDate ? { joinDate: state.studentProfile.joinDate } : {}),
        ...(state.profile.nickname?.trim() ? { nickname: state.profile.nickname.trim() } : {})
      };
    }

    if (role === "PARENT") {
      payload.parentProfile = {
        ...(state.parentProfile.relationType ? { relationType: state.parentProfile.relationType } : {})
      };
    }

    const links: Record<string, unknown> = {};
    if (supportsCenterLinks) links.centerIds = state.links.centerIds;
    if (supportsCircleLinks) links.circleIds = state.links.circleIds;
    if (supportsParentLinks) {
      links.children = state.links.childStudentIds.map((studentId) => ({
        studentId,
        relationType: state.links.childRelationType
      }));
    }
    if (supportsEnrollments) {
      links.enrollments = state.links.enrollmentCircleIds.map((circleId) => ({
        circleId,
        ...(state.links.enrollmentStartDate ? { startDate: state.links.enrollmentStartDate } : {})
      }));
    }
    if (Object.keys(links).length > 0) {
      payload.links = links;
    }

    try {
      await onSubmit(payload);
    } catch (e) {
      notifyError((e as Error).message || "An error occurred");
    }
  }, [onSubmit, state, mode, role, validateStep, supportsCenterLinks, supportsCircleLinks, supportsParentLinks, supportsEnrollments]);

  const modalFooter = useMemo(() => (
    <>
      <Button variant="ghost" onClick={onClose} disabled={busy}>
        {ar ? "إلغاء" : "Cancel"}
      </Button>
      <Button variant="primary" isLoading={busy} onClick={() => void submit()}>
        {mode === "create" ? (ar ? "إنشاء" : "Create") : ar ? "حفظ" : "Save"}
      </Button>
    </>
  ), [ar, busy, mode, onClose, submit]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      size="sm"
      title={
        mode === "create"
          ? ar ? `إضافة ${roleLabel(role, true)}` : `Create ${roleLabel(role, false)}`
          : ar ? `تعديل ${roleLabel(role, true)}` : `Edit ${roleLabel(role, false)}`
      }
      titleIcon={
        <div className="ctr-modal-head-icon">
          {role === "TEACHER" ? <Briefcase className="w-5 h-5" /> : <User className="w-5 h-5" />}
        </div>
      }
      panelClassName="ctr-center-modal-panel lib-style"
      bodyClassName="ctr-center-modal-body"
      footerClassName="ctr-center-modal-footer"
      footer={modalFooter}
    >
      <div className="ctr-center-modal">
        {/* Section 1: Personal Information */}
        <div className="glass-form-section mb-6">
          <div className="ctr-form-section__head mb-4 text-emerald-600 dark:text-emerald-400">
            <User className="w-5 h-5" />
            <span>{ar ? "المعلومات الشخصية" : "Personal Information"}</span>
          </div>

          <div className="flex flex-col gap-5">
            {allowedRoles && allowedRoles.length > 0 && (
              <div className="ctr-fg animate-in fade-in duration-300 bg-slate-50/50 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <label className="text-emerald-700 font-semibold mb-2 block">{ar ? "الدور المالي *" : "Financial Role *"}</label>
                <select
                  className="ctr-form-input glass-input"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                >
                  {allowedRoles.map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r, ar)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Avatar and Name/Email Unit */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-24 h-24 flex-shrink-0 mx-auto sm:mx-0">
                <ImageUploadField
                  label=""
                  value={state.profile.avatarUrl}
                  onChange={(next) => setState((p) => ({ ...p, profile: { ...p.profile, avatarUrl: next } }))}
                  kind="USER_AVATAR"
                  ar={ar}
                  previewAlt={state.account.fullName || (ar ? "الصورة" : "Avatar")}
                />
              </div>
              <div className="flex-1 w-full space-y-4">
                <div className="ctr-fg-row">
                  <div className="ctr-fg flex-[2]">
                    <label>{ar ? "الاسم الرباعي *" : "Full Quadname *"}</label>
                    <input
                      className="ctr-form-input glass-input"
                      value={state.account.fullName}
                      onChange={(e) => setState((p) => ({ ...p, account: { ...p.account, fullName: e.target.value } }))}
                      title={ar ? "الاسم الكامل" : "Full Name"}
                      placeholder={ar ? "أدخل الاسم كما في الهوية..." : "Enter name as in ID..."}
                    />
                  </div>
                  <div className="ctr-fg flex-1">
                    <label>{ar ? "الكنية" : "Nickname"}</label>
                    <input
                      className="ctr-form-input glass-input"
                      value={state.profile.nickname}
                      onChange={(e) => setState((p) => ({ ...p, profile: { ...p.profile, nickname: e.target.value } }))}
                      placeholder={ar ? "أبو..." : "Abu..."}
                      title={ar ? "الكنية" : "Nickname"}
                    />
                  </div>
                </div>
                <div className="ctr-fg">
                  <label>{ar ? "البريد الإلكتروني *" : "Email *"}</label>
                  <input
                    className="ctr-form-input glass-input"
                    type="email"
                    value={state.account.email}
                    onChange={(e) => setState((p) => ({ ...p, account: { ...p.account, email: e.target.value } }))}
                    title={ar ? "البريد الإلكتروني" : "Email"}
                    placeholder="example@mail.com"
                  />
                </div>
              </div>
            </div>

            <div className="ctr-fg-row">
              <div className="ctr-fg flex-1">
                <label>{ar ? `رقم الهاتف ${role !== "STUDENT" ? "*" : ""}` : `Phone Number ${role !== "STUDENT" ? "*" : ""}`}</label>
                <input
                  className="ctr-form-input glass-input"
                  value={state.profile.phone}
                  onChange={(e) => setState((p) => ({ ...p, profile: { ...p.profile, phone: e.target.value } }))}
                  placeholder="7xxxxxxxx"
                  pattern="7[0-9]{8}"
                  maxLength={9}
                  title={ar ? "رقم الهاتف (9 أرقام تبدأ بـ 7)" : "Phone (9 digits starting with 7)"}
                />
              </div>
              <div className="ctr-fg flex-1">
                <label>{ar ? "اسم المستخدم (اختياري)" : "Username (Optional)"}</label>
                <input
                  className="ctr-form-input glass-input"
                  value={state.account.username}
                  onChange={(e) => setState((p) => ({ ...p, account: { ...p.account, username: e.target.value } }))}
                  placeholder={ar ? "اسم فريد للدخول..." : "Unique sign-in name..."}
                  title={ar ? "اسم المستخدم" : "Username"}
                />
              </div>
            </div>

            {/* Gender and Birth Date Row */}
            <div className="ctr-fg-row">
              <div className="ctr-fg">
                <label>{ar ? "النوع *" : "Gender *"}</label>
                <select
                  className="ctr-center-modal__select glass-input"
                  title={ar ? "النوع" : "Gender"}
                  value={state.profile.gender}
                  onChange={(e) => setState((p) => ({ ...p, profile: { ...p.profile, gender: e.target.value as "MALE" | "FEMALE" } }))}
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>{profileGenderLabel(g, ar)}</option>
                  ))}
                </select>
              </div>
              <div className="ctr-fg">
                <label>{ar ? "تاريخ الميلاد" : "Birth Date"}</label>
                <input
                  className="ctr-form-input glass-input"
                  type="date"
                  value={state.profile.birthDate}
                  onChange={(e) => setState((p) => ({ ...p, profile: { ...p.profile, birthDate: e.target.value } }))}
                  title={ar ? "تاريخ الميلاد" : "Birth Date"}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div className="ctr-fg">
              <label>{ar ? "العنوان" : "Address"}</label>
              <input
                className="ctr-form-input glass-input"
                value={state.profile.address}
                onChange={(e) => setState((p) => ({ ...p, profile: { ...p.profile, address: e.target.value } }))}
                placeholder={ar ? "المدينة، الحي، الشارع..." : "City, Neighborhood, Street..."}
                title={ar ? "العنوان" : "Address"}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Professional / Role Profile */}
        <div className="glass-form-section mb-6">
          <div className="ctr-form-section__head mb-4 text-emerald-600 dark:text-emerald-400">
            <Briefcase className="w-5 h-5" />
            <span>{ar ? "المعلومات المهنية" : "Professional Information"}</span>
            <span className="text-xs font-normal text-slate-500 ms-2">({roleLabel(role, ar)})</span>
          </div>

          <div className="flex flex-col gap-5">
            {role === "TEACHER" && (
              <>
                <div className="ctr-fg-row">
                  <div className="ctr-fg">
                    <label>{ar ? "تاريخ الالتحاق" : "Hire Date"}</label>
                    <input className="ctr-form-input glass-input" type="date" value={state.teacherProfile.hireDate} onChange={(e) => setState((p) => ({ ...p, teacherProfile: { ...p.teacherProfile, hireDate: e.target.value } }))} title={ar ? "تاريخ الالتحاق" : "Hire Date"} max={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div className="ctr-fg">
                    <label>{ar ? "درجة الحفظ" : "Khatm Degree"}</label>
                    <select className="ctr-center-modal__select glass-input" value={state.teacherProfile.khatmType ?? ""} onChange={(e) => setState((p) => ({ ...p, teacherProfile: { ...p.teacherProfile, khatmType: (e.target.value || null) as KhatmType | null } }))} title={ar ? "درجة الحفظ" : "Khatm Type"}>
                      <option value="">{ar ? "غير محدد" : "Not set"}</option>
                      {KHATM_OPTIONS.map((v) => <option key={v} value={v}>{khatmLabel(v, ar)}</option>)}
                    </select>
                  </div>
                </div>

                {state.teacherProfile.khatmType === "QIRAAT" && (
                  <div className="ctr-fg animate-in fade-in duration-300">
                    <label>{ar ? "الروايات المسندة" : "Assigned Riwayat"}</label>
                    <select 
                      className="ctr-center-modal__select glass-input" 
                      value={state.teacherProfile.riwaya ?? ""} 
                      onChange={(e) => setState((p) => ({ ...p, teacherProfile: { ...p.teacherProfile, riwaya: (e.target.value || null) as RiwayaType | null } }))} 
                      title={ar ? "الرواية" : "Riwaya"}
                    >
                      <option value="">{ar ? "اختر الرواية..." : "Select Riwaya..."}</option>
                      {RIWAYA_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                )}

                <div className="ctr-fg-row">
                  <div className="ctr-fg">
                    <label>{ar ? "المؤهل العلمي" : "Education Level"}</label>
                    <input className="ctr-form-input glass-input" value={state.teacherProfile.educationLevel} onChange={(e) => setState((p) => ({ ...p, teacherProfile: { ...p.teacherProfile, educationLevel: e.target.value } }))} placeholder={ar ? "بكالوريوس، ماجستير..." : "Bachelor, Master..."} title={ar ? "المؤهل العلمي" : "Education Level"} />
                  </div>
                  <div className="ctr-fg">
                    <label>{ar ? "سنوات الخبرة" : "Years of Experience"}</label>
                    <input 
                      className="ctr-form-input glass-input" 
                      type="number" 
                      min="0"
                      value={state.teacherProfile.yearsExperience} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && Number(val) < 0) return;
                        setState((p) => ({ ...p, teacherProfile: { ...p.teacherProfile, yearsExperience: val } }));
                      }} 
                      title={ar ? "سنوات الخبرة" : "Years of Experience"} 
                      placeholder="0" 
                    />
                  </div>
                </div>
              </>
            )}

            {role === "SUPERVISOR" && (
              <>
                <div className="ctr-fg-row">
                  <div className="ctr-fg">
                    <label>{ar ? "تاريخ الإسناد" : "Assigned At"}</label>
                    <input className="ctr-form-input glass-input" type="date" value={state.supervisorProfile.assignedAt} onChange={(e) => setState((p) => ({ ...p, supervisorProfile: { ...p.supervisorProfile, assignedAt: e.target.value } }))} title={ar ? "تاريخ الإسناد" : "Assigned At"} />
                  </div>
                  <div className="ctr-fg">
                    <label>{ar ? "الحالة" : "Status"}</label>
                    <select className="ctr-center-modal__select glass-input" value={state.supervisorProfile.status} onChange={(e) => setState((p) => ({ ...p, supervisorProfile: { ...p.supervisorProfile, status: e.target.value as SupervisorProfileStatus } }))} title={ar ? "الحالة" : "Status"}>
                      {SUPERVISOR_STATUS_OPTIONS.map((v) => <option key={v} value={v}>{supervisorStatusLabel(v, ar)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="ctr-fg-row">
                  <div className="ctr-fg">
                    <label>{ar ? "المستوى التعليمي" : "Education Level"}</label>
                    <input className="ctr-form-input glass-input" value={state.supervisorProfile.educationLevel} onChange={(e) => setState((p) => ({ ...p, supervisorProfile: { ...p.supervisorProfile, educationLevel: e.target.value } }))} maxLength={120} />
                  </div>
                  <div className="ctr-fg">
                    <label>{ar ? "سنوات الخبرة" : "Years Experience"}</label>
                    <input className="ctr-form-input glass-input" type="number" min={0} max={80} value={state.supervisorProfile.yearsExperience} onChange={(e) => setState((p) => ({ ...p, supervisorProfile: { ...p.supervisorProfile, yearsExperience: e.target.value } }))} />
                  </div>
                </div>
                <div className="ctr-fg-row">
                  <div className="ctr-fg">
                    <label>{ar ? "مؤهل القرآن" : "Quran Qualification"}</label>
                    <select className="ctr-center-modal__select glass-input" value={state.supervisorProfile.quranQualification ?? ""} onChange={(e) => setState((p) => ({ ...p, supervisorProfile: { ...p.supervisorProfile, quranQualification: (e.target.value || null) as KhatmType | null } }))}>
                      <option value="">{ar ? "-- لم يحدد --" : "-- None --"}</option>
                      {KHATM_OPTIONS.map((v) => <option key={v} value={v}>{khatmLabel(v, ar)}</option>)}
                    </select>
                  </div>
                  <div className="ctr-fg">
                    <label>{ar ? "ملاحظات مهنية" : "Professional Notes"}</label>
                    <input className="ctr-form-input glass-input" value={state.supervisorProfile.professionalNotes} onChange={(e) => setState((p) => ({ ...p, supervisorProfile: { ...p.supervisorProfile, professionalNotes: e.target.value } }))} maxLength={500} />
                  </div>
                </div>
              </>
            )}

            {role === "CENTER_ADMIN" && (
              <>
                <div className="ctr-fg">
                  <label>{ar ? "تاريخ استلام الإدارة" : "Assigned At"}</label>
                  <input className="ctr-form-input glass-input w-full md:w-1/2" type="date" value={state.centerAdminProfile.assignedAt} onChange={(e) => setState((p) => ({ ...p, centerAdminProfile: { ...p.centerAdminProfile, assignedAt: e.target.value } }))} title={ar ? "تاريخ التعيين" : "Assigned At"} />
                </div>
                <div className="ctr-fg-row">
                  <div className="ctr-fg">
                    <label>{ar ? "المستوى التعليمي" : "Education Level"}</label>
                    <input className="ctr-form-input glass-input" value={state.centerAdminProfile.educationLevel} onChange={(e) => setState((p) => ({ ...p, centerAdminProfile: { ...p.centerAdminProfile, educationLevel: e.target.value } }))} maxLength={120} />
                  </div>
                  <div className="ctr-fg">
                    <label>{ar ? "سنوات الخبرة" : "Years Experience"}</label>
                    <input className="ctr-form-input glass-input" type="number" min={0} max={80} value={state.centerAdminProfile.yearsExperience} onChange={(e) => setState((p) => ({ ...p, centerAdminProfile: { ...p.centerAdminProfile, yearsExperience: e.target.value } }))} />
                  </div>
                </div>
                <div className="ctr-fg-row">
                  <div className="ctr-fg">
                    <label>{ar ? "سنوات الخبرة الإدارية" : "Administrative Experience (Years)"}</label>
                    <input className="ctr-form-input glass-input" type="number" min={0} max={80} value={state.centerAdminProfile.administrativeExperienceYears} onChange={(e) => setState((p) => ({ ...p, centerAdminProfile: { ...p.centerAdminProfile, administrativeExperienceYears: e.target.value } }))} />
                  </div>
                  <div className="ctr-fg">
                    <label>{ar ? "ملاحظات مهنية" : "Professional Notes"}</label>
                    <input className="ctr-form-input glass-input" value={state.centerAdminProfile.professionalNotes} onChange={(e) => setState((p) => ({ ...p, centerAdminProfile: { ...p.centerAdminProfile, professionalNotes: e.target.value } }))} maxLength={500} />
                  </div>
                </div>
              </>
            )}

            {role === "STUDENT" && (
              <div className="ctr-fg-row">
                <div className="ctr-fg">
                  <label>{ar ? "المستوى" : "Level"}</label>
                  <select className="ctr-center-modal__select glass-input" value={state.studentProfile.level} onChange={(e) => setState((p) => ({ ...p, studentProfile: { ...p.studentProfile, level: e.target.value as StudentLevel } }))} title={ar ? "المستوى" : "Level"}>
                    {STUDENT_LEVEL_OPTIONS.map((v) => <option key={v} value={v}>{studentLevelLabel(v, ar)}</option>)}
                  </select>
                </div>
                <div className="ctr-fg">
                  <label>{ar ? "حالة الطالب" : "Student Status"}</label>
                  <select className="ctr-center-modal__select glass-input" value={state.studentProfile.studentStatus} onChange={(e) => setState((p) => ({ ...p, studentProfile: { ...p.studentProfile, studentStatus: e.target.value as StudentProfileStatus } }))} title={ar ? "حالة الطالب" : "Student Status"}>
                    {STUDENT_STATUS_OPTIONS.map((v) => <option key={v} value={v}>{studentStatusLabel(v, ar)}</option>)}
                  </select>
                </div>
                <div className="ctr-fg">
                  <label>{ar ? "تاريخ الالتحاق" : "Join Date"}</label>
                  <input className="ctr-form-input glass-input" type="date" value={state.studentProfile.joinDate} onChange={(e) => setState((p) => ({ ...p, studentProfile: { ...p.studentProfile, joinDate: e.target.value } }))} title={ar ? "تاريخ الالتحاق" : "Join Date"} />
                </div>
              </div>
            )}

            {role === "PARENT" && (
              <div className="ctr-fg">
                <label>{ar ? "صلة القرابة (صفة ولي الأمر)" : "Relation Role"}</label>
                <select 
                  className="ctr-center-modal__select glass-input w-full md:w-1/2" 
                  value={state.parentProfile.relationType} 
                  onChange={(e) => {
                    const val = e.target.value as "" | ParentProfileRelationType;
                    setState((p) => ({ 
                      ...p, 
                      parentProfile: { ...p.parentProfile, relationType: val },
                      links: { 
                        ...p.links, 
                        childRelationType: (val === "" || val === "OTHER" ? "GUARDIAN" : val) as ParentRelationType 
                      }
                    }));
                  }} 
                  title={ar ? "صفة ولي الأمر" : "Relation Type"}
                >
                  <option value="">{ar ? "اختر صلة القرابة..." : "Select relation..."}</option>
                  {PARENT_PROFILE_RELATIONS.map((v) => <option key={v} value={v}>{parentRelationLabel(v, ar)}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Links and Assignments */}
        {(supportsCenterLinks || supportsCircleLinks || supportsParentLinks || supportsEnrollments) ? (
          <div className="space-y-6">
            {(supportsCenterLinks || supportsCircleLinks) && (
              <section className={`glass-form-section ${role === "TEACHER" ? "p-0 bg-transparent border-none shadow-none" : ""}`}>
                <div className="ctr-form-section__head mb-4 text-emerald-600 dark:text-emerald-400">
                  <Building2 className="w-5 h-5" />
                  <span>{ar ? "التعيينات الإدارية" : "Administrative Assignments"}</span>
                </div>

                <div className="grid gap-6">
                  <div className="ctr-fg">
                    <label>{ar ? "المركز التابع له" : "Primary Center"}</label>
                    <select 
                      className="ctr-center-modal__select glass-input w-full md:w-1/2"
                      value={activeCenterId ?? ""}
                      onChange={(e) => {
                        const cid = e.target.value ? Number(e.target.value) : null;
                        setActiveCenterId(cid);
                        if (cid && !state.links.centerIds.includes(cid)) {
                          setState(p => ({ ...p, links: { ...p.links, centerIds: [cid] } }));
                        }
                      }}
                      title={ar ? "اختر المركز" : "Select Center"}
                    >
                      <option value="">{ar ? "اختر المركز للبدء..." : "Select a center first..."}</option>
                      {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {activeCenterId && (
                    <div className="ctr-fg animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>{ar ? "الحلقات المتاحة في هذا المركز" : "Available Circles in this center"}</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {circles.filter(c => c.centerId === activeCenterId && !c.teacherId).length === 0 ? (
                          <p className="text-xs text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 col-span-2 text-center">
                            {ar ? "لا توجد حلقات مرتبطة بهذا المركز حالياً" : "No circles currently linked to this center"}
                          </p>
                        ) : (
                          circles.filter(c => c.centerId === activeCenterId && !c.teacherId).map((circle) => (
                            <label key={circle.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${state.links.circleIds.includes(circle.id) ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-800/50" : "border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"}`}>
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 transition-shadow"
                                checked={state.links.circleIds.includes(circle.id)}
                                onChange={() =>
                                  setState((p) => ({
                                    ...p,
                                    links: { ...p.links, circleIds: toggleIdInArray(p.links.circleIds, circle.id) }
                                  }))
                                }
                                title={circle.name}
                              />
                              <span className={`text-sm font-medium transition-colors ${state.links.circleIds.includes(circle.id) ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400"}`}>
                                {circle.name}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {supportsParentLinks && (
              <section className="glass-form-section">
                <div className="ctr-form-section__head mb-4 text-amber-500">
                  <LinkIcon className="w-5 h-5" />
                  <span>{ar ? "ربط الأبناء" : "Link Children"}</span>
                </div>
                {/* Note: Relation role is now unified above in Professional Info for cleaner UX */}
                <div className="grid gap-4">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {students.length === 0 ? (
                      <span className="text-sm text-slate-500 italic px-2">{ar ? "لا يوجد طلاب في النطاق الحالي" : "No students in scope"}</span>
                    ) : (
                      students.map((student) => (
                        <label key={student.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 transition-shadow"
                            checked={state.links.childStudentIds.includes(student.id)}
                            onChange={() =>
                              setState((p) => ({
                                ...p,
                                links: {
                                  ...p.links,
                                  childStudentIds: toggleIdInArray(p.links.childStudentIds, student.id)
                                }
                              }))
                            }
                            title={student.fullName}
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{student.fullName}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </section>
            )}

            {supportsEnrollments && (
              <section className="glass-form-section">
                <div className="ctr-form-section__head mb-4 text-primary-600 dark:text-primary-400">
                  <LinkIcon className="w-5 h-5" />
                  <span>{ar ? "التحاق الحلقات" : "Circle Enrollments"}</span>
                </div>
                <div className="grid gap-4">
                  <div className="ctr-fg md:w-1/2">
                    <label>{ar ? "تاريخ بداية الالتحاق بالحلقة" : "Enrollment Start Date"}</label>
                    <input
                      className="ctr-form-input glass-input"
                      type="date"
                      value={state.links.enrollmentStartDate}
                      onChange={(e) =>
                        setState((p) => ({ ...p, links: { ...p.links, enrollmentStartDate: e.target.value } }))
                      }
                      title={ar ? "تاريخ البداية" : "Start date"}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {circles.length === 0 ? (
                      <span className="text-sm text-slate-500 italic px-2">{ar ? "لا توجد حلقات متاحة" : "No circles available"}</span>
                    ) : (
                      circles.map((circle) => (
                        <label key={circle.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-primary-500 rounded border-slate-300 focus:ring-primary-500 transition-shadow"
                            checked={state.links.enrollmentCircleIds.includes(circle.id)}
                            onChange={() =>
                              setState((p) => ({
                                ...p,
                                links: {
                                  ...p.links,
                                  enrollmentCircleIds: toggleIdInArray(
                                    p.links.enrollmentCircleIds,
                                    circle.id
                                  )
                                }
                              }))
                            }
                            title={circle.name}
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{circle.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="text-center p-6 text-slate-500 italic bg-white/20 dark:bg-slate-800/20 rounded-xl border border-white/40 dark:border-white/10 mt-4">
            {ar ? "لا توجد وظائف إضافية مطلوبة لهذا الدور." : "No additional links required for this role."}
          </div>
        )}

      </div>
    </Modal>
  );
}
