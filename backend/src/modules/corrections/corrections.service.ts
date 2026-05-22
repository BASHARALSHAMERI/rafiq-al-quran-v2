import {
  AttemptStatus,
  AttendanceStatus,
  CorrectionRequestStatus,
  CorrectionTargetType,
  FollowUpRecordStatus,
  FollowUpType,
  Prisma,
  Role
} from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import { ensureCenterAllowed, ensureCircleAllowed } from "../../shared/scoping/scope.domain";
import type { ScopeContext } from "../../shared/types/auth.types";
import { quranService } from "../quran/quran.service";
import {
  correctionsRepository,
  type AttendanceTarget,
  type CorrectionItem,
  type ExamAttemptTarget,
  type FollowUpTarget
} from "./corrections.repository";

export type CreateCorrectionInput = {
  targetType: CorrectionTargetType;
  targetId: number;
  reason: string;
  proposedChanges: Record<string, unknown>;
};

export type ListCorrectionsInput = {
  status?: CorrectionRequestStatus;
  targetType?: CorrectionTargetType;
  centerId?: number;
  circleId?: number;
  page?: number;
  pageSize?: number;
};

const readNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim().length) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  }

  return null;
};

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const readBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }
  return null;
};

const asJsonValue = (value: unknown): Prisma.InputJsonValue => {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
};

const serializeCorrection = (row: CorrectionItem) => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
  appliedAt: row.appliedAt ? row.appliedAt.toISOString() : null
});

const assertCanCreateCorrection = (scope: ScopeContext) => {
  if (scope.role !== Role.TEACHER && scope.role !== Role.SUPERVISOR) {
    throw new AppError("Only teachers and supervisors can create correction requests", 403);
  }
};

const assertCanReviewCorrection = (scope: ScopeContext) => {
  if (scope.role !== Role.SUPERVISOR) {
    throw new AppError("Only supervisors can review correction requests", 403);
  }
};

const assertCorrectionInScope = (scope: ScopeContext, centerId: number, circleId: number) => {
  if (scope.allAccess) {
    return;
  }

  ensureCenterAllowed(scope, centerId);
  ensureCircleAllowed(scope, circleId);
};

const assertPendingCorrection = (row: CorrectionItem) => {
  if (row.status !== CorrectionRequestStatus.PENDING) {
    throw new AppError("Correction request is not pending", 409);
  }
};

const resolveTargetSnapshot = async (
  scope: ScopeContext,
  input: { targetType: CorrectionTargetType; targetId: number }
): Promise<{
  centerId: number;
  circleId: number;
  snapshot: Record<string, unknown>;
}> => {
  if (input.targetType === CorrectionTargetType.ATTENDANCE) {
    const target = await correctionsRepository.findAttendanceTarget({
      id: input.targetId,
      organizationId: scope.organizationId
    });
    if (!target) {
      throw new AppError("Attendance target not found", 404);
    }

    assertCorrectionInScope(scope, target.circle.centerId, target.circleId);
    return {
      centerId: target.circle.centerId,
      circleId: target.circleId,
      snapshot: {
        ...target,
        attendanceDate: target.attendanceDate.toISOString().slice(0, 10),
        createdAt: target.createdAt.toISOString(),
        updatedAt: target.updatedAt.toISOString()
      }
    };
  }

  if (input.targetType === CorrectionTargetType.FOLLOW_UP) {
    const target = await correctionsRepository.findFollowUpTarget({
      id: input.targetId,
      organizationId: scope.organizationId
    });
    if (!target) {
      throw new AppError("Follow-up target not found", 404);
    }

    assertCorrectionInScope(scope, target.circle.centerId, target.circleId);

    if (scope.role === Role.TEACHER && target.teacherId !== scope.userId) {
      throw new AppError("Teachers can only request corrections for their own follow-up records", 403);
    }

    return {
      centerId: target.circle.centerId,
      circleId: target.circleId,
      snapshot: {
        ...target,
        recordDate: target.recordDate.toISOString().slice(0, 10),
        pagesCount: target.pagesCount ? Number(target.pagesCount) : null,
        finalizedAt: target.finalizedAt ? target.finalizedAt.toISOString() : null,
        createdAt: target.createdAt.toISOString(),
        updatedAt: target.updatedAt.toISOString()
      }
    };
  }

  const target = await correctionsRepository.findExamAttemptTarget({
    id: input.targetId,
    organizationId: scope.organizationId
  });
  if (!target) {
    throw new AppError("Exam attempt target not found", 404);
  }

  const targetCenterId = target.circle.centerId;
  assertCorrectionInScope(scope, targetCenterId, target.circleId);

  return {
    centerId: targetCenterId,
    circleId: target.circleId,
    snapshot: {
      ...target,
      reviewedAt: target.reviewedAt ? target.reviewedAt.toISOString() : null,
      createdAt: target.createdAt.toISOString(),
      updatedAt: target.updatedAt.toISOString()
    }
  };
};

const applyAttendanceChanges = async (
  target: AttendanceTarget,
  snapshot: Record<string, unknown>,
  proposedChanges: Record<string, unknown>,
  actorUserId: number
) => {
  const statusRaw = readString(proposedChanges.status);
  const status =
    statusRaw && Object.values(AttendanceStatus).includes(statusRaw as AttendanceStatus)
      ? (statusRaw as AttendanceStatus)
      : undefined;

  const noteRaw = proposedChanges.note;
  const note = noteRaw === null ? null : readString(noteRaw);

  const expectedVersion = readNumber(snapshot.lockVersion);

  const updated = await correctionsRepository.applyAttendanceCorrection({
    id: target.id,
    lockVersion: expectedVersion ?? undefined,
    markedById: actorUserId,
    status,
    note: note === null ? null : note ?? undefined
  });

  if (!updated) {
    throw new AppError(
      "Attendance target has changed since the correction request was created",
      409,
      { targetId: target.id },
      "VERSION_CONFLICT"
    );
  }
};

const parseFollowUpStatus = (value: unknown): FollowUpRecordStatus | undefined => {
  const normalized = readString(value);
  if (!normalized) {
    return undefined;
  }

  if (normalized === FollowUpRecordStatus.DRAFT || normalized === FollowUpRecordStatus.FINAL) {
    return normalized;
  }

  throw new AppError("Invalid follow-up status in correction payload", 422, undefined, "VALIDATION_FAILED");
};

const parseFollowUpType = (value: unknown): FollowUpType | undefined => {
  const normalized = readString(value);
  if (!normalized) {
    return undefined;
  }

  if (
    normalized === FollowUpType.NEW_MEMORIZATION ||
    normalized === FollowUpType.REVIEW ||
    normalized === FollowUpType.MATN
  ) {
    return normalized;
  }

  throw new AppError("Invalid follow-up type in correction payload", 422, undefined, "VALIDATION_FAILED");
};

const applyFollowUpChanges = async (
  target: FollowUpTarget,
  snapshot: Record<string, unknown>,
  proposedChanges: Record<string, unknown>
) => {
  const recordDateRaw = readString(proposedChanges.recordDate);
  const recordDate = recordDateRaw ? new Date(recordDateRaw) : undefined;
  if (recordDateRaw && Number.isNaN(recordDate?.getTime())) {
    throw new AppError("Invalid recordDate in correction payload", 422, undefined, "VALIDATION_FAILED");
  }

  const type = parseFollowUpType(proposedChanges.type);
  const status = parseFollowUpStatus(proposedChanges.status);

  const nextFromSurah = proposedChanges.fromSurah === null
    ? null
    : readNumber(proposedChanges.fromSurah) ?? target.fromSurah;
  const nextFromAyah = proposedChanges.fromAyah === null
    ? null
    : readNumber(proposedChanges.fromAyah) ?? target.fromAyah;
  const nextToSurah = proposedChanges.toSurah === null
    ? null
    : readNumber(proposedChanges.toSurah) ?? target.toSurah;
  const nextToAyah = proposedChanges.toAyah === null
    ? null
    : readNumber(proposedChanges.toAyah) ?? target.toAyah;

  let ayahCount: number | null | undefined = undefined;
  let fromPage: number | null | undefined = undefined;
  let toPage: number | null | undefined = undefined;
  let pagesCount: Prisma.Decimal | null | undefined = undefined;

  if (
    nextFromSurah !== null &&
    nextFromAyah !== null &&
    nextToSurah !== null &&
    nextToAyah !== null
  ) {
    const calculation = await quranService.calculateRange({
      fromSurah: nextFromSurah,
      fromAyah: nextFromAyah,
      toSurah: nextToSurah,
      toAyah: nextToAyah
    });

    ayahCount = calculation.ayahCount;
    fromPage = calculation.fromPage;
    toPage = calculation.toPage;
    pagesCount = new Prisma.Decimal(calculation.pagesCount);
  } else if (
    proposedChanges.fromSurah === null ||
    proposedChanges.fromAyah === null ||
    proposedChanges.toSurah === null ||
    proposedChanges.toAyah === null
  ) {
    ayahCount = null;
    fromPage = null;
    toPage = null;
    pagesCount = null;
  }

  const finalizedAt =
    status === FollowUpRecordStatus.FINAL
      ? target.finalizedAt ?? new Date()
      : status === FollowUpRecordStatus.DRAFT
        ? null
        : undefined;

  const expectedVersion = readNumber(snapshot.lockVersion);

  const updated = await correctionsRepository.applyFollowUpCorrection({
    id: target.id,
    lockVersion: expectedVersion ?? undefined,
    data: {
      ...(recordDate ? { recordDate } : {}),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(proposedChanges.surah !== undefined
        ? { surah: proposedChanges.surah === null ? null : readString(proposedChanges.surah) }
        : {}),
      ...(proposedChanges.fromSurah !== undefined ? { fromSurah: nextFromSurah } : {}),
      ...(proposedChanges.fromAyah !== undefined ? { fromAyah: nextFromAyah } : {}),
      ...(proposedChanges.toSurah !== undefined ? { toSurah: nextToSurah } : {}),
      ...(proposedChanges.toAyah !== undefined ? { toAyah: nextToAyah } : {}),
      ...(ayahCount !== undefined ? { ayahCount } : {}),
      ...(fromPage !== undefined ? { fromPage } : {}),
      ...(toPage !== undefined ? { toPage } : {}),
      ...(pagesCount !== undefined ? { pagesCount } : {}),
      ...(proposedChanges.rating !== undefined
        ? { rating: proposedChanges.rating === null ? null : readNumber(proposedChanges.rating) }
        : {}),
      ...(proposedChanges.matnId !== undefined
        ? { matnId: proposedChanges.matnId === null ? null : readNumber(proposedChanges.matnId) }
        : {}),
      ...(proposedChanges.matnName !== undefined
        ? { matnName: proposedChanges.matnName === null ? null : readString(proposedChanges.matnName) }
        : {}),
      ...(proposedChanges.matnStatus !== undefined
        ? { matnStatus: proposedChanges.matnStatus === null ? null : readString(proposedChanges.matnStatus) }
        : {}),
      ...(proposedChanges.notes !== undefined
        ? { notes: proposedChanges.notes === null ? null : readString(proposedChanges.notes) }
        : {}),
      ...(finalizedAt !== undefined ? { finalizedAt } : {})
    }
  });

  if (!updated) {
    throw new AppError(
      "Follow-up target has changed since the correction request was created",
      409,
      { targetId: target.id },
      "VERSION_CONFLICT"
    );
  }
};

const parseAttemptStatus = (value: unknown): AttemptStatus | undefined => {
  const normalized = readString(value);
  if (!normalized) {
    return undefined;
  }

  if (
    normalized === AttemptStatus.SCHEDULED ||
    normalized === AttemptStatus.IN_PROGRESS ||
    normalized === AttemptStatus.EVALUATED ||
    normalized === AttemptStatus.APPROVED ||
    normalized === AttemptStatus.PUBLISHED ||
    normalized === AttemptStatus.CANCELLED
  ) {
    return normalized;
  }

  throw new AppError("Invalid attempt status in correction payload", 422, undefined, "VALIDATION_FAILED");
};

const readBreakdownObject = (value: unknown): Record<string, unknown> | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
};

const applyExamAttemptChanges = async (
  target: ExamAttemptTarget,
  snapshot: Record<string, unknown>,
  proposedChanges: Record<string, unknown>,
  reviewerUserId: number
) => {
  const breakdown = readBreakdownObject(proposedChanges.breakdown);

  const expectedVersion = readNumber(snapshot.lockVersion);

  const updated = await correctionsRepository.applyExamAttemptCorrection({
    id: target.id,
    lockVersion: expectedVersion ?? undefined,
    reviewedById: reviewerUserId,
    attemptData: {
      ...(proposedChanges.committeeNotes !== undefined
        ? {
            committeeNotes:
              proposedChanges.committeeNotes === null ? null : readString(proposedChanges.committeeNotes)
          }
        : {}),
      ...(proposedChanges.totalScore !== undefined
        ? { totalScore: proposedChanges.totalScore === null ? null : readNumber(proposedChanges.totalScore) }
        : {}),
      ...(proposedChanges.gradeLabel !== undefined
        ? { gradeLabel: proposedChanges.gradeLabel === null ? null : readString(proposedChanges.gradeLabel) }
        : {}),
      ...(proposedChanges.status !== undefined ? { status: parseAttemptStatus(proposedChanges.status) } : {}),
      reviewedAt: new Date()
    },
    breakdownData: breakdown
      ? {
          ...(breakdown.memorizationScore !== undefined
            ? {
                memorizationScore:
                  breakdown.memorizationScore === null ? null : readNumber(breakdown.memorizationScore)
              }
            : {}),
          ...(breakdown.tajweedScore !== undefined
            ? { tajweedScore: breakdown.tajweedScore === null ? null : readNumber(breakdown.tajweedScore) }
            : {}),
          ...(breakdown.theoreticalTajweedScore !== undefined
            ? {
                theoreticalTajweedScore:
                  breakdown.theoreticalTajweedScore === null
                    ? null
                    : readNumber(breakdown.theoreticalTajweedScore)
              }
            : {}),
          ...(breakdown.performanceScore !== undefined
            ? {
                performanceScore:
                  breakdown.performanceScore === null ? null : readNumber(breakdown.performanceScore)
              }
            : {}),
          ...(breakdown.promptingDeductions !== undefined
            ? {
                promptingDeductions:
                  breakdown.promptingDeductions === null ? null : readNumber(breakdown.promptingDeductions)
              }
            : {}),
          ...(breakdown.remindingDeductions !== undefined
            ? {
                remindingDeductions:
                  breakdown.remindingDeductions === null ? null : readNumber(breakdown.remindingDeductions)
              }
            : {}),
          ...(breakdown.tajweedDeductions !== undefined
            ? {
                tajweedDeductions:
                  breakdown.tajweedDeductions === null ? null : readNumber(breakdown.tajweedDeductions)
              }
            : {}),
          ...(breakdown.strengthNotes !== undefined
            ? { strengthNotes: breakdown.strengthNotes === null ? null : readString(breakdown.strengthNotes) }
            : {}),
          ...(breakdown.weaknessNotes !== undefined
            ? { weaknessNotes: breakdown.weaknessNotes === null ? null : readString(breakdown.weaknessNotes) }
            : {})
        }
      : undefined
  });

  if (!updated) {
    throw new AppError(
      "Exam attempt target has changed since the correction request was created",
      409,
      { targetId: target.id },
      "VERSION_CONFLICT"
    );
  }
};

export const correctionsService = {
  async create(scope: ScopeContext, input: CreateCorrectionInput) {
    assertCanCreateCorrection(scope);

    if (!input.proposedChanges || Object.keys(input.proposedChanges).length === 0) {
      throw new AppError("proposedChanges must include at least one field", 422, undefined, "VALIDATION_FAILED");
    }

    const target = await resolveTargetSnapshot(scope, {
      targetType: input.targetType,
      targetId: input.targetId
    });

    const created = await correctionsRepository.createCorrection({
      organizationId: scope.organizationId,
      centerId: target.centerId,
      circleId: target.circleId,
      targetType: input.targetType,
      targetId: input.targetId,
      requestedById: scope.userId,
      requestedByRole: scope.role,
      reason: input.reason.trim(),
      proposedChanges: asJsonValue(input.proposedChanges),
      currentSnapshot: asJsonValue(target.snapshot)
    });

    return serializeCorrection(created);
  },

  async list(scope: ScopeContext, query: ListCorrectionsInput) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? Math.min(query.pageSize, 100) : 20;

    if (query.centerId !== undefined) {
      ensureCenterAllowed(scope, query.centerId);
    }

    if (query.circleId !== undefined) {
      ensureCircleAllowed(scope, query.circleId);
    }

    const where: Prisma.CorrectionRequestWhereInput = {
      organizationId: scope.organizationId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.centerId ? { centerId: query.centerId } : {}),
      ...(query.circleId ? { circleId: query.circleId } : {})
    };

    if (!scope.allAccess) {
      if (scope.role === Role.TEACHER) {
        where.requestedById = scope.userId;
      } else {
        if (scope.centerIds.length) {
          where.centerId = where.centerId
            ? where.centerId
            : {
                in: scope.centerIds
              };
        }

        if (scope.circleIds.length) {
          where.circleId = where.circleId
            ? where.circleId
            : {
                in: scope.circleIds
              };
        }
      }
    }

    const result = await correctionsRepository.listCorrections({ where, page, pageSize });
    return {
      data: result.data.map((item) => serializeCorrection(item)),
      page,
      pageSize,
      total: result.total
    };
  },

  async approve(
    scope: ScopeContext,
    correctionId: number,
    input: {
      applyChanges: boolean;
      reviewNote?: string;
    }
  ) {
    assertCanReviewCorrection(scope);

    const existing = await correctionsRepository.findCorrectionById({
      id: correctionId,
      organizationId: scope.organizationId
    });

    if (!existing) {
      throw new AppError("Correction request not found", 404);
    }

    assertCorrectionInScope(scope, existing.centerId, existing.circleId);
    assertPendingCorrection(existing);

    if (input.applyChanges) {
      const snapshot =
        typeof existing.currentSnapshot === "object" && existing.currentSnapshot !== null
          ? (existing.currentSnapshot as Record<string, unknown>)
          : {};
      const proposed =
        typeof existing.proposedChanges === "object" && existing.proposedChanges !== null
          ? (existing.proposedChanges as Record<string, unknown>)
          : {};

      if (existing.targetType === CorrectionTargetType.ATTENDANCE) {
        const target = await correctionsRepository.findAttendanceTarget({
          id: existing.targetId,
          organizationId: scope.organizationId
        });
        if (!target) {
          throw new AppError("Attendance target not found", 404);
        }
        await applyAttendanceChanges(target, snapshot, proposed, scope.userId);
      } else if (existing.targetType === CorrectionTargetType.FOLLOW_UP) {
        const target = await correctionsRepository.findFollowUpTarget({
          id: existing.targetId,
          organizationId: scope.organizationId
        });
        if (!target) {
          throw new AppError("Follow-up target not found", 404);
        }
        await applyFollowUpChanges(target, snapshot, proposed);
      } else {
        const target = await correctionsRepository.findExamAttemptTarget({
          id: existing.targetId,
          organizationId: scope.organizationId
        });
        if (!target) {
          throw new AppError("Exam attempt target not found", 404);
        }
        await applyExamAttemptChanges(target, snapshot, proposed, scope.userId);
      }
    }

    const updated = await correctionsRepository.approveCorrection({
      id: correctionId,
      reviewedById: scope.userId,
      reviewNote: input.reviewNote,
      status: input.applyChanges ? CorrectionRequestStatus.APPLIED : CorrectionRequestStatus.APPROVED,
      appliedById: input.applyChanges ? scope.userId : undefined,
      appliedAt: input.applyChanges ? new Date() : undefined
    });

    return serializeCorrection(updated);
  },

  async reject(scope: ScopeContext, correctionId: number, input: { reviewNote: string }) {
    assertCanReviewCorrection(scope);

    const existing = await correctionsRepository.findCorrectionById({
      id: correctionId,
      organizationId: scope.organizationId
    });

    if (!existing) {
      throw new AppError("Correction request not found", 404);
    }

    assertCorrectionInScope(scope, existing.centerId, existing.circleId);
    assertPendingCorrection(existing);

    const updated = await correctionsRepository.rejectCorrection({
      id: correctionId,
      reviewedById: scope.userId,
      reviewNote: input.reviewNote
    });

    return serializeCorrection(updated);
  }
};
