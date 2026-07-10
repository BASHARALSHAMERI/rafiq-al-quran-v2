import { accountingService as financeAccountingService } from "./services/accounting.service";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";
import { AccountingAccountType } from "@prisma/client";

describe("finance accounts ledger validation integration", () => {
  beforeEach(resetFinanceTestDatabase);
  afterAll(() => financeTestPrisma.$disconnect());

  test("prevents linking treasury account to non-cash/bank accounts like 1150", async () => {
    const context = await createTaizFinanceContext();
    
    // Create a dummy fixed asset ledger account (code starting with 12)
    const fixedAssetAccount = await financeTestPrisma.accountingAccount.create({
      data: {
        organizationId: context.organization.id,
        name: "صندوق مؤقت",
        code: "1150",
        type: AccountingAccountType.ASSET,
        normalBalance: "DEBIT",
        isActive: true
      }
    });

    // Attempt to link a finance account to the fixed asset account should throw VALIDATION_ERROR
    await expect(
      financeAccountingService.updateAccountLedgerAccount(
        context.scopes.manager,
        context.accounts.orgFund.id,
        { accountingAccountId: fixedAssetAccount.id }
      )
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });

  test("allows linking treasury account to valid cash/bank accounts", async () => {
    const context = await createTaizFinanceContext();
    
    // Create a valid cash ledger account (code starting with 11)
    const cashAccount = await financeTestPrisma.accountingAccount.create({
      data: {
        organizationId: context.organization.id,
        name: "بنك جديد",
        code: "112001",
        type: AccountingAccountType.ASSET,
        normalBalance: "DEBIT",
        isActive: true
      }
    });

    // Attempt to link should succeed
    const result = await financeAccountingService.updateAccountLedgerAccount(
      context.scopes.manager,
      context.accounts.orgFund.id,
      { accountingAccountId: cashAccount.id }
    );
    expect(result.accountingAccountId).toBe(cashAccount.id);
  });
});
