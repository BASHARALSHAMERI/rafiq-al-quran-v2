import { FiscalPeriodStatus, JournalSourceType, JournalEntryStatus } from "@prisma/client";
import { accountingService } from "./accounting.service";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";
import { TAIZ_FINANCE_FIXTURE } from "../../test/finance/fixtures/taiz-finance.fixture";

describe("accounting PostgreSQL integration", () => {
  beforeEach(resetFinanceTestDatabase);
  afterAll(() => financeTestPrisma.$disconnect());

  test("posts only balanced entries and exposes them in ledger and trial balance", async () => {
    const context = await createTaizFinanceContext();
    const cash = context.accounts.bySystemKey.get("MAIN_CASH")!;
    const donations = context.accounts.bySystemKey.get("DONATIONS_REVENUE")!;

    const entry = await accountingService.createJournalEntry(context.scopes.manager, {
      entryNo: "TEST-JE-0001",
      entryDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
      sourceType: JournalSourceType.MANUAL,
      description: "تبرع نقدي اختباري",
      lines: [
        { accountId: cash.id, debit: 53000, credit: 0, memo: "الصندوق" },
        { accountId: donations.id, debit: 0, credit: 53000, memo: "إيراد تبرعات" }
      ]
    });

    expect(entry?.status).toBe(JournalEntryStatus.DRAFT);
    const posted = await accountingService.postJournalEntry(context.scopes.manager, entry!.id);
    expect(posted?.status).toBe(JournalEntryStatus.POSTED);
    await expect(accountingService.postJournalEntry(context.scopes.manager, entry!.id)).rejects.toMatchObject({
      code: "INVALID_STATE_TRANSITION"
    });

    const cashLedger = await accountingService.getLedger(context.scopes.auditor, { accountId: cash.id });
    expect(cashLedger.totals.debit).toBe(53000);
    expect(cashLedger.closing.balance).toBe(53000);

    const trialBalance = await accountingService.getTrialBalance(context.scopes.auditor, {});
    expect(trialBalance.totals).toEqual({ debit: 53000, credit: 53000, balanced: true });
  });

  test("keeps an unbalanced draft unposted", async () => {
    const context = await createTaizFinanceContext();
    const cash = context.accounts.bySystemKey.get("MAIN_CASH")!;
    const donations = context.accounts.bySystemKey.get("DONATIONS_REVENUE")!;
    const entry = await accountingService.createJournalEntry(context.scopes.manager, {
      entryNo: "TEST-JE-UNBALANCED",
      entryDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
      sourceType: JournalSourceType.MANUAL,
      lines: [
        { accountId: cash.id, debit: 1000, credit: 0 },
        { accountId: donations.id, debit: 0, credit: 900 }
      ]
    });

    await expect(accountingService.postJournalEntry(context.scopes.manager, entry!.id)).rejects.toMatchObject({
      code: "UNBALANCED_JOURNAL_ENTRY"
    });
    const stored = await financeTestPrisma.journalEntry.findUniqueOrThrow({ where: { id: entry!.id } });
    expect(stored.status).toBe(JournalEntryStatus.DRAFT);
  });

  test("rejects creation and posting inside a closed fiscal period", async () => {
    const context = await createTaizFinanceContext();
    const cash = context.accounts.bySystemKey.get("MAIN_CASH")!;
    const donations = context.accounts.bySystemKey.get("DONATIONS_REVENUE")!;

    await expect(
      accountingService.createJournalEntry(context.scopes.manager, {
        entryNo: "TEST-JE-CLOSED",
        entryDate: TAIZ_FINANCE_FIXTURE.dates.closedPeriod,
        sourceType: JournalSourceType.MANUAL,
        lines: [
          { accountId: cash.id, debit: 100, credit: 0 },
          { accountId: donations.id, debit: 0, credit: 100 }
        ]
      })
    ).rejects.toMatchObject({ code: "FISCAL_PERIOD_CLOSED" });
  });

  test("closes an open fiscal period, blocks new postings, and keeps reports readable", async () => {
    const context = await createTaizFinanceContext();
    const cash = context.accounts.bySystemKey.get("MAIN_CASH")!;
    const donations = context.accounts.bySystemKey.get("DONATIONS_REVENUE")!;

    const entry = await accountingService.createJournalEntry(context.scopes.manager, {
      entryNo: "TEST-JE-BEFORE-CLOSE",
      centerId: context.centers[0].id,
      entryDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
      sourceType: JournalSourceType.MANUAL,
      lines: [
        { accountId: cash.id, centerId: context.centers[0].id, debit: 750, credit: 0 },
        { accountId: donations.id, centerId: context.centers[0].id, debit: 0, credit: 750 }
      ]
    });
    await accountingService.postJournalEntry(context.scopes.manager, entry!.id);

    const closed = await accountingService.closeFiscalPeriod(
      context.scopes.manager,
      context.periods.openPeriod.id
    );
    expect(closed.status).toBe(FiscalPeriodStatus.CLOSED);
    expect(closed.closedById).toBe(context.users.financeManager.id);
    expect(closed.closedAt).not.toBeNull();

    await expect(
      accountingService.createJournalEntry(context.scopes.manager, {
        entryNo: "TEST-JE-AFTER-CLOSE",
        centerId: context.centers[0].id,
        entryDate: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
        sourceType: JournalSourceType.MANUAL,
        lines: [
          { accountId: cash.id, centerId: context.centers[0].id, debit: 100, credit: 0 },
          { accountId: donations.id, centerId: context.centers[0].id, debit: 0, credit: 100 }
        ]
      })
    ).rejects.toMatchObject({ code: "FISCAL_PERIOD_CLOSED" });

    const trialBalance = await accountingService.getTrialBalance(context.scopes.auditor, {
      centerId: context.centers[0].id,
      from: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
      to: TAIZ_FINANCE_FIXTURE.dates.openPeriod
    });
    expect(trialBalance.totals).toEqual({ debit: 750, credit: 750, balanced: true });
  });
});

