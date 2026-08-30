import { ActivityType, FollowUpType, Prisma } from "@prisma/client";
import type { FollowUpRecordStatus } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import { editLockPolicy } from "../../shared/policies/edit-lock.policy";
import { getSurahAyahCount } from "../../shared/quran/surah-ayah-counts";
import { safeDate } from "../../shared/utils/time";
import { ensureCenterAllowed, ensureCircleAllowed } from "../../shared/scoping/scope.domain";
import type { ScopeContext } from "../../shared/types/auth.types";
import { prisma } from "../../shared/db/prisma";
import { quranService } from "../quran/quran.service";
import { followUpDomain } from "./follow-ups.domain";
import { followUpsRepository, type FollowUpRecordItem } from "./follow-ups.repository";

export type CreateFollowUpInput = {
  studentId: number;
  circleId: number;
  recordDate: string;
  type: FollowUpType;
  status?: FollowUpRecordStatus;
  surah?: string;
  fromSurah?: number;
  fromAyah?: number;
  toSurah?: number;
  toAyah?: number;
  rating?: number;
  matnId?: number;
  matnName?: string;
  matnStatus?: string;
  matnFromRef?: string;
  matnToRef?: string;
  notes?: string;
  idempotencyKey?: string;
};

export type UpdateFollowUpInput = {
  recordDate?: string;
  type?: FollowUpType;
  surah?: string | null;
  fromSurah?: number | null;
  fromAyah?: number | null;
  toSurah?: number | null;
  toAyah?: number | null;
  rating?: number | null;
  matnId?: number | null;
  matnName?: string | null;
  matnStatus?: string | null;
  matnFromRef?: string | null;
  matnToRef?: string | null;
  notes?: string | null;
  lockVersion?: number;
};

export type ListFollowUpsInput = {
  centerId?: number;
  circleId?: number;
  studentId?: number;
  from?: string;
  to?: string;
  status?: FollowUpRecordStatus;
  page?: number;
  pageSize?: number;
};

const toDateOnly = (input: Date): Date => {
  const date = new Date(input);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const intersect = (base: number[], other: number[]): number[] => {
  const otherSet = new Set(other);
  return base.filter((value) => otherSet.has(value));
};

const toOptionalDecimal = (value: number | null | undefined): Prisma.Decimal | null | undefined => {
  if (value === null) return null;
  if (typeof value !== "number") return undefined;
  return new Prisma.Decimal(value);
};

const normalizeText = (value: string | null | undefined): string | null | undefined => {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeOptionalInt = (value: number | null | undefined): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Number.isInteger(value)) return undefined;
  return value;
};

const parseLegacySurahNumber = (surah: string | null | undefined): number | null => {
  if (!surah) return null;
  const normalized = surah.trim();
  if (!/^\d{1,3}$/.test(normalized)) {
    return null;
  }

  const surahNumber = Number(normalized);
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return null;
  }

  return surahNumber;
};

type ResolvedQuranRange = {
  fromSurah: number | null;
  fromAyah: number | null;
  toSurah: number | null;
  toAyah: number | null;
  ayahCount: number | null;
  fromPage: number | null;
  toPage: number | null;
  pagesCount: Prisma.Decimal | null;
};

const calculateRangeIfComplete = async (input: {
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
}): Promise<ResolvedQuranRange> => {
  const calculated = await quranService.calculateRange({
    fromSurah: input.fromSurah,
    fromAyah: input.fromAyah,
    toSurah: input.toSurah,
    toAyah: input.toAyah
  });

  return {
    fromSurah: input.fromSurah,
    fromAyah: input.fromAyah,
    toSurah: input.toSurah,
    toAyah: input.toAyah,
    ayahCount: calculated.ayahCount,
    fromPage: calculated.fromPage,
    toPage: calculated.toPage,
    pagesCount: new Prisma.Decimal(calculated.pagesCount)
  };
};

const resolveCreateQuranRange = async (input: {
  surah?: string | null;
  fromSurah?: number;
  fromAyah?: number;
  toSurah?: number;
  toAyah?: number;
}): Promise<ResolvedQuranRange> => {
  let fromSurah = normalizeOptionalInt(input.fromSurah) ?? null;
  let toSurah = normalizeOptionalInt(input.toSurah) ?? null;
  const fromAyah = normalizeOptionalInt(input.fromAyah) ?? null;
  const toAyah = normalizeOptionalInt(input.toAyah) ?? null;

  const legacySurah = parseLegacySurahNumber(input.surah);
  const hasLegacyAyahBounds = fromAyah !== null && toAyah !== null;
  if (!fromSurah && !toSurah && legacySurah && hasLegacyAyahBounds) {
    fromSurah = legacySurah;
    toSurah = legacySurah;
  }

  const hasStructuredRange = fromSurah !== null || toSurah !== null;
  if (!hasStructuredRange) {
    return {
      fromSurah: null,
      fromAyah: null,
      toSurah: null,
      toAyah: null,
      ayahCount: null,
      fromPage: null,
      toPage: null,
      pagesCount: null
    };
  }

  const allNull = [fromSurah, fromAyah, toSurah, toAyah].every((item) => item === null);
  if (allNull) {
    return {
      fromSurah: null,
      fromAyah: null,
      toSurah: null,
      toAyah: null,
      ayahCount: null,
      fromPage: null,
      toPage: null,
      pagesCount: null
    };
  }

  const allProvided = [fromSurah, fromAyah, toSurah, toAyah].every((item) => typeof item === "number");
  if (!allProvided) {
    throw new AppError(
      "نطاق القرآن يتطلب رقم السورة والآية البداية والنهاية معاً",
      422,
      undefined,
      "VALIDATION_FAILED"
    );
  }

  return calculateRangeIfComplete({
    fromSurah: fromSurah as number,
    fromAyah: fromAyah as number,
    toSurah: toSurah as number,
    toAyah: toAyah as number
  });
};

const resolveUpdateQuranRange = async (
  existing: FollowUpRecordItem,
  input: UpdateFollowUpInput,
  nextSurahText: string | null | undefined
): Promise<{
  shouldUpdateRange: boolean;
  range: ResolvedQuranRange;
}> => {
  const touched = [
    input.fromSurah,
    input.fromAyah,
    input.toSurah,
    input.toAyah
  ].some((item) => item !== undefined);

  if (!touched && input.surah === undefined) {
    return {
      shouldUpdateRange: false,
      range: {
        fromSurah: existing.fromSurah,
        fromAyah: existing.fromAyah,
        toSurah: existing.toSurah,
        toAyah: existing.toAyah,
        ayahCount: existing.ayahCount,
        fromPage: existing.fromPage,
        toPage: existing.toPage,
        pagesCount: existing.pagesCount
      }
    };
  }

  if (
    input.fromSurah === null ||
    input.fromAyah === null ||
    input.toSurah === null ||
    input.toAyah === null
  ) {
    return {
      shouldUpdateRange: true,
      range: {
        fromSurah: null,
        fromAyah: null,
        toSurah: null,
        toAyah: null,
        ayahCount: null,
        fromPage: null,
        toPage: null,
        pagesCount: null
      }
    };
  }

  let nextFromSurah = normalizeOptionalInt(input.fromSurah) ?? existing.fromSurah ?? null;
  let nextToSurah = normalizeOptionalInt(input.toSurah) ?? existing.toSurah ?? null;
  const nextFromAyah = normalizeOptionalInt(input.fromAyah) ?? existing.fromAyah ?? null;
  const nextToAyah = normalizeOptionalInt(input.toAyah) ?? existing.toAyah ?? null;

  const legacySurah = parseLegacySurahNumber(nextSurahText);
  if (
    legacySurah &&
    nextFromAyah !== null &&
    nextToAyah !== null &&
    !nextFromSurah &&
    !nextToSurah
  ) {
    nextFromSurah = legacySurah;
    nextToSurah = legacySurah;
  }

  const allNull = [nextFromSurah, nextFromAyah, nextToSurah, nextToAyah].every((item) => item === null);
  if (allNull) {
    return {
      shouldUpdateRange: true,
      range: {
        fromSurah: null,
        fromAyah: null,
        toSurah: null,
        toAyah: null,
        ayahCount: null,
        fromPage: null,
        toPage: null,
        pagesCount: null
      }
    };
  }

  const hasStructuredRange = nextFromSurah !== null || nextToSurah !== null;
  if (!hasStructuredRange) {
    return {
      shouldUpdateRange: false,
      range: {
        fromSurah: existing.fromSurah,
        fromAyah: existing.fromAyah,
        toSurah: existing.toSurah,
        toAyah: existing.toAyah,
        ayahCount: existing.ayahCount,
        fromPage: existing.fromPage,
        toPage: existing.toPage,
        pagesCount: existing.pagesCount
      }
    };
  }

  const allProvided = [nextFromSurah, nextFromAyah, nextToSurah, nextToAyah].every(
    (item) => typeof item === "number"
  );

  if (!allProvided) {
    throw new AppError(
      "نطاق القرآن يتطلب رقم السورة والآية البداية والنهاية معاً",
      422,
      undefined,
      "VALIDATION_FAILED"
    );
  }

  return {
    shouldUpdateRange: true,
    range: await calculateRangeIfComplete({
      fromSurah: nextFromSurah as number,
      fromAyah: nextFromAyah as number,
      toSurah: nextToSurah as number,
      toAyah: nextToAyah as number
    })
  };
};

const serializeRecord = (record: FollowUpRecordItem) => ({
  ...record,
  recordDate: record.recordDate.toISOString().slice(0, 10),
  pagesCount: record.pagesCount ? Number(record.pagesCount) : null,
  finalizedAt: record.finalizedAt ? record.finalizedAt.toISOString() : null,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString()
});

const ensureCircleAccessible = async (scope: ScopeContext, circleId: number) => {
  const circle = await followUpsRepository.findAccessibleCircle({
    organizationId: scope.organizationId,
    circleId,
    allowAll: scope.allAccess,
    scopeCircleIds: scope.circleIds,
    scopeCenterIds: scope.centerIds
  });

  if (!circle) {
    throw new AppError("ليس لديك صلاحية الوصول للحلقة المطلوبة", 403);
  }

  return circle;
};

const resolveScopedCircleIds = async (
  scope: ScopeContext,
  query: Pick<ListFollowUpsInput, "centerId" | "circleId">
): Promise<number[]> => {
  if (scope.allAccess) {
    if (query.circleId) {
      return [query.circleId];
    }

    if (query.centerId) {
      return followUpsRepository.findCircleIdsByCenterIds(scope.organizationId, [query.centerId]);
    }

    return followUpsRepository.findCircleIdsByOrganization(scope.organizationId);
  }

  if (query.centerId) {
    ensureCenterAllowed(scope, query.centerId);
  }

  if (query.circleId) {
    ensureCircleAllowed(scope, query.circleId);
  }

  let circleIds = scope.circleIds;

  if (query.centerId) {
    const centerCircleIds = await followUpsRepository.findCircleIdsByCenterIds(scope.organizationId, [
      query.centerId
    ]);
    circleIds = intersect(circleIds, centerCircleIds);
  }

  if (query.circleId) {
    circleIds = intersect(circleIds, [query.circleId]);
  }

  return circleIds;
};

export const followUpsService = {
  async listFollowUps(scope: ScopeContext, query: ListFollowUpsInput) {
    followUpDomain.assertCanView(scope);

    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? Math.min(query.pageSize, 100) : 20;

    const circleIds = await resolveScopedCircleIds(scope, {
      centerId: query.centerId,
      circleId: query.circleId
    });

    if (!circleIds.length) {
      return {
        data: [],
        page,
        pageSize,
        total: 0
      };
    }

    const range = followUpDomain.resolveDateRange(query.from, query.to);

    const where: Prisma.FollowUpRecordWhereInput = {
      circleId: { in: circleIds },
      recordDate: {
        gte: range.from,
        lte: range.to
      },
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.status ? { status: query.status } : {})
    };

    const result = await followUpsRepository.listRecords(where, page, pageSize);

    return {
      data: result.data.map((item) => serializeRecord(item)),
      page,
      pageSize,
      total: result.total
    };
  },

  async createFollowUp(scope: ScopeContext, input: CreateFollowUpInput) {
    followUpDomain.assertCanWrite(scope);
    const normalizedSurah = normalizeText(input.surah);
    const resolvedCreateRange = await resolveCreateQuranRange({
      surah: normalizedSurah,
      fromSurah: input.fromSurah,
      fromAyah: input.fromAyah,
      toSurah: input.toSurah,
      toAyah: input.toAyah
    });

    followUpDomain.validateFollowUpData(input.type, {
      surah: normalizedSurah,
      fromSurah: resolvedCreateRange.fromSurah ?? undefined,
      matnName: input.matnName,
      matnId: input.matnId,
      fromAyah: input.fromAyah,
      toSurah: resolvedCreateRange.toSurah ?? undefined,
      toAyah: input.toAyah,
      rating: input.rating
    });

    await ensureCircleAccessible(scope, input.circleId);

    const enrollment = await followUpsRepository.findActiveEnrollment({
      studentId: input.studentId,
      circleId: input.circleId
    });

    if (!enrollment) {
      throw new AppError("الطالب غير مسجل بشكل نشط في هذه الحلقة", 400);
    }

    const status = followUpDomain.normalizeStatus(input.status);
    const resolvedRecordDate = toDateOnly(safeDate(input.recordDate, "recordDate"));

    if (status === "FINAL") {
      const attendance = await prisma.attendanceRecord.findFirst({
        where: {
          studentId: input.studentId,
          circleId: input.circleId,
          attendanceDate: resolvedRecordDate
        }
      });
      if (!attendance || (attendance.status !== "PRESENT" && attendance.status !== "LATE")) {
        throw new AppError("لا يمكن حفظ متابعة نهائية لطالب غائب أو لم يُسجل حضوره بعد", 400);
      }
    }

    const record = await prisma.$transaction(async (tx) => {
      if (input.idempotencyKey) {
        const existing = await tx.followUpRecord.findUnique({
          where: { idempotencyKey: input.idempotencyKey }
        });
        if (existing) {
          const updated = await followUpsRepository.updateRecord(existing.id, {
            recordDate: resolvedRecordDate,
            type: input.type,
            status,
            surah: normalizedSurah ?? undefined,
            fromSurah: resolvedCreateRange.fromSurah ?? undefined,
            fromAyah: input.fromAyah,
            toSurah: resolvedCreateRange.toSurah ?? undefined,
            toAyah: input.toAyah,
            ayahCount: resolvedCreateRange.ayahCount,
            fromPage: resolvedCreateRange.fromPage,
            toPage: resolvedCreateRange.toPage,
            pagesCount: resolvedCreateRange.pagesCount,
            rating: input.rating,
            matnId: input.matnId ?? null,
            matnName: normalizeText(input.matnName) ?? undefined,
            matnStatus: normalizeText(input.matnStatus) ?? undefined,
            matnFromRef: normalizeText(input.matnFromRef) ?? undefined,
            matnToRef: normalizeText(input.matnToRef) ?? undefined,
            notes: normalizeText(input.notes) ?? undefined,
            finalizedAt: status === "FINAL" && existing.status !== "FINAL" ? new Date() : existing.finalizedAt
          }, undefined, tx);
          return updated!;
        }
      }

      const createdRecord = await followUpsRepository.createRecord({
        studentId: input.studentId,
        teacherId: scope.userId,
        circleId: input.circleId,
        recordDate: resolvedRecordDate,
      type: input.type,
      status,
      surah: normalizedSurah ?? undefined,
      fromSurah: resolvedCreateRange.fromSurah ?? undefined,
      fromAyah: input.fromAyah,
      toSurah: resolvedCreateRange.toSurah ?? undefined,
      toAyah: input.toAyah,
      ayahCount: resolvedCreateRange.ayahCount,
      fromPage: resolvedCreateRange.fromPage,
      toPage: resolvedCreateRange.toPage,
      pagesCount: resolvedCreateRange.pagesCount,
      rating: input.rating,
      matnId: input.matnId ?? null,
      matnName: normalizeText(input.matnName) ?? undefined,
      matnStatus: normalizeText(input.matnStatus) ?? undefined,
      matnFromRef: normalizeText(input.matnFromRef) ?? undefined,
      matnToRef: normalizeText(input.matnToRef) ?? undefined,
        notes: normalizeText(input.notes) ?? undefined,
        finalizedAt: status === "FINAL" ? new Date() : null,
        idempotencyKey: input.idempotencyKey ?? null
      }, tx);

      await tx.activityLog.create({
        data: {
          organizationId: scope.organizationId,
          userId: scope.userId,
          circleId: input.circleId,
          activityType: ActivityType.FOLLOW_UP_RECORDED,
          entityType: "FOLLOW_UP",
          entityId: createdRecord.id,
          message:
            status === "DRAFT"
              ? "Saved follow-up draft"
              : "Recorded final follow-up"
        }
      });

      return createdRecord;
    });

    return serializeRecord(record);
  },

  async updateFollowUp(scope: ScopeContext, followUpId: number, input: UpdateFollowUpInput) {
    followUpDomain.assertCanWrite(scope);

    const existing = await followUpsRepository.findRecordById(followUpId, scope.organizationId);

    if (!existing) {
      throw new AppError("سجل المتابعة غير موجود", 404);
    }

    await ensureCircleAccessible(scope, existing.circleId);
    followUpDomain.assertCanUpdateRecord(scope, existing.teacherId);
    editLockPolicy.assertEditable({
      resource: "Follow-up record",
      createdAt: existing.createdAt
    });
    editLockPolicy.assertVersionMatch({
      resource: "Follow-up record",
      currentVersion: existing.lockVersion,
      expectedVersion: input.lockVersion
    });

    if (existing.status === "FINAL") {
      throw new AppError("سجل المتابعة مكتمل بالفعل", 409);
    }

    const nextType = input.type ?? existing.type;
    const nextSurah = normalizeText(input.surah) ?? existing.surah ?? null;
    const resolvedUpdateRange = await resolveUpdateQuranRange(existing, input, nextSurah);
    const legacyRangeTouchedWithoutStructured =
      !resolvedUpdateRange.shouldUpdateRange &&
      (input.fromAyah !== undefined ||
        input.toAyah !== undefined ||
        input.fromSurah !== undefined ||
        input.toSurah !== undefined ||
        input.surah !== undefined);

    followUpDomain.validateFollowUpData(nextType, {
      surah: nextSurah,
      fromSurah: resolvedUpdateRange.range.fromSurah ?? undefined,
      matnName: input.matnName ?? existing.matnName,
      matnId: input.matnId ?? existing.matnId,
      fromAyah: input.fromAyah ?? existing.fromAyah,
      toSurah: resolvedUpdateRange.range.toSurah ?? undefined,
      toAyah: input.toAyah ?? existing.toAyah,
      rating: input.rating ?? existing.rating
    });

    const updatedResponse = await prisma.$transaction(async (tx) => {
      const updated = await followUpsRepository.updateRecord(followUpId, {
        recordDate: input.recordDate ? toDateOnly(safeDate(input.recordDate, "recordDate")) : undefined,
        type: input.type,
        surah: normalizeText(input.surah),
      ...(input.fromSurah !== undefined ? { fromSurah: input.fromSurah } : {}),
      ...(input.fromAyah !== undefined ? { fromAyah: input.fromAyah } : {}),
      ...(input.toSurah !== undefined ? { toSurah: input.toSurah } : {}),
      ...(input.toAyah !== undefined ? { toAyah: input.toAyah } : {}),
      ...(resolvedUpdateRange.shouldUpdateRange
        ? {
            fromSurah: resolvedUpdateRange.range.fromSurah,
            fromAyah: resolvedUpdateRange.range.fromAyah,
            toSurah: resolvedUpdateRange.range.toSurah,
            toAyah: resolvedUpdateRange.range.toAyah,
            ayahCount: resolvedUpdateRange.range.ayahCount,
            fromPage: resolvedUpdateRange.range.fromPage,
            toPage: resolvedUpdateRange.range.toPage,
            pagesCount: resolvedUpdateRange.range.pagesCount
          }
        : {}),
      ...(legacyRangeTouchedWithoutStructured
        ? {
            ayahCount: null,
            fromPage: null,
            toPage: null,
            pagesCount: null
          }
        : {}),
      rating: input.rating,
      matnId: input.matnId,
      matnName: normalizeText(input.matnName),
      matnStatus: normalizeText(input.matnStatus),
      matnFromRef: normalizeText(input.matnFromRef),
      matnToRef: normalizeText(input.matnToRef),
        notes: normalizeText(input.notes)
      }, existing.lockVersion, tx);

      if (!updated) {
        throw new AppError("تعارض في إصدار سجل المتابعة", 409, { id: followUpId }, "VERSION_CONFLICT");
      }

      await tx.activityLog.create({
        data: {
          organizationId: scope.organizationId,
          userId: scope.userId,
          circleId: updated.circleId,
          activityType: ActivityType.FOLLOW_UP_RECORDED,
          entityType: "FOLLOW_UP",
          entityId: updated.id,
          message: "Updated follow-up draft"
        }
      });

      return updated;
    });

    return serializeRecord(updatedResponse);
  },

  async finalizeFollowUp(scope: ScopeContext, followUpId: number) {
    followUpDomain.assertCanWrite(scope);

    const existing = await followUpsRepository.findRecordById(followUpId, scope.organizationId);

    if (!existing) {
      throw new AppError("سجل المتابعة غير موجود", 404);
    }

    await ensureCircleAccessible(scope, existing.circleId);
    followUpDomain.assertCanUpdateRecord(scope, existing.teacherId);
    editLockPolicy.assertEditable({
      resource: "Follow-up record",
      createdAt: existing.createdAt
    });

    if (existing.status === "FINAL") {
      return serializeRecord(existing);
    }

    const resolvedFinalizeDate = toDateOnly(existing.recordDate);
    const attendance = await prisma.attendanceRecord.findFirst({
      where: {
        studentId: existing.studentId,
        circleId: existing.circleId,
        attendanceDate: resolvedFinalizeDate
      }
    });
    if (!attendance || (attendance.status !== "PRESENT" && attendance.status !== "LATE")) {
      throw new AppError("لا يمكن تصفية متابعة لطالب غائب أو لم يُسجل حضوره بعد", 400);
    }

    const finalizedResponse = await prisma.$transaction(async (tx) => {
      const finalized = await followUpsRepository.finalizeRecord(followUpId, existing.lockVersion, tx);
      if (!finalized) {
        throw new AppError("تعارض في إصدار سجل المتابعة", 409, { id: followUpId }, "VERSION_CONFLICT");
      }

      await tx.activityLog.create({
        data: {
          organizationId: scope.organizationId,
          userId: scope.userId,
          circleId: finalized.circleId,
          activityType: ActivityType.FOLLOW_UP_RECORDED,
          entityType: "FOLLOW_UP",
          entityId: finalized.id,
          message: "Finalized follow-up draft"
        }
      });

      return finalized;
    });

    return serializeRecord(finalizedResponse);
  },

  async removeFollowUp(scope: ScopeContext, followUpId: number) {
    followUpDomain.assertCanWrite(scope);

    const existing = await followUpsRepository.findRecordById(followUpId, scope.organizationId);

    if (!existing) {
      throw new AppError("سجل المتابعة غير موجود", 404);
    }

    await ensureCircleAccessible(scope, existing.circleId);
    followUpDomain.assertCanUpdateRecord(scope, existing.teacherId);

    await followUpsRepository.removeRecord(followUpId);

    return { id: followUpId, deleted: true };
  }
};
