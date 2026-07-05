export type ExamStatus = "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED";

export type ExamType = "JUZ" | "FULL_QURAN" | "SURAH_RANGE" | "OTHER" | "JUZ_RANGE";

export type SupportedExamTemplateType = "JUZ" | "FULL_QURAN" | "JUZ_RANGE";

export type ExamPurpose = "NORMAL" | "MONTHLY" | "LEVEL" | "GOLDEN_RECORD_MUSHAF";

export type AttemptStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "EVALUATED"
  | "APPROVED"
  | "PUBLISHED"
  | "CANCELLED"
  | "ABSENT";

export type NominationRequestStatus =
  | "SUBMITTED"
  | "RETURNED"
  | "REJECTED"
  | "DEFERRED"
  | "SUPERVISOR_APPROVED"
  | "CENTER_APPROVED";

export type ExamCommitteeRole = "CHAIR" | "MEMBER";

export type ExamsFilters = {
  centerId?: number;
  circleId?: number;
  purpose?: ExamPurpose;
  status?: ExamStatus;
  from?: string;
  to?: string;
};

export type AttemptFilters = {
  centerId?: number;
  circleId?: number;
  studentId?: number;
  purpose?: ExamPurpose;
};

export type NominationFilters = {
  centerId?: number;
  circleId?: number;
  studentId?: number;
  status?: NominationRequestStatus;
};

export type QuestionBankFilters = {
  fromSurah?: number;
  toSurah?: number;
  difficultyLevel?: number;
  source?: QuestionBankSource;
  search?: string;
};

export type QuestionBankSource = "MANUAL" | "AUTO";

export type UserSummary = {
  id: number;
  fullName: string;
  email?: string;
  role?: string;
};

export type ExamQuestionBankItem = {
  id: number;
  organizationId: number;
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
  pageNumber: number;
  lineCount: number;
  difficultyLevel: number;
  suggestedText: string | null;
  source: QuestionBankSource;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserSummary;
};

export type CreateQuestionBankItemPayload = {
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
  pageNumber: number;
  lineCount: number;
  difficultyLevel: number;
  suggestedText?: string;
};

export type UpdateQuestionBankItemPayload = CreateQuestionBankItemPayload;

export type GenerateQuestionBankPayload = {
  fromSurah: number;
  toSurah: number;
  count?: number;
  pageNumber?: number;
  lineCount?: number;
  difficultyLevel?: number;
  suggestedTextPrefix?: string;
};

export type ExamCriteriaPayload = {
  memorizationScore: number;
  tajweedScore: number;
  theoreticalTajweedScore: number;
  performanceScore: number;
  promptingPenalty: number;
  remindingPenalty: number;
  tajweedPenalty: number;
  minQuestionCount: number;
  defaultQuestionCount: number;
  maxQuestionCount: number;
};

export type ExamListItem = {
  id: number;
  organizationId: number;
  centerId: number | null;
  circleId: number | null;
  title: string;
  type: ExamType;
  examBranch?: string | null;
  purpose: ExamPurpose;
  maxScore: number;
  passScore: number;
  status: ExamStatus;
  scheduledAt: string | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  center?: {
    id: number;
    name: string;
    code: string;
  } | null;
  circle?: {
    id: number;
    name: string;
    centerId: number;
  } | null;
  createdBy?: UserSummary;
  criteria?: {
    id: number;
    memorizationScore: number;
    tajweedScore: number;
    theoreticalTajweedScore: number;
    performanceScore: number;
    promptingPenalty: number;
    remindingPenalty: number;
    tajweedPenalty: number;
    minQuestionCount: number;
    defaultQuestionCount: number;
    maxQuestionCount: number;
  } | null;
  _count?: {
    attempts?: number;
  };
};

export type CreateExamPayload = {
  title: string;
  type: SupportedExamTemplateType;
  examBranch?: string | null;
  purpose?: ExamPurpose;
  maxScore: number;
  passScore: number;
  criteria?: ExamCriteriaPayload;
};

export type UpdateExamPayload = Partial<CreateExamPayload>;

export type AttemptCommitteeMember = {
  id: number;
  userId: number;
  roleAtAssignment: string;
  committeeRole: ExamCommitteeRole;
  assignedById: number | null;
  createdAt: string;
  user?: UserSummary;
};

export type AttemptQuestion = {
  id: number;
  orderIndex: number;
  source: QuestionBankSource;
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
  promptingDeductions: number;
  remindingDeductions: number;
  tajweedDeductions: number;
  isEvaluated: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExamAttemptRange = {
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
};

export type ExamAttempt = {
  id: number;
  examId: number;
  studentId: number;
  circleId: number;
  nominationRequestId?: number | null;
  examDate?: string | null;
  fullQuranCompletedAt?: string | null;
  stabilizationDays?: number | null;
  committeeNotes: string | null;
  totalScore: number | null;
  gradeLabel: string | null;
  status: AttemptStatus;
  startedAt: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  evaluatedById: number | null;
  evaluationClosedById?: number | null;
  evaluationClosedAt?: string | null;
  approvedById?: number | null;
  approvedAt?: string | null;
  publishedById?: number | null;
  publishedAt?: string | null;
  lockVersion?: number;
  createdAt: string;
  updatedAt: string;
  student?: UserSummary;
  circle?: {
    id: number;
    name: string;
    centerId: number;
    teacherId?: number | null;
    center?: {
      id: number;
      name: string;
      code: string;
    };
  };
  committeeMembers?: AttemptCommitteeMember[];
  questions?: AttemptQuestion[];
  nominationRequest?: {
    id: number;
    status: NominationRequestStatus;
    proposedExamDate?: string | null;
  } | null;
  evaluatedBy?: UserSummary | null;
  evaluationClosedBy?: UserSummary | null;
  approvedBy?: UserSummary | null;
  publishedBy?: UserSummary | null;
  breakdown?: {
    id: number;
    memorizationScore: number | null;
    tajweedScore: number | null;
    theoreticalTajweedScore: number | null;
    performanceScore: number | null;
    promptingDeductions: number | null;
    remindingDeductions: number | null;
    tajweedDeductions: number | null;
    strengthNotes: string | null;
    weaknessNotes: string | null;
  } | null;
  exam?: {
    id: number;
    title: string;
    type: ExamType;
    examBranch?: string | null;
    purpose: ExamPurpose;
    centerId: number | null;
    circleId: number | null;
    maxScore: number;
    passScore: number;
    status: ExamStatus;
    center?: {
      id: number;
      name: string;
      code?: string;
    } | null;
    criteria?: {
      id: number;
      memorizationScore: number;
      tajweedScore: number;
      theoreticalTajweedScore: number;
      performanceScore: number;
      promptingPenalty: number;
      remindingPenalty: number;
      tajweedPenalty: number;
      minQuestionCount: number;
      defaultQuestionCount: number;
      maxQuestionCount: number;
    } | null;
  };
  examRange?: ExamAttemptRange | null;
};

export type ExamNominationRequest = {
  id: number;
  organizationId: number;
  centerId: number;
  examId: number;
  studentId: number;
  circleId: number;
  proposedExamDate?: string | null;
  teacherNotes?: string | null;
  readinessScore?: number | null;
  status: NominationRequestStatus;
  supervisorReviewNotes?: string | null;
  supervisorReviewedById?: number | null;
  supervisorReviewedAt?: string | null;
  centerApprovalNotes?: string | null;
  centerApprovedById?: number | null;
  centerApprovedAt?: string | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  center?: {
    id: number;
    name: string;
    code?: string;
  } | null;
  circle?: {
    id: number;
    name: string;
    centerId: number;
    teacherId?: number | null;
  } | null;
  exam?: {
    id: number;
    title: string;
    type: ExamType;
    examBranch?: string | null;
    purpose: ExamPurpose;
    maxScore: number;
    passScore: number;
    status: ExamStatus;
  } | null;
  student?: UserSummary | null;
  createdBy?: UserSummary | null;
  supervisorReviewedBy?: UserSummary | null;
  centerApprovedBy?: UserSummary | null;
  attempt?: {
    id: number;
    status: AttemptStatus;
    examDate?: string | null;
    approvedAt?: string | null;
    publishedAt?: string | null;
  } | null;
};

export type CreateNominationPayload = {
  examId: number;
  studentId: number;
  circleId: number;
  teacherNotes?: string;
  readinessScore?: number;
  proposedExamDate?: string;
};

export type SupervisorReviewNominationPayload = {
  decision: "APPROVE" | "RETURN" | "REJECT" | "DEFER";
  notes?: string;
};

export type CommitteeAssignmentPayload = {
  userId: number;
  committeeRole: ExamCommitteeRole;
};

export type CenterApproveNominationPayload = {
  examDate: string;
  fullQuranCompletedAt?: string | null;
  centerApprovalNotes?: string;
  committeeMembers: CommitteeAssignmentPayload[];
};

export type CenterReviewNominationPayload = {
  decision: "REJECT";
  notes?: string;
};

export type CenterApprovalResult = {
  nomination: ExamNominationRequest;
  attempt: ExamAttempt;
};

export type UpdateAttemptCommitteePayload = {
  examDate?: string;
  fullQuranCompletedAt?: string | null;
  committeeMembers?: CommitteeAssignmentPayload[];
  lockVersion?: number;
};

export type EvaluateAttemptPayload = {
  memorizationScore: number;
  tajweedScore: number;
  theoreticalTajweedScore: number;
  performanceScore: number;
  committeeNotes?: string;
  strengthNotes?: string;
  weaknessNotes?: string;
  questions: Array<{
    id: number;
    promptingDeductions: number;
    remindingDeductions: number;
    tajweedDeductions: number;
    isEvaluated: boolean;
  }>;
};

// Backward-compatible alias used by legacy components.
export type ScoreAttemptPayload = EvaluateAttemptPayload;

export type ShareAttemptResultResponse = {
  createdCount: number;
};

export type GenerateAttemptQuestionsPayload = {
  count?: number;
};

export type CreateAttemptQuestionPayload = {
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
};

export type ReopenAttemptPayload = {
  reason: string;
};

export type QuranPreviewAyah = {
  surahNumber: number;
  ayahNumber: number;
  text: string;
  pageNumber?: number;
};

export type QuranRangePreview = {
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
  ayahCount: number;
  fromPage: number;
  toPage: number;
  pagesCount: number;
  source: string;
  startAyah: QuranPreviewAyah | null;
  endAyah: QuranPreviewAyah | null;
  surahs: Array<{
    surahNumber: number;
    ayahs: QuranPreviewAyah[];
  }>;
};

export type GradeScale = {
  id: number;
  label: string;
  minPercentage: number;
  maxPercentage: number;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateGradeScalePayload = {
  label: string;
  minPercentage: number;
  maxPercentage: number;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateGradeScalePayload = Partial<CreateGradeScalePayload>;
