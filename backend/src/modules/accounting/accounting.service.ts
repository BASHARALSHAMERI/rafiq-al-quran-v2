import {
  AccountingAccountType,
  AccountingNormalBalance,
  JournalEntryStatus,
  JournalSourceType,
  Prisma,
  Role,
  VoucherStatus,
  VoucherAccountingCategory,
  VoucherSourceType,
  VoucherType,
  FundTransferStatus,
  FiscalPeriodStatus
} from "@prisma/client";
import { prisma } from "../../shared/db/prisma";
import { AppError } from "../../shared/errors/app-error";
import type { ScopeContext } from "../../shared/types/auth.types";
import { accountingRepository } from "./accounting.repository";

type DateRange = {
  from?: Date;
  to?: Date;
};

type JournalLineInput = {
  accountId: number;
  centerId?: number;
  debit: number;
  credit: number;
  memo?: string;
  sourceLineType?: JournalSourceType;
  sourceLineId?: number;
};

type CreateJournalEntryInput = {
  entryNo?: string;
  centerId?: number;
  entryDate: string;
  sourceType: JournalSourceType;
  sourceId?: number;
  description?: string;
  lines: JournalLineInput[];
};

type AccountInput = {
  centerId?: number;
  parentId?: number;
  code?: string;
  type?: AccountingAccountType;
  name?: string;
  nameEn?: string;
  openingBalance?: number;
  isSubAccount?: boolean;
  isPostingAllowed?: boolean;
  notes?: string;
};

const assertAccountingRole = (scope: ScopeContext) => {
  if (scope.role !== Role.SUPER_ADMIN && scope.role !== Role.CENTER_ADMIN) {
    throw new AppError("Accounting scope denied", 403, undefined, "ACCOUNTING_SCOPE_DENIED");
  }
};

const ensureCenterAllowed = (scope: ScopeContext, centerId?: number | null) => {
  if (!centerId || scope.allAccess) return;
  if (!scope.centerIds.includes(centerId)) {
    throw new AppError("Accounting center scope denied", 403, undefined, "ACCOUNTING_SCOPE_DENIED");
  }
};

const centerScopeWhere = (
  scope: ScopeContext,
  centerId?: number
): Prisma.AccountingAccountWhereInput => {
  if (centerId) {
    ensureCenterAllowed(scope, centerId);
    return { centerId };
  }

  if (scope.allAccess) {
    return {};
  }

  return { OR: [{ centerId: { in: scope.centerIds } }, { centerId: null }] };
};

const entryCenterScopeWhere = (
  scope: ScopeContext,
  centerId?: number
): Prisma.JournalEntryWhereInput => {
  if (centerId) {
    ensureCenterAllowed(scope, centerId);
    return { centerId };
  }

  if (scope.allAccess) {
    return {};
  }

  return { OR: [{ centerId: { in: scope.centerIds } }, { centerId: null }] };
};

const lineCenterScopeWhere = (
  scope: ScopeContext,
  centerId?: number
): Prisma.JournalEntryLineWhereInput => {
  if (centerId) {
    ensureCenterAllowed(scope, centerId);
    return { centerId };
  }

  if (scope.allAccess) {
    return {};
  }

  return { OR: [{ centerId: { in: scope.centerIds } }, { centerId: null }] };
};

const parseDate = (value: string, fieldName: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`Invalid ${fieldName}`, 400, undefined, "VALIDATION_ERROR");
  }
  return parsed;
};

const parseDateRange = (from?: string, to?: string): DateRange => {
  const range: DateRange = {};
  if (from) {
    const parsedFrom = parseDate(from, "from");
    parsedFrom.setHours(0, 0, 0, 0);
    range.from = parsedFrom;
  }
  if (to) {
    const parsedTo = parseDate(to, "to");
    parsedTo.setHours(23, 59, 59, 999);
    range.to = parsedTo;
  }
  if (range.from && range.to && range.from > range.to) {
    throw new AppError("Invalid date range", 400, undefined, "VALIDATION_ERROR");
  }
  return range;
};

const decimalNumber = (value: Prisma.Decimal | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number(value.toFixed(2));
  return Number(value.toFixed(2));
};

const normalizeDecimals = <T>(value: T): T => {
  if (value instanceof Prisma.Decimal) {
    return decimalNumber(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeDecimals(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeDecimals(item)])
    ) as T;
  }

  return value;
};

const nextEntryNo = (organizationId: number): string => {
  const token = Date.now().toString(36).toUpperCase();
  return `JE-${organizationId}-${token}`;
};

const normalBalanceForType = (type: AccountingAccountType): AccountingNormalBalance => {
  if (type === AccountingAccountType.ASSET || type === AccountingAccountType.EXPENSE) {
    return AccountingNormalBalance.DEBIT;
  }
  return AccountingNormalBalance.CREDIT;
};

const validateLineAmounts = (line: JournalLineInput) => {
  if ((line.debit > 0) === (line.credit > 0)) {
    throw new AppError(
      "Each journal line must contain either debit or credit",
      400,
      undefined,
      "INVALID_JOURNAL_LINE"
    );
  }
};

const sumLines = (lines: Array<{ debit: Prisma.Decimal; credit: Prisma.Decimal }>) => {
  return lines.reduce(
    (totals, line) => ({
      debit: totals.debit.plus(line.debit),
      credit: totals.credit.plus(line.credit)
    }),
    { debit: new Prisma.Decimal(0), credit: new Prisma.Decimal(0) }
  );
};

type PostPaymentJournalEntryTxInput = {
  paymentId: number;
  postedById: number;
};

type PostVoucherJournalEntryTxInput = {
  voucherId: number;
  postedById: number;
};

type ReverseVoucherJournalEntryTxInput = {
  originalVoucherId: number;
  reversalVoucherId: number;
  postedById: number;
  reason?: string;
};

const findRequiredAccountTx = async (
  tx: Prisma.TransactionClient,
  input: {
    organizationId: number;
    systemKey: string;
    fallbackCode: string;
    expectedType: AccountingAccountType;
    missingMessage?: string;
  }
) => {
  const accountBySystemKey = await tx.accountingAccount.findFirst({
    where: {
      organizationId: input.organizationId,
      isActive: true,
      systemKey: input.systemKey
    }
  });
  const account =
    accountBySystemKey ??
    (await tx.accountingAccount.findFirst({
      where: {
        organizationId: input.organizationId,
        isActive: true,
        code: input.fallbackCode
      }
    }));

  if (!account || account.type !== input.expectedType) {
    throw new AppError(
      input.missingMessage ?? "Accounting account mapping is missing for payment posting",
      409,
      {
        systemKey: input.systemKey,
        fallbackCode: input.fallbackCode,
        expectedType: input.expectedType
      },
      "ACCOUNTING_MAPPING_MISSING"
    );
  }

  const childCount = await tx.accountingAccount.count({
    where: { organizationId: input.organizationId, parentId: account.id, isActive: true }
  });
  if (childCount > 0) {
    throw new AppError(
      "Accounting mapping points to a parent account that is not posting allowed",
      409,
      { accountId: account.id, systemKey: input.systemKey, fallbackCode: input.fallbackCode },
      "ACCOUNT_NOT_POSTING_ALLOWED"
    );
  }

  return account;
};

const findFinanceAccountLedgerAccountTx = async (
  tx: Prisma.TransactionClient,
  input: {
    organizationId: number;
    financeAccountId: number;
    missingMessage: string;
  }
) => {
  const financeAccount = await tx.financeAccount.findFirst({
    where: {
      id: input.financeAccountId,
      organizationId: input.organizationId
    },
    include: {
      accountingAccount: true
    }
  });

  if (!financeAccount) {
    throw new AppError("Finance account not found", 404, undefined, "ENTITY_NOT_FOUND");
  }

  if (
    !financeAccount.accountingAccountId ||
    !financeAccount.accountingAccount ||
    !financeAccount.accountingAccount.isActive ||
    financeAccount.accountingAccount.type !== AccountingAccountType.ASSET
  ) {
    throw new AppError(
      input.missingMessage,
      409,
      { financeAccountId: financeAccount.id, expectedType: AccountingAccountType.ASSET },
      "FINANCE_ACCOUNT_LEDGER_MAPPING_MISSING"
    );
  }

  const childCount = await tx.accountingAccount.count({
    where: {
      organizationId: input.organizationId,
      parentId: financeAccount.accountingAccount.id,
      isActive: true
    }
  });
  if (childCount > 0) {
    throw new AppError(
      "Finance account is linked to a parent ledger account that is not posting allowed",
      409,
      { financeAccountId: financeAccount.id, accountingAccountId: financeAccount.accountingAccount.id },
      "ACCOUNT_NOT_POSTING_ALLOWED"
    );
  }

  return financeAccount.accountingAccount;
};

export const ensurePeriodOpenTx = async (
  tx: Prisma.TransactionClient,
  organizationId: number,
  date: Date
) => {
  const period = await tx.fiscalPeriod.findFirst({
    where: {
      organizationId,
      startDate: { lte: date },
      endDate: { gte: date }
    }
  });

  if (period && period.status === FiscalPeriodStatus.CLOSED) {
    throw new AppError(
      "Financial operation is not allowed in a closed fiscal period",
      409,
      undefined,
      "FISCAL_PERIOD_CLOSED"
    );
  }
};


export const accountingService = {
  ensurePeriodOpenTx,
  
  async getChartOfAccounts(
    scope: ScopeContext,
    query: {
      centerId?: number;
      type?: import("@prisma/client").AccountingAccountType;
      isActive?: boolean;
    }
  ) {
    assertAccountingRole(scope);

    const rows = await accountingRepository.findAccounts({
      organizationId: scope.organizationId,
      ...centerScopeWhere(scope, query.centerId),
      ...(query.type ? { type: query.type } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {})
    });

    return normalizeDecimals(rows);
  },

  async createAccount(scope: ScopeContext, input: AccountInput) {
    assertAccountingRole(scope);
    ensureCenterAllowed(scope, input.centerId);

    if (!input.code || !input.name || !input.type) {
      throw new AppError("Accounting account code, name and type are required", 400, undefined, "VALIDATION_ERROR");
    }
    const code = input.code;
    const name = input.name;
    const type = input.type;

    try {
      const created = await prisma.$transaction(async (tx) => {
        const parent = input.parentId
          ? await tx.accountingAccount.findFirst({
              where: {
                id: input.parentId,
                organizationId: scope.organizationId,
                isActive: true
              }
            })
          : null;

        if (input.parentId && !parent) {
          throw new AppError("Parent accounting account not found", 404, undefined, "ENTITY_NOT_FOUND");
        }
        if (parent && parent.type !== type) {
          throw new AppError("Parent account type must match child account type", 400, undefined, "ACCOUNT_TYPE_MISMATCH");
        }

        const centerId = input.centerId ?? parent?.centerId ?? null;
        ensureCenterAllowed(scope, centerId);
        if (parent?.centerId && centerId && parent.centerId !== centerId) {
          throw new AppError("Parent account center must match child account center", 400, undefined, "VALIDATION_ERROR");
        }

        return tx.accountingAccount.create({
          data: {
            organizationId: scope.organizationId,
            centerId,
            parentId: parent?.id ?? null,
            code: code.trim(),
            name: name.trim(),
            type,
            normalBalance: normalBalanceForType(type),
            isActive: true
          }
        });
      });

      return normalizeDecimals(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Accounting account code already exists", 409, undefined, "ACCOUNT_CODE_CONFLICT");
      }
      throw error;
    }
  },

  async updateAccount(scope: ScopeContext, accountId: number, input: AccountInput) {
    assertAccountingRole(scope);
    ensureCenterAllowed(scope, input.centerId);

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const existing = await tx.accountingAccount.findFirst({
          where: { id: accountId, organizationId: scope.organizationId }
        });

        if (!existing) {
          throw new AppError("Accounting account not found", 404, undefined, "ENTITY_NOT_FOUND");
        }
        ensureCenterAllowed(scope, existing.centerId);

        const nextType = input.type ?? existing.type;
        const nextParentId = input.parentId === undefined ? existing.parentId : input.parentId;
        const nextCenterId = input.centerId === undefined ? existing.centerId : input.centerId ?? null;

        if (nextParentId === existing.id) {
          throw new AppError("Account cannot be its own parent", 400, undefined, "VALIDATION_ERROR");
        }

        const parent = nextParentId
          ? await tx.accountingAccount.findFirst({
              where: {
                id: nextParentId,
                organizationId: scope.organizationId,
                isActive: true
              }
            })
          : null;

        if (nextParentId && !parent) {
          throw new AppError("Parent accounting account not found", 404, undefined, "ENTITY_NOT_FOUND");
        }
        if (parent && parent.type !== nextType) {
          throw new AppError("Parent account type must match child account type", 400, undefined, "ACCOUNT_TYPE_MISMATCH");
        }
        ensureCenterAllowed(scope, nextCenterId);
        if (parent?.centerId && nextCenterId && parent.centerId !== nextCenterId) {
          throw new AppError("Parent account center must match child account center", 400, undefined, "VALIDATION_ERROR");
        }

        if (input.type && input.type !== existing.type) {
          const lineCount = await tx.journalEntryLine.count({ where: { accountId: existing.id } });
          if (lineCount > 0) {
            throw new AppError("Cannot change type for an account with journal lines", 409, undefined, "ACCOUNT_HAS_JOURNAL_LINES");
          }
        }

        return tx.accountingAccount.update({
          where: { id: existing.id },
          data: {
            ...(input.code !== undefined ? { code: input.code.trim() } : {}),
            ...(input.name !== undefined ? { name: input.name.trim() } : {}),
            ...(input.type !== undefined
              ? { type: input.type, normalBalance: normalBalanceForType(input.type) }
              : {}),
            ...(input.centerId !== undefined ? { centerId: nextCenterId } : {}),
            ...(input.parentId !== undefined ? { parentId: parent?.id ?? null } : {})
          }
        });
      });

      return normalizeDecimals(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Accounting account code already exists", 409, undefined, "ACCOUNT_CODE_CONFLICT");
      }
      throw error;
    }
  },

  async listJournalEntries(
    scope: ScopeContext,
    query: {
      centerId?: number;
      from?: string;
      to?: string;
      sourceType?: JournalSourceType;
    }
  ) {
    assertAccountingRole(scope);
    const range = parseDateRange(query.from, query.to);

    const rows = await accountingRepository.findJournalEntries({
      organizationId: scope.organizationId,
      ...entryCenterScopeWhere(scope, query.centerId),
      ...(query.sourceType ? { sourceType: query.sourceType } : {}),
      ...((range.from || range.to)
        ? {
            entryDate: {
              ...(range.from ? { gte: range.from } : {}),
              ...(range.to ? { lte: range.to } : {})
            }
          }
        : {})
    });

    return normalizeDecimals(rows);
  },

  async createJournalEntry(scope: ScopeContext, input: CreateJournalEntryInput) {
    assertAccountingRole(scope);
    ensureCenterAllowed(scope, input.centerId);

    for (const line of input.lines) {
      validateLineAmounts(line);
      ensureCenterAllowed(scope, line.centerId);
    }

    const result = await prisma.$transaction(async (tx) => {
      const accountIds = [...new Set(input.lines.map((line) => line.accountId))];
      const accounts = await tx.accountingAccount.findMany({
        where: {
          id: { in: accountIds },
          organizationId: scope.organizationId,
          isActive: true
        }
      });

      if (accounts.length !== accountIds.length) {
        throw new AppError("Accounting account not found", 404, undefined, "ENTITY_NOT_FOUND");
      }

      const accountById = new Map(accounts.map((account) => [account.id, account]));
      const parentAccounts = await tx.accountingAccount.findMany({
        where: {
          parentId: { in: accountIds },
          organizationId: scope.organizationId,
          isActive: true
        },
        select: { parentId: true }
      });
      const nonPostingAccountIds = new Set(parentAccounts.map((account) => account.parentId).filter(Boolean));
      const entryDate = parseDate(input.entryDate, "entryDate");

      await ensurePeriodOpenTx(tx, scope.organizationId, entryDate);

      const entry = await tx.journalEntry.create({
        data: {
          organizationId: scope.organizationId,
          centerId: input.centerId ?? null,
          entryNo: input.entryNo?.trim() || nextEntryNo(scope.organizationId),
          entryDate,
          sourceType: input.sourceType,
          sourceId: input.sourceId ?? null,
          status: JournalEntryStatus.DRAFT,
          description: input.description?.trim() || null
        }
      });

      await tx.journalEntryLine.createMany({
        data: input.lines.map((line) => {
          const account = accountById.get(line.accountId);
          if (!account) {
            throw new AppError("Accounting account not found", 404, undefined, "ENTITY_NOT_FOUND");
          }
          if (nonPostingAccountIds.has(line.accountId)) {
            throw new AppError("Parent accounts cannot be used in journal lines", 400, undefined, "ACCOUNT_NOT_POSTING_ALLOWED");
          }
          if (account.centerId && line.centerId && account.centerId !== line.centerId) {
            throw new AppError("Journal line center does not match account center", 400, undefined, "VALIDATION_ERROR");
          }
          const centerId = line.centerId ?? input.centerId ?? account.centerId ?? null;
          ensureCenterAllowed(scope, centerId);

          return {
            organizationId: scope.organizationId,
            journalEntryId: entry.id,
            accountId: line.accountId,
            centerId,
            debit: new Prisma.Decimal(line.debit),
            credit: new Prisma.Decimal(line.credit),
            memo: line.memo?.trim() || null,
            sourceLineType: line.sourceLineType ?? null,
            sourceLineId: line.sourceLineId ?? null
          };
        })
      });

      const created = await tx.journalEntry.findUnique({
        where: { id: entry.id },
        include: {
          lines: {
            orderBy: { id: "asc" },
            include: {
              account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } }
            }
          }
        }
      });

      return created;
    });

    return normalizeDecimals(result);
  },

  async postPaymentJournalEntryTx(
    tx: Prisma.TransactionClient,
    scope: ScopeContext,
    input: PostPaymentJournalEntryTxInput
  ) {
    assertAccountingRole(scope);

    const existing = await tx.journalEntry.findFirst({
      where: {
        organizationId: scope.organizationId,
        sourceType: JournalSourceType.PAYMENT,
        sourceId: input.paymentId
      },
      include: {
        lines: {
          orderBy: { id: "asc" },
          include: {
            account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } }
          }
        },
        postedBy: { select: { id: true, fullName: true } }
      }
    });

    if (existing) {
      return normalizeDecimals(existing);
    }

    const payment = await tx.payment.findFirst({
      where: {
        id: input.paymentId,
        organizationId: scope.organizationId
      },
      include: {
        invoice: { select: { id: true, centerId: true } },
        voucher: {
          include: {
            account: true
          }
        }
      }
    });

    if (!payment || !payment.organizationId) {
      throw new AppError("Payment not found", 404, undefined, "ENTITY_NOT_FOUND");
    }

    if (!payment.voucher || payment.voucher.status !== VoucherStatus.POSTED) {
      throw new AppError(
        "Payment voucher must be posted before accounting posting",
        409,
        undefined,
        "PAYMENT_VOUCHER_NOT_POSTED"
      );
    }

    const centerId = payment.centerId ?? payment.voucher.centerId ?? payment.invoice.centerId;
    ensureCenterAllowed(scope, centerId);

    const debitAccount = await findFinanceAccountLedgerAccountTx(tx, {
      organizationId: payment.organizationId,
      financeAccountId: payment.voucher.accountId,
      missingMessage: "Payment finance account is not linked to an active asset ledger account"
    });
    const creditAccount = await findRequiredAccountTx(tx, {
      organizationId: payment.organizationId,
      systemKey: "STUDENT_CONTRIBUTIONS_REVENUE",
      fallbackCode: "4100",
      expectedType: AccountingAccountType.REVENUE
    });

    const amount = payment.amount;
    const postedAt = new Date();

    await ensurePeriodOpenTx(tx, payment.organizationId, payment.receivedAt);

    const entry = await tx.journalEntry.create({
      data: {
        organizationId: payment.organizationId,
        centerId,
        entryNo: `PAY-${payment.organizationId}-${payment.id}`,
        entryDate: payment.receivedAt,
        sourceType: JournalSourceType.PAYMENT,
        sourceId: payment.id,
        status: JournalEntryStatus.POSTED,
        description: `Student payment collected for invoice ${payment.invoiceId}`,
        postedById: input.postedById,
        postedAt
      }
    });

    await tx.journalEntryLine.createMany({
      data: [
        {
          organizationId: payment.organizationId,
          journalEntryId: entry.id,
          accountId: debitAccount.id,
          centerId,
          debit: amount,
          credit: new Prisma.Decimal(0),
          memo: "Student payment cash collection",
          sourceLineType: JournalSourceType.PAYMENT,
          sourceLineId: payment.id
        },
        {
          organizationId: payment.organizationId,
          journalEntryId: entry.id,
          accountId: creditAccount.id,
          centerId,
          debit: new Prisma.Decimal(0),
          credit: amount,
          memo: "Student contributions revenue",
          sourceLineType: JournalSourceType.PAYMENT,
          sourceLineId: payment.id
        }
      ]
    });

    const created = await tx.journalEntry.findUnique({
      where: { id: entry.id },
      include: {
        lines: {
          orderBy: { id: "asc" },
          include: {
            account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } }
          }
        },
        postedBy: { select: { id: true, fullName: true } }
      }
    });

    return normalizeDecimals(created);
  },

  async postReceiptVoucherJournalEntryTx(
    tx: Prisma.TransactionClient,
    scope: ScopeContext,
    input: PostVoucherJournalEntryTxInput
  ) {
    assertAccountingRole(scope);

    // 1. Idempotency check
    const existing = await tx.journalEntry.findFirst({
      where: {
        organizationId: scope.organizationId,
        sourceType: JournalSourceType.VOUCHER,
        sourceId: input.voucherId
      },
      include: {
        lines: {
          orderBy: { id: "asc" },
          include: {
            account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } }
          }
        },
        postedBy: { select: { id: true, fullName: true } }
      }
    });

    if (existing) {
      return normalizeDecimals(existing);
    }

    // 2. Fetch voucher
    const voucher = await tx.financeVoucher.findFirst({
      where: {
        id: input.voucherId,
        organizationId: scope.organizationId
      }
    });

    if (!voucher) {
      throw new AppError("Voucher not found", 404, undefined, "ENTITY_NOT_FOUND");
    }

    // 3. Skip Payment-generated vouchers (already posted via postPaymentJournalEntryTx)
    if (voucher.sourceType === VoucherSourceType.PAYMENT) {
      return null;
    }

    // 4. Validate Receipt
    if (voucher.voucherType !== VoucherType.RECEIPT) {
      // FA-3.2.3 will handle Disbursement Voucher Posting.
      return null;
    }

    if (voucher.status !== VoucherStatus.POSTED) {
      throw new AppError(
        "Voucher must be posted before accounting posting",
        409,
        undefined,
        "VOUCHER_NOT_POSTED"
      );
    }

    const centerId = voucher.centerId;
    ensureCenterAllowed(scope, centerId);

    // 5. Mapping
    if (!voucher.accountingCategory) {
      throw new AppError(
        "Accounting category is missing for receipt voucher posting",
        400,
        undefined,
        "ACCOUNTING_CATEGORY_MISSING"
      );
    }

    let creditMapping: { systemKey: string; fallbackCode: string };
    switch (voucher.accountingCategory) {
      case VoucherAccountingCategory.DONATION:
        creditMapping = { systemKey: "DONATIONS_REVENUE", fallbackCode: "4200" };
        break;
      case VoucherAccountingCategory.STUDENT_CONTRIBUTION:
        creditMapping = { systemKey: "STUDENT_CONTRIBUTIONS_REVENUE", fallbackCode: "4100" };
        break;
      case VoucherAccountingCategory.OTHER_INCOME:
        creditMapping = { systemKey: "OTHER_REVENUE", fallbackCode: "4300" };
        break;
      default:
        // Prevent disbursement categories in receipt
        throw new AppError(
          `Invalid accounting category ${voucher.accountingCategory} for receipt voucher`,
          400,
          undefined,
          "INVALID_ACCOUNTING_CATEGORY"
        );
    }

    const debitAccount = await findFinanceAccountLedgerAccountTx(tx, {
      organizationId: voucher.organizationId,
      financeAccountId: voucher.accountId,
      missingMessage: "Receipt voucher finance account is not linked to an active asset ledger account"
    });

    const creditAccount = await findRequiredAccountTx(tx, {
      organizationId: voucher.organizationId,
      ...creditMapping,
      expectedType: AccountingAccountType.REVENUE
    });

    const amount = voucher.amount;
    const postedAt = new Date();
    const entryDate = voucher.postedAt || voucher.createdAt;

    await ensurePeriodOpenTx(tx, voucher.organizationId, entryDate);

    // 6. Create Entry
    const entry = await tx.journalEntry.create({
      data: {
        organizationId: voucher.organizationId,
        centerId,
        entryNo: `VOU-${voucher.organizationId}-${voucher.id}`,
        entryDate,
        sourceType: JournalSourceType.VOUCHER,
        sourceId: voucher.id,
        status: JournalEntryStatus.POSTED,
        description: voucher.notes?.trim() || `Receipt voucher collection: ${voucher.voucherNo}`,
        postedById: input.postedById,
        postedAt
      }
    });

    await tx.journalEntryLine.createMany({
      data: [
        {
          organizationId: voucher.organizationId,
          journalEntryId: entry.id,
          accountId: debitAccount.id,
          centerId,
          debit: amount,
          credit: new Prisma.Decimal(0),
          memo: `Receipt collection (${voucher.paymentMethod || "CASH"})`,
          sourceLineType: JournalSourceType.VOUCHER,
          sourceLineId: voucher.id
        },
        {
          organizationId: voucher.organizationId,
          journalEntryId: entry.id,
          accountId: creditAccount.id,
          centerId,
          debit: new Prisma.Decimal(0),
          credit: amount,
          memo: `Revenue: ${voucher.accountingCategory}`,
          sourceLineType: JournalSourceType.VOUCHER,
          sourceLineId: voucher.id
        }
      ]
    });

    const created = await tx.journalEntry.findUnique({
      where: { id: entry.id },
      include: {
        lines: {
          orderBy: { id: "asc" },
          include: {
            account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } }
          }
        },
        postedBy: { select: { id: true, fullName: true } }
      }
    });

    return normalizeDecimals(created);
  },

  async postDisbursementVoucherJournalEntryTx(
    tx: Prisma.TransactionClient,
    scope: ScopeContext,
    input: PostVoucherJournalEntryTxInput
  ) {
    assertAccountingRole(scope);

    const existing = await tx.journalEntry.findFirst({
      where: {
        organizationId: scope.organizationId,
        sourceType: JournalSourceType.VOUCHER,
        sourceId: input.voucherId
      },
      include: {
        lines: {
          orderBy: { id: "asc" },
          include: {
            account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } }
          }
        },
        postedBy: { select: { id: true, fullName: true } }
      }
    });

    if (existing) {
      return normalizeDecimals(existing);
    }

    const voucher = await tx.financeVoucher.findFirst({
      where: {
        id: input.voucherId,
        organizationId: scope.organizationId
      }
    });

    if (!voucher) {
      throw new AppError("Voucher not found", 404, undefined, "ENTITY_NOT_FOUND");
    }

    if (voucher.sourceType === VoucherSourceType.PAYMENT) {
      return null;
    }

    if (voucher.voucherType !== VoucherType.DISBURSEMENT) {
      return null;
    }

    if (voucher.status !== VoucherStatus.POSTED) {
      throw new AppError(
        "Voucher must be posted before accounting posting",
        409,
        undefined,
        "VOUCHER_NOT_POSTED"
      );
    }

    const centerId = voucher.centerId;
    ensureCenterAllowed(scope, centerId);

    if (!voucher.accountingCategory) {
      throw new AppError(
        "Accounting category is missing for disbursement voucher posting",
        400,
        undefined,
        "ACCOUNTING_CATEGORY_MISSING"
      );
    }

    let debitMapping: { systemKey: string; fallbackCode: string };
    switch (voucher.accountingCategory) {
      case VoucherAccountingCategory.OPERATING_EXPENSE:
        debitMapping = { systemKey: "OPERATING_EXPENSES", fallbackCode: "5200" };
        break;
      case VoucherAccountingCategory.EDUCATIONAL_EXPENSE:
        debitMapping = { systemKey: "EDUCATIONAL_EXPENSES", fallbackCode: "5300" };
        break;
      case VoucherAccountingCategory.CENTER_EXPENSE:
        debitMapping = { systemKey: "CENTER_EXPENSES", fallbackCode: "5400" };
        break;
      case VoucherAccountingCategory.REWARD:
      case "PAYROLL" as VoucherAccountingCategory:
        debitMapping = { systemKey: "PAYROLL_REWARDS_EXPENSE", fallbackCode: "5100" };
        break;
      default:
        throw new AppError(
          `Invalid accounting category ${voucher.accountingCategory} for disbursement voucher`,
          400,
          undefined,
          "INVALID_ACCOUNTING_CATEGORY"
        );
    }

    const debitAccount = await findRequiredAccountTx(tx, {
      organizationId: voucher.organizationId,
      ...debitMapping,
      expectedType: AccountingAccountType.EXPENSE,
      missingMessage: "Accounting expense account mapping is missing for disbursement voucher posting"
    });

    const creditAccount = await findFinanceAccountLedgerAccountTx(tx, {
      organizationId: voucher.organizationId,
      financeAccountId: voucher.accountId,
      missingMessage: "Disbursement voucher finance account is not linked to an active asset ledger account"
    });

    const amount = voucher.amount;
    const postedAt = new Date();
    const entryDate = voucher.postedAt || voucher.createdAt;

    await ensurePeriodOpenTx(tx, voucher.organizationId, entryDate);

    const entry = await tx.journalEntry.create({
      data: {
        organizationId: voucher.organizationId,
        centerId,
        entryNo: `VOU-${voucher.organizationId}-${voucher.id}`,
        entryDate,
        sourceType: JournalSourceType.VOUCHER,
        sourceId: voucher.id,
        status: JournalEntryStatus.POSTED,
        description: voucher.notes?.trim() || `Disbursement voucher posting: ${voucher.voucherNo}`,
        postedById: input.postedById,
        postedAt
      }
    });

    await tx.journalEntryLine.createMany({
      data: [
        {
          organizationId: voucher.organizationId,
          journalEntryId: entry.id,
          accountId: debitAccount.id,
          centerId,
          debit: amount,
          credit: new Prisma.Decimal(0),
          memo: `Expense: ${voucher.accountingCategory}`,
          sourceLineType: JournalSourceType.VOUCHER,
          sourceLineId: voucher.id
        },
        {
          organizationId: voucher.organizationId,
          journalEntryId: entry.id,
          accountId: creditAccount.id,
          centerId,
          debit: new Prisma.Decimal(0),
          credit: amount,
          memo: `Disbursement payment (${voucher.paymentMethod})`,
          sourceLineType: JournalSourceType.VOUCHER,
          sourceLineId: voucher.id
        }
      ]
    });

    const created = await tx.journalEntry.findUnique({
      where: { id: entry.id },
      include: {
        lines: {
          orderBy: { id: "asc" },
          include: {
            account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } }
          }
        },
        postedBy: { select: { id: true, fullName: true } }
      }
    });

    return normalizeDecimals(created);
  },

  // FA-UX-3A: Reverses the JournalEntry of a voided voucher by creating a new
  // POSTED JournalEntry whose lines mirror the original with debit/credit swapped.
  // The original entry is NEVER modified or deleted. The new entry is linked
  // via (sourceType=VOUCHER, sourceId=reversalVoucherId), so the
  // @@unique([organizationId, sourceType, sourceId]) constraint on JournalEntry
  // guarantees at most one reversal journal per reversal voucher (idempotency).
  // Returns null if the original voucher has no VOUCHER-sourced JournalEntry
  // (e.g. payment-generated vouchers whose journal lives under sourceType=PAYMENT).
  async reverseVoucherJournalEntryTx(
    tx: Prisma.TransactionClient,
    scope: ScopeContext,
    input: ReverseVoucherJournalEntryTxInput
  ) {
    assertAccountingRole(scope);

    // 1. Idempotency: if a reversal entry already exists for this reversal voucher, return it
    const existingReversal = await tx.journalEntry.findFirst({
      where: {
        organizationId: scope.organizationId,
        sourceType: JournalSourceType.VOUCHER,
        sourceId: input.reversalVoucherId
      },
      include: {
        lines: {
          orderBy: { id: "asc" },
          include: {
            account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } }
          }
        },
        postedBy: { select: { id: true, fullName: true } }
      }
    });

    if (existingReversal) {
      return normalizeDecimals(existingReversal);
    }

    // 2. Find the original voucher's JournalEntry. If the voucher never produced
    //    a VOUCHER-sourced entry (e.g. payment-generated voucher), skip safely.
    const original = await tx.journalEntry.findFirst({
      where: {
        organizationId: scope.organizationId,
        sourceType: JournalSourceType.VOUCHER,
        sourceId: input.originalVoucherId
      },
      include: {
        lines: {
          orderBy: { id: "asc" }
        }
      }
    });

    if (!original) {
      return null;
    }

    if (original.status !== JournalEntryStatus.POSTED) {
      // Only posted entries need reversing. Draft/void originals produce no ledger impact.
      return null;
    }

    // 3. Load the reversal voucher (for centerId + a stable entryNo)
    const reversalVoucher = await tx.financeVoucher.findFirst({
      where: {
        id: input.reversalVoucherId,
        organizationId: scope.organizationId
      }
    });

    if (!reversalVoucher) {
      throw new AppError(
        "Reversal voucher not found",
        404,
        undefined,
        "ENTITY_NOT_FOUND"
      );
    }

    const centerId = reversalVoucher.centerId ?? original.centerId;
    ensureCenterAllowed(scope, centerId ?? undefined);

    const postedAt = new Date();
    const entryDate = reversalVoucher.approvedAt || reversalVoucher.createdAt || postedAt;

    await ensurePeriodOpenTx(tx, scope.organizationId, entryDate);

    // 4. Create the reversal JournalEntry (POSTED) with debit/credit swapped lines.
    //    The unique(org, sourceType, sourceId) constraint prevents any double-reversal.
    const entry = await tx.journalEntry.create({
      data: {
        organizationId: scope.organizationId,
        centerId,
        entryNo: `REV-${scope.organizationId}-${input.reversalVoucherId}`,
        entryDate,
        sourceType: JournalSourceType.VOUCHER,
        sourceId: input.reversalVoucherId,
        status: JournalEntryStatus.POSTED,
        description:
          input.reason?.trim() ||
          `Reversal of journal entry ${original.entryNo} for voided voucher`,
        postedById: input.postedById,
        postedAt
      }
    });

    await tx.journalEntryLine.createMany({
      data: original.lines.map((line) => ({
        organizationId: scope.organizationId,
        journalEntryId: entry.id,
        accountId: line.accountId,
        centerId: line.centerId ?? centerId ?? null,
        // Swap debit <-> credit to produce the counter-entry
        debit: line.credit,
        credit: line.debit,
        memo: `Reversal: ${line.memo ?? ""}`.slice(0, 500),
        sourceLineType: JournalSourceType.VOUCHER,
        sourceLineId: input.reversalVoucherId
      }))
    });

    const created = await tx.journalEntry.findUnique({
      where: { id: entry.id },
      include: {
        lines: {
          orderBy: { id: "asc" },
          include: {
            account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } }
          }
        },
        postedBy: { select: { id: true, fullName: true } }
      }
    });

    return normalizeDecimals(created);
  },
  async postFundTransferJournalEntryTx(
    tx: Prisma.TransactionClient,
    scope: ScopeContext,
    input: { transferId: number; postedById: number }
  ) {
    assertAccountingRole(scope);

    const existing = await tx.journalEntry.findFirst({
      where: {
        organizationId: scope.organizationId,
        sourceType: JournalSourceType.FUND_TRANSFER,
        sourceId: input.transferId
      }
    });

    if (existing) return normalizeDecimals(existing);

    const transfer = await tx.financeFundTransfer.findFirst({
      where: { id: input.transferId, organizationId: scope.organizationId },
      include: {
        fromAccount: true,
        toAccount: true
      }
    });

    if (!transfer) {
      throw new AppError("Fund transfer not found", 404, undefined, "ENTITY_NOT_FOUND");
    }

    if (transfer.status !== FundTransferStatus.POSTED) {
      throw new AppError("Fund transfer must be posted before accounting posting", 409, undefined, "TRANSFER_NOT_POSTED");
    }

    const fromCenterId = transfer.fromCenterId;
    const toCenterId = transfer.toCenterId;

    ensureCenterAllowed(scope, fromCenterId ?? undefined);
    ensureCenterAllowed(scope, toCenterId ?? undefined);

    const debitAccount = await findFinanceAccountLedgerAccountTx(tx, {
      organizationId: transfer.organizationId,
      financeAccountId: transfer.toAccountId,
      missingMessage: "Destination finance account is not linked to an active asset ledger account"
    });

    const creditAccount = await findFinanceAccountLedgerAccountTx(tx, {
      organizationId: transfer.organizationId,
      financeAccountId: transfer.fromAccountId,
      missingMessage: "Source finance account is not linked to an active asset ledger account"
    });

    const amount = transfer.amount;
    const postedAt = new Date();
    const entryDate = transfer.postedAt || transfer.createdAt;

    await ensurePeriodOpenTx(tx, transfer.organizationId, entryDate);

    const entry = await tx.journalEntry.create({
      data: {
        organizationId: transfer.organizationId,
        centerId: null,
        entryNo: `TRF-${transfer.organizationId}-${transfer.id}`,
        entryDate,
        sourceType: JournalSourceType.FUND_TRANSFER,
        sourceId: transfer.id,
        status: JournalEntryStatus.POSTED,
        description: transfer.notes?.trim() || `Fund transfer from ${fromCenterId || 'ORG'} to ${toCenterId || 'ORG'}`,
        postedById: input.postedById,
        postedAt
      }
    });

    await tx.journalEntryLine.createMany({
      data: [
        {
          organizationId: transfer.organizationId,
          journalEntryId: entry.id,
          accountId: debitAccount.id,
          centerId: toCenterId,
          debit: amount,
          credit: new Prisma.Decimal(0),
          memo: `Fund transfer receipt from ${fromCenterId || 'ORG'}`,
          sourceLineType: JournalSourceType.FUND_TRANSFER,
          sourceLineId: transfer.id
        },
        {
          organizationId: transfer.organizationId,
          journalEntryId: entry.id,
          accountId: creditAccount.id,
          centerId: fromCenterId,
          debit: new Prisma.Decimal(0),
          credit: amount,
          memo: `Fund transfer disbursement to ${toCenterId || 'ORG'}`,
          sourceLineType: JournalSourceType.FUND_TRANSFER,
          sourceLineId: transfer.id
        }
      ]
    });

    const created = await tx.journalEntry.findUnique({
      where: { id: entry.id },
      include: {
        lines: {
          orderBy: { id: "asc" },
          include: { account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } } }
        },
        postedBy: { select: { id: true, fullName: true } }
      }
    });

    return normalizeDecimals(created);
  },

  async validateBalancedEntry(entryId: number) {
    const lines = await prisma.journalEntryLine.findMany({
      where: { journalEntryId: entryId },
      select: { debit: true, credit: true }
    });
    const totals = sumLines(lines);
    return {
      debit: decimalNumber(totals.debit),
      credit: decimalNumber(totals.credit),
      balanced: totals.debit.equals(totals.credit)
    };
  },

  async postJournalEntry(scope: ScopeContext, entryId: number) {
    assertAccountingRole(scope);

    const result = await prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.findFirst({
        where: { id: entryId, organizationId: scope.organizationId },
        include: { lines: true }
      });
      if (!entry) {
        throw new AppError("Journal entry not found", 404, undefined, "ENTITY_NOT_FOUND");
      }
      ensureCenterAllowed(scope, entry.centerId);

      if (entry.status !== JournalEntryStatus.DRAFT) {
        throw new AppError("Only draft journal entries can be posted", 409, undefined, "INVALID_STATE_TRANSITION");
      }
      if (entry.lines.length < 2) {
        throw new AppError("Journal entry must contain at least two lines", 400, undefined, "UNBALANCED_JOURNAL_ENTRY");
      }

      const totals = sumLines(entry.lines);
      if (!totals.debit.equals(totals.credit)) {
        throw new AppError("Journal entry is not balanced", 409, {
          debit: decimalNumber(totals.debit),
          credit: decimalNumber(totals.credit)
        }, "UNBALANCED_JOURNAL_ENTRY");
      }

      return tx.journalEntry.update({
        where: { id: entry.id },
        data: {
          status: JournalEntryStatus.POSTED,
          postedAt: new Date(),
          postedById: scope.userId
        },
        include: {
          lines: {
            orderBy: { id: "asc" },
            include: {
              account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } }
            }
          },
          postedBy: { select: { id: true, fullName: true } }
        }
      });
    });

    return normalizeDecimals(result);
  },

  async getLedger(
    scope: ScopeContext,
    query: { accountId: number; centerId?: number; from?: string; to?: string }
  ) {
    assertAccountingRole(scope);
    ensureCenterAllowed(scope, query.centerId);
    const range = parseDateRange(query.from, query.to);

    const account = await prisma.accountingAccount.findFirst({
      where: { id: query.accountId, organizationId: scope.organizationId }
    });
    if (!account) {
      throw new AppError("Accounting account not found", 404, undefined, "ENTITY_NOT_FOUND");
    }
    ensureCenterAllowed(scope, account.centerId);

    const centerFilter = lineCenterScopeWhere(scope, query.centerId);

    const openingRows = range.from
      ? await prisma.journalEntryLine.findMany({
          where: {
            organizationId: scope.organizationId,
            accountId: account.id,
            ...centerFilter,
            journalEntry: { status: JournalEntryStatus.POSTED, entryDate: { lt: range.from } }
          },
          select: { debit: true, credit: true }
        })
      : [];

    const periodRows = await prisma.journalEntryLine.findMany({
      where: {
        organizationId: scope.organizationId,
        accountId: account.id,
        ...centerFilter,
        journalEntry: {
          status: JournalEntryStatus.POSTED,
          ...((range.from || range.to)
            ? {
                entryDate: {
                  ...(range.from ? { gte: range.from } : {}),
                  ...(range.to ? { lte: range.to } : {})
                }
              }
            : {})
        }
      },
      orderBy: [{ journalEntry: { entryDate: "asc" } }, { id: "asc" }],
      include: {
        journalEntry: { select: { id: true, entryNo: true, entryDate: true, sourceType: true, sourceId: true } },
        center: { select: { id: true, name: true } }
      }
    });

    const opening = sumLines(openingRows);
    const period = sumLines(periodRows);
    const normalFactor = account.normalBalance === AccountingNormalBalance.DEBIT ? 1 : -1;
    const openingBalance = opening.debit.minus(opening.credit).mul(normalFactor);
    const periodBalance = period.debit.minus(period.credit).mul(normalFactor);

    return normalizeDecimals({
      account,
      opening: {
        debit: opening.debit,
        credit: opening.credit,
        balance: openingBalance
      },
      totals: {
        debit: period.debit,
        credit: period.credit,
        balance: periodBalance
      },
      closing: {
        balance: openingBalance.plus(periodBalance)
      },
      rows: periodRows
    });
  },

  async getTrialBalance(scope: ScopeContext, query: { centerId?: number; from?: string; to?: string }) {
    assertAccountingRole(scope);
    ensureCenterAllowed(scope, query.centerId);
    const range = parseDateRange(query.from, query.to);

    const centerFilter = lineCenterScopeWhere(scope, query.centerId);

    const lines = await prisma.journalEntryLine.findMany({
      where: {
        organizationId: scope.organizationId,
        ...centerFilter,
        journalEntry: {
          status: JournalEntryStatus.POSTED,
          ...((range.from || range.to)
            ? {
                entryDate: {
                  ...(range.from ? { gte: range.from } : {}),
                  ...(range.to ? { lte: range.to } : {})
                }
              }
            : {})
        }
      },
      include: {
        account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } }
      }
    });

    const byAccount = new Map<
      number,
      {
        account: (typeof lines)[number]["account"];
        debit: Prisma.Decimal;
        credit: Prisma.Decimal;
      }
    >();

    for (const line of lines) {
      const existing = byAccount.get(line.accountId) ?? {
        account: line.account,
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(0)
      };
      existing.debit = existing.debit.plus(line.debit);
      existing.credit = existing.credit.plus(line.credit);
      byAccount.set(line.accountId, existing);
    }

    const rows = Array.from(byAccount.values())
      .sort((left, right) => left.account.code.localeCompare(right.account.code))
      .map((row) => {
        const normalFactor = row.account.normalBalance === AccountingNormalBalance.DEBIT ? 1 : -1;
        return {
          account: row.account,
          debit: row.debit,
          credit: row.credit,
          balance: row.debit.minus(row.credit).mul(normalFactor)
        };
      });

    const totals = rows.reduce(
      (acc, row) => ({
        debit: acc.debit.plus(row.debit),
        credit: acc.credit.plus(row.credit)
      }),
      { debit: new Prisma.Decimal(0), credit: new Prisma.Decimal(0) }
    );

    return normalizeDecimals({
      rows,
      totals: {
        debit: totals.debit,
        credit: totals.credit,
        balanced: totals.debit.equals(totals.credit)
      }
    });
  }
};
