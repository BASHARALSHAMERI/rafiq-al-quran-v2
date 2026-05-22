export type GraduationCandidateStatus =
  | "NOMINATED"
  | "SCHEDULED"
  | "TESTED"
  | "APPROVED"
  | "REJECTED"
  | "DEFERRED";

export type GoldenRecordStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type GoldenRecordType = "KHATEM" | "IJAZAH";
export type GoldenRecordSource = "CANDIDATE" | "MANUAL" | "EXAM_BASED";
export type RiwayaType = "HAFS" | "WARSH";
export type AchievementCategory = "LESS_THAN_10_JUZ" | "JUZ_10" | "JUZ_20" | "JUZ_30";
export type ExamPurpose = "NORMAL" | "MONTHLY" | "LEVEL" | "GOLDEN_RECORD_MUSHAF";

export type PaginatedList<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type CandidateGoldenRecordLink = {
  id: number;
  status: GoldenRecordStatus;
  type: GoldenRecordType;
  year: number;
  registrySerial: string | null;
};

export type GoldenRecordCandidateLink = {
  id: number;
  status: GraduationCandidateStatus;
  year: number;
};

export type ActorSummary = {
  id: number;
  fullName: string;
  role: string;
};

export type StudentSummary = {
  id: number;
  fullName: string;
  role: string;
  isActive: boolean;
};

export type CenterSummary = {
  id: number;
  name: string;
  code: string;
};

export type CircleSummary = {
  id: number;
  name: string;
  centerId: number;
};

export type CandidateExamSummary = {
  id: number;
  title: string;
  type: string;
  purpose: ExamPurpose;
  status: string;
  centerId: number;
  circleId: number | null;
  scheduledAt: string | null;
};

export type CandidateExamAttemptSummary = {
  id: number;
  examId: number;
  studentId: number;
  circleId: number;
  examPurpose: ExamPurpose;
  status: string;
  totalScore: number | null;
  gradeLabel: string | null;
  reviewedAt: string | null;
  average: number | null;
  isEligibleForGoldenRecord: boolean;
};

export type AchievementSnapshotSummary = {
  id: number;
  year: number;
  achievementCategory: AchievementCategory;
  juzCount: number;
  snapshotSource: string;
  capturedAt: string | null;
};

export type GraduationCandidateItem = {
  id: number;
  year: number;
  studentId: number;
  centerId: number;
  circleId: number;
  examId: number | null;
  examAttemptId: number | null;
  studentName: string;
  centerName: string;
  circleName: string | null;
  memorizationCompletionDate: string | null;
  khatmaTestDate: string | null;
  memorizationStartDate: string | null;
  memorizationDurationMonths: number | null;
  gradeSnapshot: string | null;
  averageSnapshot: number | null;
  notes: string | null;
  status: GraduationCandidateStatus;
  statusNote: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  deferredAt: string | null;
  createdAt: string;
  updatedAt: string;
  lockVersion: number;
  student: StudentSummary | null;
  center: CenterSummary | null;
  circle: CircleSummary | null;
  exam: CandidateExamSummary | null;
  examAttempt: CandidateExamAttemptSummary | null;
  goldenRecord: CandidateGoldenRecordLink | null;
  approvedBy: ActorSummary | null;
  rejectedBy: ActorSummary | null;
  deferredBy: ActorSummary | null;
  createdBy: ActorSummary | null;
  updatedBy: ActorSummary | null;
};

export type GoldenRecordItem = {
  id: number;
  year: number;
  source: GoldenRecordSource;
  candidateId: number | null;
  examId: number | null;
  examAttemptId: number | null;
  studentId: number;
  centerId: number;
  circleId: number | null;
  studentName: string;
  centerName: string;
  circleName: string | null;
  registrySerial: string | null;
  grade: string;
  average: number | null;
  appreciation: string;
  examDate: string | null;
  type: GoldenRecordType;
  riwaya: RiwayaType | null;
  notes: string | null;
  status: GoldenRecordStatus;
  statusNote: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lockVersion: number;
  candidate: GoldenRecordCandidateLink | null;
  student: StudentSummary | null;
  center: CenterSummary | null;
  circle: CircleSummary | null;
  exam: CandidateExamSummary | null;
  examAttempt: CandidateExamAttemptSummary | null;
  achievementSnapshot: AchievementSnapshotSummary | null;
  submittedBy: ActorSummary | null;
  approvedBy: ActorSummary | null;
  rejectedBy: ActorSummary | null;
  createdBy: ActorSummary | null;
  updatedBy: ActorSummary | null;
};

export type StatsBucket = {
  lessThan10Juz: number;
  juz10: number;
  juz20: number;
  juz30: number;
  total: number;
};

export type GoldenRecordStatsBreakdownItem = StatsBucket & {
  centerId: number;
  centerName: string;
  centerCode: string;
};

export type GoldenRecordStats = {
  year: number;
  centerId: number | null;
  summary: StatsBucket;
  breakdown: GoldenRecordStatsBreakdownItem[];
};

export type CandidatesQuery = {
  centerId?: number;
  circleId?: number;
  search?: string;
  year?: number;
  status?: GraduationCandidateStatus;
  page?: number;
  pageSize?: number;
};

export type GoldenRecordsQuery = {
  centerId?: number;
  circleId?: number;
  search?: string;
  year?: number;
  type?: GoldenRecordType;
  riwaya?: RiwayaType;
  status?: GoldenRecordStatus;
  page?: number;
  pageSize?: number;
};

export type GoldenRecordStatsQuery = {
  centerId?: number;
  year?: number;
};

export type CreateCandidatePayload = {
  studentId: number;
  memorizationCompletionDate: string;
  khatmaTestDate: string;
  notes?: string | null;
};

export type UpdateCandidatePayload = {
  memorizationCompletionDate?: string;
  khatmaTestDate?: string;
  notes?: string | null;
  lockVersion?: number;
};

export type CandidateDecisionPayload = {
  statusNote?: string | null;
  lockVersion?: number;
};

export type CandidateRequiredDecisionPayload = {
  statusNote: string;
  lockVersion?: number;
};

export type LinkCandidateExamAttemptPayload = {
  examAttemptId: number;
  lockVersion?: number;
};

export type CreateGoldenRecordPayload = {
  candidateId?: number;
  studentId: number;
  centerId: number;
  type: GoldenRecordType;
  riwaya?: RiwayaType | null;
  grade?: string;
  average?: number;
  appreciation?: string;
  examDate?: string;
  notes?: string | null;
};

export type UpdateGoldenRecordPayload = {
  circleId?: number | null;
  type?: GoldenRecordType;
  riwaya?: RiwayaType | null;
  grade?: string;
  average?: number;
  appreciation?: string;
  examDate?: string;
  notes?: string | null;
  lockVersion?: number;
};

export type GoldenRecordDecisionPayload = {
  statusNote?: string | null;
  lockVersion?: number;
};

export type GoldenRecordRequiredDecisionPayload = {
  statusNote: string;
  lockVersion?: number;
};
