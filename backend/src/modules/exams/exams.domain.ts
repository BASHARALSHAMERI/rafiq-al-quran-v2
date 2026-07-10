import { AttemptStatus, CommitteeRole, Role } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import { ensureCenterAllowed, ensureCircleAllowed } from "../../shared/scoping/scope.domain";
import type { ScopeContext } from "../../shared/types/auth.types";
import { safeDate } from "../../shared/utils/time";

export type ExamsDateRange = {
  from: Date;
  to: Date;
};

const startOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const unique = (values: number[]): number[] => [...new Set(values)];

const EXAMS_ALLOWED_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.SUPERVISOR,
  Role.TEACHER,
  Role.STUDENT
];

const ATTEMPTS_ALLOWED_ROLES: Role[] = [
  ...EXAMS_ALLOWED_ROLES,
  Role.STUDENT,
  Role.PARENT
];

export const examsDomain = {
  assertCanAccessExams(scope: ScopeContext) {
    if (!EXAMS_ALLOWED_ROLES.includes(scope.role)) {
      throw new AppError("Exams access is restricted for your role", 403);
    }
  },

  assertCanAccessAttempts(scope: ScopeContext) {
    if (!ATTEMPTS_ALLOWED_ROLES.includes(scope.role)) {
      throw new AppError("Exam attempt access is restricted for your role", 403);
    }
  },

  assertCanManageTemplates(scope: ScopeContext) {
    if (scope.role !== Role.SUPER_ADMIN) {
      throw new AppError("Only the general manager can manage exam templates", 403);
    }
  },

  assertCanCreateNomination(scope: ScopeContext) {
    if (scope.role !== Role.TEACHER && scope.role !== Role.CENTER_ADMIN) {
      throw new AppError("Only teachers or center managers can create nomination requests", 403);
    }
  },

  assertCanReviewNomination(scope: ScopeContext) {
    if (scope.role !== Role.SUPERVISOR) {
      throw new AppError("Only supervisors can review nomination requests", 403);
    }
  },

  assertCanApproveNomination(scope: ScopeContext) {
    if (scope.role !== Role.CENTER_ADMIN) {
      throw new AppError("Only center managers can approve nomination requests", 403);
    }
  },

  assertCanManageAttemptCommittee(scope: ScopeContext) {
    if (scope.role !== Role.CENTER_ADMIN) {
      throw new AppError("Only center managers can manage attempt scheduling and committee", 403);
    }
  },

  assertCanGenerateAttemptQuestions(scope: ScopeContext) {
    // CENTER_ADMIN can always generate questions.
    // TEACHER / SUPERVISOR can only generate if they are the committee chair —
    // that check is enforced in the workflow service after calling this.
    if (
      scope.role !== Role.CENTER_ADMIN &&
      scope.role !== Role.TEACHER &&
      scope.role !== Role.SUPERVISOR
    ) {
      throw new AppError("Only center managers or committee members can generate exam questions", 403);
    }
  },

  assertCanApproveAttempt(scope: ScopeContext) {
    if (scope.role !== Role.CENTER_ADMIN) {
      throw new AppError("Only center managers can approve exam attempts", 403);
    }
  },

  assertCanPublishAttempt(scope: ScopeContext) {
    if (scope.role !== Role.CENTER_ADMIN) {
      throw new AppError("Only center managers can publish exam attempts", 403);
    }
  },

  // Legacy aliases kept only so the historical service layer can compile while
  // the operational workflow has moved to the new nominations/committee flow.
  assertCanNominate(scope: ScopeContext) {
    if (scope.role !== Role.CENTER_ADMIN) {
      throw new AppError("Only center managers can manage official attempts", 403);
    }
  },

  assertCanScoreAttempt(scope: ScopeContext) {
    if (
      scope.role !== Role.CENTER_ADMIN &&
      scope.role !== Role.SUPERVISOR &&
      scope.role !== Role.TEACHER
    ) {
      throw new AppError("You are not allowed to work on this exam attempt", 403);
    }
  },

  assertCanShareResult(scope: ScopeContext) {
    if (
      scope.role !== Role.SUPER_ADMIN &&
      scope.role !== Role.CENTER_ADMIN &&
      scope.role !== Role.SUPERVISOR &&
      scope.role !== Role.TEACHER
    ) {
      throw new AppError("You are not allowed to share exam results", 403);
    }
  },

  assertCanReopenAttempt(scope: ScopeContext) {
    if (scope.role !== Role.CENTER_ADMIN) {
      throw new AppError("Only center managers can reopen exam attempts", 403);
    }
  },

  resolveDateRange(from?: string, to?: string): ExamsDateRange | undefined {
    if (!from && !to) {
      return undefined;
    }

    const now = new Date();
    const resolvedFrom = from ? safeDate(from, "from") : new Date(0);
    const resolvedTo = to ? safeDate(to, "to") : now;

    const range = {
      from: startOfDay(resolvedFrom),
      to: endOfDay(resolvedTo)
    };

    if (range.from > range.to) {
      throw new AppError("Date range is invalid: from must be before to", 400);
    }

    return range;
  },

  resolveRequiredDate(value: string, fieldName: string): Date {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new AppError(`Invalid date value for ${fieldName}`, 400);
    }

    return parsed;
  },

  resolveOptionalDate(value: string | null | undefined, fieldName: string): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    return this.resolveRequiredDate(value, fieldName);
  },

  assertScopeFilters(scope: ScopeContext, input: { centerId?: number; circleId?: number }) {
    if (input.centerId) {
      ensureCenterAllowed(scope, input.centerId);
    }

    if (input.circleId) {
      ensureCircleAllowed(scope, input.circleId);
    }
  },

  ensureTemplateVisible(scope: ScopeContext, exam: { centerId: number | null; circleId: number | null }) {
    if (scope.allAccess) {
      return;
    }

    if (exam.centerId && !scope.centerIds.includes(exam.centerId)) {
      throw new AppError("Exam template is outside your center scope", 403);
    }

    if (exam.circleId && scope.circleIds.length && !scope.circleIds.includes(exam.circleId)) {
      throw new AppError("Exam template is outside your circle scope", 403);
    }
  },

  ensureCircleVisible(scope: ScopeContext, circleId: number) {
    ensureCircleAllowed(scope, circleId);
  },

  ensureCenterVisible(scope: ScopeContext, centerId: number) {
    ensureCenterAllowed(scope, centerId);
  },

  ensureAttemptCenterScope(scope: ScopeContext, centerId: number) {
    if (scope.allAccess) {
      return;
    }

    if (!scope.centerIds.includes(centerId)) {
      throw new AppError("Exam attempt is outside your center scope", 403);
    }
  },

  ensureNominationVisibility(input: {
    scope: ScopeContext;
    centerId: number;
    createdById: number;
  }) {
    const { scope, centerId, createdById } = input;

    if (scope.role === Role.SUPER_ADMIN) {
      return;
    }

    if (scope.role === Role.CENTER_ADMIN || scope.role === Role.SUPERVISOR) {
      this.ensureAttemptCenterScope(scope, centerId);
      return;
    }

    if (scope.role === Role.TEACHER && scope.userId === createdById) {
      return;
    }

    throw new AppError("Nomination request is outside your scope", 403);
  },

  ensureAttemptVisibility(input: {
    scope: ScopeContext;
    centerId: number;
    circleTeacherId?: number | null;
    committeeUserIds: number[];
    status: AttemptStatus;
  }) {
    const { scope, centerId, circleTeacherId, committeeUserIds, status } = input;

    if (scope.role === Role.SUPER_ADMIN) {
      return;
    }

    if (scope.role === Role.CENTER_ADMIN) {
      this.ensureAttemptCenterScope(scope, centerId);
      return;
    }

    if (committeeUserIds.includes(scope.userId)) {
      return;
    }

    if (
      scope.role === Role.TEACHER &&
      circleTeacherId === scope.userId &&
      (status === AttemptStatus.APPROVED || status === AttemptStatus.PUBLISHED)
    ) {
      return;
    }

    throw new AppError("Exam attempt is not assigned to you", 403);
  },

  assertCommitteeRoles(roles: Role[]) {
    const ALLOWED_COMMITTEE_ROLES: Role[] = [Role.SUPERVISOR, Role.TEACHER, Role.CENTER_ADMIN];
    if (!roles.every((role) => ALLOWED_COMMITTEE_ROLES.includes(role))) {
      throw new AppError("Committee members must be supervisors, teachers, or center managers", 400);
    }
  },

  assertCommitteeComposition(committeeRoles: CommitteeRole[]) {
    if (!committeeRoles.length) {
      throw new AppError("Committee must contain at least one member", 400);
    }

    const chairCount = committeeRoles.filter((role) => role === CommitteeRole.CHAIR).length;
    if (chairCount !== 1) {
      throw new AppError("Committee must contain exactly one chair", 400);
    }
  },

  assertAttemptSchedule(input: {
    examType: "JUZ" | "FULL_QURAN" | "JUZ_RANGE";
    examDate: Date;
    fullQuranCompletedAt?: Date | null;
  }) {
    if (input.examType === "FULL_QURAN") {
      if (!input.fullQuranCompletedAt) {
        throw new AppError("fullQuranCompletedAt is required for FULL_QURAN attempts", 400);
      }

      if (input.fullQuranCompletedAt > input.examDate) {
        throw new AppError("fullQuranCompletedAt cannot be after examDate", 400);
      }

      return;
    }

    // JUZ and JUZ_RANGE do not require fullQuranCompletedAt
    if (input.fullQuranCompletedAt) {
      throw new AppError("fullQuranCompletedAt must be empty for JUZ attempts", 400);
    }
  },

  assertAttemptEditableStatus(status: AttemptStatus) {
    if (status !== AttemptStatus.SCHEDULED && status !== AttemptStatus.IN_PROGRESS) {
      throw new AppError("Attempt cannot be edited from its current status", 400);
    }
  },

  assertAttemptCanBeFinalized(status: AttemptStatus) {
    if (status !== AttemptStatus.SCHEDULED && status !== AttemptStatus.IN_PROGRESS) {
      throw new AppError("Attempt cannot be finalized from its current status", 400);
    }
  },

  assertAttemptCanBeApproved(status: AttemptStatus) {
    if (status !== AttemptStatus.EVALUATED) {
      throw new AppError("Attempt must be evaluated before approval", 400);
    }
  },

  assertAttemptCanBePublished(status: AttemptStatus) {
    if (status !== AttemptStatus.APPROVED && status !== AttemptStatus.EVALUATED) {
      throw new AppError("Attempt must be evaluated before publication", 400);
    }
  },

  assertAttemptCanBeReopened(status: AttemptStatus) {
    if (status === AttemptStatus.PUBLISHED) {
      throw new AppError("Published attempts cannot be reopened", 400);
    }

    if (status === AttemptStatus.CANCELLED) {
      throw new AppError("Cancelled attempts cannot be reopened", 400);
    }
  },

  assertQuestionEditingAllowedStatus(status: AttemptStatus) {
    if (status !== AttemptStatus.SCHEDULED && status !== AttemptStatus.IN_PROGRESS) {
      throw new AppError("Questions can only be edited before evaluation is closed", 400);
    }
  },

  computeTotalScore(input: {
    memorizationScore: number;
    tajweedScore: number;
    performanceScore: number;
    promptingDeductions: number;
    remindingDeductions: number;
    tajweedDeductions: number;
    maxScore: number;
  }): number {
    const deductions =
      input.memorizationScore +
      input.tajweedScore +
      input.performanceScore +
      input.promptingDeductions +
      input.remindingDeductions +
      input.tajweedDeductions;
    const rawTotal = input.maxScore - deductions;
    return Math.max(0, Math.min(input.maxScore, rawTotal));
  },

  computeStabilizationDays(fullQuranCompletedAt?: Date | null, examDate?: Date | null): number | null {
    if (!fullQuranCompletedAt || !examDate) {
      return null;
    }

    const ms = endOfDay(examDate).getTime() - startOfDay(fullQuranCompletedAt).getTime();
    return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  },

  uniqueIds(values: number[]): number[] {
    return unique(values);
  }
};
