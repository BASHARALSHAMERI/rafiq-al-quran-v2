import { AccountingAccountType } from "@prisma/client";
import { accountingService } from "../accounting/accounting.service";
import { financeV2Domain } from "./finance-v2.domain";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";

describe("finance and accounting RBAC integration", () => {
  beforeEach(resetFinanceTestDatabase);
  afterAll(() => financeTestPrisma.$disconnect());

  test("permits finance roles and rejects operational roles from accounting", async () => {
    const context = await createTaizFinanceContext();
    await expect(accountingService.getChartOfAccounts(context.scopes.manager, {})).resolves.not.toHaveLength(0);
    await expect(accountingService.getChartOfAccounts(context.scopes.auditor, {})).resolves.not.toHaveLength(0);
    await expect(accountingService.getChartOfAccounts(context.scopes.supervisor, {})).rejects.toMatchObject({
      code: "ACCOUNTING_SCOPE_DENIED"
    });
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

  test("parents and students cannot perform administrative finance writes", async () => {
    const context = await createTaizFinanceContext();
    expect(() => financeV2Domain.assertCanWrite(context.scopes.parent)).toThrow("Finance scope denied");
    expect(() => financeV2Domain.assertCanWrite(context.scopes.student)).toThrow("Finance scope denied");
  });
});

