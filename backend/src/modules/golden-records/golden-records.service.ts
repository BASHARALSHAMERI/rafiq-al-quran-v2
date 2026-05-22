import {
  AttemptStatus,
  ExamPurpose,
  GoldenRecordSource,
  GoldenRecordStatus,
  GoldenRecordType,
  GraduationCandidateStatus,
  Prisma,
  RiwayaType,
  Role
} from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import type { ScopeContext } from "../../shared/types/auth.types";
import { notificationsService } from "../notifications/notifications.service";
import { goldenRecordsDomain } from "./golden-records.domain";
import {
  goldenRecordsRepository,
  type CandidateItem,
  type ExamAttemptOutcome,
  type GoldenRecordItem,
  type StudentContext
} from "./golden-records.repository";

const PROFILE_SYNC_SOURCE = "PROFILE_SYNC";
const GOLDEN_APPROVAL_SOURCE = "GOLDEN_APPROVAL";

export type ListCandidatesQuery = {
  centerId?: number;
  circleId?: number;
  search?: string;
  year?: number;
  status?: GraduationCandidateStatus;
  page?: number;
  pageSize?: number;
};

export type CreateCandidateInput = {
  studentId: number;
  memorizationCompletionDate: string;
  khatmaTestDate: string;
  notes?: string | null;
};

export type UpdateCandidateInput = {
  memorizationCompletionDate?: string;
  khatmaTestDate?: string;
  notes?: string | null;
  lockVersion?: number;
};

export type LinkCandidateExamAttemptInput = {
  examAttemptId: number;
  lockVersion?: number;
};

export type ListGoldenRecordsQuery = {
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

export type CreateGoldenRecordInput = {
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

export type UpdateGoldenRecordInput = {
  examId?: number | null;
  examAttemptId?: number | null;
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

export type GoldenRecordStatsQuery = {
  centerId?: number;
  year?: number;
};

type StatsBucket = {
  lessThan10Juz: number;
  juz10: number;
  juz20: number;
  juz30: number;
  total: number;
};

const emptyStatsBucket = (): StatsBucket => ({
  lessThan10Juz: 0,
  juz10: 0,
  juz20: 0,
  juz30: 0,
  total: 0
});

const incrementStatsBucket = (
  bucket: StatsBucket,
  category: import("@prisma/client").AchievementCategory
) => {
  if (category === "LESS_THAN_10_JUZ") {
    bucket.lessThan10Juz += 1;
  } else if (category === "JUZ_10") {
    bucket.juz10 += 1;
  } else if (category === "JUZ_20") {
    bucket.juz20 += 1;
  } else if (category === "JUZ_30") {
    bucket.juz30 += 1;
  }

  bucket.total += 1;
};

const normalizeOptionalString = (value?: string | null): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeRequiredString = (value?: string | null, fieldName = "value"): string => {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    throw new AppError(`${fieldName} is required`, 422, undefined, "VALIDATION_FAILED");
  }
  return normalized;
};

const dateOnly = (value: Date | null | undefined): string | null => {
  return value ? value.toISOString().slice(0, 10) : null;
};

const timestamp = (value: Date | null | undefined): string | null => {
  return value ? value.toISOString() : null;
};

const decimalToNumber = (value: Prisma.Decimal | number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
};

const serializeActor = (
  actor?:
    | {
        id: number;
        fullName: string;
        role: Role;
      }
    | null
) => {
  if (!actor) {
    return null;
  }

  return {
    id: actor.id,
    fullName: actor.fullName,
    role: actor.role
  };
};

const deriveAverageFromAttempt = (attempt?: ExamAttemptOutcome | null): number | null => {
  if (!attempt || typeof attempt.totalScore !== "number" || !attempt.exam.maxScore) {
    return null;
  }

  return Number(((attempt.totalScore / attempt.exam.maxScore) * 100).toFixed(2));
};

const isEligibleGoldenRecordAttemptOutcome = (attempt?: ExamAttemptOutcome | null): boolean => {
  if (!attempt) {
    return false;
  }

  if (attempt.exam.purpose !== ExamPurpose.GOLDEN_RECORD_MUSHAF) {
    return false;
  }

  if (attempt.status !== AttemptStatus.APPROVED || !attempt.reviewedAt) {
    return false;
  }

  if (typeof attempt.totalScore !== "number") {
    return false;
  }

  return attempt.totalScore >= attempt.exam.passScore;
};

const uniqueCenterIds = (scope: ScopeContext, requestedCenterId?: number): number[] | undefined => {
  if (scope.allAccess) {
    return requestedCenterId ? [requestedCenterId] : undefined;
  }

  if (requestedCenterId) {
    return [requestedCenterId];
  }

  return [...new Set(scope.centerIds)];
};

const mapUniqueError = (error: Prisma.PrismaClientKnownRequestError) => {
  const target = error.meta?.target;
  const text = Array.isArray(target) ? target.join(",") : String(target ?? "");

  if (text.includes("graduation_candidates_organization_id_student_id_year_key")) {
    return new AppError("Candidate already exists for this student and year", 409);
  }

  if (text.includes("golden_records_candidate_id_key")) {
    return new AppError("Approved candidate already has a final golden record", 409);
  }

  if (text.includes("graduation_candidates_exam_attempt_id_key")) {
    return new AppError("Exam attempt is already linked to another candidate", 409);
  }

  if (text.includes("golden_records_organization_id_student_id_year_type_key")) {
    return new AppError("Duplicate final golden record for this student, year, and type", 409);
  }

  if (text.includes("golden_records_registry_serial_key")) {
    return new AppError("Generated registry serial conflicted, retry the approval", 409);
  }

  throw error;
};

const serializeCandidate = (row: CandidateItem) => ({
  id: row.id,
  year: row.year,
  studentId: row.studentId,
  centerId: row.centerId,
  circleId: row.circleId,
  examId: row.examId,
  examAttemptId: row.examAttemptId,
  studentName: row.studentNameSnapshot,
  centerName: row.centerNameSnapshot,
  circleName: row.circleNameSnapshot,
  memorizationCompletionDate: dateOnly(row.memorizationCompletionDate),
  khatmaTestDate: dateOnly(row.khatmaTestDate),
  memorizationStartDate: dateOnly(row.memorizationStartDate),
  memorizationDurationMonths: row.memorizationDurationMonths,
  gradeSnapshot: row.gradeSnapshot,
  averageSnapshot: decimalToNumber(row.averageSnapshot),
  notes: row.notes,
  status: goldenRecordsDomain.normalizeCandidateStatus(row.status),
  statusNote: row.statusNote,
  approvedAt: timestamp(row.approvedAt),
  rejectedAt: timestamp(row.rejectedAt),
  deferredAt: timestamp(row.deferredAt),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  lockVersion: row.lockVersion,
  student: row.student
    ? {
        id: row.student.id,
        fullName: row.student.fullName,
        role: row.student.role,
        isActive: row.student.isActive
      }
    : null,
  center: row.center
    ? {
        id: row.center.id,
        name: row.center.name,
        code: row.center.code
      }
    : null,
  circle: row.circle
    ? {
        id: row.circle.id,
        name: row.circle.name,
        centerId: row.circle.centerId
      }
    : null,
  exam: row.exam
    ? {
        id: row.exam.id,
        title: row.exam.title,
        type: row.exam.type,
        purpose: row.exam.purpose,
        status: row.exam.status,
        centerId: row.exam.centerId,
        circleId: row.exam.circleId,
        scheduledAt: timestamp(row.exam.scheduledAt)
      }
    : null,
  examAttempt: row.examAttempt
    ? {
        id: row.examAttempt.id,
        examId: row.examAttempt.examId,
        studentId: row.examAttempt.studentId,
        circleId: row.examAttempt.circleId,
        examPurpose: row.examAttempt.exam.purpose,
        status: row.examAttempt.status,
        totalScore: row.examAttempt.totalScore,
        gradeLabel: row.examAttempt.gradeLabel,
        reviewedAt: timestamp(row.examAttempt.reviewedAt),
        average: deriveAverageFromAttempt(row.examAttempt),
        isEligibleForGoldenRecord: isEligibleGoldenRecordAttemptOutcome(row.examAttempt)
      }
    : null,
  goldenRecord: row.goldenRecord,
  approvedBy: serializeActor(row.approvedBy),
  rejectedBy: serializeActor(row.rejectedBy),
  deferredBy: serializeActor(row.deferredBy),
  createdBy: serializeActor(row.createdBy),
  updatedBy: serializeActor(row.updatedBy)
});

const serializeGoldenRecord = (row: GoldenRecordItem) => ({
  id: row.id,
  year: row.year,
  source: row.source,
  candidateId: row.candidateId,
  examId: row.examId,
  examAttemptId: row.examAttemptId,
  studentId: row.studentId,
  centerId: row.centerId,
  circleId: row.circleId,
  studentName: row.studentNameSnapshot,
  centerName: row.centerNameSnapshot,
  circleName: row.circleNameSnapshot,
  registrySerial: row.registrySerial,
  grade: row.grade,
  average: decimalToNumber(row.average),
  appreciation: row.appreciation,
  examDate: dateOnly(row.examDate),
  type: row.type,
  riwaya: row.riwaya,
  notes: row.notes,
  status: row.status,
  statusNote: row.statusNote,
  submittedAt: timestamp(row.submittedAt),
  approvedAt: timestamp(row.approvedAt),
  rejectedAt: timestamp(row.rejectedAt),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  lockVersion: row.lockVersion,
  candidate: row.candidate,
  student: row.student
    ? {
        id: row.student.id,
        fullName: row.student.fullName,
        role: row.student.role,
        isActive: row.student.isActive
      }
    : null,
  center: row.center
    ? {
        id: row.center.id,
        name: row.center.name,
        code: row.center.code
      }
    : null,
  circle: row.circle
    ? {
        id: row.circle.id,
        name: row.circle.name,
        centerId: row.circle.centerId
      }
    : null,
  exam: row.exam
    ? {
        id: row.exam.id,
        title: row.exam.title,
        type: row.exam.type,
        purpose: row.exam.purpose,
        status: row.exam.status,
        centerId: row.exam.centerId,
        circleId: row.exam.circleId,
        scheduledAt: timestamp(row.exam.scheduledAt)
      }
    : null,
  examAttempt: row.examAttempt
    ? {
        id: row.examAttempt.id,
        examId: row.examAttempt.examId,
        studentId: row.examAttempt.studentId,
        circleId: row.examAttempt.circleId,
        examPurpose: row.examAttempt.exam.purpose,
        status: row.examAttempt.status,
        totalScore: row.examAttempt.totalScore,
        gradeLabel: row.examAttempt.gradeLabel,
        reviewedAt: timestamp(row.examAttempt.reviewedAt),
        average: deriveAverageFromAttempt(row.examAttempt),
        isEligibleForGoldenRecord: isEligibleGoldenRecordAttemptOutcome(row.examAttempt)
      }
    : null,
  achievementSnapshot: row.achievementSnapshot
    ? {
        id: row.achievementSnapshot.id,
        year: row.achievementSnapshot.year,
        achievementCategory: row.achievementSnapshot.achievementCategory,
        juzCount: row.achievementSnapshot.juzCount,
        snapshotSource: row.achievementSnapshot.snapshotSource,
        capturedAt: timestamp(row.achievementSnapshot.capturedAt)
      }
    : null,
  submittedBy: serializeActor(row.submittedBy),
  approvedBy: serializeActor(row.approvedBy),
  rejectedBy: serializeActor(row.rejectedBy),
  createdBy: serializeActor(row.createdBy),
  updatedBy: serializeActor(row.updatedBy)
});

type CandidateEnrollment = StudentContext["studentEnrollments"][number];

const normalizeDateValue = (value: Date) => {
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const resolveCandidateEnrollment = (student: StudentContext): CandidateEnrollment => {
  const activeEnrollments = student.studentEnrollments.filter((item) => item.circle?.center);

  if (activeEnrollments.length === 0) {
    throw new AppError(
      "Student must have one active halaqa before nomination",
      422,
      undefined,
      "VALIDATION_FAILED"
    );
  }

  if (activeEnrollments.length > 1) {
    throw new AppError(
      "Student has multiple active halaqas; nomination requires exactly one active halaqa",
      422,
      undefined,
      "AMBIGUOUS_ACTIVE_HALAKA"
    );
  }

  return activeEnrollments[0];
};

const calculateMemorizationDurationMonths = (startDate: Date, completionDate: Date) => {
  const normalizedStartDate = normalizeDateValue(startDate);
  const normalizedCompletionDate = normalizeDateValue(completionDate);

  if (normalizedCompletionDate.getTime() < normalizedStartDate.getTime()) {
    throw new AppError(
      "Memorization completion date cannot be earlier than memorization start date",
      422,
      undefined,
      "INVALID_MEMORIZATION_TIMELINE"
    );
  }

  let months =
    (normalizedCompletionDate.getFullYear() - normalizedStartDate.getFullYear()) * 12 +
    (normalizedCompletionDate.getMonth() - normalizedStartDate.getMonth());

  if (normalizedCompletionDate.getDate() < normalizedStartDate.getDate()) {
    months -= 1;
  }

  return Math.max(months, 0);
};

const ensureStudentContext = async (organizationId: number, studentId: number) => {
  const student = await goldenRecordsRepository.findStudentContext({
    organizationId,
    studentId
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  return student;
};

const resolveCandidateNominationContext = async (input: {
  scope: ScopeContext;
  studentId: number;
  memorizationCompletionDate?: Date | null;
}) => {
  const student = await ensureStudentContext(input.scope.organizationId, input.studentId);
  const enrollment = resolveCandidateEnrollment(student);
  const center = enrollment.circle.center;
  const circle = enrollment.circle;

  goldenRecordsDomain.assertScopeFilters(input.scope, {
    centerId: center.id,
    circleId: circle.id
  });

  const earliestEnrollmentStartDate =
    await goldenRecordsRepository.findEarliestStudentEnrollmentStartDate({
      organizationId: input.scope.organizationId,
      studentId: student.id
    });

  const memorizationStartDate = earliestEnrollmentStartDate
    ? normalizeDateValue(earliestEnrollmentStartDate)
    : student.studentProfile?.joinDate
      ? normalizeDateValue(student.studentProfile.joinDate)
      : null;

  const memorizationDurationMonths =
    input.memorizationCompletionDate && memorizationStartDate
      ? calculateMemorizationDurationMonths(
          memorizationStartDate,
          input.memorizationCompletionDate
        )
      : null;

  return {
    student,
    center,
    circle,
    memorizationStartDate,
    memorizationDurationMonths
  };
};

const resolveCandidateExamAttemptLinkContext = async (input: {
  organizationId: number;
  candidate: CandidateItem;
  examAttemptId: number;
}) => {
  const examAttempt = await goldenRecordsRepository.findExamAttemptOutcome({
    examAttemptId: input.examAttemptId,
    organizationId: input.organizationId
  });

  if (!examAttempt) {
    throw new AppError("Exam attempt not found", 404);
  }

  if (examAttempt.exam.purpose !== ExamPurpose.GOLDEN_RECORD_MUSHAF) {
    throw new AppError(
      "Exam attempt must belong to a GOLDEN_RECORD_MUSHAF exam",
      422,
      {
        examAttemptId: examAttempt.id,
        examId: examAttempt.examId,
        purpose: examAttempt.exam.purpose
      },
      "INVALID_EXAM_PURPOSE"
    );
  }

  if (examAttempt.studentId !== input.candidate.studentId) {
    throw new AppError("Exam attempt belongs to a different student", 422);
  }

  if (examAttempt.exam.centerId !== input.candidate.centerId) {
    throw new AppError("Exam attempt belongs to a different center", 422);
  }

  return examAttempt;
};

const resolveExamContext = async (input: {
  organizationId: number;
  studentId: number;
  centerId: number;
  circleId?: number | null;
  examId?: number | null;
  examAttemptId?: number | null;
}) => {
  const [exam, examAttempt] = await Promise.all([
    input.examId
      ? goldenRecordsRepository.findExamById({
          examId: input.examId,
          organizationId: input.organizationId
        })
      : Promise.resolve(null),
    input.examAttemptId
      ? goldenRecordsRepository.findExamAttemptOutcome({
          examAttemptId: input.examAttemptId,
          organizationId: input.organizationId
        })
      : Promise.resolve(null)
  ]);

  const resolvedExam = examAttempt?.exam ?? exam;

  if (input.examId && !exam) {
    throw new AppError("Exam not found", 404);
  }

  if (input.examAttemptId && !examAttempt) {
    throw new AppError("Exam attempt not found", 404);
  }

  if (examAttempt) {
    if (examAttempt.studentId !== input.studentId) {
      throw new AppError("Exam attempt belongs to a different student", 422);
    }

    if (examAttempt.exam.centerId !== input.centerId) {
      throw new AppError("Exam attempt belongs to a different center", 422);
    }

    if (
      input.circleId !== undefined &&
      input.circleId !== null &&
      examAttempt.circleId !== input.circleId
    ) {
      throw new AppError("Exam attempt belongs to a different halaqa", 422);
    }

    if (input.examId && examAttempt.examId !== input.examId) {
      throw new AppError("Exam attempt does not belong to the supplied exam", 422);
    }
  }

  if (resolvedExam) {
    if (resolvedExam.centerId !== input.centerId) {
      throw new AppError("Exam belongs to a different center", 422);
    }

    if (
      input.circleId !== undefined &&
      input.circleId !== null &&
      resolvedExam.circleId !== null &&
      resolvedExam.circleId !== input.circleId
    ) {
      throw new AppError("Exam belongs to a different halaqa", 422);
    }
  }

  return {
    exam: resolvedExam,
    examAttempt
  };
};

const loadCandidateInScope = async (scope: ScopeContext, candidateId: number) => {
  const candidate = await goldenRecordsRepository.findCandidateById({
    id: candidateId,
    organizationId: scope.organizationId
  });

  if (!candidate) {
    throw new AppError("Graduation candidate not found", 404);
  }

  goldenRecordsDomain.assertScopeFilters(scope, {
    centerId: candidate.centerId,
    circleId: candidate.circleId
  });

  return candidate;
};

const loadGoldenRecordInScope = async (scope: ScopeContext, recordId: number) => {
  const record = await goldenRecordsRepository.findGoldenRecordById({
    id: recordId,
    organizationId: scope.organizationId
  });

  if (!record) {
    throw new AppError("Final golden record not found", 404);
  }

  goldenRecordsDomain.assertScopeFilters(scope, {
    centerId: record.centerId,
    circleId: record.circleId ?? undefined
  });

  return record;
};

const assertEligibleGoldenRecordAttemptOutcome = (attempt: ExamAttemptOutcome) => {
  if (attempt.exam.purpose !== ExamPurpose.GOLDEN_RECORD_MUSHAF) {
    throw new AppError(
      "Final golden record requires an exam attempt from a GOLDEN_RECORD_MUSHAF exam",
      422,
      { examAttemptId: attempt.id, examId: attempt.examId, purpose: attempt.exam.purpose },
      "INVALID_EXAM_PURPOSE"
    );
  }

  if (attempt.status !== AttemptStatus.APPROVED || !attempt.reviewedAt) {
    throw new AppError("Final golden record requires an approved exam attempt", 422);
  }

  if (typeof attempt.totalScore !== "number") {
    throw new AppError("Approved exam attempt must include a final score", 422);
  }

  if (attempt.totalScore < attempt.exam.passScore) {
    throw new AppError(
      "Final golden record requires an eligible approved exam result",
      422,
      {
        examAttemptId: attempt.id,
        totalScore: attempt.totalScore,
        passScore: attempt.exam.passScore
      },
      "INELIGIBLE_EXAM_RESULT"
    );
  }
};

const resolveEligibleCandidateFinalRecordAttempt = async (input: {
  organizationId: number;
  candidate: CandidateItem;
}) => {
  if (!input.candidate.examAttemptId) {
    throw new AppError(
      "Approved candidate must be linked to an exam attempt before a final golden record can proceed",
      422,
      { candidateId: input.candidate.id },
      "EXAM_ATTEMPT_REQUIRED"
    );
  }

  const attempt = await goldenRecordsRepository.findExamAttemptOutcome({
    examAttemptId: input.candidate.examAttemptId,
    organizationId: input.organizationId
  });

  if (!attempt) {
    throw new AppError("Linked exam attempt not found", 404);
  }

  if (
    attempt.studentId !== input.candidate.studentId ||
    attempt.exam.centerId !== input.candidate.centerId
  ) {
    throw new AppError("Linked exam attempt no longer matches the approved candidate", 422);
  }

  assertEligibleGoldenRecordAttemptOutcome(attempt);

  return attempt;
};

const assertGoldenRecordDocumentationReady = (record: GoldenRecordItem) => {
  if (!record.grade || !record.appreciation || record.average === null || !record.examDate) {
    throw new AppError(
      "Final golden record requires grade, average, appreciation, and examDate before submission or approval",
      422,
      undefined,
      "VALIDATION_FAILED"
    );
  }
};

const assertGoldenRecordCandidateGate = async (
  scope: ScopeContext,
  record: GoldenRecordItem
) => {
  if (record.source !== GoldenRecordSource.CANDIDATE) {
    let attempt: ExamAttemptOutcome | null = null;
    if (record.source === GoldenRecordSource.EXAM_BASED) {
      if (!record.examAttemptId) {
        throw new AppError("Exam-based golden record requires an exam attempt", 422);
      }
      attempt = await goldenRecordsRepository.findExamAttemptOutcome({
        examAttemptId: record.examAttemptId,
        organizationId: scope.organizationId
      });
      if (!attempt) {
        throw new AppError("Linked exam attempt not found", 404);
      }
      assertEligibleGoldenRecordAttemptOutcome(attempt);
    }
    return {
      candidate: null,
      examAttempt: attempt
    };
  }

  if (!record.candidateId) {
    throw new AppError(
      "Final golden record must be linked to an approved graduation candidate",
      422,
      { recordId: record.id },
      "CANDIDATE_REQUIRED"
    );
  }

  const candidate = await loadCandidateInScope(scope, record.candidateId);
  if (candidate.status !== GraduationCandidateStatus.APPROVED) {
    throw new AppError(
      "Linked candidate must stay approved before the final golden record can proceed",
      409,
      { candidateId: candidate.id, status: candidate.status },
      "CANDIDATE_NOT_APPROVED"
    );
  }

  const attempt = await resolveEligibleCandidateFinalRecordAttempt({
    organizationId: scope.organizationId,
    candidate
  });

  if (!record.examAttemptId || record.examAttemptId !== attempt.id) {
    throw new AppError(
      "Final golden record must stay linked to the candidate's approved exam attempt",
      422,
      { recordId: record.id, candidateId: candidate.id, examAttemptId: record.examAttemptId },
      "EXAM_ATTEMPT_MISMATCH"
    );
  }

  if (record.studentId !== candidate.studentId || record.centerId !== candidate.centerId) {
    throw new AppError("Final golden record no longer matches the linked candidate context", 422);
  }

  if (record.examId !== null && record.examId !== attempt.examId) {
    throw new AppError("Final golden record exam no longer matches the linked exam attempt", 422);
  }

  return {
    candidate,
    examAttempt: attempt
  };
};

const syncCurrentYearSnapshots = async (
  scope: ScopeContext,
  year: number,
  centerId?: number
) => {
  if (year !== goldenRecordsDomain.currentYear()) {
    return;
  }

  const scopedCenterIds = uniqueCenterIds(scope, centerId);
  if (scopedCenterIds && scopedCenterIds.length === 0) {
    return;
  }

  const sources = await goldenRecordsRepository.findActiveStudentAchievementSources({
    organizationId: scope.organizationId,
    centerIds: scopedCenterIds
  });

  if (!sources.length) {
    return;
  }

  const latestByStudent = new Map<number, (typeof sources)[number]>();
  for (const source of sources) {
    if (!latestByStudent.has(source.studentId)) {
      latestByStudent.set(source.studentId, source);
    }
  }

  const studentIds = [...latestByStudent.keys()];
  const existingSnapshots = await goldenRecordsRepository.findAchievementSnapshotsByStudentYear({
    organizationId: scope.organizationId,
    year,
    studentIds
  });
  const existingByStudentId = new Map(existingSnapshots.map((item) => [item.studentId, item]));

  await prisma.$transaction(async (tx) => {
    for (const source of latestByStudent.values()) {
      const existingSnapshot = existingByStudentId.get(source.studentId);
      if (existingSnapshot?.goldenRecordId) {
        continue;
      }

      const juzCount = Math.max(0, Math.min(30, source.student.studentProfile?.currentJuzz ?? 0));
      const achievementCategory = goldenRecordsDomain.deriveAchievementCategory(juzCount);

      await goldenRecordsRepository.upsertAchievementSnapshot(
        {
          organizationId: scope.organizationId,
          year,
          studentId: source.studentId,
          centerId: source.circle.centerId,
          circleId: source.circleId,
          achievementCategory,
          juzCount,
          snapshotSource: PROFILE_SYNC_SOURCE,
          capturedById: scope.userId
        },
        tx
      );
    }
  });
};

export const goldenRecordsService = {
  async listCandidates(scope: ScopeContext, query: ListCandidatesQuery) {
    goldenRecordsDomain.assertModuleAccess(scope);
    goldenRecordsDomain.assertScopeFilters(scope, {
      centerId: query.centerId,
      circleId: query.circleId
    });

    const year = goldenRecordsDomain.resolveYear(query.year);
    const scopedCenterIds = uniqueCenterIds(scope, query.centerId);

    if (scopedCenterIds && scopedCenterIds.length === 0) {
      return {
        items: [],
        total: 0,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 10
      };
    }

    const result = await goldenRecordsRepository.listCandidates({
      organizationId: scope.organizationId,
      centerIds: scopedCenterIds,
      circleIds: query.circleId ? [query.circleId] : undefined,
      search: normalizeOptionalString(query.search) ?? undefined,
      year,
      status: query.status,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10
    });

    return {
      items: result.items.map(serializeCandidate),
      total: result.total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10
    };
  },

  async createCandidate(scope: ScopeContext, input: CreateCandidateInput) {
    goldenRecordsDomain.assertModuleAccess(scope);
    goldenRecordsDomain.assertCanManageCandidateNominations(scope);

    const year = goldenRecordsDomain.resolveYear();
    const memorizationCompletionDate = goldenRecordsDomain.parseDateOnly(
      input.memorizationCompletionDate,
      "memorizationCompletionDate"
    );
    const khatmaTestDate = goldenRecordsDomain.parseDateOnly(
      input.khatmaTestDate,
      "khatmaTestDate"
    );
    const nominationContext = await resolveCandidateNominationContext({
      scope,
      studentId: input.studentId,
      memorizationCompletionDate
    });

    const existing = await goldenRecordsRepository.findCandidateByStudentYear({
      organizationId: scope.organizationId,
      studentId: nominationContext.student.id,
      year
    });

    if (existing) {
      throw new AppError("Candidate already exists for this student and year", 409);
    }

    try {
      const created = await goldenRecordsRepository.createCandidate({
        organizationId: scope.organizationId,
        year,
        studentId: nominationContext.student.id,
        centerId: nominationContext.center.id,
        circleId: nominationContext.circle.id,
        examId: null,
        examAttemptId: null,
        studentNameSnapshot: nominationContext.student.fullName,
        centerNameSnapshot: nominationContext.center.name,
        circleNameSnapshot: nominationContext.circle.name,
        memorizationCompletionDate,
        khatmaTestDate,
        memorizationStartDate: nominationContext.memorizationStartDate,
        memorizationDurationMonths: nominationContext.memorizationDurationMonths,
        gradeSnapshot: null,
        averageSnapshot: null,
        notes: normalizeOptionalString(input.notes) ?? null,
        status: GraduationCandidateStatus.NOMINATED,
        createdById: scope.userId
      });

      return serializeCandidate(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw mapUniqueError(error);
      }
      throw error;
    }
  },

  async updateCandidate(scope: ScopeContext, candidateId: number, input: UpdateCandidateInput) {
    goldenRecordsDomain.assertModuleAccess(scope);
    goldenRecordsDomain.assertCanManageCandidateNominations(scope);

    const existing = await loadCandidateInScope(scope, candidateId);
    goldenRecordsDomain.assertCandidateEditable(existing.status);

    if (existing.goldenRecord) {
      throw new AppError("Candidate already has a linked final golden record and is locked", 409);
    }

    const memorizationCompletionDate =
      input.memorizationCompletionDate === undefined
        ? existing.memorizationCompletionDate
        : goldenRecordsDomain.parseDateOnly(
            input.memorizationCompletionDate,
            "memorizationCompletionDate"
          );
    const khatmaTestDate =
      input.khatmaTestDate === undefined
        ? existing.khatmaTestDate
        : goldenRecordsDomain.parseDateOnly(input.khatmaTestDate, "khatmaTestDate");
    const nominationContext = await resolveCandidateNominationContext({
      scope,
      studentId: existing.studentId,
      memorizationCompletionDate: memorizationCompletionDate ?? null
    });
    const shouldResubmitNomination =
      existing.status !== GraduationCandidateStatus.NOMINATED;

    if (shouldResubmitNomination) {
      goldenRecordsDomain.assertValidCandidateTransition(
        existing.status,
        GraduationCandidateStatus.NOMINATED
      );
    }

    try {
      const updated = await goldenRecordsRepository.updateCandidate({
        id: existing.id,
        lockVersion: input.lockVersion,
        data: {
          centerId: nominationContext.center.id,
          circleId: nominationContext.circle.id,
          examId: shouldResubmitNomination ? null : undefined,
          examAttemptId: shouldResubmitNomination ? null : undefined,
          studentNameSnapshot: nominationContext.student.fullName,
          centerNameSnapshot: nominationContext.center.name,
          circleNameSnapshot: nominationContext.circle.name,
          memorizationCompletionDate,
          khatmaTestDate,
          memorizationStartDate: nominationContext.memorizationStartDate,
          memorizationDurationMonths: nominationContext.memorizationDurationMonths,
          gradeSnapshot: shouldResubmitNomination ? null : undefined,
          averageSnapshot: shouldResubmitNomination ? null : undefined,
          notes:
            input.notes === undefined ? undefined : normalizeOptionalString(input.notes) ?? null,
          status: GraduationCandidateStatus.NOMINATED,
          statusNote: shouldResubmitNomination ? null : undefined,
          rejectedById: shouldResubmitNomination ? null : undefined,
          rejectedAt: shouldResubmitNomination ? null : undefined,
          deferredById: shouldResubmitNomination ? null : undefined,
          deferredAt: shouldResubmitNomination ? null : undefined,
          updatedById: scope.userId
        }
      });

      if (!updated) {
        throw new AppError(
          "Candidate was modified by another request",
          409,
          { candidateId: existing.id },
          "VERSION_CONFLICT"
        );
      }

      return serializeCandidate(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw mapUniqueError(error);
      }
      throw error;
    }
  },
  async approveCandidate(
    scope: ScopeContext,
    candidateId: number,
    input: { statusNote?: string | null; lockVersion?: number }
  ) {
    goldenRecordsDomain.assertModuleAccess(scope);
    goldenRecordsDomain.assertCanApproveCandidates(scope);

    const existing = await loadCandidateInScope(scope, candidateId);
    if (existing.goldenRecord) {
      throw new AppError("Candidate already has a linked final golden record", 409);
    }

    if (existing.status === GraduationCandidateStatus.APPROVED) {
      return serializeCandidate(existing);
    }

    goldenRecordsDomain.assertValidCandidateTransition(
      existing.status,
      GraduationCandidateStatus.APPROVED
    );

    const updated = await prisma.$transaction(async (tx) => {
      const approved = await goldenRecordsRepository.updateCandidate(
        {
          id: existing.id,
          lockVersion: input.lockVersion,
          data: {
            status: GraduationCandidateStatus.APPROVED,
            statusNote:
              input.statusNote === undefined
                ? undefined
                : normalizeOptionalString(input.statusNote) ?? null,
            approvedById: scope.userId,
            approvedAt: new Date(),
            rejectedById: null,
            rejectedAt: null,
            deferredById: null,
            deferredAt: null,
            updatedById: scope.userId
          }
        },
        tx
      );

      if (!approved) {
        throw new AppError(
          "Candidate was modified by another request",
          409,
          { candidateId: existing.id },
          "VERSION_CONFLICT"
        );
      }

      await notificationsService.notifyGoldenRecordNominationApproved(
        {
          organizationId: scope.organizationId,
          centerId: approved.centerId,
          circleId: approved.circleId,
          candidateId: approved.id,
          studentId: approved.studentId,
          studentName: approved.studentNameSnapshot,
          centerName: approved.centerNameSnapshot,
          circleName: approved.circleNameSnapshot,
          year: approved.year,
          mushafExamDate: approved.khatmaTestDate,
          approvedByUserId: scope.userId
        },
        tx
      );

      return approved;
    });

    return serializeCandidate(updated);
  },

  async rejectCandidate(
    scope: ScopeContext,
    candidateId: number,
    input: { statusNote: string; lockVersion?: number }
  ) {
    goldenRecordsDomain.assertModuleAccess(scope);
    goldenRecordsDomain.assertCanApproveCandidates(scope);

    const existing = await loadCandidateInScope(scope, candidateId);
    if (existing.goldenRecord) {
      throw new AppError("Candidate already has a linked final golden record", 409);
    }

    goldenRecordsDomain.assertValidCandidateTransition(
      existing.status,
      GraduationCandidateStatus.REJECTED
    );

    const updated = await goldenRecordsRepository.updateCandidate({
      id: existing.id,
      lockVersion: input.lockVersion,
      data: {
        status: GraduationCandidateStatus.REJECTED,
        statusNote: input.statusNote.trim(),
        rejectedById: scope.userId,
        rejectedAt: new Date(),
        approvedById: null,
        approvedAt: null,
        deferredById: null,
        deferredAt: null,
        updatedById: scope.userId
      }
    });

    if (!updated) {
      throw new AppError(
        "Candidate was modified by another request",
        409,
        { candidateId: existing.id },
        "VERSION_CONFLICT"
      );
    }

    return serializeCandidate(updated);
  },

  async deferCandidate(
    scope: ScopeContext,
    candidateId: number,
    input: { statusNote: string; lockVersion?: number }
  ) {
    goldenRecordsDomain.assertModuleAccess(scope);
    goldenRecordsDomain.assertCanApproveCandidates(scope);

    const existing = await loadCandidateInScope(scope, candidateId);
    if (existing.goldenRecord) {
      throw new AppError("Candidate already has a linked final golden record", 409);
    }

    goldenRecordsDomain.assertValidCandidateTransition(
      existing.status,
      GraduationCandidateStatus.DEFERRED
    );

    const updated = await goldenRecordsRepository.updateCandidate({
      id: existing.id,
      lockVersion: input.lockVersion,
      data: {
        status: GraduationCandidateStatus.DEFERRED,
        statusNote: input.statusNote.trim(),
        deferredById: scope.userId,
        deferredAt: new Date(),
        approvedById: null,
        approvedAt: null,
        rejectedById: null,
        rejectedAt: null,
        updatedById: scope.userId
      }
    });

    if (!updated) {
      throw new AppError(
        "Candidate was modified by another request",
        409,
        { candidateId: existing.id },
        "VERSION_CONFLICT"
      );
    }

    return serializeCandidate(updated);
  },

  async linkCandidateExamAttempt(
    scope: ScopeContext,
    candidateId: number,
    input: LinkCandidateExamAttemptInput
  ) {
    goldenRecordsDomain.assertModuleAccess(scope);
    goldenRecordsDomain.assertCanManageCandidateExamLinkage(scope);

    const candidate = await loadCandidateInScope(scope, candidateId);

    if (candidate.status !== GraduationCandidateStatus.APPROVED) {
      throw new AppError(
        "Only approved candidates can be linked to exam attempts",
        409,
        { candidateId: candidate.id, status: candidate.status },
        "CANDIDATE_NOT_APPROVED"
      );
    }

    if (candidate.goldenRecord) {
      throw new AppError("Candidate already has a linked final golden record", 409);
    }

    const examAttempt = await resolveCandidateExamAttemptLinkContext({
      organizationId: scope.organizationId,
      candidate,
      examAttemptId: input.examAttemptId
    });

    try {
      const updated = await goldenRecordsRepository.updateCandidate({
        id: candidate.id,
        lockVersion: input.lockVersion,
        data: {
          examId: examAttempt.examId,
          examAttemptId: examAttempt.id,
          gradeSnapshot: null,
          averageSnapshot: null,
          updatedById: scope.userId
        }
      });

      if (!updated) {
        throw new AppError(
          "Candidate was modified by another request",
          409,
          { candidateId: candidate.id },
          "VERSION_CONFLICT"
        );
      }

      return serializeCandidate(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw mapUniqueError(error);
      }
      throw error;
    }
  },

  async listGoldenRecords(scope: ScopeContext, query: ListGoldenRecordsQuery) {
    goldenRecordsDomain.assertModuleAccess(scope);
    goldenRecordsDomain.assertScopeFilters(scope, {
      centerId: query.centerId,
      circleId: query.circleId
    });

    const year = goldenRecordsDomain.resolveYear(query.year);
    const scopedCenterIds = uniqueCenterIds(scope, query.centerId);

    if (scopedCenterIds && scopedCenterIds.length === 0) {
      return {
        items: [],
        total: 0,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 10
      };
    }

    const result = await goldenRecordsRepository.listGoldenRecords({
      organizationId: scope.organizationId,
      centerIds: scopedCenterIds,
      circleIds: query.circleId ? [query.circleId] : undefined,
      search: normalizeOptionalString(query.search) ?? undefined,
      year,
      type: query.type,
      riwaya: query.riwaya,
      status: query.status,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10
    });

    return {
      items: result.items.map(serializeGoldenRecord),
      total: result.total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10
    };
  },

  async createGoldenRecord(scope: ScopeContext, input: CreateGoldenRecordInput) {
    goldenRecordsDomain.assertModuleAccess(scope);
    goldenRecordsDomain.assertRiwayaRule(input.type, input.riwaya);

    let candidate = null;
    let studentId = input.studentId;
    let centerId = input.centerId;
    let circleId: number | null = null;
    let studentNameSnapshot = "";
    let centerNameSnapshot = "";
    let circleNameSnapshot: string | null = null;
    let examId: number | null = null;
    let examAttemptId: number | null = null;
    let source: GoldenRecordSource = GoldenRecordSource.MANUAL;
    let resolvedExamAttempt: ExamAttemptOutcome | null = null;

    if (input.candidateId) {
      candidate = await loadCandidateInScope(scope, input.candidateId);
      if (candidate.status !== GraduationCandidateStatus.APPROVED) {
        throw new AppError("Candidate must be approved before creating a linked final golden record", 409);
      }

      if (candidate.goldenRecord) {
        throw new AppError("Candidate already has a linked final golden record", 409);
      }

      resolvedExamAttempt = await resolveEligibleCandidateFinalRecordAttempt({
        organizationId: scope.organizationId,
        candidate
      });

      studentId = candidate.studentId;
      centerId = candidate.centerId;
      circleId = candidate.circleId;
      studentNameSnapshot = candidate.studentNameSnapshot;
      centerNameSnapshot = candidate.centerNameSnapshot;
      circleNameSnapshot = candidate.circleNameSnapshot;
      examId = resolvedExamAttempt.examId;
      examAttemptId = resolvedExamAttempt.id;
      source = GoldenRecordSource.CANDIDATE;
    } else {
      const student = await ensureStudentContext(scope.organizationId, input.studentId);
      studentNameSnapshot = student.fullName ?? "";
      
      const center = await goldenRecordsRepository.findCenterById({
        centerId: input.centerId,
        organizationId: scope.organizationId
      });
      
      if (!center) throw new AppError("Center not found", 404);
      goldenRecordsDomain.assertScopeFilters(scope, { centerId: center.id });

      centerNameSnapshot = center.name;

    }

    const grade = normalizeOptionalString(input.grade) ?? resolvedExamAttempt?.gradeLabel;
    const average = input.average ?? deriveAverageFromAttempt(resolvedExamAttempt);
    const appreciation = normalizeOptionalString(input.appreciation) ?? resolvedExamAttempt?.gradeLabel;
    const examDate =
      input.examDate !== undefined
        ? goldenRecordsDomain.parseDateOnly(input.examDate, "examDate")
        : resolvedExamAttempt?.exam.scheduledAt
          ? goldenRecordsDomain.parseDateOnly(
              resolvedExamAttempt.exam.scheduledAt.toISOString(),
              "scheduledAt"
            )
          : resolvedExamAttempt?.reviewedAt
            ? goldenRecordsDomain.parseDateOnly(
                resolvedExamAttempt.reviewedAt.toISOString(),
                "reviewedAt"
              )
            : null;

    if (!grade || average === null || average === undefined || !appreciation || !examDate) {
      throw new AppError(
        "Final golden record requires grade, average, appreciation, and examDate before creation",
        422,
        undefined,
        "VALIDATION_FAILED"
      );
    }

    try {
      const created = await goldenRecordsRepository.createGoldenRecord({
        organizationId: scope.organizationId,
        year: candidate?.year ?? goldenRecordsDomain.currentYear(),
        source,
        candidateId: candidate?.id ?? null,
        examId,
        examAttemptId,
        studentId,
        centerId,
        circleId,
        studentNameSnapshot,
        centerNameSnapshot,
        circleNameSnapshot,
        grade,
        average,
        appreciation,
        examDate,
        type: input.type,
        riwaya: input.riwaya ?? null,
        notes: normalizeOptionalString(input.notes) ?? null,
        status: GoldenRecordStatus.DRAFT,
        createdById: scope.userId
      });

      return serializeGoldenRecord(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw mapUniqueError(error);
      }
      throw error;
    }
  },

  async updateGoldenRecord(scope: ScopeContext, recordId: number, input: UpdateGoldenRecordInput) {
    goldenRecordsDomain.assertModuleAccess(scope);

    const existing = await loadGoldenRecordInScope(scope, recordId);
    goldenRecordsDomain.assertGoldenRecordEditable(existing.status);

    if (input.examId !== undefined || input.examAttemptId !== undefined) {
      throw new AppError(
        "Final golden records do not manage exam bindings. Link the approved exam attempt on the graduation candidate before creating the final record.",
        409,
        { recordId: existing.id },
        "EXAM_BINDING_LOCKED"
      );
    }

    if (existing.candidateId && input.circleId !== undefined) {
      throw new AppError("Candidate-linked final records keep their candidate exam and halaqa bindings", 409);
    }

    const nextType = input.type ?? existing.type;
    const nextRiwaya = input.riwaya !== undefined ? input.riwaya : existing.riwaya;
    goldenRecordsDomain.assertRiwayaRule(nextType, nextRiwaya);

    const nextCircleId =
      input.circleId === undefined
        ? existing.circleId
        : input.circleId === null
          ? null
          : input.circleId;

    if (nextCircleId !== null && nextCircleId !== undefined) {
      goldenRecordsDomain.assertScopeFilters(scope, {
        centerId: existing.centerId,
        circleId: nextCircleId
      });
    }

    const circle =
      nextCircleId === null
        ? null
        : nextCircleId === existing.circleId
          ? existing.circle
          : await goldenRecordsRepository.findCircleById({
              circleId: nextCircleId,
              organizationId: scope.organizationId
            });

    if (nextCircleId !== null && nextCircleId !== undefined && !circle) {
      throw new AppError("Halaqa not found", 404);
    }

    if (circle && circle.centerId !== existing.centerId) {
      throw new AppError("Selected halaqa does not belong to the golden record center", 422);
    }

    const nextGrade =
      input.grade !== undefined ? normalizeRequiredString(input.grade, "grade") : existing.grade;
    const nextAverage =
      input.average !== undefined ? input.average : decimalToNumber(existing.average) ?? 0;
    const nextAppreciation =
      input.appreciation !== undefined
        ? normalizeRequiredString(input.appreciation, "appreciation")
        : existing.appreciation;
    const nextExamDate =
      input.examDate !== undefined
        ? goldenRecordsDomain.parseDateOnly(input.examDate, "examDate")
        : existing.examDate;

    const updated = await goldenRecordsRepository.updateGoldenRecord({
      id: existing.id,
      lockVersion: input.lockVersion,
      data: {
        examId: existing.examId,
        examAttemptId: existing.examAttemptId,
        circleId: nextCircleId ?? null,
        circleNameSnapshot: circle?.name ?? null,
        type: nextType,
        riwaya: nextRiwaya ?? null,
        grade: nextGrade,
        average: nextAverage,
        appreciation: nextAppreciation,
        examDate: nextExamDate,
        notes:
          input.notes === undefined ? undefined : normalizeOptionalString(input.notes) ?? null,
        updatedById: scope.userId
      }
    });

    if (!updated) {
      throw new AppError(
        "Final golden record was modified by another request",
        409,
        { recordId: existing.id },
        "VERSION_CONFLICT"
      );
    }

    return serializeGoldenRecord(updated);
  },

  async submitGoldenRecord(
    scope: ScopeContext,
    recordId: number,
    input: { statusNote?: string | null; lockVersion?: number }
  ) {
    goldenRecordsDomain.assertModuleAccess(scope);

    const existing = await loadGoldenRecordInScope(scope, recordId);
    goldenRecordsDomain.assertValidGoldenRecordTransition(
      existing.status,
      GoldenRecordStatus.SUBMITTED
    );
    goldenRecordsDomain.assertRiwayaRule(existing.type, existing.riwaya);
    await assertGoldenRecordCandidateGate(scope, existing);
    assertGoldenRecordDocumentationReady(existing);

    const updated = await goldenRecordsRepository.updateGoldenRecord({
      id: existing.id,
      lockVersion: input.lockVersion,
      data: {
        status: GoldenRecordStatus.SUBMITTED,
        statusNote:
          input.statusNote === undefined
            ? undefined
            : normalizeOptionalString(input.statusNote) ?? null,
        submittedById: scope.userId,
        submittedAt: new Date(),
        rejectedById: null,
        rejectedAt: null,
        updatedById: scope.userId
      }
    });

    if (!updated) {
      throw new AppError(
        "Final golden record was modified by another request",
        409,
        { recordId: existing.id },
        "VERSION_CONFLICT"
      );
    }

    return serializeGoldenRecord(updated);
  },

  async approveGoldenRecord(
    scope: ScopeContext,
    recordId: number,
    input: { statusNote?: string | null; lockVersion?: number }
  ) {
    goldenRecordsDomain.assertModuleAccess(scope);
    goldenRecordsDomain.assertCanApproveGoldenRecords(scope);

    const existing = await loadGoldenRecordInScope(scope, recordId);
    goldenRecordsDomain.assertValidGoldenRecordTransition(
      existing.status,
      GoldenRecordStatus.APPROVED
    );
    goldenRecordsDomain.assertRiwayaRule(existing.type, existing.riwaya);
    await assertGoldenRecordCandidateGate(scope, existing);
    assertGoldenRecordDocumentationReady(existing);

    const updated = await prisma.$transaction(async (tx) => {
      const approved = await goldenRecordsRepository.updateGoldenRecord(
        {
          id: existing.id,
          lockVersion: input.lockVersion,
          data: {
            status: GoldenRecordStatus.APPROVED,
            statusNote:
              input.statusNote === undefined
                ? undefined
                : normalizeOptionalString(input.statusNote) ?? null,
            approvedById: scope.userId,
            approvedAt: new Date(),
            rejectedById: null,
            rejectedAt: null,
            registrySerial:
              existing.registrySerial ??
              goldenRecordsDomain.buildRegistrySerial({
                organizationId: existing.organizationId,
                year: existing.year,
                recordId: existing.id
              }),
            updatedById: scope.userId
          }
        },
        tx
      );

      if (!approved) {
        throw new AppError(
          "Final golden record was modified by another request",
          409,
          { recordId: existing.id },
          "VERSION_CONFLICT"
        );
      }

      await goldenRecordsRepository.upsertAchievementSnapshot(
        {
          organizationId: approved.organizationId,
          year: approved.year,
          studentId: approved.studentId,
          centerId: approved.centerId,
          circleId: approved.circleId ?? null,
          achievementCategory: goldenRecordsDomain.deriveAchievementCategory(30),
          juzCount: 30,
          goldenRecordId: approved.id,
          snapshotSource: GOLDEN_APPROVAL_SOURCE,
          capturedById: scope.userId
        },
        tx
      );

      return approved;
    });

    return serializeGoldenRecord(updated);
  },

  async rejectGoldenRecord(
    scope: ScopeContext,
    recordId: number,
    input: { statusNote: string; lockVersion?: number }
  ) {
    goldenRecordsDomain.assertModuleAccess(scope);
    goldenRecordsDomain.assertCanApproveGoldenRecords(scope);

    const existing = await loadGoldenRecordInScope(scope, recordId);
    goldenRecordsDomain.assertValidGoldenRecordTransition(
      existing.status,
      GoldenRecordStatus.REJECTED
    );

    const updated = await goldenRecordsRepository.updateGoldenRecord({
      id: existing.id,
      lockVersion: input.lockVersion,
      data: {
        status: GoldenRecordStatus.REJECTED,
        statusNote: input.statusNote.trim(),
        rejectedById: scope.userId,
        rejectedAt: new Date(),
        approvedById: null,
        approvedAt: null,
        updatedById: scope.userId
      }
    });

    if (!updated) {
      throw new AppError(
        "Final golden record was modified by another request",
        409,
        { recordId: existing.id },
        "VERSION_CONFLICT"
      );
    }

    return serializeGoldenRecord(updated);
  },

  async getStats(scope: ScopeContext, query: GoldenRecordStatsQuery) {
    goldenRecordsDomain.assertModuleAccess(scope);
    goldenRecordsDomain.assertScopeFilters(scope, {
      centerId: query.centerId
    });

    const year = goldenRecordsDomain.resolveYear(query.year);
    await syncCurrentYearSnapshots(scope, year, query.centerId);

    const scopedCenterIds = uniqueCenterIds(scope, query.centerId);
    if (scopedCenterIds && scopedCenterIds.length === 0) {
      return {
        year,
        centerId: query.centerId ?? null,
        summary: emptyStatsBucket(),
        breakdown: []
      };
    }

    const rows = await goldenRecordsRepository.listAchievementSnapshots({
      organizationId: scope.organizationId,
      year,
      centerIds: scopedCenterIds
    });

    const summary = emptyStatsBucket();
    const breakdownMap = new Map<
      number,
      {
        centerId: number;
        centerName: string;
        centerCode: string;
        stats: StatsBucket;
      }
    >();

    for (const row of rows) {
      incrementStatsBucket(summary, row.achievementCategory);

      if (!breakdownMap.has(row.centerId)) {
        breakdownMap.set(row.centerId, {
          centerId: row.centerId,
          centerName: row.center.name,
          centerCode: row.center.code,
          stats: emptyStatsBucket()
        });
      }

      incrementStatsBucket(breakdownMap.get(row.centerId)!.stats, row.achievementCategory);
    }

    const breakdown = [...breakdownMap.values()]
      .sort((a, b) => a.centerName.localeCompare(b.centerName, "ar"))
      .map((item) => ({
        centerId: item.centerId,
        centerName: item.centerName,
        centerCode: item.centerCode,
        ...item.stats
      }));

    return {
      year,
      centerId: query.centerId ?? null,
      summary,
      breakdown
    };
  }
};
