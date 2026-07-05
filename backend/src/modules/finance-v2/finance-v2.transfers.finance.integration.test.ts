import { FundTransferStatus } from "@prisma/client";
import { accountingService as financeAccountingService } from "./services/accounting.service";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";

describe("fund transfer workflow integration", () => {
  beforeEach(resetFinanceTestDatabase);
  afterAll(() => financeTestPrisma.$disconnect());

  const approve = async (context: Awaited<ReturnType<typeof createTaizFinanceContext>>, amount: number) => {
    const transfer = await financeAccountingService.createFundTransfer(context.scopes.manager, {
      fromAccountId: context.accounts.orgFund.id,
      toAccountId: context.accounts.centerFund.id,
      amount,
      notes: "تحويل تمويل مركز اختباري"
    });
    await financeAccountingService.submitFundTransfer(context.scopes.manager, transfer.id, {});
    await financeAccountingService.approveFundTransfer(context.scopes.manager, transfer.id, {});
    return transfer;
  };

  test("posts matching outgoing/incoming movements and one balanced journal", async () => {
    const context = await createTaizFinanceContext();
    const transfer = await approve(context, 250000);
    const result = await financeAccountingService.postFundTransfer(context.scopes.treasurer, transfer.id, {});

    expect(result.transfer.status).toBe(FundTransferStatus.POSTED);
    expect(result.movementOut.amount).toBe(250000);
    expect(result.movementIn.amount).toBe(250000);
    const [source, destination] = await Promise.all([
      financeTestPrisma.financeAccount.findUniqueOrThrow({ where: { id: context.accounts.orgFund.id } }),
      financeTestPrisma.financeAccount.findUniqueOrThrow({ where: { id: context.accounts.centerFund.id } })
    ]);
    expect(source.currentBalance.toNumber()).toBe(750000);
    expect(destination.currentBalance.toNumber()).toBe(450000);

    const journal = await financeTestPrisma.journalEntry.findFirstOrThrow({
      where: { sourceType: "FUND_TRANSFER", sourceId: transfer.id },
      include: { lines: true }
    });
    expect(journal.lines.reduce((sum, line) => sum + line.debit.toNumber(), 0)).toBe(250000);
    expect(journal.lines.reduce((sum, line) => sum + line.credit.toNumber(), 0)).toBe(250000);
    await expect(financeAccountingService.postFundTransfer(context.scopes.treasurer, transfer.id, {})).rejects.toMatchObject({
      code: "INVALID_STATE_TRANSITION"
    });
  });

  test("rejects same-account and insufficient/concurrent transfers", async () => {
    const context = await createTaizFinanceContext();
    await expect(
      financeAccountingService.createFundTransfer(context.scopes.manager, {
        fromAccountId: context.accounts.orgFund.id,
        toAccountId: context.accounts.orgFund.id,
        amount: 1
      })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    const tooLarge = await approve(context, 1000001);
    await expect(financeAccountingService.postFundTransfer(context.scopes.treasurer, tooLarge.id, {})).rejects.toThrow();

    const first = await approve(context, 700000);
    const second = await approve(context, 700000);
    const results = await Promise.allSettled([
      financeAccountingService.postFundTransfer(context.scopes.treasurer, first.id, {}),
      financeAccountingService.postFundTransfer(context.scopes.treasurer, second.id, {})
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(
      await financeTestPrisma.financeFundTransfer.count({ where: { status: FundTransferStatus.POSTED } })
    ).toBe(1);
    expect((await financeTestPrisma.financeAccount.findUniqueOrThrow({ where: { id: context.accounts.orgFund.id } })).currentBalance.toNumber()).toBe(300000);
  });
});

