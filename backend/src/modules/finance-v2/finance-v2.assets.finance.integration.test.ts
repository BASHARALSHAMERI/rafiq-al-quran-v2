import { JournalSourceType } from "@prisma/client";
import { assetsService } from "./services/assets.service";
import { financeReportsService } from "./services/finance-reports.service";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";
import { TAIZ_FINANCE_FIXTURE } from "../../test/finance/fixtures/taiz-finance.fixture";

describe("fixed asset workflow integration", () => {
  beforeEach(resetFinanceTestDatabase);
  afterAll(() => financeTestPrisma.$disconnect());

  const createCategory = async (context: Awaited<ReturnType<typeof createTaizFinanceContext>>) =>
    assetsService.createAssetCategory(context.scopes.manager, {
      name: "أجهزة حاسوب اختبارية",
      assetAccountId: context.accounts.bySystemKey.get("COMPUTERS_EQUIPMENT")!.id,
      depreciationExpenseAccountId: context.accounts.bySystemKey.get("DEPRECIATION_EXPENSE")!.id,
      accumulatedDepreciationAccountId: context.accounts.bySystemKey.get("ACCUMULATED_DEPRECIATION_EQUIPMENT")!.id,
      usefulLifeMonths: 2
    });

  test("registers a fixed asset through the production service", async () => {
    const context = await createTaizFinanceContext();
    const category = await createCategory(context);
    await expect(
      assetsService.createFixedAsset(context.scopes.manager, {
        centerId: context.centers[0].id,
        categoryId: category.id,
        assetCode: "TEST-ASSET-SERVICE",
        name: TAIZ_FINANCE_FIXTURE.assets[0],
        purchaseDate: "2031-01-15",
        purchaseCost: 120000,
        usefulLifeMonths: 2,
        location: "معمل مركز الروضة",
        custodianUserId: context.users.teacher.id
      })
    ).resolves.toMatchObject({ assetCode: "TEST-ASSET-SERVICE" });
  });

  test("posts acquisition, custody, depreciation, reports, and blocks over-depreciation", async () => {
    const context = await createTaizFinanceContext();
    const category = await createCategory(context);
    const asset = await financeTestPrisma.fixedAsset.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        categoryId: category.id,
        assetCode: "TEST-ASSET-DOWNSTREAM",
        name: TAIZ_FINANCE_FIXTURE.assets[0],
        purchaseDate: new Date("2031-01-15"),
        purchaseCost: 120000,
        currentValue: 120000,
        usefulLifeMonths: 2,
        location: "معمل مركز الروضة"
      }
    });

    await assetsService.postAssetAcquisition(context.scopes.manager, asset.id, {
      financeAccountId: context.accounts.centerFund.id
    });
    await expect(
      assetsService.postAssetAcquisition(context.scopes.manager, asset.id, {
        financeAccountId: context.accounts.centerFund.id
      })
    ).rejects.toThrow();
    const acquisition = await financeTestPrisma.journalEntry.findFirstOrThrow({
      where: { sourceType: JournalSourceType.ASSET_ACQUISITION, sourceId: asset.id },
      include: { lines: true }
    });
    expect(acquisition.lines.reduce((sum, line) => sum + line.debit.toNumber(), 0)).toBe(120000);
    expect(acquisition.lines.reduce((sum, line) => sum + line.credit.toNumber(), 0)).toBe(120000);

    await assetsService.assignCustody(context.scopes.manager, asset.id, {
      toUserId: context.users.supervisor.id,
      centerId: context.centers[0].id,
      notes: "نقل عهدة اختباري"
    });
    expect((await financeTestPrisma.fixedAsset.findUniqueOrThrow({ where: { id: asset.id } })).custodianUserId).toBe(
      context.users.supervisor.id
    );

    await assetsService.postAssetDepreciation(context.scopes.manager, asset.id, { periodYear: 2031, periodMonth: 1 });
    await assetsService.postAssetDepreciation(context.scopes.manager, asset.id, { periodYear: 2031, periodMonth: 2 });
    await expect(
      assetsService.postAssetDepreciation(context.scopes.manager, asset.id, { periodYear: 2031, periodMonth: 3 })
    ).rejects.toThrow();
    const depreciation = await financeTestPrisma.assetDepreciationEntry.aggregate({
      where: { assetId: asset.id },
      _sum: { amount: true },
      _count: { _all: true }
    });
    expect(depreciation._count._all).toBe(2);
    expect(depreciation._sum.amount?.toNumber()).toBe(120000);

    const activities = await financeReportsService.reportStatementOfActivities(context.scopes.auditor, {
      from: "2031-01-01",
      to: "2031-12-31"
    });
    const position = await financeReportsService.reportFinancialPosition(context.scopes.auditor, {
      asOf: "2031-12-31"
    });
    expect(activities.expenses.depreciation.reduce((sum, row) => sum + row.balance, 0)).toBe(120000);
    expect(position.assets.fixed.some((row) => row.code === "1230")).toBe(true);
    expect(position.isBalanced).toBe(true);
  });
});
