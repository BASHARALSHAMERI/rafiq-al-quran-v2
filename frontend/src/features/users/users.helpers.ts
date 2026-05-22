import type { Role } from "../auth/types";
import type {
  Gender,
  KhatmType,
  ParentProfileRelationType,
  ParentRelationType,
  RiwayaType,
  StudentLevel,
  StudentProfileStatus,
  SupervisorProfileStatus,
  UserListItem
} from "./types";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export type UserFormMode = "create" | "edit";
export type FormModalState = null | { mode: "create" } | { mode: "edit"; user: UserListItem };

export type RoleAwareUserFormState = {
  account: {
    fullName: string;
    email: string;
    username: string;
    password: string;
    isActive: boolean;
  };
  profile: {
    nickname: string;
    gender: Gender;
    birthDate: string;
    phone: string;
    address: string;
    avatarUrl: string;
  };
  teacherProfile: {
    hireDate: string;
    khatmType: KhatmType | null;
    riwaya: RiwayaType | null;
    educationLevel: string;
    yearsExperience: string;
  };
  supervisorProfile: {
    assignedAt: string;
    status: SupervisorProfileStatus;
    educationLevel: string;
    yearsExperience: string;
    quranQualification: KhatmType | null;
    professionalNotes: string;
  };
  centerAdminProfile: {
    assignedAt: string;
    educationLevel: string;
    yearsExperience: string;
    administrativeExperienceYears: string;
    professionalNotes: string;
  };
  studentProfile: {
    level: StudentLevel;
    studentStatus: StudentProfileStatus;
    joinDate: string;
  };
  parentProfile: {
    relationType: "" | ParentProfileRelationType;
  };
  links: {
    centerIds: number[];
    circleIds: number[];
    childStudentIds: number[];
    childRelationType: ParentRelationType;
    enrollmentCircleIds: number[];
    enrollmentStartDate: string;
    guardianIds: number[];
    guardianRelationType: ParentRelationType;
    isNewGuardian: boolean;
    newGuardian: {
      fullName: string;
      phone: string;
      relationType: ParentRelationType;
    };
  };
};

/* ═══════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════ */

export const PARENT_RELATIONS: ParentRelationType[] = ["FATHER", "MOTHER", "BROTHER", "UNCLE", "MATERNAL_UNCLE", "GRANDFATHER", "GRANDMOTHER", "GUARDIAN"];
export const PARENT_PROFILE_RELATIONS: ParentProfileRelationType[] = ["FATHER", "MOTHER", "BROTHER", "UNCLE", "MATERNAL_UNCLE", "GRANDFATHER", "GRANDMOTHER", "GUARDIAN", "OTHER"];
export const GENDER_OPTIONS: Gender[] = ["MALE", "FEMALE"];
export const KHATM_OPTIONS: KhatmType[] = ["KHATIM", "MUJAZ", "QIRAAT"];
export const RIWAYA_OPTIONS: RiwayaType[] = ["HAFS", "WARSH"];
export const SUPERVISOR_STATUS_OPTIONS: SupervisorProfileStatus[] = ["ACTIVE", "SUSPENDED"];
export const STUDENT_LEVEL_OPTIONS: StudentLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
export const STUDENT_STATUS_OPTIONS: StudentProfileStatus[] = ["REGULAR", "DROPPED", "GRADUATED"];

/* ═══════════════════════════════════════════════════════════════
   Helper Functions
   ═══════════════════════════════════════════════════════════════ */

export const parseNumber = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export const fmtDate = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("ar-SA-u-nu-latn");
};

export const roleLabel = (role: Role, ar: boolean) => {
  if (!ar) return role;
  const map: Record<Role, string> = {
    SUPER_ADMIN: "مشرف عام",
    CENTER_ADMIN: "مدير مركز",
    SUPERVISOR: "مشرف",
    TEACHER: "معلم",
    PARENT: "ولي أمر",
    STUDENT: "طالب"
  };
  return map[role];
};

export const addLabel = (role: Role, ar: boolean) => {
  if (!ar) return `Add ${role}`;
  if (role === "TEACHER") return "إضافة معلم";
  if (role === "SUPERVISOR") return "إضافة مشرف";
  if (role === "PARENT") return "إضافة ولي أمر";
  if (role === "STUDENT") return "إضافة طالب";
  return "إضافة مستخدم";
};

export const uniq = (items: number[]) => [...new Set(items.filter((n) => n > 0))];

export const centerIdsForUser = (user: UserListItem): number[] => {
  const a = (user.centerAccesses ?? []).map((x) => x.centerId);
  const b = (user.circleAccesses ?? []).map((x) => (typeof x.circle?.centerId === "number" ? x.circle.centerId : 0));
  const c = (user.studentEnrollments ?? []).map((x) => (typeof x.circle?.centerId === "number" ? x.circle.centerId : 0));
  return uniq([...a, ...b, ...c]);
};

export const circleIdsForUser = (user: UserListItem): number[] => {
  const a = (user.circleAccesses ?? []).map((x) => x.circleId);
  const b = (user.studentEnrollments ?? []).map((x) => x.circleId);
  return uniq([...a, ...b]);
};

export const summarize = (items: string[], max = 2) =>
  items.length === 0 ? "-" : items.length <= max ? items.join(", ") : `${items.slice(0, max).join(", ")} +${items.length - max}`;

export const isoDateInput = (value?: string | null) => (value ? String(value).slice(0, 10) : "");

export const toggleIdInArray = (ids: number[], id: number) =>
  ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];

export const profileGenderLabel = (value: Gender, ar: boolean) =>
  ar ? (value === "MALE" ? "ذكر" : "أنثى") : value;

export const khatmLabel = (value: KhatmType, ar: boolean) => {
  if (!ar) return value;
  const map: Record<KhatmType, string> = { KHATIM: "خاتم", MUJAZ: "مجاز", QIRAAT: "قراءات" };
  return map[value];
};

export const riwayaLabel = (value: RiwayaType, ar: boolean) => {
  if (!ar) return value;
  const map: Record<RiwayaType, string> = { HAFS: "حفص عن عاصم", WARSH: "ورش عن نافع" };
  return map[value];
};

export const supervisorStatusLabel = (value: SupervisorProfileStatus, ar: boolean) => {
  if (!ar) return value;
  const map: Record<SupervisorProfileStatus, string> = { ACTIVE: "نشط", SUSPENDED: "موقوف" };
  return map[value];
};

export const studentLevelLabel = (value: StudentLevel, ar: boolean) => {
  if (!ar) return value;
  const map: Record<StudentLevel, string> = { BEGINNER: "مبتدئ", INTERMEDIATE: "متوسط", ADVANCED: "متقدم" };
  return map[value];
};

export const studentStatusLabel = (value: StudentProfileStatus, ar: boolean) => {
  if (!ar) return value;
  const map: Record<StudentProfileStatus, string> = { REGULAR: "منتظم", DROPPED: "منقطع", GRADUATED: "متخرج" };
  return map[value];
};

export const parentRelationLabel = (value: ParentProfileRelationType, ar: boolean) => {
  if (!ar) return value;
  const map: Record<ParentProfileRelationType, string> = {
    FATHER: "أب",
    MOTHER: "أم",
    BROTHER: "أخ",
    UNCLE: "عم",
    MATERNAL_UNCLE: "خال",
    GRANDFATHER: "جد",
    GRANDMOTHER: "جدة",
    GUARDIAN: "ولي أمر",
    OTHER: "أخرى"
  };
  return map[value];
};

export const buildRoleAwareInitialState = (role: Role, mode: UserFormMode, user?: UserListItem): RoleAwareUserFormState => {
  const centerIds = uniq((user?.centerAccesses ?? []).map((x) => x.centerId));
  const circleIds = uniq((user?.circleAccesses ?? []).map((x) => x.circleId));
  const childStudentIds = uniq((user?.parentLinks ?? []).map((x) => x.studentId));
  const enrollmentCircleIds = uniq((user?.studentEnrollments ?? []).map((x) => x.circleId));
  const guardianIds = uniq((user?.childLinks ?? []).map((x) => x.parentId));

  return {
    account: {
      fullName: user?.profile?.fullName ?? user?.fullName ?? "",
      email: user?.email ?? "",
      username: user?.username ?? "",
      password: "",
      isActive: mode === "create" ? true : (user?.isActive ?? true)
    },
    profile: {
      nickname: user?.profile?.nickname ?? user?.studentProfile?.nickname ?? "",
      gender: user?.profile?.gender ?? (role === "TEACHER" || role === "SUPERVISOR" || role === "CENTER_ADMIN" || role === "PARENT" ? "MALE" : "FEMALE"),
      birthDate: isoDateInput(user?.profile?.birthDate),
      phone: user?.profile?.phone ?? "",
      address: user?.profile?.address ?? "",
      avatarUrl: user?.profile?.avatarUrl ?? ""
    },
    teacherProfile: {
      hireDate: user?.teacherProfile?.hireDate ? isoDateInput(user.teacherProfile.hireDate) : (mode === "create" ? new Date().toISOString().split("T")[0] : ""),
      khatmType: (user?.teacherProfile?.khatmType as KhatmType | undefined) ?? null,
      riwaya: (user?.teacherProfile?.riwaya as RiwayaType | undefined) ?? null,
      educationLevel: user?.teacherProfile?.educationLevel ?? "",
      yearsExperience:
        typeof user?.teacherProfile?.yearsExperience === "number"
          ? String(user.teacherProfile.yearsExperience)
          : ""
    },
    supervisorProfile: {
      assignedAt: user?.supervisorProfile?.assignedAt ? isoDateInput(user.supervisorProfile.assignedAt) : (mode === "create" ? new Date().toISOString().split("T")[0] : ""),
      status: user?.supervisorProfile?.status ?? "ACTIVE",
      educationLevel: user?.supervisorProfile?.educationLevel ?? "",
      yearsExperience:
        typeof user?.supervisorProfile?.yearsExperience === "number"
          ? String(user.supervisorProfile.yearsExperience)
          : "",
      quranQualification: (user?.supervisorProfile?.quranQualification as KhatmType | undefined) ?? null,
      professionalNotes: user?.supervisorProfile?.professionalNotes ?? ""
    },
    centerAdminProfile: {
      assignedAt: user?.centerAdminProfile?.assignedAt ? isoDateInput(user.centerAdminProfile.assignedAt) : (mode === "create" ? new Date().toISOString().split("T")[0] : ""),
      educationLevel: user?.centerAdminProfile?.educationLevel ?? "",
      yearsExperience:
        typeof user?.centerAdminProfile?.yearsExperience === "number"
          ? String(user.centerAdminProfile.yearsExperience)
          : "",
      administrativeExperienceYears:
        typeof user?.centerAdminProfile?.administrativeExperienceYears === "number"
          ? String(user.centerAdminProfile.administrativeExperienceYears)
          : "",
      professionalNotes: user?.centerAdminProfile?.professionalNotes ?? ""
    },
    studentProfile: {
      level: user?.studentProfile?.level ?? "BEGINNER",
      studentStatus: user?.studentProfile?.studentStatus ?? "REGULAR",
      joinDate: user?.studentProfile?.joinDate ? isoDateInput(user.studentProfile.joinDate) : (mode === "create" ? new Date().toISOString().split("T")[0] : "")
    },
    parentProfile: {
      relationType: (user?.parentProfile?.relationType as ParentProfileRelationType | undefined) ?? ""
    },
    links: {
      centerIds,
      circleIds,
      childStudentIds,
      childRelationType:
        (user?.parentLinks?.[0]?.relationType as ParentRelationType | undefined) ?? "GUARDIAN",
      enrollmentCircleIds,
      enrollmentStartDate:
        mode === "edit"
          ? isoDateInput(user?.studentEnrollments?.[0]?.startDate)
          : "",
      guardianIds,
      guardianRelationType: (user?.childLinks?.[0]?.relationType as ParentRelationType | undefined) ?? "FATHER",
      isNewGuardian: false,
      newGuardian: {
        fullName: "",
        phone: "",
        relationType: "FATHER"
      }
    }
  };
};
