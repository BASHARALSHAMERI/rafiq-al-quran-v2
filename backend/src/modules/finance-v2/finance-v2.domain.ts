import {
  InvoiceStatus,
  PayrollBatchStatus,
  Prisma,
  RewardBatchStatus,
  Role,
  VoucherStatus,
  FundTransferStatus
} from "@prisma/client";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors/app-error";
import type { ScopeContext } from "../../shared/types/auth.types";

type Pagination = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

type DateRange = {
  from: Date;
  to: Date;
};

const READ_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ACCOUNTANT,
  Role.FINANCE_MANAGER,
  Role.TREASURER,
  Role.AUDITOR,
  Role.SUPERVISOR
];
const WRITE_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ACCOUNTANT, Role.FINANCE_MANAGER];
const EXECUTE_ROLES: Role[] = [Role.SUPER_ADMIN, Role.TREASURER];
const APPROVAL_ROLES: Role[] = [Role.SUPER_ADMIN, Role.FINANCE_MANAGER];

const VOUCHER_TRANSITIONS: Record<VoucherStatus, VoucherStatus[]> = {
  DRAFT: [VoucherStatus.SUBMITTED, VoucherStatus.CANCELLED],
  SUBMITTED: [VoucherStatus.APPROVED, VoucherStatus.REJECTED],
  APPROVED: [VoucherStatus.POSTED],
  REJECTED: [VoucherStatus.DRAFT],
  POSTED: [VoucherStatus.VOID_REQUESTED],
  VOID_REQUESTED: [VoucherStatus.VOIDED, VoucherStatus.POSTED],
  VOIDED: [],
  CANCELLED: []
};

const PAYROLL_BATCH_TRANSITIONS: Record<PayrollBatchStatus, PayrollBatchStatus[]> = {
  DRAFT: [PayrollBatchStatus.SUBMITTED, PayrollBatchStatus.CANCELLED],
  SUBMITTED: [PayrollBatchStatus.APPROVED, PayrollBatchStatus.REJECTED],
  APPROVED: [PayrollBatchStatus.IN_PROGRESS],
  REJECTED: [PayrollBatchStatus.DRAFT],
  IN_PROGRESS: [PayrollBatchStatus.PARTIALLY_PAID, PayrollBatchStatus.PAID],
  PARTIALLY_PAID: [PayrollBatchStatus.PAID],
  PAID: [PayrollBatchStatus.CLOSED],
  CLOSED: [],
  CANCELLED: []
};

const REWARD_BATCH_TRANSITIONS: Record<RewardBatchStatus, RewardBatchStatus[]> = {
  DRAFT: [RewardBatchStatus.SUBMITTED, RewardBatchStatus.CANCELLED],
  SUBMITTED: [RewardBatchStatus.APPROVED, RewardBatchStatus.REJECTED],
  APPROVED: [RewardBatchStatus.IN_PROGRESS],
  REJECTED: [RewardBatchStatus.DRAFT],
  IN_PROGRESS: [RewardBatchStatus.PARTIALLY_PAID, RewardBatchStatus.PAID],
  PARTIALLY_PAID: [RewardBatchStatus.PAID],
  PAID: [RewardBatchStatus.CLOSED],
  CLOSED: [],
  CANCELLED: []
};

const FUND_TRANSFER_TRANSITIONS: Record<FundTransferStatus, FundTransferStatus[]> = {
  DRAFT: [FundTransferStatus.SUBMITTED, FundTransferStatus.CANCELLED],
  SUBMITTED: [FundTransferStatus.APPROVED, FundTransferStatus.REJECTED],
  APPROVED: [FundTransferStatus.POSTED],
  REJECTED: [FundTransferStatus.DRAFT],
  POSTED: [],
  CANCELLED: []
};

const financeError = (
  message: string,
  statusCode: number,
  code: string,
  details?: unknown
): AppError => {
  return new AppError(message, statusCode, details, code);
};

const toDecimal = (value: number): Prisma.Decimal => new Prisma.Decimal(value);

const toMoney = (value: Prisma.Decimal | number | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return Number(value.toFixed(2));
  }

  return Number(value.toFixed(2));
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

export const financeV2Domain = {
  financeError,

  assertReadEnabled() {
    if (!env.FINANCE_V2_READ_ENABLED) {
      throw financeError("Finance V2 read is disabled", 404, "FINANCE_V2_DISABLED");
    }
  },

  assertWriteEnabled() {
    if (!env.FINANCE_V2_WRITE_ENABLED) {
      throw financeError("Finance V2 write is disabled", 404, "FINANCE_V2_DISABLED");
    }
  },

  assertCanRead(scope: ScopeContext) {
    if (
      !READ_ROLES.includes(scope.role) &&
      scope.role !== Role.PARENT &&
      scope.role !== Role.STUDENT
    ) {
      throw financeError("Finance scope denied", 403, "FINANCE_SCOPE_DENIED");
    }
  },

  assertCanWrite(scope: ScopeContext) {
    if (!WRITE_ROLES.includes(scope.role)) {
      throw financeError("Finance scope denied", 403, "FINANCE_SCOPE_DENIED");
    }
  },

  assertCanExecute(scope: ScopeContext) {
    if (!EXECUTE_ROLES.includes(scope.role)) {
      throw financeError("Finance scope denied", 403, "FINANCE_SCOPE_DENIED");
    }
  },

  assertCanManageSettings(scope: ScopeContext) {
    if (!APPROVAL_ROLES.includes(scope.role)) {
      throw financeError("Finance scope denied", 403, "FINANCE_SCOPE_DENIED");
    }
  },

  assertCanApprove(scope: ScopeContext) {
    if (!APPROVAL_ROLES.includes(scope.role)) {
      throw financeError("Finance scope denied", 403, "FINANCE_SCOPE_DENIED");
    }
  },

  ensureCenterAllowed(scope: ScopeContext, centerId?: number | null) {
    if (!centerId || scope.allAccess) {
      return;
    }

    if (!scope.centerIds.includes(centerId)) {
      throw financeError("Finance scope denied", 403, "FINANCE_SCOPE_DENIED");
    }
  },

  ensureScopedCenterRequired(scope: ScopeContext, centerId?: number | null) {
    if (scope.allAccess) {
      return;
    }

    if (!centerId) {
      throw financeError("Finance scope denied", 403, "FINANCE_SCOPE_DENIED");
    }

    this.ensureCenterAllowed(scope, centerId);
  },

  ensureStudentAllowed(scope: ScopeContext, studentId: number) {
    if (scope.allAccess) {
      return;
    }

    if (scope.role === Role.STUDENT && scope.userId !== studentId) {
      throw financeError("Finance scope denied", 403, "FINANCE_SCOPE_DENIED");
    }

    if (scope.role === Role.PARENT && !scope.studentIds.includes(studentId)) {
      throw financeError("Finance scope denied", 403, "FINANCE_SCOPE_DENIED");
    }
  },

  resolveCenterScope(scope: ScopeContext, centerId?: number): number[] | undefined {
    if (scope.allAccess) {
      return centerId ? [centerId] : undefined;
    }

    if (scope.role === Role.PARENT || scope.role === Role.STUDENT) {
      return centerId ? [centerId] : undefined;
    }

    if (centerId) {
      return [centerId];
    }

    return scope.centerIds;
  },

  resolveStudentScope(scope: ScopeContext, requestedStudentId?: number): number[] | undefined {
    if (scope.role === Role.STUDENT) {
      if (requestedStudentId && requestedStudentId !== scope.userId) {
        throw financeError("Finance scope denied", 403, "FINANCE_SCOPE_DENIED");
      }

      return [scope.userId];
    }

    if (scope.role === Role.PARENT) {
      if (requestedStudentId) {
        if (!scope.studentIds.includes(requestedStudentId)) {
          throw financeError("Finance scope denied", 403, "FINANCE_SCOPE_DENIED");
        }
        return [requestedStudentId];
      }

      return scope.studentIds;
    }

    return requestedStudentId ? [requestedStudentId] : undefined;
  },

  parseOptionalDate(value: string | undefined, fieldName: string): Date | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw financeError(`Invalid ${fieldName}`, 400, "VALIDATION_ERROR");
    }

    return parsed;
  },

  resolveDateRange(from?: string, to?: string): DateRange | undefined {
    if (!from && !to) {
      return undefined;
    }

    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(0);
    const toDate = to ? new Date(to) : now;

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw financeError("Invalid date range", 400, "VALIDATION_ERROR");
    }

    const range = {
      from: startOfDay(fromDate),
      to: endOfDay(toDate)
    };

    if (range.from > range.to) {
      throw financeError("Invalid date range", 400, "VALIDATION_ERROR");
    }

    return range;
  },

  resolvePagination(page?: number, pageSize?: number): Pagination {
    const normalizedPage = page ?? 1;
    const normalizedPageSize = pageSize ?? 20;

    if (normalizedPage <= 0 || normalizedPageSize <= 0 || normalizedPageSize > 100) {
      throw financeError("Invalid pagination", 400, "VALIDATION_ERROR");
    }

    return {
      page: normalizedPage,
      pageSize: normalizedPageSize,
      skip: (normalizedPage - 1) * normalizedPageSize,
      take: normalizedPageSize
    };
  },

  assertVoucherTransition(from: VoucherStatus, to: VoucherStatus) {
    if (!VOUCHER_TRANSITIONS[from]?.includes(to)) {
      throw financeError("Invalid state transition", 409, "INVALID_STATE_TRANSITION", {
        from,
        to
      });
    }
  },

  assertPayrollBatchTransition(from: PayrollBatchStatus, to: PayrollBatchStatus) {
    if (!PAYROLL_BATCH_TRANSITIONS[from]?.includes(to)) {
      throw financeError("Invalid state transition", 409, "INVALID_STATE_TRANSITION", {
        from,
        to
      });
    }
  },

  assertRewardBatchTransition(from: RewardBatchStatus, to: RewardBatchStatus) {
    if (!REWARD_BATCH_TRANSITIONS[from]?.includes(to)) {
      throw financeError("Invalid state transition", 409, "INVALID_STATE_TRANSITION", {
        from,
        to
      });
    }
  },

  assertFundTransferTransition(from: FundTransferStatus, to: FundTransferStatus) {
    if (!FUND_TRANSFER_TRANSITIONS[from]?.includes(to)) {
      throw financeError("Invalid state transition", 409, "INVALID_STATE_TRANSITION", {
        from,
        to
      });
    }
  },

  resolveInvoiceStatus(totalPaid: Prisma.Decimal, amount: Prisma.Decimal): InvoiceStatus {
    if (totalPaid.greaterThanOrEqualTo(amount)) {
      return InvoiceStatus.PAID;
    }

    if (totalPaid.greaterThan(0)) {
      return InvoiceStatus.PARTIAL;
    }

    return InvoiceStatus.PENDING;
  },

  toDecimal,
  toMoney
};
