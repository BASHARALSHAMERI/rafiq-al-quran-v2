import type {
  GoldenRecordItem,
  GoldenRecordStatus,
  GoldenRecordType,
  GraduationCandidateItem,
  GraduationCandidateStatus,
  RiwayaType
} from "./types";
import type { UserDetails } from "../users/types";

export const candidateTransitions: Record<GraduationCandidateStatus, GraduationCandidateStatus[]> = {
  NOMINATED: ["APPROVED", "REJECTED", "DEFERRED"],
  SCHEDULED: ["NOMINATED", "APPROVED", "REJECTED", "DEFERRED"],
  TESTED: ["NOMINATED", "APPROVED", "REJECTED", "DEFERRED"],
  APPROVED: [],
  REJECTED: ["NOMINATED"],
  DEFERRED: ["NOMINATED"]
};

export const toPositiveNumber = (value: string): number | undefined => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export const toNullableNumber = (value: string): number | null | undefined => {
  if (!value.trim()) {
    return null;
  }
  return toPositiveNumber(value);
};

export const toOptionalNumber = (value: string): number | undefined => {
  if (!value.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const getActiveStudentEnrollments = (student?: UserDetails | null) =>
  (student?.studentEnrollments ?? []).filter((enrollment) => enrollment.status === "ACTIVE");

export const getEarliestStudentStartDate = (student?: UserDetails | null) => {
  const enrollmentStartDates = (student?.studentEnrollments ?? [])
    .map((enrollment) => enrollment.startDate)
    .filter((value): value is string => Boolean(value))
    .sort((first, second) => new Date(first).getTime() - new Date(second).getTime());

  return enrollmentStartDates[0] ?? student?.studentProfile?.joinDate ?? null;
};

export const calculateDurationMonths = (
  startDate: string | null | undefined,
  completionDate: string | null | undefined
) => {
  if (!startDate || !completionDate) {
    return null;
  }

  const normalizedStartDate = new Date(startDate);
  const normalizedCompletionDate = new Date(completionDate);

  if (
    Number.isNaN(normalizedStartDate.getTime()) ||
    Number.isNaN(normalizedCompletionDate.getTime()) ||
    normalizedCompletionDate.getTime() < normalizedStartDate.getTime()
  ) {
    return null;
  }

  let months =
    (normalizedCompletionDate.getFullYear() - normalizedStartDate.getFullYear()) * 12 +
    (normalizedCompletionDate.getMonth() - normalizedStartDate.getMonth());

  if (normalizedCompletionDate.getDate() < normalizedStartDate.getDate()) {
    months -= 1;
  }

  return Math.max(months, 0);
};

export const formatDateLabel = (value: string | null | undefined, ar: boolean) => {
  if (!value) {
    return ar ? "غير محدد" : "Not set";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(ar ? "ar-SA-u-nu-latn" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

export const formatAverageLabel = (value: number | null | undefined, ar: boolean) => {
  if (value === null || value === undefined) {
    return ar ? "غير محدد" : "Not set";
  }

  return new Intl.NumberFormat(ar ? "ar-SA-u-nu-latn" : "en-US", {
    maximumFractionDigits: 2
  }).format(value);
};

export const formatDurationLabel = (value: number | null | undefined, ar: boolean) => {
  if (value === null || value === undefined) {
    return ar ? "غير محدد" : "Not set";
  }
  return ar ? `${value} شهر` : `${value} months`;
};

export const candidateStatusLabel = (status: GraduationCandidateStatus, ar: boolean) => {
  const labels: Record<GraduationCandidateStatus, string> = {
    NOMINATED: ar ? "مرشح" : "Nominated",
    SCHEDULED: ar ? "مجدول" : "Scheduled",
    TESTED: ar ? "تم الاختبار" : "Tested",
    APPROVED: ar ? "معتمد" : "Approved",
    REJECTED: ar ? "مرفوض" : "Rejected",
    DEFERRED: ar ? "مؤجل" : "Deferred"
  };
  return labels[status];
};

export const attemptStatusLabel = (status: string, ar: boolean) => {
  const labels: Record<string, string> = {
    SCHEDULED: ar ? "مجدولة" : "Scheduled",
    IN_PROGRESS: ar ? "قيد التنفيذ" : "In Progress",
    SUBMITTED: ar ? "مرفوعة للمراجعة" : "Submitted",
    REVIEWED: ar ? "مراجعة" : "Reviewed"
  };
  return labels[status] ?? status;
};

export const goldenRecordStatusLabel = (status: GoldenRecordStatus, ar: boolean) => {
  const labels: Record<GoldenRecordStatus, string> = {
    DRAFT: ar ? "مسودة" : "Draft",
    SUBMITTED: ar ? "بانتظار الاعتماد" : "Submitted",
    APPROVED: ar ? "معتمد نهائيًا" : "Approved",
    REJECTED: ar ? "مرفوض" : "Rejected"
  };
  return labels[status];
};

export const goldenRecordTypeLabel = (type: GoldenRecordType, ar: boolean) => {
  const labels: Record<GoldenRecordType, string> = {
    KHATEM: ar ? "خاتم" : "Khatem",
    IJAZAH: ar ? "إجازة" : "Ijazah"
  };
  return labels[type];
};

export const riwayaLabel = (riwaya: RiwayaType | null | undefined, ar: boolean) => {
  if (!riwaya) {
    return ar ? "غير محدد" : "Not set";
  }

  return riwaya === "HAFS" ? (ar ? "حفص" : "Hafs") : ar ? "ورش" : "Warsh";
};

export const badgeVariantForStatus = (
  status: GraduationCandidateStatus | GoldenRecordStatus
): "success" | "warning" | "error" | "info" | "default" => {
  if (status === "APPROVED") {
    return "success";
  }
  if (status === "REJECTED") {
    return "error";
  }
  if (status === "DEFERRED" || status === "SUBMITTED" || status === "SCHEDULED") {
    return "warning";
  }
  if (status === "TESTED") {
    return "info";
  }
  return "default";
};

export const canTransitionCandidate = (
  item: GraduationCandidateItem,
  nextStatus: GraduationCandidateStatus
) => candidateTransitions[item.status].includes(nextStatus);

export const hasEligibleGoldenRecordAttempt = (
  attempt?: { isEligibleForGoldenRecord?: boolean | null } | null
) => Boolean(attempt?.isEligibleForGoldenRecord);

export const canEditCandidate = (item: GraduationCandidateItem) => item.status !== "APPROVED";

export const canLinkCandidateExamAttempt = (item: GraduationCandidateItem) =>
  item.status === "APPROVED" && !item.goldenRecord;

export const canCreateRecordFromCandidate = (item: GraduationCandidateItem) =>
  item.status === "APPROVED" &&
  !item.goldenRecord &&
  hasEligibleGoldenRecordAttempt(item.examAttempt);

export const canEditRecord = (item: GoldenRecordItem) =>
  item.status === "DRAFT" || item.status === "REJECTED";

const hasCompleteRecordDocumentation = (item: GoldenRecordItem) =>
  Boolean(item.grade && item.appreciation && item.average !== null && item.examDate);

const hasOperationalCandidateProof = (item: GoldenRecordItem) =>
  Boolean(item.candidateId) &&
  item.candidate?.status === "APPROVED" &&
  hasEligibleGoldenRecordAttempt(item.examAttempt);

export const canSubmitRecord = (item: GoldenRecordItem) =>
  (item.status === "DRAFT" || item.status === "REJECTED") &&
  hasCompleteRecordDocumentation(item) &&
  (item.source === "MANUAL" || hasOperationalCandidateProof(item));

export const canApproveRecord = (item: GoldenRecordItem) =>
  item.status === "SUBMITTED" &&
  hasCompleteRecordDocumentation(item) &&
  (item.source === "MANUAL" || hasOperationalCandidateProof(item));
