import { AccountingAccountType, ExpenseInvoiceStatus, FiscalPeriodStatus, JournalSourceType } from "@prisma/client";
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

    await expensesService.payExpenseInvoice(context.scopes.treasurer, invoice.id, {
      amount: 30000,
      financeAccountId: context.accounts.centerFund.id
    });
    expect((await financeTestPrisma.expenseInvoice.findUniqueOrThrow({ where: { id: invoice.id } })).status).toBe(
      ExpenseInvoiceStatus.PARTIALLY_PAID
    );
    const partiallyPaidInvoice = (await expensesService.listExpenseInvoices(context.scopes.manager, {}))
      .find((row) => row.id === invoice.id);
    expect(partiallyPaidInvoice).toMatchObject({ paidAmount: 30000, remainingAmount: 60000 });
    await expensesService.payExpenseInvoice(context.scopes.treasurer, invoice.id, {
      amount: 60000,
      financeAccountId: context.accounts.centerFund.id
    });
    expect((await financeTestPrisma.expenseInvoice.findUniqueOrThrow({ where: { id: invoice.id } })).status).toBe(
      ExpenseInvoiceStatus.PAID
    );
    await expect(
      expensesService.payExpenseInvoice(context.scopes.treasurer, invoice.id, {
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
      expensesService.payExpenseInvoice(context.scopes.treasurer, invoice.id, {
        amount: 10000,
        financeAccountId: context.accounts.centerFund.id
      })
    ).rejects.toMatchObject({ code: "FISCAL_PERIOD_CLOSED" });
    expect(await financeTestPrisma.expensePayment.count({ where: { invoiceId: invoice.id } })).toBe(0);
  });
  test("rejects suppliers and categories that belong to another organization", async () => {
    const context = await createTaizFinanceContext();
    const otherOrganization = await financeTestPrisma.organization.create({
      data: { name: "منظمة اختبار أخرى", code: "expense-other-org" }
    });
    const foreignSupplier = await financeTestPrisma.supplier.create({
      data: { organizationId: otherOrganization.id, name: "مورد خارجي" }
    });
    const foreignCategory = await financeTestPrisma.expenseCategory.create({
      data: { organizationId: otherOrganization.id, name: "تصنيف خارجي" }
    });
    const localCategory = await expensesService.createExpenseCategory(context.scopes.manager, {
      name: "تصنيف محلي"
    });

    await expect(
      expensesService.createExpenseInvoice(context.scopes.manager, {
        centerId: context.centers[0].id,
        supplierId: foreignSupplier.id,
        categoryId: localCategory.id,
        invoiceDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
        description: "فاتورة بمورد من منظمة أخرى",
        amount: 1000
      })
    ).rejects.toMatchObject({ code: "ENTITY_NOT_FOUND" });

    await expect(
      expensesService.createExpenseInvoice(context.scopes.manager, {
        centerId: context.centers[0].id,
        categoryId: foreignCategory.id,
        invoiceDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
        description: "فاتورة بتصنيف من منظمة أخرى",
        amount: 1000
      })
    ).rejects.toMatchObject({ code: "ENTITY_NOT_FOUND" });

    expect(await financeTestPrisma.expenseInvoice.count()).toBe(0);
  });

  test("keeps an invoice in draft when its category has no posting account", async () => {
    const context = await createTaizFinanceContext();
    const category = await expensesService.createExpenseCategory(context.scopes.manager, {
      name: "تصنيف بلا حساب"
    });
    const invoice = await expensesService.createExpenseInvoice(context.scopes.manager, {
      centerId: context.centers[0].id,
      categoryId: category.id,
      invoiceDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
      description: "فاتورة لا يجب اعتمادها",
      amount: 5000
    });

    await expect(
      expensesService.approveExpenseInvoice(context.scopes.manager, invoice.id)
    ).rejects.toMatchObject({ code: "ACCOUNTING_MAPPING_MISSING" });

    expect((await financeTestPrisma.expenseInvoice.findUniqueOrThrow({ where: { id: invoice.id } })).status)
      .toBe(ExpenseInvoiceStatus.DRAFT);
    expect(await financeTestPrisma.journalEntry.count({
      where: { sourceType: JournalSourceType.EXPENSE_INVOICE, sourceId: invoice.id }
    })).toBe(0);
  });

  test("rejects trimmed duplicate master data and supplier invoice numbers", async () => {
    const context = await createTaizFinanceContext();
    const supplier = await expensesService.createSupplier(context.scopes.manager, {
      name: "مورد الفواتير"
    });
    await expect(
      expensesService.createSupplier(context.scopes.manager, { name: "  مورد الفواتير  " })
    ).rejects.toMatchObject({ code: "DUPLICATE_SUPPLIER" });

    const category = await expensesService.createExpenseCategory(context.scopes.manager, {
      name: "خدمات تشغيلية",
      accountingAccountId: context.accounts.bySystemKey.get("OPERATING_EXPENSES")!.id
    });
    await expect(
      expensesService.createExpenseCategory(context.scopes.manager, { name: "  خدمات تشغيلية  " })
    ).rejects.toMatchObject({ code: "DUPLICATE_EXPENSE_CATEGORY" });

    await expensesService.createExpenseInvoice(context.scopes.manager, {
      centerId: context.centers[0].id,
      supplierId: supplier.id,
      categoryId: category.id,
      invoiceNo: "SUP-100",
      invoiceDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
      description: "الفاتورة الأصلية",
      amount: 2000
    });
    await expect(
      expensesService.createExpenseInvoice(context.scopes.manager, {
        centerId: context.centers[0].id,
        supplierId: supplier.id,
        categoryId: category.id,
        invoiceNo: "  SUP-100  ",
        invoiceDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
        description: "فاتورة مكررة",
        amount: 2000
      })
    ).rejects.toMatchObject({ code: "DUPLICATE_EXPENSE_INVOICE" });
  });

  test("prevents re-approving an already-approved invoice", async () => {
    const context = await createTaizFinanceContext();
    const category = await expensesService.createExpenseCategory(context.scopes.manager, {
      name: "مصروف تشغيلي",
      accountingAccountId: context.accounts.bySystemKey.get("OPERATING_EXPENSES")!.id
    });
    const invoice = await expensesService.createExpenseInvoice(context.scopes.manager, {
      centerId: context.centers[0].id,
      categoryId: category.id,
      invoiceDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
      description: "فاتورة للاختبار",
      amount: 5000
    });
    await expensesService.approveExpenseInvoice(context.scopes.manager, invoice.id);
    await expect(
      expensesService.approveExpenseInvoice(context.scopes.manager, invoice.id)
    ).rejects.toMatchObject({ code: "ALREADY_APPROVED" });
    const entries = await financeTestPrisma.journalEntry.count({
      where: { sourceType: JournalSourceType.EXPENSE_INVOICE, sourceId: invoice.id }
    });
    expect(entries).toBe(1);
  });

  test("rejects approval when accounts payable account is missing", async () => {
    const context = await createTaizFinanceContext();
    const apAccount = context.accounts.bySystemKey.get("ACCOUNTS_PAYABLE")!;
    await financeTestPrisma.accountingAccount.update({
      where: { id: apAccount.id },
      data: { isActive: false }
    });
    const category = await expensesService.createExpenseCategory(context.scopes.manager, {
      name: "مصروف اختبار",
      accountingAccountId: context.accounts.bySystemKey.get("OPERATING_EXPENSES")!.id
    });
    const invoice = await expensesService.createExpenseInvoice(context.scopes.manager, {
      centerId: context.centers[0].id,
      categoryId: category.id,
      invoiceDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
      description: "فاتورة بدون حساب دائن",
      amount: 3000
    });
    await expect(
      expensesService.approveExpenseInvoice(context.scopes.manager, invoice.id)
    ).rejects.toMatchObject({ code: "ACCOUNTING_MAPPING_MISSING" });
    expect((await financeTestPrisma.expenseInvoice.findUniqueOrThrow({ where: { id: invoice.id } })).status)
      .toBe(ExpenseInvoiceStatus.DRAFT);
  });

  test("cancels a draft invoice without reversal entry", async () => {
    const context = await createTaizFinanceContext();
    const category = await expensesService.createExpenseCategory(context.scopes.manager, {
      name: "مصروف اختبار الإلغاء",
      accountingAccountId: context.accounts.bySystemKey.get("OPERATING_EXPENSES")!.id
    });
    const invoice = await expensesService.createExpenseInvoice(context.scopes.manager, {
      centerId: context.centers[0].id,
      categoryId: category.id,
      invoiceDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
      description: "فاتورة سيتم إلغاؤها",
      amount: 4000
    });
    const voided = await expensesService.cancelExpenseInvoice(context.scopes.manager, invoice.id, "تم الإلغاء للاختبار");
    expect(voided.status).toBe(ExpenseInvoiceStatus.VOIDED);
    expect(voided.cancelReason).toBe("تم الإلغاء للاختبار");
    expect(voided.cancelledById).toBe(context.users.financeManager.id);
    const entries = await financeTestPrisma.journalEntry.count({
      where: { sourceType: JournalSourceType.EXPENSE_INVOICE, sourceId: invoice.id }
    });
    expect(entries).toBe(0);
  });

  test("cancels an approved invoice with reversal entry", async () => {
    const context = await createTaizFinanceContext();
    const operating = context.accounts.bySystemKey.get("OPERATING_EXPENSES")!;
    const category = await expensesService.createExpenseCategory(context.scopes.manager, {
      name: "مصروف إلغاء معتمد",
      accountingAccountId: operating.id
    });
    const invoice = await expensesService.createExpenseInvoice(context.scopes.manager, {
      centerId: context.centers[0].id,
      categoryId: category.id,
      invoiceDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
      description: "فاتورة معتمدة سيتم إلغاؤها",
      amount: 6000
    });
    await expensesService.approveExpenseInvoice(context.scopes.manager, invoice.id);
    expect((await financeTestPrisma.expenseInvoice.findUniqueOrThrow({ where: { id: invoice.id } })).status)
      .toBe(ExpenseInvoiceStatus.APPROVED);
    const voided = await expensesService.cancelExpenseInvoice(context.scopes.manager, invoice.id, "إلغاء الفاتورة المعتمدة");
    expect(voided.status).toBe(ExpenseInvoiceStatus.VOIDED);
    const reversalEntry = await financeTestPrisma.journalEntry.findFirstOrThrow({
      where: { sourceType: JournalSourceType.EXPENSE_INVOICE, sourceId: -invoice.id },
      include: { lines: true }
    });
    expect(reversalEntry.lines.length).toBe(2);
    expect(reversalEntry.lines.reduce((sum, line) => sum + line.debit.toNumber(), 0)).toBe(6000);
    expect(reversalEntry.lines.reduce((sum, line) => sum + line.credit.toNumber(), 0)).toBe(6000);
  });

  test("rejects cancel on a paid invoice", async () => {
    const context = await createTaizFinanceContext();
    const operating = context.accounts.bySystemKey.get("OPERATING_EXPENSES")!;
    const category = await expensesService.createExpenseCategory(context.scopes.manager, {
      name: "مصروف مدفوع",
      accountingAccountId: operating.id
    });
    const invoice = await expensesService.createExpenseInvoice(context.scopes.manager, {
      centerId: context.centers[0].id,
      categoryId: category.id,
      invoiceDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
      description: "فاتورة مدفوعة",
      amount: 2000
    });
    await expensesService.approveExpenseInvoice(context.scopes.manager, invoice.id);
    await expensesService.payExpenseInvoice(context.scopes.treasurer, invoice.id, {
      amount: 2000,
      financeAccountId: context.accounts.centerFund.id
    });
    await expect(
      expensesService.cancelExpenseInvoice(context.scopes.manager, invoice.id, "محاولة إلغاء مدفوعة")
    ).rejects.toMatchObject({ code: "CANNOT_CANCEL_PAID_INVOICE" });
    expect((await financeTestPrisma.expenseInvoice.findUniqueOrThrow({ where: { id: invoice.id } })).status)
      .toBe(ExpenseInvoiceStatus.PAID);
  });

  test("prevents using inactive supplier in new invoices", async () => {
    const context = await createTaizFinanceContext();
    const supplier = await expensesService.createSupplier(context.scopes.manager, {
      name: "مورد سيتم تعطيله"
    });
    await expensesService.updateSupplier(context.scopes.manager, supplier.id, { isActive: false });
    const category = await expensesService.createExpenseCategory(context.scopes.manager, {
      name: "مصروف بمورّد غير نشط",
      accountingAccountId: context.accounts.bySystemKey.get("OPERATING_EXPENSES")!.id
    });
    await expect(
      expensesService.createExpenseInvoice(context.scopes.manager, {
        centerId: context.centers[0].id,
        supplierId: supplier.id,
        categoryId: category.id,
        invoiceDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
        description: "فاتورة بمورد غير نشط",
        amount: 1000
      })
    ).rejects.toMatchObject({ code: "ENTITY_NOT_FOUND" });
  });

  test("prevents using inactive category in new invoices", async () => {
    const context = await createTaizFinanceContext();
    const category = await expensesService.createExpenseCategory(context.scopes.manager, {
      name: "تصنيف سيتم تعطيله",
      accountingAccountId: context.accounts.bySystemKey.get("OPERATING_EXPENSES")!.id
    });
    await expensesService.updateExpenseCategory(context.scopes.manager, category.id, { isActive: false });
    await expect(
      expensesService.createExpenseInvoice(context.scopes.manager, {
        centerId: context.centers[0].id,
        categoryId: category.id,
        invoiceDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
        description: "فاتورة بتصنيف غير نشط",
        amount: 1000
      })
    ).rejects.toMatchObject({ code: "ENTITY_NOT_FOUND" });
  });
});

