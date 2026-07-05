import type { AttemptStatus, ExamCommitteeRole, ExamType, ExamPurpose } from "../types";

export const JUZ_BRANCH_OPTIONS = [
  "الجزء 1",
  "الجزء 2",
  "الجزء 3",
  "الجزء 4",
  "الجزء 5",
  "الجزء 6",
  "الجزء 7",
  "الجزء 8",
  "الجزء 9",
  "الجزء 10",
  "الجزء 11",
  "الجزء 12",
  "الجزء 13",
  "الجزء 14",
  "الجزء 15",
  "الجزء 16",
  "الجزء 17",
  "الجزء 18",
  "الجزء 19",
  "الجزء 20",
  "الجزء 21",
  "الجزء 22",
  "الجزء 23",
  "الجزء 24",
  "الجزء 25",
  "الجزء 26",
  "الجزء 27",
  "الجزء 28",
  "الجزء 29",
  "الجزء 30"
] as const;

export const JUZ_CATEGORIES_OPTIONS = [...JUZ_BRANCH_OPTIONS];

export const EXAM_TYPE_OPTIONS: Array<{ value: "JUZ" | "FULL_QURAN" | "JUZ_RANGE"; label: string }> = [
  { value: "JUZ", label: "اختبار جزء" },
  { value: "JUZ_RANGE", label: "فئات أجزاء (من - إلى)" },
  { value: "FULL_QURAN", label: "اختبار القرآن كاملًا" }
];

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  JUZ: "جزء",
  FULL_QURAN: "القرآن كاملًا",
  SURAH_RANGE: "نطاق سور",
  OTHER: "اختبار آخر",
  JUZ_RANGE: "فئات أجزاء"
};

export const EXAM_PURPOSE_LABELS: Record<ExamPurpose, string> = {
  NORMAL: "اختبار عادي",
  MONTHLY: "اختبار شهري",
  LEVEL: "اختبار مرحلي",
  GOLDEN_RECORD_MUSHAF: "مصحف السجل الذهبي"
};

export const EXAM_PURPOSE_OPTIONS: Array<{ value: ExamPurpose; label: string }> = [
  { value: "NORMAL", label: "اختبار عادي" },
  { value: "MONTHLY", label: "اختبار شهري" },
  { value: "LEVEL", label: "اختبار مرحلي" },
  { value: "GOLDEN_RECORD_MUSHAF", label: "مصحف السجل الذهبي" }
];

export const EXAM_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي"
};

export const ATTEMPT_STATUS_LABELS: Record<AttemptStatus, string> = {
  SCHEDULED: "مجدول",
  IN_PROGRESS: "قيد التقييم",
  EVALUATED: "تم التقييم",
  APPROVED: "معتمد",
  PUBLISHED: "منشور",
  CANCELLED: "ملغى",
  ABSENT: "غائب"
};

export const ATTEMPT_STATUS_VARIANTS: Record<
  AttemptStatus,
  "default" | "secondary" | "success" | "warning" | "error"
> = {
  SCHEDULED: "warning",
  IN_PROGRESS: "warning",
  EVALUATED: "secondary",
  APPROVED: "default",
  PUBLISHED: "success",
  CANCELLED: "error",
  ABSENT: "error"
};

export const NOMINATION_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "جديد",
  RETURNED: "أعيد للمراجع",
  REJECTED: "مرفوض",
  DEFERRED: "مؤجل",
  SUPERVISOR_APPROVED: "بانتظار اعتماد المركز",
  CENTER_APPROVED: "اعتمد من المركز"
};

export const COMMITTEE_ROLE_LABELS: Record<ExamCommitteeRole, string> = {
  CHAIR: "رئيس اللجنة",
  MEMBER: "عضو اللجنة"
};
