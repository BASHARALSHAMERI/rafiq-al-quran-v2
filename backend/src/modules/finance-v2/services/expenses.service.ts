import {
  AccountingAccountType,
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
import type { ScopeContext } from "../../../shared/types/auth.types";
import { accountingService } from "../../accounting/accounting.service";
import { nextVoucherNoTx, postVoucherTx } from "../finance-v2.internal";

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

export const expensesService = {
  async listSuppliers(scope: ScopeContext) {
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
    const supplier = await prisma.supplier.create({
      data: {
        organizationId: scope.organizationId,
        name: input.name,
        phone: input.phone,
        address: input.address,
        notes: input.notes
      }
    });
    return supplier;
  },

  async listExpenseCategories(scope: ScopeContext) {
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
        throw new AppError("Expense posting account not found", 404);
      }
    }

    const category = await prisma.expenseCategory.create({
      data: {
        organizationId: scope.organizationId,
        name: input.name,
        type: input.type,
        accountingAccountId: input.accountingAccountId
      }
    });
    return category;
  },

  async listExpenseInvoices(
    scope: ScopeContext,
    query: { centerId?: number; status?: ExpenseInvoiceStatus; supplierId?: number }
  ) {
    const invoices = await prisma.expenseInvoice.findMany({
      where: {
        organizationId: scope.organizationId,
        ...(query.centerId ? { centerId: query.centerId } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.supplierId ? { supplierId: query.supplierId } : {})
      },
      include: {
        supplier: true,
        category: true,
        center: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return invoices;
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
    const invoiceDate = new Date(input.invoiceDate);
    
    // Check if period open
    await prisma.$transaction(async (tx) => {
      await accountingService.ensurePeriodOpenTx(tx, scope.organizationId, invoiceDate);
    });

    const invoice = await prisma.expenseInvoice.create({
      data: {
        organizationId: scope.organizationId,
        centerId: input.centerId,
        supplierId: input.supplierId,
        categoryId: input.categoryId,
        invoiceNo: input.invoiceNo,
        invoiceDate,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        description: input.description,
        amount: new Prisma.Decimal(input.amount),
        status: ExpenseInvoiceStatus.DRAFT
      }
    });
    return invoice;
  },

  async approveExpenseInvoice(scope: ScopeContext, id: number) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.expenseInvoice.findUnique({
        where: { id },
        include: { category: true }
      });

      if (!invoice || invoice.organizationId !== scope.organizationId) {
        throw new AppError("Invoice not found", 404);
      }
      if (invoice.status !== ExpenseInvoiceStatus.DRAFT && invoice.status !== ExpenseInvoiceStatus.PENDING_APPROVAL) {
        throw new AppError("Only DRAFT/PENDING invoices can be approved", 400);
      }

      await accountingService.ensurePeriodOpenTx(tx, scope.organizationId, invoice.invoiceDate);

      const approvedInvoice = await tx.expenseInvoice.update({
        where: { id },
        data: {
          status: ExpenseInvoiceStatus.APPROVED,
          approvedById: scope.userId,
          approvedAt: new Date()
        }
      });

      // TODO: Add audit log for EXPENSE_INVOICE approval (AUDIT-TRAIL-FINANCE-1)

      // Post AP Journal Entry if accounting category exists
      if (invoice.category.accountingAccountId) {
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
          throw new AppError("Expense category is not linked to a posting expense account", 409);
        }

        // Find AP Account
        const apAccount = await findPostingAccountsPayableTx(tx, scope.organizationId);

        if (apAccount) {
          const entry = await tx.journalEntry.create({
            data: {
              organizationId: scope.organizationId,
              centerId: invoice.centerId,
              entryNo: `EXP-${invoice.id}`,
              entryDate: invoice.invoiceDate,
              sourceType: JournalSourceType.EXPENSE_INVOICE,
              sourceId: invoice.id,
              status: JournalEntryStatus.POSTED,
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
                accountId: invoice.category.accountingAccountId,
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
        }
      }

      return approvedInvoice;
    });
  },

  async payExpenseInvoice(
    scope: ScopeContext,
    id: number,
    input: { amount: number; financeAccountId: number; notes?: string }
  ) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.expenseInvoice.findUnique({
        where: { id }
      });

      if (!invoice || invoice.organizationId !== scope.organizationId) {
        throw new AppError("Invoice not found", 404);
      }
      if (invoice.status !== ExpenseInvoiceStatus.APPROVED && invoice.status !== ExpenseInvoiceStatus.PARTIALLY_PAID) {
        throw new AppError("Invoice must be approved to be paid", 400);
      }

      const paymentAmount = new Prisma.Decimal(input.amount);
      const paidAt = new Date();
      if (paymentAmount.lte(0)) {
        throw new AppError("Payment amount must be greater than zero", 400);
      }

      const existingPayments = await tx.expensePayment.aggregate({
        where: { invoiceId: invoice.id },
        _sum: { amount: true }
      });
      const alreadyPaid = existingPayments._sum.amount || new Prisma.Decimal(0);
      const remainingAmount = invoice.amount.minus(alreadyPaid);
      if (paymentAmount.gt(remainingAmount)) {
        throw new AppError("Payment exceeds expense invoice remaining balance", 409, {
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
        throw new AppError("Finance account not found", 404, undefined, "ENTITY_NOT_FOUND");
      }

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
          "Finance account is not linked to an active posting asset ledger account",
          409,
          { financeAccountId: financeAccount.id, expectedType: AccountingAccountType.ASSET },
          "FINANCE_ACCOUNT_LEDGER_MAPPING_MISSING"
        );
      }

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
        allowOverdraft: false
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

      // TODO: Add audit log for EXPENSE_INVOICE payment (AUDIT-TRAIL-FINANCE-1)

      // Create AP Payment Journal Entry
      const apAccount = await findPostingAccountsPayableTx(tx, scope.organizationId);

      const creditAccountId = financeAccount.accountingAccountId;

      if (apAccount && creditAccountId) {
        const entry = await tx.journalEntry.create({
          data: {
            organizationId: scope.organizationId,
            centerId: invoice.centerId,
            entryNo: `PAY-EXP-${payment.id}`,
            entryDate: paidAt,
            sourceType: JournalSourceType.EXPENSE_PAYMENT,
            sourceId: payment.id,
            status: JournalEntryStatus.POSTED,
            description: `Payment for expense invoice ${invoice.id}`,
            postedById: scope.userId,
            postedAt: new Date()
          }
        });

        await tx.journalEntryLine.createMany({
          data: [
            {
              organizationId: scope.organizationId,
              journalEntryId: entry.id,
              accountId: apAccount.id,
              centerId: invoice.centerId,
              debit: paymentAmount,
              credit: new Prisma.Decimal(0),
              memo: `AP settlement for invoice ${invoice.id}`,
              sourceLineType: JournalSourceType.EXPENSE_PAYMENT,
              sourceLineId: payment.id
            },
            {
              organizationId: scope.organizationId,
              journalEntryId: entry.id,
              accountId: creditAccountId,
              centerId: invoice.centerId,
              debit: new Prisma.Decimal(0),
              credit: paymentAmount,
              memo: `Cash payment for invoice ${invoice.id}`,
              sourceLineType: JournalSourceType.EXPENSE_PAYMENT,
              sourceLineId: payment.id
            }
          ]
        });

        await tx.expensePayment.update({
          where: { id: payment.id },
          data: { journalEntryId: entry.id }
        });
      }

      return payment;
    });
  }
};
