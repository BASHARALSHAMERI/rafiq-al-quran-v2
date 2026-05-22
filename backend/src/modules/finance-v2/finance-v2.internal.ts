// @ts-nocheck
import {
  AccountingAccountType,
  AuditAction,
  AuditEntityType,
  FeeMode,
  FinanceAccountType,
  FinanceMovementDirection,
  FinanceMovementType,
  FundTransferStatus,
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  PayrollBatchStatus,
  PayrollItemStatus,
  Prisma,
  RewardBatchStatus,
  RewardCycle,
  RewardItemStatus,
  Role,
  VoucherSourceType,
  VoucherStatus,
  VoucherType
} from "@prisma/client";
import { auditLogger } from "../../shared/audit/audit-log";
import { prisma } from "../../shared/db/prisma";
import type { ScopeContext } from "../../shared/types/auth.types";
import { financeV2Domain } from "./finance-v2.domain";

export type Tx = Prisma.TransactionClient;

export const DEFAULT_POLICY = {
  requireTransferAttachment: true,
  requireApprovalDisbursement: true,
  requireApprovalReceipt: false,
  allowFreeStudents: true,
  allowSymbolicOneTimeFee: true,
  allowOverdraft: false
} as const;

export const centerCoreSelect = {
  id: true,
  name: true,
  code: true,
  organizationId: true,
  isActive: true
} satisfies Prisma.CenterSelect;

export const studentCoreSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  organizationId: true,
  isActive: true
} satisfies Prisma.UserSelect;

export const invoiceSelect = {
  id: true,
  studentId: true,
  centerId: true,
  month: true,
  year: true,
  invoiceType: true,
  amount: true,
  status: true,
  issuedAt: true,
  dueDate: true,
  notes: true,
  cancelReason: true,
  cancelledAt: true,
  cancelledById: true,
  lockVersion: true,
  createdAt: true,
  student: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
    }
  },
  center: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  cancelledBy: {
    select: {
      id: true,
      fullName: true,
      role: true
    }
  },
  payments: {
    select: {
      id: true,
      amount: true,
      method: true,
      receivedAt: true,
      voucherId: true
    }
  }
} satisfies Prisma.InvoiceSelect;

export const paymentSelect = {
  id: true,
  invoiceId: true,
  organizationId: true,
  centerId: true,
  voucherId: true,
  amount: true,
  method: true,
  idempotencyKey: true,
  attachmentStorageKey: true,
  externalTransferRef: true,
  receivedById: true,
  receivedAt: true,
  createdAt: true,
  voucher: {
    select: {
      id: true,
      voucherNo: true,
      voucherType: true,
      status: true
    }
  },
  receivedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
    }
  }
} satisfies Prisma.PaymentSelect;

export const accountSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  accountingAccountId: true,
  accountType: true,
  openingBalance: true,
  currentBalance: true,
  currencyCode: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  accountingAccount: {
    select: {
      id: true,
      code: true,
      name: true,
      type: true
    }
  },
  center: {
    select: {
      id: true,
      name: true,
      code: true
    }
  }
} satisfies Prisma.FinanceAccountSelect;

export const voucherSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  accountId: true,
  voucherType: true,
  voucherNo: true,
  sourceType: true,
  sourceId: true,
  paymentMethod: true,
  amount: true,
  // FA-UX-4B: currency fields are exposed for display/print only.
  originalAmount: true,
  originalCurrencyCode: true,
  exchangeRateToBase: true,
  status: true,
  accountingCategory: true,
  attachmentStorageKey: true,
  externalTransferRef: true,
  notes: true,
  createdById: true,
  approvedById: true,
  postedById: true,
  submittedAt: true,
  approvedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  postedAt: true,
  voidRequestedAt: true,
  voidedAt: true,
  voucherDate: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  account: {
    select: {
      id: true,
      accountType: true,
      centerId: true,
      accountingAccountId: true,
      currentBalance: true,
      currencyCode: true,
      accountingAccount: {
        select: {
          id: true,
          code: true,
          name: true,
          type: true
        }
      }
    }
  },
  center: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  createdBy: {
    select: {
      id: true,
      fullName: true,
      role: true
    }
  },
  approvedBy: {
    select: {
      id: true,
      fullName: true,
      role: true
    }
  },
  postedBy: {
    select: {
      id: true,
      fullName: true,
      role: true
    }
  },
  movement: {
    select: {
      id: true,
      movementType: true,
      direction: true,
      amount: true,
      balanceBefore: true,
      balanceAfter: true,
      postedAt: true,
      reversalOfMovementId: true
    }
  }
} satisfies Prisma.FinanceVoucherSelect;

export const movementSelect = {
  id: true,
  organizationId: true,
  accountId: true,
  voucherId: true,
  movementType: true,
  direction: true,
  amount: true,
  balanceBefore: true,
  balanceAfter: true,
  postedAt: true,
  reversalOfMovementId: true,
  createdAt: true,
  account: {
    select: {
      id: true,
      accountType: true,
      centerId: true,
      accountingAccountId: true,
      currencyCode: true
    }
  },
  voucher: {
    select: {
      id: true,
      voucherNo: true,
      voucherType: true,
      status: true
    }
  }
} satisfies Prisma.FinanceAccountMovementSelect;

export const payrollProfileSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  userId: true,
  monthlyBaseAmount: true,
  salaryCurrencyCode: true,
  paymentMethodDefault: true,
  bankAccountNumber: true,
  bankName: true,
  iban: true,
  salaryGradeId: true,
  salarySource: true,
  overrideReason: true,
  approvedById: true,
  approvedAt: true,
  effectiveFrom: true,
  effectiveTo: true,
  isActive: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: { id: true, name: true, code: true }
  },
  user: {
    select: { id: true, fullName: true, role: true, email: true }
  },
  salaryGrade: {
    select: { id: true, jobTitle: true, gradeLevel: true, baseSalary: true }
  },
  approvedBy: {
    select: { id: true, fullName: true }
  }
} satisfies Prisma.PayrollProfileSelect;

export const payrollBatchSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  periodYear: true,
  periodMonth: true,
  status: true,
  totalItems: true,
  totalNetAmount: true,
  approvedById: true,
  submittedAt: true,
  approvedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: { id: true, name: true, code: true }
  },
  approvedBy: {
    select: { id: true, fullName: true, role: true }
  },
  items: {
    select: {
      id: true,
      beneficiaryUserId: true,
      baseAmount: true,
      bonusAmount: true,
      deductionAmount: true,
      deductionEventIds: true,
      netAmount: true,
      status: true,
      paymentMethod: true,
      paymentReference: true,
      failureReason: true,
      voucherId: true,
      notes: true,
      paidAt: true,
      beneficiary: {
        select: { id: true, fullName: true, role: true }
      },
      voucher: {
        select: { id: true, voucherNo: true, status: true }
      }
    }
  }
} satisfies Prisma.PayrollBatchSelect;

export const rewardProfileSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  beneficiaryUserId: true,
  beneficiaryRole: true,
  cycle: true,
  rewardType: true,
  defaultAmount: true,
  effectiveFrom: true,
  effectiveTo: true,
  isActive: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: { id: true, name: true, code: true }
  },
  beneficiary: {
    select: { id: true, fullName: true, role: true, email: true }
  }
} satisfies Prisma.RewardProfileSelect;

export const rewardBatchSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  cycle: true,
  rewardType: true,
  periodYear: true,
  periodMonth: true,
  periodQuarter: true,
  status: true,
  totalAmount: true,
  totalItems: true,
  approvedById: true,
  submittedAt: true,
  approvedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: { id: true, name: true, code: true }
  },
  approvedBy: {
    select: { id: true, fullName: true, role: true }
  },
  items: {
    select: {
      id: true,
      beneficiaryUserId: true,
      beneficiaryRole: true,
      centerId: true,
      circleId: true,
      amount: true,
      rankInCircle: true,
      rewardType: true,
      status: true,
      paymentMethod: true,
      paymentReference: true,
      failureReason: true,
      voucherId: true,
      notes: true,
      paidAt: true,
      beneficiary: {
        select: { id: true, fullName: true, role: true }
      },
      center: {
        select: { id: true, name: true, code: true }
      },
      circle: {
        select: { id: true, name: true }
      },
      voucher: {
        select: { id: true, voucherNo: true, status: true }
      }
    }
  }
} satisfies Prisma.RewardBatchSelect;

export const fundTransferSelect = {
  id: true,
  organizationId: true,
  fromAccountId: true,
  toAccountId: true,
  fromCenterId: true,
  toCenterId: true,
  amount: true,
  status: true,
  requestedById: true,
  approvedById: true,
  voucherOutId: true,
  voucherInId: true,
  notes: true,
  submittedAt: true,
  approvedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  postedAt: true,
  createdAt: true,
  updatedAt: true,
  fromAccount: {
    select: {
      id: true,
      accountType: true,
      centerId: true,
      currentBalance: true,
      currencyCode: true
    }
  },
  toAccount: {
    select: {
      id: true,
      accountType: true,
      centerId: true,
      currentBalance: true,
      currencyCode: true
    }
  },
  fromCenter: {
    select: { id: true, name: true, code: true }
  },
  toCenter: {
    select: { id: true, name: true, code: true }
  },
  requestedBy: {
    select: { id: true, fullName: true, role: true }
  },
  approvedBy: {
    select: { id: true, fullName: true, role: true }
  },
  voucherOut: {
    select: { id: true, voucherNo: true, status: true }
  },
  voucherIn: {
    select: { id: true, voucherNo: true, status: true }
  }
} satisfies Prisma.FinanceFundTransferSelect;

export const studentFeeProfileSelect = {
  id: true,
  organizationId: true,
  centerId: true,
  studentId: true,
  feeMode: true,
  tuitionPlanId: true,
  symbolicAmount: true,
  isActive: true,
  startDate: true,
  endDate: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  center: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  student: {
    select: {
      id: true,
      fullName: true,
      role: true,
      email: true
    }
  },
  tuitionPlan: {
    select: {
      id: true,
      name: true,
      monthlyAmount: true,
      planKind: true
    }
  }
} satisfies Prisma.StudentFeeProfileSelect;

export const normalizeDecimals = (value: unknown): unknown => {
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

  return value as NonNullable<T>;
};

export const normalize = <T>(value: T): T => normalizeDecimals(value) as T;

export const isKnownPrismaError = (error: unknown): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError;

export const mapUniqueConflict = (error: unknown, code: string, message: string) => {
  if (isKnownPrismaError(error) && error.code === "P2002") {
    throw financeV2Domain.financeError(message, 409, code);
  }
};

export const parseIdempotencyKey = (key?: string | null): string | undefined => {
  const normalized = key?.trim();
  if (!normalized) {
    return undefined;
  }
  return normalized.slice(0, 128);
};

export const calcInvoiceTotals = (invoice: {
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

export const withInvoiceTotals = <T extends { amount: Prisma.Decimal; payments: Array<{ amount: Prisma.Decimal }> }>(
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

export const nextVoucherNoTx = async (
  tx: Tx,
  prefix: string,
  organizationId: number,
  year: number = new Date().getFullYear()
): Promise<string> => {
  const sequence = await tx.documentSequence.findUnique({
    where: {
      organizationId_documentType_year: {
        organizationId,
        documentType: prefix,
        year,
      },
    },
  });

  if (sequence) {
    const updated = await tx.documentSequence.update({
      where: { id: sequence.id },
      data: { lastSequence: { increment: 1 } },
    });
    return `${prefix}-${year}-${String(updated.lastSequence).padStart(4, "0")}`;
  }

  const created = await tx.documentSequence.create({
    data: {
      organizationId,
      documentType: prefix,
      year,
      lastSequence: 1,
    },
  });
  return `${prefix}-${year}-${String(created.lastSequence).padStart(4, "0")}`;
};

export const ensureDate = (value?: string): Date | undefined =>
  financeV2Domain.parseOptionalDate(value, "date");

export const assertTransferAttachment = (input: {
  method?: PaymentMethod | null;
  attachmentStorageKey?: string | null;
  requireTransferAttachment: boolean;
}) => {
  if (
    input.method === PaymentMethod.TRANSFER &&
    input.requireTransferAttachment &&
    !input.attachmentStorageKey
  ) {
    throw financeV2Domain.financeError(
      "Attachment is required for transfer payments",
      400,
      "ATTACHMENT_REQUIRED_FOR_TRANSFER"
    );
  }
};

export const resolveVoucherMovementType = (input: {
  sourceType: VoucherSourceType;
  voucherType: VoucherType;
}): FinanceMovementType => {
  if (input.sourceType === VoucherSourceType.PAYMENT) {
    return FinanceMovementType.PAYMENT_COLLECTION;
  }

  if (input.sourceType === VoucherSourceType.PAYROLL_ITEM) {
    return FinanceMovementType.PAYROLL_PAYOUT;
  }

  if (input.sourceType === VoucherSourceType.REWARD_ITEM) {
    return FinanceMovementType.REWARD_PAYOUT;
  }

  if (input.sourceType === VoucherSourceType.FUND_TRANSFER) {
    return input.voucherType === VoucherType.RECEIPT
      ? FinanceMovementType.FUND_TRANSFER_IN
      : FinanceMovementType.FUND_TRANSFER_OUT;
  }

  return input.voucherType === VoucherType.RECEIPT
    ? FinanceMovementType.PAYMENT_COLLECTION
    : FinanceMovementType.VOUCHER_DISBURSEMENT;
};

export const getEffectivePolicyTx = async (tx: Tx, input: { organizationId: number; centerId?: number | null }) => {
  const organizationPolicy = await tx.financePolicyProfile.findFirst({
    where: {
      organizationId: input.organizationId,
      centerId: null
    }
  });

  const centerPolicy = input.centerId
    ? await tx.financePolicyProfile.findFirst({
        where: {
          organizationId: input.organizationId,
          centerId: input.centerId
        }
      })
    : null;

  return {
    ...DEFAULT_POLICY,
    ...(organizationPolicy
      ? {
          requireTransferAttachment: organizationPolicy.requireTransferAttachment,
          requireApprovalDisbursement: organizationPolicy.requireApprovalDisbursement,
          requireApprovalReceipt: organizationPolicy.requireApprovalReceipt,
          allowFreeStudents: organizationPolicy.allowFreeStudents,
          allowSymbolicOneTimeFee: organizationPolicy.allowSymbolicOneTimeFee,
          allowOverdraft: organizationPolicy.allowOverdraft
        }
      : {}),
    ...(centerPolicy
      ? {
          requireTransferAttachment: centerPolicy.requireTransferAttachment,
          requireApprovalDisbursement: centerPolicy.requireApprovalDisbursement,
          requireApprovalReceipt: centerPolicy.requireApprovalReceipt,
          allowFreeStudents: centerPolicy.allowFreeStudents,
          allowSymbolicOneTimeFee: centerPolicy.allowSymbolicOneTimeFee,
          allowOverdraft: centerPolicy.allowOverdraft
        }
      : {})
  };
};

const resolveDefaultFinanceAccountLedgerAccountIdTx = async (tx: Tx, organizationId: number) => {
  const account = await tx.accountingAccount.findFirst({
    where: {
      organizationId,
      type: AccountingAccountType.ASSET,
      isActive: true,
      children: { none: { isActive: true } },
      OR: [{ systemKey: "MAIN_CASH" }, { code: "1110" }, { code: "1100" }]
    },
    orderBy: [{ systemKey: "desc" }, { code: "asc" }, { id: "asc" }],
    select: { id: true }
  });

  return account?.id ?? null;
};

export const ensureOrgFundAccountTx = async (tx: Tx, organizationId: number) => {
  const existing = await tx.financeAccount.findFirst({
    where: {
      organizationId,
      centerId: null,
      accountType: FinanceAccountType.ORG_FUND,
      isActive: true
    },
    select: accountSelect
  });

  if (existing) {
    return existing;
  }

  const accountingAccountId = await resolveDefaultFinanceAccountLedgerAccountIdTx(tx, organizationId);

  return tx.financeAccount.create({
    data: {
      organizationId,
      centerId: null,
      accountingAccountId,
      accountType: FinanceAccountType.ORG_FUND,
      openingBalance: new Prisma.Decimal(0),
      currentBalance: new Prisma.Decimal(0),
      currencyCode: "YER",
      isActive: true
    },
    select: accountSelect
  });
};

export const ensureCenterFundAccountTx = async (
  tx: Tx,
  input: { organizationId: number; centerId: number }
) => {
  const existing = await tx.financeAccount.findFirst({
    where: {
      organizationId: input.organizationId,
      centerId: input.centerId,
      accountType: FinanceAccountType.CENTER_FUND,
      isActive: true
    },
    select: accountSelect
  });

  if (existing) {
    return existing;
  }

  const accountingAccountId = await resolveDefaultFinanceAccountLedgerAccountIdTx(tx, input.organizationId);

  try {
    return await tx.financeAccount.create({
      data: {
        organizationId: input.organizationId,
        centerId: input.centerId,
        accountingAccountId,
        accountType: FinanceAccountType.CENTER_FUND,
        openingBalance: new Prisma.Decimal(0),
        currentBalance: new Prisma.Decimal(0),
        currencyCode: "YER",
        isActive: true
      },
      select: accountSelect
    });
  } catch (error) {
    if (isKnownPrismaError(error) && error.code === "P2002") {
      const retry = await tx.financeAccount.findFirst({
        where: {
          organizationId: input.organizationId,
          centerId: input.centerId,
          accountType: FinanceAccountType.CENTER_FUND,
          isActive: true
        },
        select: accountSelect
      });

      if (retry) {
        return retry;
      }
    }

    throw error;
  }
};

export const ensureAccountLockTx = async (tx: Tx, accountId: number) => {
  await tx.$queryRaw`SELECT id FROM "finance_accounts" WHERE id = ${accountId} FOR UPDATE`;

  const account = await tx.financeAccount.findUnique({
    where: { id: accountId },
    select: accountSelect
  });

  if (!account) {
    throw financeV2Domain.financeError("Finance account not found", 404, "ENTITY_NOT_FOUND");
  }

  return account;
};

export const ensureInvoiceLockTx = async (tx: Tx, invoiceId: number) => {
  await tx.$queryRaw`SELECT id FROM "invoices" WHERE id = ${invoiceId} FOR UPDATE`;
};

export const updateInvoiceStatusTx = async (tx: Tx, invoiceId: number) => {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      amount: true,
      status: true,
      lockVersion: true,
      payments: {
        select: {
          amount: true
        }
      }
    }
  });

  if (!invoice) {
    throw financeV2Domain.financeError("Invoice not found", 404, "ENTITY_NOT_FOUND");
  }

  const totalPaid = invoice.payments.reduce(
    (sum, payment) => sum.plus(payment.amount),
    new Prisma.Decimal(0)
  );
  const status = financeV2Domain.resolveInvoiceStatus(totalPaid, invoice.amount);

  await tx.invoice.update({
    where: { id: invoice.id },
    data: {
      status,
      lockVersion: invoice.lockVersion + 1
    }
  });

  return status;
};

export const postVoucherTx = async (
  tx: Tx,
  input: {
    voucherId: number;
    postedById: number;
    movementType: FinanceMovementType;
    allowOverdraft: boolean;
    reversalOfMovementId?: number | null;
  }
) => {
  const voucher = await tx.financeVoucher.findUnique({
    where: {
      id: input.voucherId
    },
    select: voucherSelect
  });

  if (!voucher) {
    throw financeV2Domain.financeError("Voucher not found", 404, "ENTITY_NOT_FOUND");
  }

  const existingMovement = await tx.financeAccountMovement.findUnique({
    where: {
      voucherId: voucher.id
    },
    select: movementSelect
  });

  if (existingMovement) {
    return {
      voucher: normalize(voucher),
      movement: normalize(existingMovement),
      account: normalize(voucher.account)
    };
  }

  const account = await ensureAccountLockTx(tx, voucher.accountId);
  const direction =
    voucher.voucherType === VoucherType.RECEIPT
      ? FinanceMovementDirection.IN
      : FinanceMovementDirection.OUT;

  const balanceBefore = account.currentBalance;
  const balanceAfter =
    direction === FinanceMovementDirection.IN
      ? balanceBefore.plus(voucher.amount)
      : balanceBefore.minus(voucher.amount);

  if (
    direction === FinanceMovementDirection.OUT &&
    !input.allowOverdraft &&
    balanceAfter.lessThan(0)
  ) {
    throw financeV2Domain.financeError("Insufficient funds", 409, "INSUFFICIENT_FUNDS", {
      accountId: account.id,
      balance: Number(balanceBefore.toFixed(2)),
      amount: Number(voucher.amount.toFixed(2))
    });
  }

  const postedAt = new Date();

  const updatedAccount = await tx.financeAccount.update({
    where: { id: account.id },
    data: {
      currentBalance: balanceAfter
    },
    select: accountSelect
  });

  const movement = await tx.financeAccountMovement.create({
    data: {
      organizationId: voucher.organizationId,
      accountId: account.id,
      voucherId: voucher.id,
      movementType: input.movementType,
      direction,
      amount: voucher.amount,
      balanceBefore,
      balanceAfter,
      postedAt,
      reversalOfMovementId: input.reversalOfMovementId ?? null
    },
    select: movementSelect
  });

  const postedVoucher = await tx.financeVoucher.update({
    where: { id: voucher.id },
    data: {
      status: VoucherStatus.POSTED,
      postedById: input.postedById,
      postedAt
    },
    select: voucherSelect
  });

  return {
    voucher: normalize(postedVoucher),
    movement: normalize(movement),
    account: normalize(updatedAccount)
  };
};

export const requireFinanceEntity = <T>(value: T | null | undefined, message: string): NonNullable<T> => {
  if (!value) {
    throw financeV2Domain.financeError(message, 404, "ENTITY_NOT_FOUND");
  }
  return value as NonNullable<T>;
};

export const ensureVoucherScope = (scope: ScopeContext, voucher: { centerId: number | null }) => {
  financeV2Domain.ensureCenterAllowed(scope, voucher.centerId);
};

export const ensureFinanceCenter = async (scope: ScopeContext, centerId: number) => {
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

export const ensureFinanceStudent = async (scope: ScopeContext, studentId: number) => {
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

export const addAudit = async (input: {
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

export const deriveBatchStatus = (input: { total: number; paid: number }): PayrollBatchStatus => {
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

export const deriveRewardBatchStatus = (input: { total: number; paid: number }): RewardBatchStatus => {
  if (input.total === 0) {
    return RewardBatchStatus.IN_PROGRESS;
  }

  if (input.paid === 0) {
    return RewardBatchStatus.IN_PROGRESS;
  }

  if (input.paid >= input.total) {
    return RewardBatchStatus.PAID;
  }

  return RewardBatchStatus.PARTIALLY_PAID;
};


export function assertFinanceEntity<T>(value: T | null | undefined, message: string): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw financeV2Domain.financeError(message, 404, "ENTITY_NOT_FOUND");
  }
}
