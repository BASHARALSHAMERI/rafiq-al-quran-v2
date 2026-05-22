// @ts-nocheck
import { Prisma } from "@prisma/client";
import type { ScopeContext } from "../../shared/types/auth.types";
import { auditLogger } from "../../shared/audit/audit-log";
import { financeV2Domain } from "./finance-v2.domain";

/** Prisma transaction client shorthand */
export type Tx = Prisma.TransactionClient;

export const DEFAULT_POLICY = {
  requireTransferAttachment: true,
  requireApprovalDisbursement: true,
  requireApprovalReceipt: false,
  allowFreeStudents: true,
  allowSymbolicOneTimeFee: true,
  allowOverdraft: false
} as const;
const normalizeDecimals = (value: unknown): unknown => {
  if (value instanceof Prisma.Decimal) {
    return Number(value.toFixed(2));
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeDecimals(item));
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    const record = value as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};

    for (const [key, nested] of Object.entries(record)) {
      normalized[key] = normalizeDecimals(nested);
    }

    return normalized;
  }

  return value;
};

const normalize = <T>(value: T): T => normalizeDecimals(value) as T;

const isKnownPrismaError = (error: unknown): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError;

const mapUniqueConflict = (error: unknown, code: string, message: string) => {
  if (isKnownPrismaError(error) && error.code === "P2002") {
    throw financeV2Domain.financeError(message, 409, code);
  }
};

const parseIdempotencyKey = (key?: string | null): string | undefined => {
  const normalized = key?.trim();
  if (!normalized) {
    return undefined;
  }
  return normalized.slice(0, 128);
};

const calcInvoiceTotals = (invoice: {
  amount: Prisma.Decimal;
  payments: Array<{ amount: Prisma.Decimal }>;
}) => {
  const totalPaid = invoice.payments.reduce(
    (sum, payment) => sum.plus(payment.amount),
    new Prisma.Decimal(0)
  );
  const remaining = Prisma.Decimal.max(new Prisma.Decimal(0), invoice.amount.minus(totalPaid));

  return {
    totalPaid,
    remaining
  };
};

const withInvoiceTotals = <T extends { amount: Prisma.Decimal; payments: Array<{ amount: Prisma.Decimal }> }>(
  invoice: T
) => {
  const totals = calcInvoiceTotals(invoice);
  return normalize({
    ...invoice,
    totalPaid: totals.totalPaid,
    remainingAmount: totals.remaining,
    paymentsCount: invoice.payments.length
  });
};

const nextVoucherNo = (prefix: string, organizationId: number): string => {
  const token = Date.now().toString(36).toUpperCase();
  return `${prefix}-${organizationId}-${token}`;
};

const ensureDate = (value?: string): Date | undefined =>
  financeV2Domain.parseOptionalDate(value, "date");

const requireFinanceEntity = <T>(value: T | null, message: string): T => {
  if (!value) {
    throw financeV2Domain.financeError(message, 404, "ENTITY_NOT_FOUND");
  }
  return value;
};

const ensureVoucherScope = (scope: ScopeContext, voucher: { centerId: number | null }) => {
  financeV2Domain.ensureCenterAllowed(scope, voucher.centerId);
};

const ensureFinanceCenter = async (scope: ScopeContext, centerId: number) => {
  financeV2Domain.ensureCenterAllowed(scope, centerId);

  const center = await prisma.center.findFirst({
    where: {
      id: centerId,
      organizationId: scope.organizationId,
      isActive: true
    },
    select: centerCoreSelect
  });

  return requireFinanceEntity(center, "Center not found");
};

const ensureFinanceStudent = async (scope: ScopeContext, studentId: number) => {
  const student = await prisma.user.findFirst({
    where: {
      id: studentId,
      organizationId: scope.organizationId,
      role: Role.STUDENT,
      isActive: true
    },
    select: studentCoreSelect
  });

  return requireFinanceEntity(student, "Student not found");
};

const addAudit = async (input: {
  scope: ScopeContext;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: number;
  centerId?: number | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
}) => {
  await auditLogger.log({
    organizationId: input.scope.organizationId,
    centerId: input.centerId ?? null,
    actorUserId: input.scope.userId,
    actorRole: input.scope.role,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary,
    metadata: input.metadata
  });
};

const deriveBatchStatus = (input: { total: number; paid: number }): PayrollBatchStatus => {
  if (input.total === 0) {
    return PayrollBatchStatus.IN_PROGRESS;
  }

  if (input.paid === 0) {
    return PayrollBatchStatus.IN_PROGRESS;
  }

  if (input.paid >= input.total) {
    return PayrollBatchStatus.PAID;
  }

  return PayrollBatchStatus.PARTIALLY_PAID;
};
