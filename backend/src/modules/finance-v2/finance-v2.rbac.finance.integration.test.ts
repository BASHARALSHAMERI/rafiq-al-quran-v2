import { AccountingAccountType, JournalSourceType } from "@prisma/client";
import { accountingService } from "../accounting/accounting.service";
import { financeV2Domain } from "./finance-v2.domain";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";
import { TAIZ_FINANCE_FIXTURE } from "../../test/finance/fixtures/taiz-finance.fixture";

describe("finance and accounting RBAC integration", () => {
  beforeEach(resetFinanceTestDatabase);
  afterAll(() => financeTestPrisma.$disconnect());

  test("permits finance roles and center-scoped supervisor reads", async () => {
    const context = await createTaizFinanceContext();
    await expect(accountingService.getChartOfAccounts(context.scopes.manager, {})).resolves.not.toHaveLength(0);
    await expect(accountingService.getChartOfAccounts(context.scopes.auditor, {})).resolves.not.toHaveLength(0);
    await expect(
      accountingService.getTrialBalance(context.scopes.supervisor, {
        centerId: context.centers[0].id
      })
    ).resolves.toMatchObject({ totals: { balanced: true } });
    await expect(
      accountingService.getChartOfAccounts(context.scopes.supervisor, {
        centerId: context.centers[1].id,
        type: AccountingAccountType.ASSET
      })
    ).rejects.toMatchObject({
      code: "ACCOUNTING_SCOPE_DENIED"
    });
    expect(() => financeV2Domain.assertCanRead(context.scopes.supervisor)).not.toThrow();
    expect(() => financeV2Domain.assertCanWrite(context.scopes.supervisor)).toThrow("Finance scope denied");
    await expect(
      accountingService.closeFiscalPeriod(context.scopes.supervisor, context.periods.openPeriod.id)
    ).rejects.toMatchObject({ code: "ACCOUNTING_SCOPE_DENIED" });
    await expect(accountingService.getChartOfAccounts(context.scopes.teacher, {})).rejects.toMatchObject({
      code: "ACCOUNTING_SCOPE_DENIED"
    });
  });

  test("prevents a scoped accountant from reading another center", async () => {
    const context = await createTaizFinanceContext();
    await expect(
      accountingService.getChartOfAccounts(context.scopes.accountant, {
        centerId: context.centers[1].id,
        type: AccountingAccountType.ASSET
      })
    ).rejects.toMatchObject({ code: "ACCOUNTING_SCOPE_DENIED" });
  });

  test("limits supervisor accounting data to the assigned center by default", async () => {
    const context = await createTaizFinanceContext();
    const cash = context.accounts.bySystemKey.get("MAIN_CASH")!;
    const donations = context.accounts.bySystemKey.get("DONATIONS_REVENUE")!;

    for (const [centerId, amount] of [
      [context.centers[0].id, 100],
      [context.centers[1].id, 300]
    ] as const) {
      const entry = await accountingService.createJournalEntry(context.scopes.manager, {
        centerId,
        entryDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
        sourceType: JournalSourceType.MANUAL,
        lines: [
          { accountId: cash.id, centerId, debit: amount, credit: 0 },
          { accountId: donations.id, centerId, debit: 0, credit: amount }
        ]
      });
      await accountingService.postJournalEntry(context.scopes.manager, entry!.id);
    }

    const trialBalance = await accountingService.getTrialBalance(context.scopes.supervisor, {});
    expect(trialBalance.totals).toEqual({ debit: 100, credit: 100, balanced: true });
  });

  test("parents and students cannot perform administrative finance writes", async () => {
    const context = await createTaizFinanceContext();
    expect(() => financeV2Domain.assertCanWrite(context.scopes.parent)).toThrow("Finance scope denied");
    expect(() => financeV2Domain.assertCanWrite(context.scopes.student)).toThrow("Finance scope denied");
    await expect(accountingService.getChartOfAccounts(context.scopes.parent, {})).rejects.toMatchObject({
      code: "ACCOUNTING_SCOPE_DENIED"
    });
    await expect(accountingService.getChartOfAccounts(context.scopes.student, {})).rejects.toMatchObject({
      code: "ACCOUNTING_SCOPE_DENIED"
    });
  });
});

