import { ExpenseInvoiceStatus, FiscalPeriodStatus, JournalSourceType } from "@prisma/client";
import { expensesService } from "./services/expenses.service";
import { financeReportsService } from "./services/finance-reports.service";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";
import { TAIZ_FINANCE_FIXTURE } from "../../test/finance/fixtures/taiz-finance.fixture";

describe("expense workflow integration", () => {
  beforeEach(resetFinanceTestDatabase);
  afterAll(() => financeTestPrisma.$disconnect());

  test("accrues, partially settles, fully settles, and prevents duplicate payment", async () => {
    const context = await createTaizFinanceContext();
    const supplier = await expensesService.createSupplier(context.scopes.manager, {
      name: TAIZ_FINANCE_FIXTURE.suppliers[0],
      address: "تعز - شارع جمال"
    });
    const operating = context.accounts.bySystemKey.get("OPERATING_EXPENSES")!;
    const category = await expensesService.createExpenseCategory(context.scopes.manager, {
      name: "كهرباء وتشغيل",
      type: "OPERATING",
      accountingAccountId: operating.id
    });
    const invoice = await expensesService.createExpenseInvoice(context.scopes.manager, {
      centerId: context.centers[0].id,
      supplierId: supplier.id,
      categoryId: category.id,
      invoiceNo: "TEST-EXP-001",
      invoiceDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
      description: "فاتورة كهرباء تشغيلية اختبارية",
      amount: 90000
    });

    const approved = await expensesService.approveExpenseInvoice(context.scopes.manager, invoice.id);
    expect(approved.status).toBe(ExpenseInvoiceStatus.APPROVED);
    const accrual = await financeTestPrisma.journalEntry.findFirstOrThrow({
      where: { sourceType: JournalSourceType.EXPENSE_INVOICE, sourceId: invoice.id },
      include: { lines: true }
    });
    expect(accrual.lines.reduce((sum, line) => sum + line.debit.toNumber(), 0)).toBe(90000);
    expect(accrual.lines.reduce((sum, line) => sum + line.credit.toNumber(), 0)).toBe(90000);

    await expensesService.payExpenseInvoice(context.scopes.manager, invoice.id, {
      amount: 30000,
      financeAccountId: context.accounts.centerFund.id
    });
    expect((await financeTestPrisma.expenseInvoice.findUniqueOrThrow({ where: { id: invoice.id } })).status).toBe(
      ExpenseInvoiceStatus.PARTIALLY_PAID
    );
    await expensesService.payExpenseInvoice(context.scopes.manager, invoice.id, {
      amount: 60000,
      financeAccountId: context.accounts.centerFund.id
    });
    expect((await financeTestPrisma.expenseInvoice.findUniqueOrThrow({ where: { id: invoice.id } })).status).toBe(
      ExpenseInvoiceStatus.PAID
    );
    await expect(
      expensesService.payExpenseInvoice(context.scopes.manager, invoice.id, {
        amount: 1,
        financeAccountId: context.accounts.centerFund.id
      })
    ).rejects.toThrow();

    expect(await financeTestPrisma.expensePayment.count({ where: { invoiceId: invoice.id } })).toBe(2);
    expect(await financeTestPrisma.financeAccountMovement.count({ where: { accountId: context.accounts.centerFund.id } })).toBe(2);
    const activities = await financeReportsService.reportStatementOfActivities(context.scopes.auditor, {
      from: "2000-01-01",
      to: "2099-12-31"
    });
    expect(activities.expenses.totalExpenses).toBe(90000);
  });

  test("rejects payment while the covering fiscal period is closed", async () => {
    const context = await createTaizFinanceContext();
    const category = await expensesService.createExpenseCategory(context.scopes.manager, {
      name: "صيانة",
      accountingAccountId: context.accounts.bySystemKey.get("OPERATING_EXPENSES")!.id
    });
    const invoice = await expensesService.createExpenseInvoice(context.scopes.manager, {
      centerId: context.centers[0].id,
      categoryId: category.id,
      invoiceDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
      description: "صيانة اختبارية",
      amount: 10000
    });
    await expensesService.approveExpenseInvoice(context.scopes.manager, invoice.id);
    await financeTestPrisma.fiscalPeriod.update({
      where: { id: context.periods.openPeriod.id },
      data: { status: FiscalPeriodStatus.CLOSED }
    });

    await expect(
      expensesService.payExpenseInvoice(context.scopes.manager, invoice.id, {
        amount: 10000,
        financeAccountId: context.accounts.centerFund.id
      })
    ).rejects.toMatchObject({ code: "FISCAL_PERIOD_CLOSED" });
    expect(await financeTestPrisma.expensePayment.count({ where: { invoiceId: invoice.id } })).toBe(0);
  });
});

