import { AuditAction, AuditEntityType, Role, type Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";
import { ensureCenterAllowed, ensureCircleAllowed } from "../../shared/scoping/scope.domain";
import type { ScopeContext } from "../../shared/types/auth.types";
import { safeDate } from "../../shared/utils/time";

type AuditDateRange = {
  from: Date;
  to: Date;
};

type Pagination = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

const AUDIT_ALLOWED_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.SUPERVISOR,
  Role.TEACHER
];

const FINANCE_ENTITY_TYPES: AuditEntityType[] = [
  AuditEntityType.INVOICE,
  AuditEntityType.PAYMENT,
  AuditEntityType.VOUCHER,
  AuditEntityType.FINANCE_ACCOUNT,
  AuditEntityType.FUND_TRANSFER,
  AuditEntityType.PAYROLL_BATCH,
  AuditEntityType.PAYROLL_ITEM,
  AuditEntityType.REWARD_BATCH,
  AuditEntityType.REWARD_ITEM
];

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

export const auditDomain = {
  assertCanAccess(scope: ScopeContext) {
    if (!AUDIT_ALLOWED_ROLES.includes(scope.role)) {
      throw new AppError("Audit log is restricted for your role", 403);
    }
  },

  resolveDateRange(from?: string, to?: string): AuditDateRange | undefined {
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

  resolvePagination(page?: number, pageSize?: number): Pagination {
    const normalizedPage = page ?? 1;
    const normalizedPageSize = pageSize ?? 20;

    if (normalizedPage <= 0 || normalizedPageSize <= 0) {
      throw new AppError("Pagination values must be positive", 400);
    }

    if (normalizedPageSize > 100) {
      throw new AppError("pageSize must be 100 or less", 400);
    }

    return {
      page: normalizedPage,
      pageSize: normalizedPageSize,
      skip: (normalizedPage - 1) * normalizedPageSize,
      take: normalizedPageSize
    };
  },

  assertScopeFilters(
    scope: ScopeContext,
    input: {
      centerId?: number;
      circleId?: number;
      entityType?: AuditEntityType;
    }
  ) {
    if (input.centerId) {
      ensureCenterAllowed(scope, input.centerId);
    }

    if (input.circleId) {
      ensureCircleAllowed(scope, input.circleId);
    }

    if (
      scope.role === Role.TEACHER &&
      input.entityType &&
      FINANCE_ENTITY_TYPES.includes(input.entityType)
    ) {
      throw new AppError("Finance audit records are outside your scope", 403);
    }
  },

  resolveVisibleEntityTypes(scope: ScopeContext): AuditEntityType[] {
    if (scope.role === Role.TEACHER) {
      return Object.values(AuditEntityType).filter(
        (entityType) => !FINANCE_ENTITY_TYPES.includes(entityType)
      );
    }

    return Object.values(AuditEntityType);
  },

  resolveVisibleActions(): AuditAction[] {
    return Object.values(AuditAction);
  },

  resolveRoleScopeWhere(scope: ScopeContext): Prisma.AuditLogWhereInput {
    if (scope.allAccess) {
      return {};
    }

    if (scope.role === Role.CENTER_ADMIN) {
      if (!scope.centerIds.length) {
        return { id: { equals: -1 } };
      }

      return {
        centerId: {
          in: scope.centerIds
        }
      };
    }

    if (scope.role === Role.SUPERVISOR) {
      const conditions: Prisma.AuditLogWhereInput[] = [];

      if (scope.circleIds.length) {
        conditions.push({
          circleId: {
            in: scope.circleIds
          }
        });
      }

      if (scope.centerIds.length) {
        conditions.push({
          circleId: null,
          centerId: {
            in: scope.centerIds
          }
        });
      }

      if (!conditions.length) {
        return { id: { equals: -1 } };
      }

      return {
        OR: conditions
      };
    }

    if (scope.role === Role.TEACHER) {
      if (!scope.circleIds.length) {
        return { id: { equals: -1 } };
      }

      return {
        circleId: {
          in: scope.circleIds
        },
        entityType: {
          notIn: FINANCE_ENTITY_TYPES
        }
      };
    }

    return { id: { equals: -1 } };
  }
};
