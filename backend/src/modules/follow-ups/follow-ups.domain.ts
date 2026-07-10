import { FollowUpType, Role } from "@prisma/client";
import type { FollowUpRecordStatus } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import type { ScopeContext } from "../../shared/types/auth.types";
import { safeDate } from "../../shared/utils/time";

export type FollowUpDateRange = {
  from: Date;
  to: Date;
};

const WRITER_ROLES: Role[] = [Role.TEACHER, Role.SUPERVISOR];
const VIEWER_ROLES: Role[] = [Role.SUPER_ADMIN, Role.CENTER_ADMIN, Role.SUPERVISOR, Role.TEACHER];

export const startOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

export const followUpDomain = {
  assertCanView(scope: ScopeContext) {
    if (!VIEWER_ROLES.includes(scope.role)) {
      throw new AppError("Follow-up access is restricted for your role", 403);
    }
  },

  assertCanWrite(scope: ScopeContext) {
    if (!WRITER_ROLES.includes(scope.role)) {
      throw new AppError("Only teachers and supervisors can write follow-up records", 403);
    }
  },

  assertCanUpdateRecord(scope: ScopeContext, teacherId: number) {
    if (scope.role === Role.TEACHER && scope.userId !== teacherId) {
      throw new AppError("Teachers can only update their own follow-up records", 403);
    }
  },

  resolveDateRange(from?: string, to?: string): FollowUpDateRange {
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 30);

    const resolvedFrom = from ? safeDate(from, "from") : defaultFrom;
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

  normalizeStatus(value?: FollowUpRecordStatus): FollowUpRecordStatus {
    return value ?? "FINAL";
  },

  validateFollowUpData(type: FollowUpType, data: {
    surah?: string | null;
    fromSurah?: number | null;
    matnName?: string | null;
    matnId?: number | null;
    fromAyah?: number | null;
    toSurah?: number | null;
    toAyah?: number | null;
    rating?: number | null;
  }) {
    const hasStructuredRange = data.fromSurah !== undefined || data.toSurah !== undefined;

    const hasFullRange = hasStructuredRange && [
      data.fromSurah,
      data.fromAyah,
      data.toSurah,
      data.toAyah
    ].every((value) => typeof value === "number");

    if (hasStructuredRange && !hasFullRange) {
      throw new AppError("Quran range requires fromSurah/fromAyah/toSurah/toAyah together", 422, undefined, "VALIDATION_FAILED");
    }

    if (hasFullRange) {
      if ((data.fromSurah as number) < 1 || (data.fromSurah as number) > 114 || (data.toSurah as number) < 1 || (data.toSurah as number) > 114) {
        throw new AppError("Surah range must be between 1 and 114", 422, undefined, "VALIDATION_FAILED");
      }

      const isOrdered =
        (data.fromSurah as number) < (data.toSurah as number) ||
        ((data.fromSurah as number) === (data.toSurah as number) &&
          (data.fromAyah as number) <= (data.toAyah as number));
      if (!isOrdered) {
        throw new AppError("Quran range order is invalid", 422, undefined, "VALIDATION_FAILED");
      }
    }

    if (
      (type === FollowUpType.NEW_MEMORIZATION || type === FollowUpType.REVIEW) &&
      !data.surah?.trim() &&
      !hasFullRange
    ) {
      throw new AppError(`surah or Quran range is required for ${type}`, 400);
    }

    if (type === FollowUpType.MATN && !data.matnName?.trim() && !data.matnId) {
      throw new AppError("matnName or matnId is required for MATN type", 400);
    }

    if (data.fromAyah && data.toAyah) {
      const sameSurahStructured = hasFullRange && data.fromSurah === data.toSurah;
      if ((sameSurahStructured || !hasFullRange) && data.fromAyah > data.toAyah) {
        throw new AppError("fromAyah must be less than or equal to toAyah", 400);
      }
    }

    if (typeof data.rating === "number" && (data.rating < 1 || data.rating > 100)) {
      throw new AppError("rating must be between 1 and 100", 400);
    }
  }
};
