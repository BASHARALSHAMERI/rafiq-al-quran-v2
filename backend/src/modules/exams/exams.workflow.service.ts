import {
  AttemptStatus,
  CommitteeRole,
  NominationRequestStatus,
  Prisma,
  Role
} from "@prisma/client";
import { AuditAction, AuditEntityType } from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import { auditLogger } from "../../shared/audit/audit-log";
import { AppError } from "../../shared/errors/app-error";
import { editLockPolicy } from "../../shared/policies/edit-lock.policy";
import type { ScopeContext } from "../../shared/types/auth.types";
import { notificationsRepository } from "../notifications/notifications.repository";
import { examsDomain } from "./exams.domain";
import { examsRepository } from "./exams.repository";
import { examsService } from "./exams.service";
import { examsWorkflowRepository } from "./exams.workflow.repository";
import { createGradeScalesService } from "./grade-scales.service";

type ListNominationRequestsQuery = {
  centerId?: number;
  circleId?: number;
  studentId?: number;
  status?: NominationRequestStatus;
};

type CreateNominationRequestInput = {
  examId: number;
  studentId: number;
  circleId: number;
  teacherNotes?: string;
  readinessScore?: number;
  proposedExamDate?: string;
};

type SupervisorReviewNominationInput = {
  decision: "APPROVE" | "RETURN" | "REJECT" | "DEFER";
  notes?: string;
};

type CenterReviewNominationInput = {
  decision: "REJECT";
  notes?: string;
};

type CommitteeMemberInput = {
  userId: number;
  committeeRole: CommitteeRole;
};

type CenterApproveNominationInput = {
  examDate: string;
  fullQuranCompletedAt?: string | null;
  centerApprovalNotes?: string;
  committeeMembers: CommitteeMemberInput[];
};

type UpdateAttemptCommitteeInput = {
  examDate?: string;
  fullQuranCompletedAt?: string | null;
  committeeMembers?: CommitteeMemberInput[];
  lockVersion?: number;
};

type EvaluateAttemptInput = {
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

type ReopenAttemptInput = {
  reason: string;
};

const gradeScalesService = createGradeScalesService(prisma);

const serializeAttempt = <T extends Record<string, unknown> & {
  examDate?: Date | string | null;
  fullQuranCompletedAt?: Date | string | null;
}>(attempt: T) => {
  const examDate = attempt.examDate ? new Date(attempt.examDate) : null;
  const fullQuranCompletedAt = attempt.fullQuranCompletedAt
    ? new Date(attempt.fullQuranCompletedAt)
    : null;

  return {
    ...attempt,
    stabilizationDays: examsDomain.computeStabilizationDays(fullQuranCompletedAt, examDate)
  };
};

const buildScheduleNotificationBody = (input: {
  studentName: string;
  examTitle: string;
  examDate: Date;
  centerName: string;
  circleName: string;
  examBranch: string | null;
}) => {
  const dateLabel = input.examDate.toISOString().slice(0, 10);
  const branchLabel = input.examBranch ? ` (النطاق: ${input.examBranch})` : "";
  return `تم تحديد موعد اختبار ${input.studentName}${branchLabel} في ${input.circleName} بمركز ${input.centerName} يوم ${dateLabel} للاختبار: ${input.examTitle}.`;
};

const buildResultNotificationBody = (input: {
  studentName: string;
  examTitle: string;
  totalScore: number | null;
  gradeLabel: string | null;
  examBranch: string | null;
}) => {
  const scoreLabel = input.totalScore === null ? "غير محدد" : `${input.totalScore}`;
  const gradeLabel = input.gradeLabel ?? "غير محدد";
  const branchLabel = input.examBranch ? ` (${input.examBranch})` : "";
  return `تم نشر نتيجة اختبار ${input.studentName}${branchLabel} في ${input.examTitle}. الدرجة: ${scoreLabel}. التقدير: ${gradeLabel}.`;
};

const notifyAttemptSchedule = async (scope: ScopeContext, attemptId: number) => {
  const context = await examsRepository.findAttemptNotificationContext({
    attemptId,
    organizationId: scope.organizationId
  });

  if (!context) {
    return { createdCount: 0 };
  }

  const recipientUserIds = examsDomain.uniqueIds([
    context.student.id,
    context.circle.teacherId,
    ...context.student.childLinks.map((link) => link.parentId)
  ]);
  const body = buildScheduleNotificationBody({
    studentName: context.student.fullName,
    examTitle: context.exam.title,
    examDate: context.examDate,
    centerName: context.circle.center.name,
    circleName: context.circle.name,
    examBranch: context.exam.examBranch
  });

  const result = await notificationsRepository.createMany({
    data: recipientUserIds.map((recipientUserId) => ({
      organizationId: scope.organizationId,
      centerId: context.circle.centerId,
      circleId: context.circle.id,
      type: "EXAM_ATTEMPT_SCHEDULED",
      title: "موعد اختبار جديد",
      body,
      payload: {
        workflow: "EXAM_ATTEMPT_SCHEDULED",
        attemptId: context.id,
        examId: context.exam.id,
        examDate: context.examDate.toISOString().slice(0, 10)
      },
      recipientUserId,
      createdById: scope.userId
    }))
  });

  return { createdCount: result.count };
};

const notifyAttemptPublished = async (scope: ScopeContext, attemptId: number) => {
  const context = await examsRepository.findAttemptNotificationContext({
    attemptId,
    organizationId: scope.organizationId
  });

  if (!context) {
    return { createdCount: 0 };
  }

  const recipientUserIds = examsDomain.uniqueIds([
    context.student.id,
    context.circle.teacherId,
    ...context.student.childLinks.map((link) => link.parentId)
  ]);
  const body = buildResultNotificationBody({
    studentName: context.student.fullName,
    examTitle: context.exam.title,
    totalScore: context.totalScore,
    gradeLabel: context.gradeLabel,
    examBranch: context.exam.examBranch
  });

  const result = await notificationsRepository.createMany({
    data: recipientUserIds.map((recipientUserId) => ({
      organizationId: scope.organizationId,
      centerId: context.circle.centerId,
      circleId: context.circle.id,
      type: "EXAM_PUBLISHED",
      title: "نتيجة اختبار الطالب",
      body,
      payload: {
        workflow: "EXAM_PUBLISHED",
        attemptId: context.id,
        examId: context.exam.id,
        totalScore: context.totalScore,
        gradeLabel: context.gradeLabel
      },
      recipientUserId,
      createdById: scope.userId
    }))
  });

  return { createdCount: result.count };
};

const ensureCircleExistsAndVisible = async (
  scope: ScopeContext,
  circleId: number,
  expectedCenterId?: number
) => {
  examsDomain.ensureCircleVisible(scope, circleId);

  const circle = await examsRepository.findCircleById({
    circleId,
    organizationId: scope.organizationId
  });

  if (!circle) {
    throw new AppError("Circle not found", 404);
  }

  if (expectedCenterId && circle.centerId !== expectedCenterId) {
    throw new AppError("Circle does not belong to selected center", 400);
  }

  return circle;
};

const getExamInScope = async (scope: ScopeContext, examId: number) => {
  const exam = await examsRepository.findExamById({
    examId,
    organizationId: scope.organizationId
  });

  if (!exam) {
    throw new AppError("Exam not found", 404);
  }

  examsDomain.ensureTemplateVisible(scope, {
    centerId: exam.centerId,
    circleId: exam.circleId
  });

  return exam;
};

const getNominationInScope = async (scope: ScopeContext, nominationId: number) => {
  const nomination = await examsWorkflowRepository.findNominationRequestById({
    nominationId,
    organizationId: scope.organizationId
  });

  if (!nomination) {
    throw new AppError("Nomination request not found", 404);
  }

  examsDomain.ensureNominationVisibility({
    scope,
    centerId: nomination.centerId,
    createdById: nomination.createdById
  });

  return nomination;
};

const getAttemptInScope = async (scope: ScopeContext, attemptId: number) => {
  const attempt = await examsWorkflowRepository.findAttemptById({
    attemptId,
    organizationId: scope.organizationId
  });

  if (!attempt) {
    throw new AppError("Attempt not found", 404);
  }

  examsDomain.ensureAttemptVisibility({
    scope,
    centerId: attempt.circle.centerId,
    circleTeacherId: attempt.circle.teacherId,
    committeeUserIds: attempt.committeeMembers.map((member) => member.userId),
    status: attempt.status
  });

  return attempt;
};

const validateCommitteeMembers = async (
  scope: ScopeContext,
  centerId: number,
  committeeMembers: CommitteeMemberInput[]
) => {
  const uniqueMemberIds = examsDomain.uniqueIds(committeeMembers.map((member) => member.userId));
  const users = await examsRepository.findCommitteeUsers({
    organizationId: scope.organizationId,
    centerId,
    userIds: uniqueMemberIds
  });

  if (users.length !== uniqueMemberIds.length) {
    throw new AppError("One or more selected committee members are invalid for this center", 400);
  }

  examsDomain.assertCommitteeRoles(users.map((user) => user.role));
  examsDomain.assertCommitteeComposition(committeeMembers.map((member) => member.committeeRole));

  const roleMap = new Map(users.map((user) => [user.id, user.role]));

  return committeeMembers.map((member) => ({
    userId: member.userId,
    roleAtAssignment: roleMap.get(member.userId) ?? Role.TEACHER,
    committeeRole: member.committeeRole,
    assignedById: scope.userId
  }));
};

const assertCommitteeMember = (
  attempt: Awaited<ReturnType<typeof getAttemptInScope>>,
  scope: ScopeContext
) => {
  const membership = attempt.committeeMembers.find((member) => member.userId === scope.userId) ?? null;
  if (!membership) {
    throw new AppError("Only committee members can evaluate this attempt", 403);
  }

  return membership;
};

const assertCommitteeChair = (
  attempt: Awaited<ReturnType<typeof getAttemptInScope>>,
  scope: ScopeContext
) => {
  const membership = assertCommitteeMember(attempt, scope);
  if (membership.committeeRole !== CommitteeRole.CHAIR) {
    throw new AppError("Only the committee chair can perform this action", 403);
  }

  return membership;
};

export const examsWorkflowService = {
  async listNominationRequests(scope: ScopeContext, query: ListNominationRequestsQuery) {
    examsDomain.assertCanAccessExams(scope);
    examsDomain.assertScopeFilters(scope, {
      centerId: query.centerId,
      circleId: query.circleId
    });

    const centerIds =
      scope.role === Role.CENTER_ADMIN
        ? query.centerId
          ? [query.centerId]
          : scope.centerIds
        : query.centerId
          ? [query.centerId]
          : undefined;

    return examsWorkflowRepository.listNominationRequests({
      organizationId: scope.organizationId,
      centerIds,
      circleIds: query.circleId ? [query.circleId] : undefined,
      studentId: query.studentId,
      status: query.status,
      createdById: scope.role === Role.TEACHER ? scope.userId : undefined
    });
  },

  async createNominationRequest(scope: ScopeContext, input: CreateNominationRequestInput) {
    examsDomain.assertCanCreateNomination(scope);

    const exam = await getExamInScope(scope, input.examId);
    if (exam.status !== "PUBLISHED") {
      throw new AppError("Nomination requests can only use published exam templates", 400);
    }

    const circle = await ensureCircleExistsAndVisible(scope, input.circleId);
    if (circle.teacherId !== scope.userId) {
      throw new AppError("Teachers can only nominate students from their own circles", 403);
    }

    const student = await examsRepository.findStudentById({
      studentId: input.studentId,
      organizationId: scope.organizationId
    });

    if (!student || student.role !== Role.STUDENT || !student.isActive) {
      throw new AppError("Student not found or inactive", 400);
    }

    const enrollment = await examsRepository.findActiveEnrollment({
      studentId: input.studentId,
      circleId: input.circleId,
      organizationId: scope.organizationId
    });

    if (!enrollment) {
      throw new AppError("Student is not actively enrolled in selected circle", 400);
    }

    const nomination = await examsWorkflowRepository.createNominationRequest({
      organizationId: scope.organizationId,
      centerId: circle.centerId,
      examId: input.examId,
      studentId: input.studentId,
      circleId: input.circleId,
      proposedExamDate:
        examsDomain.resolveOptionalDate(input.proposedExamDate, "proposedExamDate") ?? null,
      teacherNotes: input.teacherNotes?.trim() || null,
      readinessScore: input.readinessScore ?? null,
      createdById: scope.userId
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: circle.centerId,
      circleId: circle.id,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.EXAM,
      entityId: nomination.id,
      summary: "تم إنشاء طلب ترشيح لاختبار",
      metadata: {
        examId: input.examId,
        studentId: input.studentId,
        circleId: input.circleId,
        readinessScore: input.readinessScore ?? null
      }
    });

    return nomination;
  },

  async supervisorReviewNominationRequest(
    scope: ScopeContext,
    nominationId: number,
    input: SupervisorReviewNominationInput
  ) {
    examsDomain.assertCanReviewNomination(scope);

    const nomination = await getNominationInScope(scope, nominationId);
    examsDomain.ensureAttemptCenterScope(scope, nomination.centerId);

    if (nomination.status === NominationRequestStatus.CENTER_APPROVED) {
      throw new AppError("Center-approved nominations cannot be reviewed again", 400);
    }

    const statusMap: Record<SupervisorReviewNominationInput["decision"], NominationRequestStatus> = {
      APPROVE: NominationRequestStatus.SUPERVISOR_APPROVED,
      RETURN: NominationRequestStatus.RETURNED,
      REJECT: NominationRequestStatus.REJECTED,
      DEFER: NominationRequestStatus.DEFERRED
    };

    const updatedNomination = await examsWorkflowRepository.supervisorReviewNominationRequest({
      nominationId,
      status: statusMap[input.decision],
      notes: input.notes?.trim() || null,
      supervisorReviewedById: scope.userId
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: nomination.centerId,
      circleId: nomination.circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.EXAM,
      entityId: nomination.id,
      summary: "تمت مراجعة طلب ترشيح اختبار من المشرف",
      metadata: {
        decision: input.decision,
        status: updatedNomination.status
      }
    });

    return updatedNomination;
  },

  async centerReviewNominationRequest(
    scope: ScopeContext,
    nominationId: number,
    input: CenterReviewNominationInput
  ) {
    examsDomain.assertCanApproveNomination(scope);

    const nomination = await getNominationInScope(scope, nominationId);
    examsDomain.ensureAttemptCenterScope(scope, nomination.centerId);

    if (nomination.status === NominationRequestStatus.CENTER_APPROVED) {
      throw new AppError("Center-approved nominations cannot be reviewed again", 400);
    }

    if (nomination.status !== NominationRequestStatus.SUBMITTED) {
      throw new AppError("Only submitted nominations can be reviewed by center administration", 400);
    }

    const statusMap: Record<CenterReviewNominationInput["decision"], NominationRequestStatus> = {
      REJECT: NominationRequestStatus.REJECTED
    };

    const updatedNomination = await examsWorkflowRepository.centerReviewNominationRequest({
      nominationId,
      status: statusMap[input.decision],
      notes: input.notes?.trim() || null,
      centerReviewedById: scope.userId
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: nomination.centerId,
      circleId: nomination.circleId,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.EXAM,
      entityId: nomination.id,
      summary: "تمت مراجعة طلب ترشيح الاختبار من مدير المركز",
      metadata: {
        decision: input.decision,
        status: updatedNomination.status
      }
    });

    return updatedNomination;
  },

  async centerApproveNominationRequest(
    scope: ScopeContext,
    nominationId: number,
    input: CenterApproveNominationInput
  ) {
    examsDomain.assertCanApproveNomination(scope);

    const nomination = await getNominationInScope(scope, nominationId);
    examsDomain.ensureAttemptCenterScope(scope, nomination.centerId);

    if (
      nomination.status !== NominationRequestStatus.SUBMITTED &&
      nomination.status !== NominationRequestStatus.SUPERVISOR_APPROVED
    ) {
      throw new AppError("Nomination must be submitted before center approval", 400);
    }

    const exam = await getExamInScope(scope, nomination.examId);
    if (exam.type !== "JUZ" && exam.type !== "FULL_QURAN") {
      throw new AppError("Only JUZ and FULL_QURAN templates are supported for official attempts", 400);
    }
    const examDate = examsDomain.resolveRequiredDate(input.examDate, "examDate");
    const fullQuranCompletedAt = examsDomain.resolveOptionalDate(
      input.fullQuranCompletedAt,
      "fullQuranCompletedAt"
    );

    examsDomain.assertAttemptSchedule({
      examType: exam.type,
      examDate,
      fullQuranCompletedAt
    });

    const committeeMembers = await validateCommitteeMembers(
      scope,
      nomination.centerId,
      input.committeeMembers
    );

    try {
      const result = await examsWorkflowRepository.centerApproveNominationRequest({
        nominationId,
        centerApprovalNotes: input.centerApprovalNotes?.trim() || null,
        centerApprovedById: scope.userId,
        examDate,
        fullQuranCompletedAt: fullQuranCompletedAt ?? null,
        committeeMembers
      });

      await auditLogger.log({
        organizationId: scope.organizationId,
        centerId: nomination.centerId,
        circleId: nomination.circleId,
        actorUserId: scope.userId,
        actorRole: scope.role,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.EXAM_ATTEMPT,
        entityId: result.attempt.id,
        summary: "تم اعتماد طلب الترشيح وإنشاء محاولة اختبار رسمية",
        metadata: {
          nominationRequestId: nominationId,
          examId: nomination.examId,
          studentId: nomination.studentId,
          examDate: examDate.toISOString().slice(0, 10)
        }
      });

      await notifyAttemptSchedule(scope, result.attempt.id);

      return {
        nomination: result.nomination,
        attempt: serializeAttempt(result.attempt)
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("An official attempt already exists for this student and exam date", 409);
      }

      throw error;
    }
  },

  async listExamAttempts(scope: ScopeContext, examId: number) {
    examsDomain.assertCanAccessAttempts(scope);
    await getExamInScope(scope, examId);

    const attempts = await examsWorkflowRepository.listAttempts({
      organizationId: scope.organizationId,
      examId,
      centerIds: scope.role === Role.CENTER_ADMIN ? scope.centerIds : undefined,
      viewerRole: scope.role,
      viewerUserId: scope.userId,
      viewerStudentIds: scope.role === Role.PARENT ? scope.studentIds : undefined
    });

    return attempts.map((attempt) => serializeAttempt(attempt));
  },

  async listAllAttempts(
    scope: ScopeContext,
    query: { centerId?: number; circleId?: number; studentId?: number; purpose?: import("@prisma/client").ExamPurpose }
  ) {
    examsDomain.assertCanAccessAttempts(scope);
    examsDomain.assertScopeFilters(scope, {
      centerId: query.centerId,
      circleId: query.circleId
    });

    const attempts = await examsWorkflowRepository.listAttempts({
      organizationId: scope.organizationId,
      centerIds:
        scope.role === Role.SUPER_ADMIN
          ? query.centerId
            ? [query.centerId]
            : undefined
          : scope.role === Role.CENTER_ADMIN || scope.role === Role.SUPERVISOR
            ? query.centerId
              ? [query.centerId]
              : scope.centerIds
            : query.centerId
              ? [query.centerId]
              : undefined,
      circleIds: query.circleId ? [query.circleId] : undefined,
      studentId: query.studentId,
      purpose: query.purpose,
      viewerRole: scope.role,
      viewerUserId: scope.userId,
      viewerStudentIds: scope.role === Role.PARENT ? scope.studentIds : undefined
    });

    return attempts.map((attempt) => serializeAttempt(attempt));
  },

  async updateAttemptCommittee(scope: ScopeContext, attemptId: number, input: UpdateAttemptCommitteeInput) {
    examsDomain.assertCanManageAttemptCommittee(scope);

    const attempt = await getAttemptInScope(scope, attemptId);
    examsDomain.ensureAttemptCenterScope(scope, attempt.circle.centerId);
    examsDomain.assertAttemptEditableStatus(attempt.status);

    editLockPolicy.assertVersionMatch({
      resource: "Exam attempt",
      currentVersion: attempt.lockVersion,
      expectedVersion: input.lockVersion
    });

    const nextExamDate =
      input.examDate !== undefined ? examsDomain.resolveRequiredDate(input.examDate, "examDate") : attempt.examDate;
    const nextFullQuranCompletedAt =
      input.fullQuranCompletedAt !== undefined
        ? examsDomain.resolveOptionalDate(input.fullQuranCompletedAt, "fullQuranCompletedAt")
        : attempt.fullQuranCompletedAt;

    if (attempt.exam.type !== "JUZ" && attempt.exam.type !== "FULL_QURAN") {
      throw new AppError("Only JUZ and FULL_QURAN templates are supported for official attempts", 400);
    }

    examsDomain.assertAttemptSchedule({
      examType: attempt.exam.type,
      examDate: nextExamDate,
      fullQuranCompletedAt: nextFullQuranCompletedAt
    });

    const updatedAttempt = await examsWorkflowRepository.replaceAttemptCommittee({
      attemptId,
      lockVersion: attempt.lockVersion,
      examDate: input.examDate !== undefined ? nextExamDate : undefined,
      fullQuranCompletedAt:
        input.fullQuranCompletedAt !== undefined
          ? nextFullQuranCompletedAt ?? null
          : undefined,
      committeeMembers: input.committeeMembers
        ? await validateCommitteeMembers(scope, attempt.circle.centerId, input.committeeMembers)
        : undefined
    });

    if (!updatedAttempt) {
      throw new AppError("Exam attempt version conflict", 409, { attemptId }, "VERSION_CONFLICT");
    }

    await notifyAttemptSchedule(scope, updatedAttempt.id);
    return serializeAttempt(updatedAttempt);
  },

  async generateAttemptQuestions(scope: ScopeContext, attemptId: number, input: { count?: number }) {
    const attempt = await getAttemptInScope(scope, attemptId);
    examsDomain.ensureAttemptCenterScope(scope, attempt.circle.centerId);
    examsDomain.assertQuestionEditingAllowedStatus(attempt.status);
    return examsService.generateAttemptQuestions(scope, attemptId, input);
  },

  async createAttemptQuestion(scope: ScopeContext, attemptId: number, input: { fromSurah: number; fromAyah: number; toSurah: number; toAyah: number }) {
    const attempt = await getAttemptInScope(scope, attemptId);
    examsDomain.assertQuestionEditingAllowedStatus(attempt.status);
    assertCommitteeChair(attempt, scope);
    return examsService.createAttemptQuestion(scope, attemptId, input);
  },

  async deleteAttemptQuestion(scope: ScopeContext, attemptId: number, questionId: number) {
    const attempt = await getAttemptInScope(scope, attemptId);
    examsDomain.assertQuestionEditingAllowedStatus(attempt.status);
    assertCommitteeChair(attempt, scope);
    return examsService.deleteAttemptQuestion(scope, attemptId, questionId);
  },

  async evaluateAttempt(scope: ScopeContext, attemptId: number, input: EvaluateAttemptInput) {
    const attempt = await getAttemptInScope(scope, attemptId);
    assertCommitteeMember(attempt, scope);
    examsDomain.assertAttemptEditableStatus(attempt.status);

    if (!attempt.questions.length) {
      throw new AppError("At least one exam question is required before evaluation", 400);
    }

    const questionPayloadMap = new Map(input.questions.map((question) => [question.id, question]));
    const mergedQuestions = attempt.questions.map((question) => {
      const incoming = questionPayloadMap.get(question.id);
      if (!incoming) {
        return question;
      }

      return {
        ...question,
        promptingDeductions: incoming.promptingDeductions,
        remindingDeductions: incoming.remindingDeductions,
        tajweedDeductions: incoming.tajweedDeductions,
        isEvaluated: incoming.isEvaluated
      };
    });

    const promptingDeductions = mergedQuestions.reduce((sum, question) => sum + question.promptingDeductions, 0);
    const remindingDeductions = mergedQuestions.reduce((sum, question) => sum + question.remindingDeductions, 0);
    const tajweedDeductions = mergedQuestions.reduce((sum, question) => sum + question.tajweedDeductions, 0);
    const totalScore = examsDomain.computeTotalScore({
      memorizationScore: input.memorizationScore,
      tajweedScore: input.tajweedScore + input.theoreticalTajweedScore,
      performanceScore: input.performanceScore,
      promptingDeductions,
      remindingDeductions,
      tajweedDeductions,
      maxScore: attempt.exam.maxScore
    });
    const percentage = attempt.exam.maxScore ? (totalScore / attempt.exam.maxScore) * 100 : 0;
    const gradeLabel = await gradeScalesService.resolveLabel(scope.organizationId, percentage);

    const updatedAttempt = await examsWorkflowRepository.saveAttemptEvaluation({
      attemptId,
      evaluatedById: scope.userId,
      totalScore,
      gradeLabel,
      committeeNotes: input.committeeNotes?.trim() || null,
      strengthNotes: input.strengthNotes?.trim() || null,
      weaknessNotes: input.weaknessNotes?.trim() || null,
      memorizationScore: input.memorizationScore,
      tajweedScore: input.tajweedScore,
      theoreticalTajweedScore: input.theoreticalTajweedScore,
      performanceScore: input.performanceScore,
      promptingDeductions,
      remindingDeductions,
      tajweedDeductions,
      questionUpdates: mergedQuestions.map((question) => ({
        id: question.id,
        promptingDeductions: question.promptingDeductions,
        remindingDeductions: question.remindingDeductions,
        tajweedDeductions: question.tajweedDeductions,
        isEvaluated: question.isEvaluated
      }))
    });

    if (!updatedAttempt) {
      throw new AppError("Failed to save evaluation", 500);
    }

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: attempt.circle.centerId,
      circleId: attempt.circle.id,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.SCORE,
      entityType: AuditEntityType.EXAM_ATTEMPT,
      entityId: attempt.id,
      summary: "تم حفظ تقييم محاولة الاختبار",
      metadata: {
        totalScore,
        gradeLabel
      }
    });

    return serializeAttempt(updatedAttempt);
  },

  async finalizeAttemptEvaluation(scope: ScopeContext, attemptId: number) {
    const attempt = await getAttemptInScope(scope, attemptId);
    assertCommitteeChair(attempt, scope);
    examsDomain.assertAttemptCanBeFinalized(attempt.status);

    if (!attempt.questions.length || attempt.questions.some((question) => !question.isEvaluated)) {
      throw new AppError("All exam questions must be evaluated before finalizing", 400);
    }

    if (!attempt.breakdown || attempt.totalScore === null) {
      throw new AppError("Evaluation must be saved before finalization", 400);
    }

    const finalizedAttempt = await examsWorkflowRepository.finalizeAttemptEvaluation({
      attemptId,
      evaluationClosedById: scope.userId
    });

    return serializeAttempt(finalizedAttempt);
  },

  async approveAttempt(scope: ScopeContext, attemptId: number) {
    examsDomain.assertCanApproveAttempt(scope);
    const attempt = await getAttemptInScope(scope, attemptId);
    examsDomain.ensureAttemptCenterScope(scope, attempt.circle.centerId);
    examsDomain.assertAttemptCanBeApproved(attempt.status);
    return serializeAttempt(
      await examsWorkflowRepository.approveAttempt({
        attemptId,
        approvedById: scope.userId
      })
    );
  },

  async publishAttempt(scope: ScopeContext, attemptId: number) {
    examsDomain.assertCanPublishAttempt(scope);
    const attempt = await getAttemptInScope(scope, attemptId);
    examsDomain.ensureAttemptCenterScope(scope, attempt.circle.centerId);
    examsDomain.assertAttemptCanBePublished(attempt.status);

    const publishedAttempt = await examsWorkflowRepository.publishAttempt({
      attemptId,
      publishedById: scope.userId
    });

    await notifyAttemptPublished(scope, attemptId);
    return serializeAttempt(publishedAttempt);
  },

  async reopenAttemptForQuestionAdjustment(scope: ScopeContext, attemptId: number, input: ReopenAttemptInput) {
    examsDomain.assertCanReopenAttempt(scope);
    const attempt = await getAttemptInScope(scope, attemptId);
    examsDomain.ensureAttemptCenterScope(scope, attempt.circle.centerId);
    examsDomain.assertAttemptCanBeReopened(attempt.status);

    const reopenedAttempt = await examsWorkflowRepository.reopenAttemptForQuestionAdjustment({
      attemptId
    });

    await auditLogger.log({
      organizationId: scope.organizationId,
      centerId: attempt.circle.centerId,
      circleId: attempt.circle.id,
      actorUserId: scope.userId,
      actorRole: scope.role,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.EXAM_ATTEMPT,
      entityId: attempt.id,
      summary: "تمت إعادة فتح محاولة الاختبار لتعديل الأسئلة",
      metadata: {
        reason: input.reason.trim(),
        previousStatus: attempt.status,
        newStatus: reopenedAttempt.status
      }
    });

    return serializeAttempt(reopenedAttempt);
  }
};
