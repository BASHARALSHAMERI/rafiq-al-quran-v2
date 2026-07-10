import {
  AchievementCategory,
  GoldenRecordStatus,
  GoldenRecordType,
  GraduationCandidateStatus,
  RiwayaType,
  Role
} from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import { ensureCenterAllowed, ensureCircleAllowed } from "../../shared/scoping/scope.domain";
import type { ScopeContext } from "../../shared/types/auth.types";
import { safeDate } from "../../shared/utils/time";

const GOLDEN_RECORD_ALLOWED_ROLES: Role[] = [Role.SUPER_ADMIN, Role.CENTER_ADMIN];

const CANDIDATE_TRANSITIONS: Record<
  GraduationCandidateStatus,
  GraduationCandidateStatus[]
> = {
  NOMINATED: [GraduationCandidateStatus.APPROVED, GraduationCandidateStatus.REJECTED, GraduationCandidateStatus.DEFERRED],
  SCHEDULED: [
    GraduationCandidateStatus.NOMINATED,
    GraduationCandidateStatus.APPROVED,
    GraduationCandidateStatus.REJECTED,
    GraduationCandidateStatus.DEFERRED
  ],
  TESTED: [
    GraduationCandidateStatus.NOMINATED,
    GraduationCandidateStatus.APPROVED,
    GraduationCandidateStatus.REJECTED,
    GraduationCandidateStatus.DEFERRED
  ],
  APPROVED: [],
  REJECTED: [GraduationCandidateStatus.NOMINATED],
  DEFERRED: [GraduationCandidateStatus.NOMINATED]
};

const GOLDEN_RECORD_TRANSITIONS: Record<GoldenRecordStatus, GoldenRecordStatus[]> = {
  DRAFT: [GoldenRecordStatus.SUBMITTED],
  SUBMITTED: [GoldenRecordStatus.APPROVED, GoldenRecordStatus.REJECTED],
  APPROVED: [],
  REJECTED: [GoldenRecordStatus.DRAFT, GoldenRecordStatus.SUBMITTED]
};

const toDateOnly = (value: Date): Date => {
  const normalized = new Date(value);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
};

export const goldenRecordsDomain = {
  currentYear(): number {
    return new Date().getFullYear();
  },

  assertModuleAccess(scope: ScopeContext) {
    if (!GOLDEN_RECORD_ALLOWED_ROLES.includes(scope.role)) {
      throw new AppError("Golden Record access is restricted for your role", 403);
    }
  },

  assertCanApproveCandidates(scope: ScopeContext) {
    if (scope.role !== Role.SUPER_ADMIN) {
      throw new AppError("Only Super Admin can approve, reject, or defer graduation candidates", 403);
    }
  },

  assertCanManageCandidateNominations(scope: ScopeContext) {
    if (scope.role !== Role.CENTER_ADMIN) {
      throw new AppError("Only Center Admin can create or edit graduation nominations", 403);
    }
  },

  assertCanManageCandidateExamLinkage(scope: ScopeContext) {
    if (scope.role !== Role.CENTER_ADMIN) {
      throw new AppError("Only Center Admin can link graduation candidates to exam attempts", 403);
    }
  },

  assertCanApproveGoldenRecords(scope: ScopeContext) {
    if (scope.role !== Role.SUPER_ADMIN) {
      throw new AppError("Only Super Admin can approve or reject final golden records", 403);
    }
  },

  assertScopeFilters(scope: ScopeContext, input: { centerId?: number; circleId?: number }) {
    if (input.centerId) {
      ensureCenterAllowed(scope, input.centerId);
    }

    if (input.circleId) {
      ensureCircleAllowed(scope, input.circleId);
    }
  },

  ensureCenterVisible(scope: ScopeContext, centerId: number) {
    ensureCenterAllowed(scope, centerId);
  },

  ensureCircleVisible(scope: ScopeContext, circleId: number) {
    ensureCircleAllowed(scope, circleId);
  },

  resolveYear(year?: number): number {
    return year ?? this.currentYear();
  },

  parseDateOnly(value: string, fieldName: string): Date {
    return toDateOnly(safeDate(value, fieldName));
  },

  parseOptionalDateOnly(value: string | null | undefined, fieldName: string): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    return this.parseDateOnly(value, fieldName);
  },

  normalizeCandidateStatus(status: GraduationCandidateStatus): GraduationCandidateStatus {
    return status;
  },

  assertValidCandidateTransition(
    currentStatus: GraduationCandidateStatus,
    nextStatus: GraduationCandidateStatus
  ) {
    if (currentStatus === nextStatus) {
      return;
    }

    if (!CANDIDATE_TRANSITIONS[currentStatus].includes(nextStatus)) {
      throw new AppError(
        `Invalid candidate transition from ${currentStatus} to ${nextStatus}`,
        409,
        { currentStatus, nextStatus },
        "INVALID_STATUS_TRANSITION"
      );
    }
  },

  assertCandidateEditable(status: GraduationCandidateStatus) {
    if (status === GraduationCandidateStatus.APPROVED) {
      throw new AppError("Approved candidate is locked for direct editing", 409, undefined, "LOCKED_RECORD");
    }
  },

  assertValidGoldenRecordTransition(
    currentStatus: GoldenRecordStatus,
    nextStatus: GoldenRecordStatus
  ) {
    if (currentStatus === nextStatus) {
      return;
    }

    if (!GOLDEN_RECORD_TRANSITIONS[currentStatus].includes(nextStatus)) {
      throw new AppError(
        `Invalid final record transition from ${currentStatus} to ${nextStatus}`,
        409,
        { currentStatus, nextStatus },
        "INVALID_STATUS_TRANSITION"
      );
    }
  },

  assertGoldenRecordEditable(status: GoldenRecordStatus) {
    if (status === GoldenRecordStatus.APPROVED) {
      throw new AppError("Approved golden record is immutable", 409, undefined, "LOCKED_RECORD");
    }

    if (status === GoldenRecordStatus.SUBMITTED) {
      throw new AppError("Submitted golden record must be approved or rejected before further edits", 409);
    }
  },

  assertRiwayaRule(type: GoldenRecordType, riwaya?: RiwayaType | null) {
    if (type === GoldenRecordType.IJAZAH && !riwaya) {
      throw new AppError("Riwaya is required for IJAZAH records", 422, undefined, "VALIDATION_FAILED");
    }
  },

  deriveAchievementCategory(juzCount: number): AchievementCategory {
    if (!Number.isInteger(juzCount) || juzCount < 0 || juzCount > 30) {
      throw new AppError("juzCount must be between 0 and 30", 422, undefined, "VALIDATION_FAILED");
    }

    if (juzCount === 30) {
      return AchievementCategory.JUZ_30;
    }

    if (juzCount >= 20) {
      return AchievementCategory.JUZ_20;
    }

    if (juzCount >= 10) {
      return AchievementCategory.JUZ_10;
    }

    return AchievementCategory.LESS_THAN_10_JUZ;
  },

  buildRegistrySerial(input: { organizationId: number; year: number; recordId: number }): string {
    return `GR-${input.year}-${input.organizationId}-${String(input.recordId).padStart(6, "0")}`;
  }
};
