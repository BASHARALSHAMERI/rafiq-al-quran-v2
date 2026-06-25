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
  if (
    scope.role !== Role.SUPER_ADMIN &&
    scope.role !== Role.ACCOUNTANT &&
    scope.role !== Role.FINANCE_MANAGER &&
    scope.role !== Role.TREASURER &&
    scope.role !== Role.AUDITOR &&
    scope.role !== Role.SUPERVISOR
  ) {
    throw new AppError("ليس لديك صلاحية للنطاق المحاسبي", 403, undefined, "ACCOUNTING_SCOPE_DENIED");
  }
};

const assertAccountingAdminRole = (scope: ScopeContext) => {
  if (scope.role !== Role.SUPER_ADMIN && scope.role !== Role.FINANCE_MANAGER) {
    throw new AppError("ليس لديك صلاحية لإدارة الفترات المالية", 403, undefined, "ACCOUNTING_SCOPE_DENIED");
  }
};

const ensureCenterAllowed = (scope: ScopeContext, centerId?: number | null) => {
  if (!centerId || scope.allAccess) return;
  if (!scope.centerIds.includes(centerId)) {
    throw new AppError("ليس لديك صلاحية للنطاق المحاسبي للمركز", 403, undefined, "ACCOUNTING_SCOPE_DENIED");
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

  if (scope.role === Role.SUPERVISOR) {
    return { centerId: { in: scope.centerIds } };
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

  if (scope.role === Role.SUPERVISOR) {
    return { centerId: { in: scope.centerIds } };
  }

  return { OR: [{ centerId: { in: scope.centerIds } }, { centerId: null }] };
};

const parseDate = (value: string, fieldName: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`${fieldName} غير صالح`, 400, undefined, "VALIDATION_ERROR");
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
    throw new AppError("نطاق التواريخ غير صالح", 400, undefined, "VALIDATION_ERROR");
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
      "كل سطر في القيد يجب أن يحتوي على مدين أو دائن",
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

type PostExpensePaymentSettlementJournalEntryTxInput = {
  expensePaymentId: number;
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
      input.missingMessage ?? "تصنيف الحساب المحاسبي مفقود لترحيل الدفعة",
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
      "التصنيف المحاسبي يشير إلى حساب أب غير مسموح بالترحيل",
      409,
      { accountId: account.id, systemKey: input.systemKey, fallbackCode: input.fallbackCode },
      "ACCOUNT_NOT_POSTING_ALLOWED"
    );
  }

  return account;
};

const findAccountsPayablePostingAccountTx = async (
  tx: Prisma.TransactionClient,
  organizationId: number
) => {
  const account = await tx.accountingAccount.findFirst({
    where: {
      organizationId,
      type: AccountingAccountType.LIABILITY,
      isActive: true,
      children: { none: { isActive: true } },
      OR: [{ systemKey: "ACCOUNTS_PAYABLE" }, { code: "2130" }, { code: "2100" }]
    },
    orderBy: [{ systemKey: "desc" }, { code: "desc" }, { id: "asc" }]
  });

  if (!account) {
    throw new AppError(
      "حساب الدائنون مفقود لتسوية دفعة المصروف",
      409,
      { systemKey: "ACCOUNTS_PAYABLE", fallbackCodes: ["2130", "2100"] },
      "ACCOUNTING_MAPPING_MISSING"
    );
  }

  return account;
};

const resolveExpenseInvoiceAccountsPayableTx = async (
  tx: Prisma.TransactionClient,
  input: {
    organizationId: number;
    invoiceId: number;
  }
) => {
  const accrualEntry = await tx.journalEntry.findFirst({
    where: {
      organizationId: input.organizationId,
      sourceType: JournalSourceType.EXPENSE_INVOICE,
      sourceId: input.invoiceId,
      status: JournalEntryStatus.POSTED
    },
    include: {
      lines: {
        where: {
          credit: { gt: new Prisma.Decimal(0) },
          account: {
            type: AccountingAccountType.LIABILITY,
            isActive: true,
            children: { none: { isActive: true } }
          }
        },
        include: { account: true },
        orderBy: { id: "asc" }
      }
    }
  });

  return accrualEntry?.lines[0]?.account ?? findAccountsPayablePostingAccountTx(tx, input.organizationId);
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
    throw new AppError("الحساب المالي غير موجود", 404, undefined, "ENTITY_NOT_FOUND");
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

  if (!period) {
    const all = await tx.fiscalPeriod.findMany({
      where: { organizationId },
      select: { id: true, periodNumber: true, startDate: true, endDate: true, status: true }
    });
    console.error(
      "[FISCAL_DEBUG] org=%d date=%s dateLocal=%s",
      organizationId,
      date.toISOString(),
      date.toString()
    );
    for (const p of all) {
      console.error(
        "[FISCAL_DEBUG] period=%d num=%d start=%s end=%s status=%s",
        p.id, p.periodNumber, p.startDate.toISOString(), p.endDate.toISOString(), p.status
      );
    }
    throw new AppError(
      "لا توجد فترة مالية مفتوحة تغطي تاريخ العملية",
      409,
      undefined,
      "FISCAL_PERIOD_NOT_FOUND"
    );
  }

  if (period.status === FiscalPeriodStatus.CLOSED) {
    throw new AppError(
      "لا يمكن تنفيذ العملية المالية في فترة مالية مغلقة",
      409,
      undefined,
      "FISCAL_PERIOD_CLOSED"
    );
  }

  return period;
};

export const accountingService = {
  ensurePeriodOpenTx,

  async listFiscalPeriods(scope: ScopeContext) {
    assertAccountingRole(scope);
    return accountingRepository.findFiscalPeriods(scope.organizationId);
  },

  async closeFiscalPeriod(scope: ScopeContext, periodId: number) {
    assertAccountingAdminRole(scope);

    return prisma.$transaction(async (tx) => {
      const period = await tx.fiscalPeriod.findFirst({
        where: { id: periodId, organizationId: scope.organizationId }
      });

      if (!period) {
        throw new AppError("الفترة المالية غير موجودة", 404, undefined, "FISCAL_PERIOD_NOT_FOUND");
      }

      if (period.status === FiscalPeriodStatus.CLOSED) {
        throw new AppError("الفترة المالية مغلقة بالفعل", 409, undefined, "FISCAL_PERIOD_ALREADY_CLOSED");
      }

      const draftEntries = await tx.journalEntry.count({
        where: { fiscalPeriodId: period.id, status: JournalEntryStatus.DRAFT }
      });

      if (draftEntries > 0) {
        throw new AppError(
          "لا يمكن إغلاق فترة مالية تحتوي على قيود مسودة",
          409,
          { draftEntries },
          "FISCAL_PERIOD_HAS_DRAFT_ENTRIES"
        );
      }

      return tx.fiscalPeriod.update({
        where: { id: period.id },
        data: { status: FiscalPeriodStatus.CLOSED, closedAt: new Date(), closedById: scope.userId },
        include: {
          fiscalYear: { select: { id: true, year: true, status: true } },
          closedBy: { select: { id: true, fullName: true } },
          _count: { select: { journalEntries: true } }
        }
      });
    });
  },

  async reopenFiscalPeriod(scope: ScopeContext, periodId: number) {
    assertAccountingAdminRole(scope);

    return prisma.$transaction(async (tx) => {
      const period = await tx.fiscalPeriod.findFirst({
        where: { id: periodId, organizationId: scope.organizationId }
      });

      if (!period) {
        throw new AppError("الفترة المالية غير موجودة", 404, undefined, "FISCAL_PERIOD_NOT_FOUND");
      }

      if (period.status === FiscalPeriodStatus.OPEN) {
        throw new AppError("الفترة المالية مفتوحة بالفعل", 409, undefined, "FISCAL_PERIOD_ALREADY_OPEN");
      }

      const fiscalYear = await tx.fiscalYear.findUnique({
        where: { id: period.fiscalYearId }
      });
      if (fiscalYear && fiscalYear.status === FiscalPeriodStatus.CLOSED) {
        throw new AppError("لا يمكن إعادة فتح فترة في سنة مالية مغلقة", 409, undefined, "FISCAL_YEAR_CLOSED");
      }

      return tx.fiscalPeriod.update({
        where: { id: period.id },
        data: { status: FiscalPeriodStatus.OPEN, closedAt: null, closedById: null },
        include: {
          fiscalYear: { select: { id: true, year: true, status: true } },
          closedBy: { select: { id: true, fullName: true } },
          _count: { select: { journalEntries: true } }
        }
      });
    });
  },

  async listFiscalYears(scope: ScopeContext) {
    assertAccountingRole(scope);
    return prisma.fiscalYear.findMany({
      where: { organizationId: scope.organizationId },
      orderBy: { year: "desc" },
      include: {
        periods: {
          orderBy: { periodNumber: "asc" },
          include: {
            closedBy: { select: { id: true, fullName: true } },
            _count: { select: { journalEntries: true } }
          }
        },
        closedBy: { select: { id: true, fullName: true } }
      }
    });
  },

  async createFiscalYear(
    scope: ScopeContext,
    input: { year: number; startDate: string; endDate: string; periodType: "MONTHLY" | "QUARTERLY" }
  ) {
    assertAccountingAdminRole(scope);
    const start = parseDate(input.startDate, "startDate");
    const end = parseDate(input.endDate, "endDate");
    if (start >= end) {
      throw new AppError("تاريخ البداية يجب أن يكون قبل تاريخ النهاية", 400, undefined, "VALIDATION_ERROR");
    }
    return prisma.$transaction(async (tx) => {
      const existing = await tx.fiscalYear.findFirst({
        where: { organizationId: scope.organizationId, year: input.year }
      });
      if (existing) {
        throw new AppError("السنة المالية موجودة بالفعل", 409, { year: input.year }, "FISCAL_YEAR_EXISTS");
      }
      const fiscalYear = await tx.fiscalYear.create({
        data: {
          organizationId: scope.organizationId,
          year: input.year,
          startDate: start,
          endDate: end,
          status: FiscalPeriodStatus.OPEN
        }
      });
      const arabicMonths = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
      const arabicQuarters = ["الربع الأول","الربع الثاني","الربع الثالث","الربع الرابع"];
      const periods: Array<{
        fiscalYearId: number; organizationId: number; periodNumber: number;
        periodName: string; startDate: Date; endDate: Date; status: FiscalPeriodStatus;
      }> = [];
      if (input.periodType === "MONTHLY") {
        for (let m = 0; m < 12; m++) {
          const pStart = new Date(start.getFullYear(), start.getMonth() + m, 1);
          const pEnd = new Date(start.getFullYear(), start.getMonth() + m + 1, 0);
          if (pStart > end) break;
          const actualEnd = pEnd > end ? end : pEnd;
          periods.push({ fiscalYearId: fiscalYear.id, organizationId: scope.organizationId,
            periodNumber: m + 1, periodName: arabicMonths[(start.getMonth() + m) % 12],
            startDate: pStart, endDate: actualEnd, status: FiscalPeriodStatus.OPEN });
        }
      } else {
        for (let q = 0; q < 4; q++) {
          const qStart = new Date(start.getFullYear(), start.getMonth() + q * 3, 1);
          const qEnd = new Date(start.getFullYear(), start.getMonth() + q * 3 + 3, 0);
          if (qStart > end) break;
          const actualEnd = qEnd > end ? end : qEnd;
          periods.push({ fiscalYearId: fiscalYear.id, organizationId: scope.organizationId,
            periodNumber: q + 1, periodName: arabicQuarters[q],
            startDate: qStart, endDate: actualEnd, status: FiscalPeriodStatus.OPEN });
        }
      }
      await tx.fiscalPeriod.createMany({ data: periods });
      return tx.fiscalYear.findUniqueOrThrow({
        where: { id: fiscalYear.id },
        include: { periods: { orderBy: { periodNumber: "asc" }, include: { _count: { select: { journalEntries: true } } } } }
      });
    });
  },
  
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
      throw new AppError("رمز الحساب المحاسبي واسمه ونوعه مطلوب", 400, undefined, "VALIDATION_ERROR");
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
          throw new AppError("الحساب الأب غير موجود", 404, undefined, "ENTITY_NOT_FOUND");
        }
        if (parent && parent.type !== type) {
          throw new AppError("نوع الحساب الأب يجب أن يطابق نوع الحساب الفرعي", 400, undefined, "ACCOUNT_TYPE_MISMATCH");
        }

        const centerId = input.centerId ?? parent?.centerId ?? null;
        ensureCenterAllowed(scope, centerId);
        if (parent?.centerId && centerId && parent.centerId !== centerId) {
          throw new AppError("مركز الحساب الأب يجب أن يطابق مركز الحساب الفرعي", 400, undefined, "VALIDATION_ERROR");
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
        throw new AppError("رمز الحساب المحاسبي موجود مسبقاً", 409, undefined, "ACCOUNT_CODE_CONFLICT");
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
          throw new AppError("الحساب المحاسبي غير موجود", 404, undefined, "ENTITY_NOT_FOUND");
        }
        ensureCenterAllowed(scope, existing.centerId);

        const nextType = input.type ?? existing.type;
        const nextParentId = input.parentId === undefined ? existing.parentId : input.parentId;
        const nextCenterId = input.centerId === undefined ? existing.centerId : input.centerId ?? null;

        if (nextParentId === existing.id) {
          throw new AppError("الحساب لا يمكن أن يكون أباً لنفسه", 400, undefined, "VALIDATION_ERROR");
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
          throw new AppError("الحساب الأب غير موجود", 404, undefined, "ENTITY_NOT_FOUND");
        }
        if (parent && parent.type !== nextType) {
          throw new AppError("نوع الحساب الأب يجب أن يطابق نوع الحساب الفرعي", 400, undefined, "ACCOUNT_TYPE_MISMATCH");
        }
        ensureCenterAllowed(scope, nextCenterId);
        if (parent?.centerId && nextCenterId && parent.centerId !== nextCenterId) {
          throw new AppError("مركز الحساب الأب يجب أن يطابق مركز الحساب الفرعي", 400, undefined, "VALIDATION_ERROR");
        }

        if (input.type && input.type !== existing.type) {
          const lineCount = await tx.journalEntryLine.count({ where: { accountId: existing.id } });
          if (lineCount > 0) {
            throw new AppError("لا يمكن تغيير نوع حساب عليه قيود", 409, undefined, "ACCOUNT_HAS_JOURNAL_LINES");
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
        throw new AppError("رمز الحساب المحاسبي موجود مسبقاً", 409, undefined, "ACCOUNT_CODE_CONFLICT");
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
        throw new AppError("الحساب المحاسبي غير موجود", 404, undefined, "ENTITY_NOT_FOUND");
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

      const fiscalPeriod = await ensurePeriodOpenTx(tx, scope.organizationId, entryDate);

      const entry = await tx.journalEntry.create({
        data: {
          organizationId: scope.organizationId,
          centerId: input.centerId ?? null,
          entryNo: input.entryNo?.trim() || nextEntryNo(scope.organizationId),
          entryDate,
          sourceType: input.sourceType,
          sourceId: input.sourceId ?? null,
          status: JournalEntryStatus.DRAFT,
          fiscalPeriodId: fiscalPeriod?.id ?? null,
          description: input.description?.trim() || null
        }
      });

      await tx.journalEntryLine.createMany({
        data: input.lines.map((line) => {
          const account = accountById.get(line.accountId);
          if (!account) {
            throw new AppError("الحساب المحاسبي غير موجود", 404, undefined, "ENTITY_NOT_FOUND");
          }
          if (nonPostingAccountIds.has(line.accountId)) {
            throw new AppError("الحسابات الأب لا يمكن استخدامها في القيود", 400, undefined, "ACCOUNT_NOT_POSTING_ALLOWED");
          }
          if (account.centerId && line.centerId && account.centerId !== line.centerId) {
            throw new AppError("مركز بند القيد لا يطابق مركز الحساب", 400, undefined, "VALIDATION_ERROR");
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
      throw new AppError("الدفعة غير موجودة", 404, undefined, "ENTITY_NOT_FOUND");
    }

    if (!payment.voucher || payment.voucher.status !== VoucherStatus.POSTED) {
      throw new AppError(
        "الدفعة يجب أن تكون مرحّلة قبل الترحيل المحاسبي",
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

    const fiscalPeriod = await ensurePeriodOpenTx(tx, payment.organizationId, payment.receivedAt);

    const entry = await tx.journalEntry.create({
      data: {
        organizationId: payment.organizationId,
        centerId,
        entryNo: `PAY-${payment.organizationId}-${payment.id}`,
        entryDate: payment.receivedAt,
        sourceType: JournalSourceType.PAYMENT,
        sourceId: payment.id,
        status: JournalEntryStatus.POSTED,
        fiscalPeriodId: fiscalPeriod?.id ?? null,
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
      throw new AppError("السند غير موجود", 404, undefined, "ENTITY_NOT_FOUND");
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
        "السند يجب أن يكون مرحّلاً قبل الترحيل المحاسبي",
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
        "التصنيف المحاسبي مفقود لترحيل سند القبض",
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

    const fiscalPeriod = await ensurePeriodOpenTx(tx, voucher.organizationId, entryDate);

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
        fiscalPeriodId: fiscalPeriod?.id ?? null,
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

  async postExpensePaymentSettlementJournalEntryTx(
    tx: Prisma.TransactionClient,
    scope: ScopeContext,
    input: PostExpensePaymentSettlementJournalEntryTxInput
  ) {
    assertAccountingRole(scope);

    const existingPaymentEntry = await tx.journalEntry.findFirst({
      where: {
        organizationId: scope.organizationId,
        sourceType: JournalSourceType.EXPENSE_PAYMENT,
        sourceId: input.expensePaymentId
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

    if (existingPaymentEntry) {
      await tx.expensePayment.updateMany({
        where: {
          id: input.expensePaymentId,
          organizationId: scope.organizationId,
          journalEntryId: null
        },
        data: { journalEntryId: existingPaymentEntry.id }
      });
      return normalizeDecimals(existingPaymentEntry);
    }

    const payment = await tx.expensePayment.findFirst({
      where: {
        id: input.expensePaymentId,
        organizationId: scope.organizationId
      },
      include: {
        invoice: {
          include: {
            category: {
              include: {
                accountingAccount: true
              }
            }
          }
        },
        voucher: true
      }
    });

    if (!payment) {
      throw new AppError("دفعة المصروف غير موجودة", 404, undefined, "ENTITY_NOT_FOUND");
    }

    if (payment.voucherId !== input.voucherId) {
      throw new AppError(
        "سند دفع المصروف لا يطابق مدخلات التسوية",
        409,
        { expensePaymentId: payment.id, paymentVoucherId: payment.voucherId, voucherId: input.voucherId },
        "EXPENSE_PAYMENT_VOUCHER_MISMATCH"
      );
    }

    if (payment.journalEntryId) {
      const linkedEntry = await tx.journalEntry.findFirst({
        where: {
          id: payment.journalEntryId,
          organizationId: scope.organizationId
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

      if (linkedEntry) {
        return normalizeDecimals(linkedEntry);
      }
    }

    const existingVoucherEntry = await tx.journalEntry.findFirst({
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

    if (existingVoucherEntry) {
      return normalizeDecimals(existingVoucherEntry);
    }

    const voucher = payment.voucher;
    if (!voucher) {
      throw new AppError("سند دفع المصروف غير موجود", 404, undefined, "ENTITY_NOT_FOUND");
    }

    if (voucher.status !== VoucherStatus.POSTED) {
      throw new AppError(
        "سند دفع المصروف يجب أن يكون مرحّلاً قبل التسوية المحاسبية",
        409,
        undefined,
        "VOUCHER_NOT_POSTED"
      );
    }

    if (voucher.voucherType !== VoucherType.DISBURSEMENT || voucher.sourceType !== VoucherSourceType.EXPENSE) {
      throw new AppError(
        "السند ليس سند صرف مصروف",
        409,
        { voucherId: voucher.id, voucherType: voucher.voucherType, sourceType: voucher.sourceType },
        "INVALID_EXPENSE_PAYMENT_VOUCHER"
      );
    }

    const centerId = payment.invoice.centerId ?? voucher.centerId;
    ensureCenterAllowed(scope, centerId);

    const debitAccount = await resolveExpenseInvoiceAccountsPayableTx(tx, {
      organizationId: payment.organizationId,
      invoiceId: payment.invoiceId
    });

    const creditAccount = await findFinanceAccountLedgerAccountTx(tx, {
      organizationId: payment.organizationId,
      financeAccountId: voucher.accountId,
      missingMessage: "Expense payment finance account is not linked to an active asset ledger account"
    });

    const entryDate = payment.paidAt;
    const postedAt = new Date();

    const fiscalPeriod = await ensurePeriodOpenTx(tx, payment.organizationId, entryDate);

    const entry = await tx.journalEntry.create({
      data: {
        organizationId: payment.organizationId,
        centerId,
        entryNo: `EXP-PAY-${payment.organizationId}-${payment.id}`,
        entryDate,
        sourceType: JournalSourceType.EXPENSE_PAYMENT,
        sourceId: payment.id,
        status: JournalEntryStatus.POSTED,
        fiscalPeriodId: fiscalPeriod?.id ?? null,
        description: `Payment settlement for expense invoice ${payment.invoiceId}`,
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
          debit: payment.amount,
          credit: new Prisma.Decimal(0),
          memo: `AP settlement for invoice ${payment.invoiceId}`,
          sourceLineType: JournalSourceType.EXPENSE_PAYMENT,
          sourceLineId: payment.id
        },
        {
          organizationId: payment.organizationId,
          journalEntryId: entry.id,
          accountId: creditAccount.id,
          centerId,
          debit: new Prisma.Decimal(0),
          credit: payment.amount,
          memo: `Cash/bank payment for invoice ${payment.invoiceId}`,
          sourceLineType: JournalSourceType.EXPENSE_PAYMENT,
          sourceLineId: payment.id
        }
      ]
    });

    await tx.expensePayment.update({
      where: { id: payment.id },
      data: { journalEntryId: entry.id }
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
      throw new AppError("السند غير موجود", 404, undefined, "ENTITY_NOT_FOUND");
    }

    if (voucher.sourceType === VoucherSourceType.PAYMENT) {
      return null;
    }

    if (voucher.voucherType !== VoucherType.DISBURSEMENT) {
      return null;
    }

    if (voucher.status !== VoucherStatus.POSTED) {
      throw new AppError(
        "السند يجب أن يكون مرحّلاً قبل الترحيل المحاسبي",
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
          `تصنيف محاسبي غير صالح ${voucher.accountingCategory} لسند الصرف`,
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

    const fiscalPeriod = await ensurePeriodOpenTx(tx, voucher.organizationId, entryDate);

    const entry = await tx.journalEntry.create({
      data: {
        organizationId: voucher.organizationId,
        centerId,
        entryNo: `VOU-${voucher.organizationId}-${voucher.id}`,
        entryDate,
        sourceType: JournalSourceType.VOUCHER,
        sourceId: voucher.id,
        status: JournalEntryStatus.POSTED,
        fiscalPeriodId: fiscalPeriod?.id ?? null,
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
        "سند الإلغاء غير موجود",
        404,
        undefined,
        "ENTITY_NOT_FOUND"
      );
    }

    const centerId = reversalVoucher.centerId ?? original.centerId;
    ensureCenterAllowed(scope, centerId ?? undefined);

    const postedAt = new Date();
    const entryDate = reversalVoucher.approvedAt || reversalVoucher.createdAt || postedAt;

    const fiscalPeriod = await ensurePeriodOpenTx(tx, scope.organizationId, entryDate);

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
        fiscalPeriodId: fiscalPeriod?.id ?? null,
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
      throw new AppError("تحويل الأموال غير موجود", 404, undefined, "ENTITY_NOT_FOUND");
    }

    if (transfer.status !== FundTransferStatus.POSTED) {
      throw new AppError("تحويل الأموال يجب أن يكون مرحّلاً قبل الترحيل المحاسبي", 409, undefined, "TRANSFER_NOT_POSTED");
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

    const fiscalPeriod = await ensurePeriodOpenTx(tx, transfer.organizationId, entryDate);

    const entry = await tx.journalEntry.create({
      data: {
        organizationId: transfer.organizationId,
        centerId: null,
        entryNo: `TRF-${transfer.organizationId}-${transfer.id}`,
        entryDate,
        sourceType: JournalSourceType.FUND_TRANSFER,
        sourceId: transfer.id,
        status: JournalEntryStatus.POSTED,
        fiscalPeriodId: fiscalPeriod?.id ?? null,
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
        throw new AppError("القيد اليومي غير موجود", 404, undefined, "ENTITY_NOT_FOUND");
      }
      ensureCenterAllowed(scope, entry.centerId);

      if (entry.status !== JournalEntryStatus.DRAFT) {
        throw new AppError("فقط القيود المسودة يمكن ترحيلها", 409, undefined, "INVALID_STATE_TRANSITION");
      }
      if (entry.lines.length < 2) {
        throw new AppError("القيد اليومي يجب أن يحتوي على سطرين على الأقل", 400, undefined, "UNBALANCED_JOURNAL_ENTRY");
      }

      const totals = sumLines(entry.lines);
      if (!totals.debit.equals(totals.credit)) {
        throw new AppError("القيد اليومي غير متوازن", 409, {
          debit: decimalNumber(totals.debit),
          credit: decimalNumber(totals.credit)
        }, "UNBALANCED_JOURNAL_ENTRY");
      }

      const fiscalPeriod = await ensurePeriodOpenTx(tx, scope.organizationId, entry.entryDate);

      return tx.journalEntry.update({
        where: { id: entry.id },
        data: {
          status: JournalEntryStatus.POSTED,
          fiscalPeriodId: entry.fiscalPeriodId ?? fiscalPeriod?.id ?? null,
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
      throw new AppError("الحساب المحاسبي غير موجود", 404, undefined, "ENTITY_NOT_FOUND");
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
