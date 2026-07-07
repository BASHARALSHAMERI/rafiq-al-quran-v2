import {
  AccountingAccountType,
  AuditAction,
  AuditEntityType,
  ExpenseInvoiceStatus,
  JournalEntryStatus,
  JournalSourceType,
  Prisma,
  VoucherSourceType,
  VoucherStatus,
  VoucherType,
  VoucherAccountingCategory,
  FinanceMovementType
} from "@prisma/client";
import { prisma } from "../../../shared/db/prisma";
import { AppError } from "../../../shared/errors/app-error";
import { safeDate, toDateOnly } from "../../../shared/utils/time";
import type { ScopeContext } from "../../../shared/types/auth.types";
import { accountingService, ensurePeriodOpenTx } from "../../accounting/accounting.service";
import { financeV2Domain } from "../finance-v2.domain";
import { addAudit, isKnownPrismaError, nextVoucherNoTx, normalize, postVoucherTx, getEffectivePolicyTx } from "../finance-v2.internal";

const findPostingAccountsPayableTx = (tx: Prisma.TransactionClient, organizationId: number) => {
  return tx.accountingAccount.findFirst({
    where: {
      organizationId,
      type: AccountingAccountType.LIABILITY,
      isActive: true,
      children: { none: { isActive: true } },
      OR: [{ systemKey: "ACCOUNTS_PAYABLE" }, { code: "2130" }, { code: "2100" }]
    },
    orderBy: [{ systemKey: "desc" }, { code: "desc" }, { id: "asc" }]
  });
};

const resolveExpenseInvoiceCenterWhere = (
  scope: ScopeContext,
  centerId?: number
): Prisma.ExpenseInvoiceWhereInput => {
  financeV2Domain.ensureCenterAllowed(scope, centerId);

  if (centerId) {
    return { centerId };
  }

  if (scope.allAccess) {
    return {};
  }

  return { centerId: { in: scope.centerIds } };
};

const ensureExpenseInvoiceScope = (
  scope: ScopeContext,
  invoice: { centerId: number | null }
) => {
  financeV2Domain.ensureScopedCenterRequired(scope, invoice.centerId);
};

const ensureFinanceAccountScope = (
  scope: ScopeContext,
  financeAccount: { centerId: number | null }
) => {
  if (financeAccount.centerId) {
    financeV2Domain.ensureCenterAllowed(scope, financeAccount.centerId);
  }
};

export const expensesService = {
  async listSuppliers(scope: ScopeContext) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    const suppliers = await prisma.supplier.findMany({
      where: { organizationId: scope.organizationId },
      orderBy: { name: "asc" }
    });
    return suppliers;
  },

  async createSupplier(
    scope: ScopeContext,
    input: { name: string; phone?: string; address?: string; notes?: string }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);
    try {
      return await prisma.supplier.create({
        data: {
          organizationId: scope.organizationId,
          name: input.name.trim(),
          phone: input.phone?.trim() || null,
          address: input.address?.trim() || null,
          notes: input.notes?.trim() || null
        }
      });
    } catch (error) {
      if (isKnownPrismaError(error) && error.code === "P2002") {
        throw new AppError(
          "Supplier already exists",
          409,
          undefined,
          "DUPLICATE_SUPPLIER",
          { ar: "المورد موجود مسبقاً", en: "Supplier already exists" }
        );
      }
      throw error;
    }
  },

  async listExpenseCategories(scope: ScopeContext) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    const categories = await prisma.expenseCategory.findMany({
      where: { organizationId: scope.organizationId },
      include: { accountingAccount: { select: { id: true, name: true, code: true } } },
      orderBy: { name: "asc" }
    });
    return categories;
  },

  async createExpenseCategory(
    scope: ScopeContext,
    input: { name: string; type?: string; accountingAccountId?: number }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanManageSettings(scope);
    if (input.accountingAccountId) {
      const account = await prisma.accountingAccount.findFirst({
        where: {
          id: input.accountingAccountId,
          organizationId: scope.organizationId,
          type: AccountingAccountType.EXPENSE,
          isActive: true,
          children: { none: { isActive: true } }
        }
      });
      if (!account) {
        throw new AppError("حساب ترحيل المصروفات غير موجود", 404);
      }
    }

    try {
      return await prisma.expenseCategory.create({
        data: {
          organizationId: scope.organizationId,
          name: input.name.trim(),
          type: input.type?.trim() || null,
          accountingAccountId: input.accountingAccountId
        }
      });
    } catch (error) {
      if (isKnownPrismaError(error) && error.code === "P2002") {
        throw new AppError(
          "Expense category already exists",
          409,
          undefined,
          "DUPLICATE_EXPENSE_CATEGORY",
          { ar: "تصنيف المصروف موجود مسبقاً", en: "Expense category already exists" }
        );
      }
      throw error;
    }
  },

  async listExpenseInvoices(
    scope: ScopeContext,
    query: { centerId?: number; status?: ExpenseInvoiceStatus; supplierId?: number }
  ) {
    financeV2Domain.assertReadEnabled();
    financeV2Domain.assertCanRead(scope);
    const centerWhere = resolveExpenseInvoiceCenterWhere(scope, query.centerId);

    const invoices = await prisma.expenseInvoice.findMany({
      where: {
        organizationId: scope.organizationId,
        ...centerWhere,
        ...(query.status ? { status: query.status } : {}),
        ...(query.supplierId ? { supplierId: query.supplierId } : {})
      },
      include: {
        supplier: true,
        category: true,
        center: { select: { id: true, name: true } },
        payments: { select: { amount: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return invoices.map(({ payments, ...invoice }) => {
      const paidAmount = payments.reduce(
        (sum, payment) => sum.plus(payment.amount),
        new Prisma.Decimal(0)
      );
      return normalize({
        ...invoice,
        paidAmount,
        remainingAmount: Prisma.Decimal.max(new Prisma.Decimal(0), invoice.amount.minus(paidAmount))
      });
    });
  },

  async createExpenseInvoice(
    scope: ScopeContext,
    input: {
      centerId?: number;
      supplierId?: number;
      categoryId: number;
      invoiceNo?: string;
      invoiceDate: string;
      dueDate?: string;
      description: string;
      amount: number;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);
    const invoiceDate = toDateOnly(safeDate(input.invoiceDate, "invoiceDate"));
    const invoiceNo = input.invoiceNo?.trim() || undefined;
    financeV2Domain.ensureScopedCenterRequired(scope, input.centerId);

    return prisma.$transaction(async (tx) => {
      await accountingService.ensurePeriodOpenTx(tx, scope.organizationId, invoiceDate);

      if (input.centerId) {
        const center = await tx.center.findFirst({
          where: { id: input.centerId, organizationId: scope.organizationId, isActive: true },
          select: { id: true }
        });
        if (!center) {
          throw new AppError(
            "Center not found",
            404,
            undefined,
            "ENTITY_NOT_FOUND",
            { ar: "المركز غير موجود", en: "Center not found" }
          );
        }
      }

      const category = await tx.expenseCategory.findFirst({
        where: { id: input.categoryId, organizationId: scope.organizationId, isActive: true },
        select: { id: true }
      });
      if (!category) {
        throw new AppError(
          "Expense category not found",
          404,
          undefined,
          "ENTITY_NOT_FOUND",
          { ar: "تصنيف المصروف غير موجود", en: "Expense category not found" }
        );
      }

      if (input.supplierId) {
        const supplier = await tx.supplier.findFirst({
          where: { id: input.supplierId, organizationId: scope.organizationId, isActive: true },
          select: { id: true }
        });
        if (!supplier) {
          throw new AppError(
            "Supplier not found",
            404,
            undefined,
            "ENTITY_NOT_FOUND",
            { ar: "المورد غير موجود", en: "Supplier not found" }
          );
        }
      }

      if (invoiceNo && input.supplierId) {
        const duplicate = await tx.expenseInvoice.findFirst({
          where: {
            organizationId: scope.organizationId,
            supplierId: input.supplierId,
            invoiceNo
          },
          select: { id: true }
        });
        if (duplicate) {
          throw new AppError(
            "Invoice number already exists for this supplier",
            409,
            undefined,
            "DUPLICATE_EXPENSE_INVOICE",
            {
              ar: "رقم الفاتورة مسجل مسبقاً لهذا المورد",
              en: "Invoice number already exists for this supplier"
            }
          );
        }
      }

      return tx.expenseInvoice.create({
        data: {
          organizationId: scope.organizationId,
          centerId: input.centerId,
          supplierId: input.supplierId,
          categoryId: input.categoryId,
          invoiceNo: invoiceNo ?? `EXP-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-6)}`,
          invoiceDate,
          dueDate: input.dueDate ? toDateOnly(safeDate(input.dueDate, "dueDate")) : null,
          description: input.description.trim(),
          amount: new Prisma.Decimal(input.amount),
          status: ExpenseInvoiceStatus.DRAFT
        }
      });
    });
  },

  async approveExpenseInvoice(scope: ScopeContext, id: number) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanApprove(scope);
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.expenseInvoice.findUnique({
        where: { id },
        include: { category: true }
      });

      if (!invoice || invoice.organizationId !== scope.organizationId) {
        throw new AppError("الفاتورة غير موجودة", 404);
      }
      ensureExpenseInvoiceScope(scope, invoice);

      const existingEntry = await tx.journalEntry.findFirst({
        where: {
          organizationId: scope.organizationId,
          sourceType: JournalSourceType.EXPENSE_INVOICE,
          sourceId: id
        }
      });
      if (existingEntry) {
        throw new AppError(
          "الفاتورة معتمدة مسبقاً",
          409,
          undefined,
          "ALREADY_APPROVED",
          { ar: "الفاتورة معتمدة مسبقاً", en: "Invoice already approved" }
        );
      }

      if (invoice.status !== ExpenseInvoiceStatus.DRAFT && invoice.status !== ExpenseInvoiceStatus.PENDING_APPROVAL) {
        throw new AppError(
          "الفاتورة معتمدة مسبقاً",
          409,
          undefined,
          "ALREADY_APPROVED",
          { ar: "الفاتورة معتمدة مسبقاً", en: "Invoice already approved" }
        );
      }

      const fiscalPeriod = await ensurePeriodOpenTx(tx, scope.organizationId, invoice.invoiceDate);

      if (!invoice.category.isActive || !invoice.category.accountingAccountId) {
        throw new AppError(
          "Expense category is not linked to a posting expense account",
          409,
          undefined,
          "ACCOUNTING_MAPPING_MISSING",
          {
            ar: "لا يمكن اعتماد الفاتورة لأن تصنيف المصروف غير مربوط بحساب محاسبي. يرجى ربط التصنيف بحساب مصروفات أولاً.",
            en: "Cannot approve the invoice because the expense category is not linked to an accounting account. Please link the category to an expense account first."
          }
        );
      }

      const categoryAccount = await tx.accountingAccount.findFirst({
        where: {
          id: invoice.category.accountingAccountId,
          organizationId: scope.organizationId,
          type: AccountingAccountType.EXPENSE,
          isActive: true,
          children: { none: { isActive: true } }
        }
      });
      if (!categoryAccount) {
        throw new AppError(
          "Expense category is not linked to a posting expense account",
          409,
          undefined,
          "ACCOUNTING_MAPPING_MISSING",
          {
            ar: "لا يمكن اعتماد الفاتورة لأن تصنيف المصروف غير مربوط بحساب محاسبي. يرجى ربط التصنيف بحساب مصروفات أولاً.",
            en: "Cannot approve the invoice because the expense category is not linked to an accounting account. Please link the category to an expense account first."
          }
        );
      }

      const apAccount = await findPostingAccountsPayableTx(tx, scope.organizationId);
      if (!apAccount) {
        throw new AppError(
          "Accounts payable posting account is missing",
          409,
          undefined,
          "ACCOUNTING_MAPPING_MISSING",
          {
            ar: "حساب الدائنون غير موجود لترحيل فاتورة المصروف",
            en: "Accounts payable posting account is missing"
          }
        );
      }

      const entry = await tx.journalEntry.create({
        data: {
          organizationId: scope.organizationId,
          centerId: invoice.centerId,
          entryNo: `EXP-${invoice.id}`,
          entryDate: invoice.invoiceDate,
          sourceType: JournalSourceType.EXPENSE_INVOICE,
          sourceId: invoice.id,
          status: JournalEntryStatus.POSTED,
          fiscalPeriodId: fiscalPeriod?.id ?? null,
          description: invoice.description,
          postedById: scope.userId,
          postedAt: new Date()
        }
      });

      await tx.journalEntryLine.createMany({
        data: [
          {
            organizationId: scope.organizationId,
            journalEntryId: entry.id,
            accountId: categoryAccount.id,
            centerId: invoice.centerId,
            debit: invoice.amount,
            credit: new Prisma.Decimal(0),
            memo: invoice.description,
            sourceLineType: JournalSourceType.EXPENSE_INVOICE,
            sourceLineId: invoice.id
          },
          {
            organizationId: scope.organizationId,
            journalEntryId: entry.id,
            accountId: apAccount.id,
            centerId: invoice.centerId,
            debit: new Prisma.Decimal(0),
            credit: invoice.amount,
            memo: `AP for invoice ${invoice.id}`,
            sourceLineType: JournalSourceType.EXPENSE_INVOICE,
            sourceLineId: invoice.id
          }
        ]
      });

      const approvedInvoice = await tx.expenseInvoice.update({
        where: { id },
        data: {
          status: ExpenseInvoiceStatus.APPROVED,
          approvedById: scope.userId,
          approvedAt: new Date()
        }
      });

      await addAudit({
        scope,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.EXPENSE_INVOICE,
        entityId: approvedInvoice.id,
        centerId: approvedInvoice.centerId,
        summary: "تم اعتماد فاتورة مصروف"
      });

      return approvedInvoice;
    });
  },

  async payExpenseInvoice(
    scope: ScopeContext,
    id: number,
    input: { amount: number; financeAccountId: number; notes?: string }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanExecute(scope);
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.expenseInvoice.findUnique({
        where: { id }
      });

      if (!invoice || invoice.organizationId !== scope.organizationId) {
        throw new AppError("الفاتورة غير موجودة", 404);
      }
      ensureExpenseInvoiceScope(scope, invoice);

      if (invoice.status !== ExpenseInvoiceStatus.APPROVED && invoice.status !== ExpenseInvoiceStatus.PARTIALLY_PAID) {
        throw new AppError("الفاتورة يجب أن تكون معتمدة للدفع", 400);
      }

      const paymentAmount = new Prisma.Decimal(input.amount);
      const paidAt = new Date();
      if (paymentAmount.lte(0)) {
        throw new AppError("مبلغ الدفع يجب أن يكون أكبر من صفر", 400);
      }

      const existingPayments = await tx.expensePayment.aggregate({
        where: { invoiceId: invoice.id },
        _sum: { amount: true }
      });
      const alreadyPaid = existingPayments._sum.amount || new Prisma.Decimal(0);
      const remainingAmount = invoice.amount.minus(alreadyPaid);
      if (paymentAmount.gt(remainingAmount)) {
        throw new AppError("الدفعة تتجاوز الرصيد المتبقي للفاتورة", 409, {
          invoiceId: invoice.id,
          remainingAmount: remainingAmount.toFixed(2),
          paymentAmount: paymentAmount.toFixed(2)
        }, "PAYMENT_OVER_REMAINING");
      }

      await accountingService.ensurePeriodOpenTx(tx, scope.organizationId, paidAt);

      const financeAccount = await tx.financeAccount.findFirst({
        where: {
          id: input.financeAccountId,
          organizationId: scope.organizationId,
          isActive: true
        },
        include: {
          accountingAccount: true
        }
      });

      if (!financeAccount) {
        throw new AppError("الحساب المالي غير موجود", 404, undefined, "ENTITY_NOT_FOUND");
      }
      ensureFinanceAccountScope(scope, financeAccount);

      if (
        !financeAccount.accountingAccountId ||
        !financeAccount.accountingAccount ||
        !financeAccount.accountingAccount.isActive ||
        financeAccount.accountingAccount.organizationId !== scope.organizationId ||
        financeAccount.accountingAccount.type !== AccountingAccountType.ASSET ||
        (await tx.accountingAccount.count({
          where: {
            organizationId: scope.organizationId,
            parentId: financeAccount.accountingAccount.id,
            isActive: true
          }
        })) > 0
      ) {
        throw new AppError(
          "لا يمكن دفع الفاتورة لأن الصندوق أو الحساب المالي غير مربوط بحساب محاسبي من نوع أصل",
          409,
          { financeAccountId: financeAccount.id, expectedType: AccountingAccountType.ASSET },
          "FINANCE_ACCOUNT_LEDGER_MAPPING_MISSING"
        );
      }

      // Read the effective financial policy to honour allowOverdraft setting
      // (same pattern as payroll.service.ts and rewards.service.ts)
      const policy = await getEffectivePolicyTx(tx, {
        organizationId: scope.organizationId,
        centerId: invoice.centerId
      });

      // Create Finance Voucher (Disbursement)
      const voucherNo = await nextVoucherNoTx(tx, "DV", scope.organizationId);
      const voucher = await tx.financeVoucher.create({
        data: {
          organizationId: scope.organizationId,
          centerId: invoice.centerId,
          accountId: input.financeAccountId,
          voucherType: VoucherType.DISBURSEMENT,
          sourceType: VoucherSourceType.EXPENSE,
          voucherNo,
          voucherDate: paidAt,
          amount: paymentAmount,
          status: VoucherStatus.APPROVED,
          accountingCategory: VoucherAccountingCategory.OPERATING_EXPENSE,
          createdById: scope.userId,
          approvedById: scope.userId
        }
      });

      await postVoucherTx(tx, {
        voucherId: voucher.id,
        postedById: scope.userId,
        movementType: FinanceMovementType.VOUCHER_DISBURSEMENT,
        allowOverdraft: policy.allowOverdraft
      });

      // Create Payment Record
      const payment = await tx.expensePayment.create({
        data: {
          organizationId: scope.organizationId,
          invoiceId: invoice.id,
          amount: paymentAmount,
          paidAt,
          financeAccountId: input.financeAccountId,
          voucherId: voucher.id,
          notes: input.notes
        }
      });

      // Update Invoice Status
      const totalPaid = alreadyPaid.plus(paymentAmount);
      const newStatus = totalPaid.gte(invoice.amount) ? ExpenseInvoiceStatus.PAID : ExpenseInvoiceStatus.PARTIALLY_PAID;

      await tx.expenseInvoice.update({
        where: { id },
        data: { status: newStatus }
      });

      await addAudit({
        scope,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.EXPENSE_INVOICE,
        entityId: invoice.id,
        centerId: invoice.centerId,
        summary: "تم دفع فاتورة مصروف"
      });

      await accountingService.postExpensePaymentSettlementJournalEntryTx(tx, scope, {
        expensePaymentId: payment.id,
        voucherId: voucher.id,
        postedById: scope.userId
      });

      return payment;
    });
  },

  async cancelExpenseInvoice(scope: ScopeContext, id: number, reason?: string) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.expenseInvoice.findUnique({
        where: { id },
        include: { category: true }
      });

      if (!invoice || invoice.organizationId !== scope.organizationId) {
        throw new AppError("الفاتورة غير موجودة", 404);
      }
      ensureExpenseInvoiceScope(scope, invoice);

      if (invoice.status === ExpenseInvoiceStatus.PAID || invoice.status === ExpenseInvoiceStatus.PARTIALLY_PAID) {
        throw new AppError(
          "لا يمكن إلغاء فاتورة مدفوعة أو مدفوعة جزئياً",
          400,
          undefined,
          "CANNOT_CANCEL_PAID_INVOICE",
          { ar: "لا يمكن إلغاء فاتورة مدفوعة أو مدفوعة جزئياً. يجب إلغاء المدفوعات أولاً.", en: "Cannot cancel a paid or partially paid invoice" }
        );
      }

      if (invoice.status === ExpenseInvoiceStatus.VOIDED) {
        throw new AppError(
          "الفاتورة ملغاة مسبقاً",
          409,
          undefined,
          "ALREADY_VOIDED",
          { ar: "الفاتورة ملغاة مسبقاً", en: "Invoice already voided" }
        );
      }

      if (invoice.status === ExpenseInvoiceStatus.DRAFT) {
        const voided = await tx.expenseInvoice.update({
          where: { id },
          data: {
            status: ExpenseInvoiceStatus.VOIDED,
            cancelledById: scope.userId,
            cancelledAt: new Date(),
            cancelReason: reason?.trim() || null
          }
        });
        await addAudit({
          scope,
          action: AuditAction.UPDATE,
          entityType: AuditEntityType.EXPENSE_INVOICE,
          entityId: id,
          centerId: invoice.centerId,
          summary: "تم إلغاء فاتورة مصروف (مسودة)"
        });
        return voided;
      }

      if (invoice.status === ExpenseInvoiceStatus.APPROVED) {
        const fiscalPeriod = await ensurePeriodOpenTx(tx, scope.organizationId, new Date());

        const originalEntry = await tx.journalEntry.findFirst({
          where: {
            organizationId: scope.organizationId,
            sourceType: JournalSourceType.EXPENSE_INVOICE,
            sourceId: id,
            status: JournalEntryStatus.POSTED
          },
          include: { lines: true }
        });

        if (originalEntry) {
          const reversalEntry = await tx.journalEntry.create({
            data: {
              organizationId: scope.organizationId,
              centerId: invoice.centerId,
              entryNo: `EXP-CXL-${id}`,
              entryDate: new Date(),
              sourceType: JournalSourceType.EXPENSE_INVOICE,
              sourceId: -id,
              status: JournalEntryStatus.POSTED,
              fiscalPeriodId: fiscalPeriod?.id ?? null,
              description: `إلغاء فاتورة مصروف ${id}${reason ? ` - ${reason}` : ""}`,
              postedById: scope.userId,
              postedAt: new Date()
            }
          });

          await tx.journalEntryLine.createMany({
            data: originalEntry.lines.map((line) => ({
              organizationId: scope.organizationId,
              journalEntryId: reversalEntry.id,
              accountId: line.accountId,
              centerId: line.centerId,
              debit: line.credit,
              credit: line.debit,
              memo: `عكس: ${line.memo || ""}`.trim(),
              sourceLineType: JournalSourceType.EXPENSE_INVOICE,
              sourceLineId: id
            }))
          });
        }

        const voided = await tx.expenseInvoice.update({
          where: { id },
          data: {
            status: ExpenseInvoiceStatus.VOIDED,
            cancelledById: scope.userId,
            cancelledAt: new Date(),
            cancelReason: reason?.trim() || null
          }
        });

        await addAudit({
          scope,
          action: AuditAction.UPDATE,
          entityType: AuditEntityType.EXPENSE_INVOICE,
          entityId: id,
          centerId: invoice.centerId,
          summary: "تم إلغاء فاتورة مصروف (معتمدة)"
        });

        return voided;
      }

      throw new AppError(
        "لا يمكن إلغاء الفاتورة في حالتها الحالية",
        400,
        undefined,
        "INVALID_STATUS",
        { ar: `لا يمكن إلغاء الفاتورة في حالتها الحالية: ${invoice.status}`, en: `Cannot cancel invoice in status: ${invoice.status}` }
      );
    });
  },

  async updateSupplier(
    scope: ScopeContext,
    id: number,
    input: { name?: string; phone?: string; address?: string; notes?: string; isActive?: boolean }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);
    const supplier = await prisma.supplier.findFirst({
      where: { id, organizationId: scope.organizationId }
    });
    if (!supplier) {
      throw new AppError("المورد غير موجود", 404);
    }
    try {
      return await prisma.supplier.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
          ...(input.address !== undefined ? { address: input.address?.trim() || null } : {}),
          ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
        }
      });
    } catch (error) {
      if (isKnownPrismaError(error) && error.code === "P2002") {
        throw new AppError(
          "Supplier already exists",
          409,
          undefined,
          "DUPLICATE_SUPPLIER",
          { ar: "المورد موجود مسبقاً", en: "Supplier already exists" }
        );
      }
      throw error;
    }
  },

  async updateExpenseCategory(
    scope: ScopeContext,
    id: number,
    input: { name?: string; type?: string; accountingAccountId?: number | null; isActive?: boolean }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanManageSettings(scope);
    const category = await prisma.expenseCategory.findFirst({
      where: { id, organizationId: scope.organizationId }
    });
    if (!category) {
      throw new AppError("تصنيف المصروف غير موجود", 404);
    }

    if (input.accountingAccountId) {
      const account = await prisma.accountingAccount.findFirst({
        where: {
          id: input.accountingAccountId,
          organizationId: scope.organizationId,
          type: AccountingAccountType.EXPENSE,
          isActive: true,
          children: { none: { isActive: true } }
        }
      });
      if (!account) {
        throw new AppError("حساب ترحيل المصروفات غير موجود", 404);
      }
    }

    try {
      return await prisma.expenseCategory.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.type !== undefined ? { type: input.type?.trim() || null } : {}),
          ...(input.accountingAccountId !== undefined ? { accountingAccountId: input.accountingAccountId } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
        }
      });
    } catch (error) {
      if (isKnownPrismaError(error) && error.code === "P2002") {
        throw new AppError(
          "Expense category already exists",
          409,
          undefined,
          "DUPLICATE_EXPENSE_CATEGORY",
          { ar: "تصنيف المصروف موجود مسبقاً", en: "Expense category already exists" }
        );
      }
      throw error;
    }
  },

  async deleteSupplier(scope: ScopeContext, id: number) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanManageSettings(scope);
    const supplier = await prisma.supplier.findFirst({
      where: { id, organizationId: scope.organizationId }
    });
    if (!supplier) throw new AppError("المورد غير موجود", 404);

    const invoiceCount = await prisma.expenseInvoice.count({
      where: { supplierId: id }
    });
    if (invoiceCount > 0) {
      throw new AppError(
        "لا يمكن حذف المورد لارتباطه بفواتير، يمكنك تعطيله بدلاً من ذلك",
        400,
        undefined,
        "SUPPLIER_HAS_INVOICES",
        {
          ar: "لا يمكن حذف المورد لأنه مرتبط بفواتير مصروفات. يمكنك تعطيله بدلاً من الحذف.",
          en: "Cannot delete supplier because it is linked to expense invoices. You can disable it instead."
        }
      );
    }
    await prisma.supplier.delete({ where: { id } });
  },

  async deleteExpenseCategory(scope: ScopeContext, id: number) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanManageSettings(scope);
    const category = await prisma.expenseCategory.findFirst({
      where: { id, organizationId: scope.organizationId }
    });
    if (!category) throw new AppError("التصنيف غير موجود", 404);

    const invoiceCount = await prisma.expenseInvoice.count({
      where: { categoryId: id }
    });
    if (invoiceCount > 0) {
      throw new AppError(
        "لا يمكن حذف التصنيف لارتباطه بفواتير",
        400,
        undefined,
        "CATEGORY_HAS_INVOICES",
        {
          ar: "لا يمكن حذف التصنيف لأنه مرتبط بفواتير مصروفات. يمكنك تعطيله بدلاً من الحذف.",
          en: "Cannot delete category because it is linked to expense invoices. You can disable it instead."
        }
      );
    }
    await prisma.expenseCategory.delete({ where: { id } });
  },

  async updateExpenseInvoice(
    scope: ScopeContext,
    id: number,
    input: {
      centerId?: number | null;
      supplierId?: number | null;
      categoryId?: number;
      invoiceNo?: string | null;
      invoiceDate?: string;
      dueDate?: string | null;
      description?: string;
      amount?: number;
    }
  ) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    const invoice = await prisma.expenseInvoice.findUnique({
      where: { id }
    });

    if (!invoice || invoice.organizationId !== scope.organizationId) {
      throw new AppError("الفاتورة غير موجودة", 404);
    }
    ensureExpenseInvoiceScope(scope, invoice);

    if (invoice.status !== ExpenseInvoiceStatus.DRAFT) {
      throw new AppError(
        "لا يمكن تعديل الفاتورة إلا إذا كانت في حالة مسودة",
        400,
        undefined,
        "CANNOT_EDIT_NON_DRAFT",
        {
          ar: "لا يمكن تعديل الفاتورة إلا إذا كانت مسودة",
          en: "Invoice can only be edited when in DRAFT status"
        }
      );
    }

    if (input.centerId !== undefined && input.centerId !== null) {
      financeV2Domain.ensureScopedCenterRequired(scope, input.centerId);
    }

    return prisma.expenseInvoice.update({
      where: { id },
      data: {
        ...(input.centerId !== undefined ? { centerId: input.centerId } : {}),
        ...(input.supplierId !== undefined ? { supplierId: input.supplierId } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.invoiceNo !== undefined ? { invoiceNo: input.invoiceNo?.trim() || null } : {}),
        ...(input.invoiceDate !== undefined ? { invoiceDate: toDateOnly(safeDate(input.invoiceDate, "invoiceDate")) } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? toDateOnly(safeDate(input.dueDate, "dueDate")) : null } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() } : {}),
        ...(input.amount !== undefined ? { amount: new Prisma.Decimal(input.amount) } : {})
      }
    });
  },

  async deleteExpenseInvoice(scope: ScopeContext, id: number) {
    financeV2Domain.assertWriteEnabled();
    financeV2Domain.assertCanWrite(scope);

    const invoice = await prisma.expenseInvoice.findUnique({
      where: { id }
    });

    if (!invoice || invoice.organizationId !== scope.organizationId) {
      throw new AppError("الفاتورة غير موجودة", 404);
    }
    ensureExpenseInvoiceScope(scope, invoice);

    if (invoice.status !== ExpenseInvoiceStatus.DRAFT) {
      throw new AppError(
        "لا يمكن حذف الفاتورة إلا إذا كانت مسودة",
        400,
        undefined,
        "CANNOT_DELETE_NON_DRAFT",
        {
          ar: "لا يمكن حذف الفاتورة إلا إذا كانت مسودة. للفواتير الأخرى، استخدم الإلغاء.",
          en: "Invoice can only be deleted when in DRAFT status. For other statuses, use cancel."
        }
      );
    }

    await prisma.expenseInvoice.delete({ where: { id } });
  }
};
