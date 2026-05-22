import { ReportType, Role } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import { ensureCenterAllowed, ensureCircleAllowed } from "../../shared/scoping/scope.domain";
import type { ScopeContext } from "../../shared/types/auth.types";
import { safeDate } from "../../shared/utils/time";

export type ReportsDateRange = {
  from: Date;
  to: Date;
};

export type ReportFilterInput = {
  from: string;
  to: string;
  centerId?: number;
  circleId?: number;
  actorRole?: Role;
  examStatus?: import("@prisma/client").ExamStatus;
  status?: import("@prisma/client").InvoiceStatus;
  search?: string;
};

const startOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const FULL_REPORT_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.SUPERVISOR,
  Role.TEACHER,
  Role.PARENT
];

export const reportsDomain = {
  assertReportAccess(scope: ScopeContext, reportType: ReportType) {
    if (!FULL_REPORT_ROLES.includes(scope.role)) {
      throw new AppError("Reports are restricted for your role", 403);
    }

    if (scope.role === Role.PARENT && reportType === ReportType.FOLLOW_UP) {
      throw new AppError("Follow-up report is restricted for parents", 403);
    }

    if (scope.role === Role.TEACHER && reportType === ReportType.FINANCE) {
      throw new AppError("Finance report is restricted for teachers", 403);
    }
  },

  resolveDateRange(from: string, to: string): ReportsDateRange {
    const normalizedFrom = startOfDay(safeDate(from, "from"));
    const normalizedTo = endOfDay(safeDate(to, "to"));

    if (normalizedFrom > normalizedTo) {
      throw new AppError("Date range is invalid: from must be before to", 400);
    }

    return {
      from: normalizedFrom,
      to: normalizedTo
    };
  },

  assertFilterScope(
    scope: ScopeContext,
    input: {
      centerId?: number;
      circleId?: number;
      forReportType: ReportType;
    }
  ) {
    if (input.centerId && scope.role !== Role.PARENT) {
      ensureCenterAllowed(scope, input.centerId);
    }

    if (input.circleId) {
      ensureCircleAllowed(scope, input.circleId);
    }
  },

  resolveCenterScope(scope: ScopeContext, requestedCenterId?: number): number[] | undefined {
    if (scope.allAccess) {
      return requestedCenterId ? [requestedCenterId] : undefined;
    }

    if (scope.role === Role.PARENT) {
      return requestedCenterId ? [requestedCenterId] : undefined;
    }

    if (requestedCenterId) {
      return [requestedCenterId];
    }

    return scope.centerIds;
  },

  resolveCircleScope(scope: ScopeContext, requestedCircleId?: number): number[] | undefined {
    if (scope.allAccess) {
      return requestedCircleId ? [requestedCircleId] : undefined;
    }

    if (requestedCircleId) {
      return [requestedCircleId];
    }

    return scope.circleIds;
  },

  resolveStudentScope(scope: ScopeContext): number[] | undefined {
    if (scope.role === Role.PARENT) {
      return scope.studentIds;
    }

    return undefined;
  }
};
