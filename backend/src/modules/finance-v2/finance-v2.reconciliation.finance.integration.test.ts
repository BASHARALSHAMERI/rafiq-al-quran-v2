import {
  PaymentMethod,
  VoucherAccountingCategory,
  VoucherSourceType,
  VoucherType
} from "@prisma/client";
import { accountingService as ledgerService } from "../accounting/accounting.service";
import { accountingService as financeAccountingService } from "./services/accounting.service";
import { financeReportsService } from "./services/finance-reports.service";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";
import { TAIZ_FINANCE_FIXTURE } from "../../test/finance/fixtures/taiz-finance.fixture";

describe("finance reconciliation and reports integration", () => {
  beforeEach(resetFinanceTestDatabase);
  afterAll(() => financeTestPrisma.$disconnect());

  test("reconciles voucher, movement, journal, ledger, trial balance, and statements", async () => {
    const context = await createTaizFinanceContext();
    const amount = 75000;
    const voucher = await financeAccountingService.createVoucher(context.scopes.manager, {
      accountId: context.accounts.orgFund.id,
      voucherType: VoucherType.RECEIPT,
      sourceType: VoucherSourceType.MANUAL,
      paymentMethod: PaymentMethod.CASH,
      amount,
      accountingCategory: VoucherAccountingCategory.DONATION,
      voucherDate: new Date(TAIZ_FINANCE_FIXTURE.dates.openPeriod)
    });
    await financeAccountingService.submitVoucher(context.scopes.manager, voucher.id, {});
    await financeAccountingService.approveVoucher(context.scopes.manager, voucher.id, {});
    await financeAccountingService.postVoucher(context.scopes.manager, voucher.id, {});

    const movement = await financeTestPrisma.financeAccountMovement.findUniqueOrThrow({
      where: { voucherId: voucher.id }
    });
    const journal = await financeTestPrisma.journalEntry.findFirstOrThrow({
      where: { organizationId: context.organization.id, sourceType: "VOUCHER", sourceId: voucher.id },
      include: { lines: true }
    });
    const cashAccount = context.accounts.bySystemKey.get("MAIN_CASH")!;
    const ledger = await ledgerService.getLedger(context.scopes.auditor, { accountId: cashAccount.id });
    const trial = await ledgerService.getTrialBalance(context.scopes.auditor, {});
    const activities = await financeReportsService.reportStatementOfActivities(context.scopes.auditor, {
      from: "2000-01-01",
      to: "2099-12-31"
    });
    const position = await financeReportsService.reportFinancialPosition(context.scopes.auditor, {
      asOf: "2099-12-31"
    });

    expect(voucher.amount).toBe(amount);
    expect(movement.amount.toNumber()).toBe(amount);
    expect(journal.lines.reduce((sum, line) => sum + line.debit.toNumber(), 0)).toBe(amount);
    expect(ledger.totals.debit).toBe(amount);
    expect(trial.totals.balanced).toBe(true);
    expect(activities.revenue.totalRevenue).toBe(amount);
    expect(activities.surplusOrDeficit).toBe(amount);
    expect(position.isBalanced).toBe(true);
    expect(position.assets.totalAssets).toBe(
      position.liabilities.totalLiabilities + position.netAssets.totalNetAssets
    );

    const auditCount = await financeTestPrisma.auditLog.count({
      where: { organizationId: context.organization.id }
    });
    expect(auditCount).toBeGreaterThanOrEqual(4);
  });
});
