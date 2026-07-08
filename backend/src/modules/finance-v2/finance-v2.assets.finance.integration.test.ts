import {
  FinanceMovementDirection,
  FinanceMovementType,
  FixedAssetStatus,
  JournalSourceType,
  VoucherSourceType
} from "@prisma/client";
import { assetsService } from "./services/assets.service";
import { financeReportsService } from "./services/finance-reports.service";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";
import { TAIZ_FINANCE_FIXTURE } from "../../test/finance/fixtures/taiz-finance.fixture";

/** تاريخ شراء صالح في الماضي */
const PAST_DATE = "2024-01-15";

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

  // ─── اختبارات createFixedAsset ──────────────────────────────────────────────

  test("registers a fixed asset through the production service", async () => {
    const context = await createTaizFinanceContext();
    const category = await createCategory(context);
    await expect(
      assetsService.createFixedAsset(context.scopes.manager, {
        centerId: context.centers[0].id,
        categoryId: category.id,
        assetCode: "TEST-ASSET-SERVICE",
        name: TAIZ_FINANCE_FIXTURE.assets[0],
        purchaseDate: PAST_DATE,            // تاريخ ماضٍ صالح
        purchaseCost: 120000,
        usefulLifeMonths: 2,
        location: 'HQ'
      })
    ).resolves.toMatchObject({ assetCode: "TEST-ASSET-SERVICE" });
  });

  test("createFixedAsset sets currentValue = purchaseCost when not provided", async () => {
    const context = await createTaizFinanceContext();
    const category = await createCategory(context);
    const asset = await assetsService.createFixedAsset(context.scopes.manager, {
      centerId: context.centers[0].id,
      categoryId: category.id,
      assetCode: "TEST-AUTO-VALUE",
      name: "أصل اختباري تلقائي",
      purchaseDate: PAST_DATE,
      purchaseCost: 50000
      // لا نحدد currentValue
    });
    expect(asset.currentValue?.toString()).toBe("50000");
  });

  test("createFixedAsset rejects future purchaseDate", async () => {
    const context = await createTaizFinanceContext();
    const category = await createCategory(context);
    await expect(
      assetsService.createFixedAsset(context.scopes.manager, {
        centerId: context.centers[0].id,
        categoryId: category.id,
        assetCode: "TEST-FUTURE",
        name: "أصل مستقبلي",
        purchaseDate: "2099-01-01",    // تاريخ مستقبلي
        purchaseCost: 10000
      })
    ).rejects.toThrow("تاريخ الشراء لا يمكن أن يكون في المستقبل");
  });

  // ─── اختبارات assignCustody ─────────────────────────────────────────────────

  test("assignCustody sets asset status to IN_CUSTODY", async () => {
    const context = await createTaizFinanceContext();
    const category = await createCategory(context);
    const asset = await financeTestPrisma.fixedAsset.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        categoryId: category.id,
        assetCode: "TEST-CUSTODY-STATUS",
        name: "أصل حالة العهدة",
        purchaseDate: new Date(PAST_DATE),
        purchaseCost: 10000,
        currentValue: 10000
      }
    });

    await assetsService.assignCustody(context.scopes.manager, asset.id, {
      toUserId: context.users.teacher.id,
      assignedAt: PAST_DATE
    });

    const updated = await financeTestPrisma.fixedAsset.findUniqueOrThrow({ where: { id: asset.id } });
    expect(updated.status).toBe("IN_CUSTODY" as any);
    expect(updated.custodianUserId).toBe(context.users.teacher.id);
  });

  test("assignCustody rejects assignment to DISPOSED asset", async () => {
    const context = await createTaizFinanceContext();
    const category = await createCategory(context);
    const asset = await financeTestPrisma.fixedAsset.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        categoryId: category.id,
        assetCode: "TEST-DISPOSED",
        name: "أصل مستبعد",
        purchaseDate: new Date(PAST_DATE),
        purchaseCost: 10000,
        currentValue: 10000,
        status: FixedAssetStatus.DISPOSED
      }
    });

    await expect(
      assetsService.assignCustody(context.scopes.manager, asset.id, {
        toUserId: context.users.teacher.id
      })
    ).rejects.toThrow();
  });

  test("assignCustody rejects when asset already has active custody", async () => {
    const context = await createTaizFinanceContext();
    const category = await createCategory(context);
    const asset = await financeTestPrisma.fixedAsset.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        categoryId: category.id,
        assetCode: "TEST-DOUBLE-CUSTODY",
        name: "أصل عهدة مكررة",
        purchaseDate: new Date(PAST_DATE),
        purchaseCost: 10000,
        currentValue: 10000
      }
    });

    await assetsService.assignCustody(context.scopes.manager, asset.id, {
      toUserId: context.users.teacher.id,
      assignedAt: PAST_DATE
    });

    await expect(
      assetsService.assignCustody(context.scopes.manager, asset.id, {
        toUserId: context.users.supervisor.id
      })
    ).rejects.toThrow("عهدة نشطة");
  });

  // ─── اختبارات releaseCustody ────────────────────────────────────────────────

  test("releaseCustody sets status back to ACTIVE and clears custodian", async () => {
    const context = await createTaizFinanceContext();
    const category = await createCategory(context);
    const asset = await financeTestPrisma.fixedAsset.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        categoryId: category.id,
        assetCode: "TEST-RELEASE",
        name: "أصل إخلاء عهدة",
        purchaseDate: new Date(PAST_DATE),
        purchaseCost: 10000,
        currentValue: 10000
      }
    });

    const custody = await assetsService.assignCustody(context.scopes.manager, asset.id, {
      toUserId: context.users.teacher.id,
      assignedAt: PAST_DATE
    });

    await assetsService.releaseCustody(context.scopes.manager, custody.id, {
      returnedAt: PAST_DATE
    });

    const updated = await financeTestPrisma.fixedAsset.findUniqueOrThrow({ where: { id: asset.id } });
    expect(updated.status).toBe(FixedAssetStatus.ACTIVE);
    expect(updated.custodianUserId).toBeNull();
  });

  // ─── اختبارات deactivateFixedAsset ─────────────────────────────────────────

  test("deactivateFixedAsset rejects when active custody exists", async () => {
    const context = await createTaizFinanceContext();
    const category = await createCategory(context);
    const asset = await financeTestPrisma.fixedAsset.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        categoryId: category.id,
        assetCode: "TEST-DEACTIVATE-BLOCKED",
        name: "أصل تعطيل محظور",
        purchaseDate: new Date(PAST_DATE),
        purchaseCost: 10000,
        currentValue: 10000
      }
    });

    await assetsService.assignCustody(context.scopes.manager, asset.id, {
      toUserId: context.users.teacher.id
    });

    await expect(
      assetsService.deactivateFixedAsset(context.scopes.manager, asset.id)
    ).rejects.toThrow("عهدة نشطة");
  });

  // ─── اختبارات deactivateAssetCategory ──────────────────────────────────────

  test("deactivateAssetCategory rejects when active assets exist", async () => {
    const context = await createTaizFinanceContext();
    const category = await createCategory(context);

    await financeTestPrisma.fixedAsset.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        categoryId: category.id,
        assetCode: "TEST-CAT-DEACTIVATE",
        name: "أصل يمنع تعطيل التصنيف",
        purchaseDate: new Date(PAST_DATE),
        purchaseCost: 10000,
        currentValue: 10000,
        status: FixedAssetStatus.ACTIVE
      }
    });

    await expect(
      assetsService.deactivateAssetCategory(context.scopes.manager, category.id)
    ).rejects.toThrow();
  });

  // ─── اختبار postAssetDepreciation يقبل IN_CUSTODY ──────────────────────────

  test("postAssetDepreciation accepts IN_CUSTODY asset", async () => {
    const context = await createTaizFinanceContext();
    const category = await createCategory(context);
    const asset = await financeTestPrisma.fixedAsset.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        categoryId: category.id,
        assetCode: "TEST-INCUSTODY-DEP",
        name: "أصل بعهدة إهلاك",
        purchaseDate: new Date(PAST_DATE),
        purchaseCost: 120000,
        currentValue: 120000,
        usefulLifeMonths: 2,
        status: "IN_CUSTODY" as any
      }
    });

    // نحتاج acquisitionJournalEntryId لاكتمال الدورة — لكن postAssetDepreciation
    // لا يتحقق منه، فقط من الحالة والعمر الافتراضي
    await expect(
      assetsService.postAssetDepreciation(context.scopes.manager, asset.id, {
        periodYear: 2024,
        periodMonth: 2
      })
    ).resolves.toMatchObject({ id: asset.id });
  });

  // ─── الاختبار الشامل (من قبل، محدَّث) ──────────────────────────────────────

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
        purchaseDate: new Date(PAST_DATE),
        purchaseCost: 120000,
        currentValue: 120000,
        usefulLifeMonths: 2,
        location: "معمل مركز الروضة"
      }
    });

    const balanceBefore = (
      await financeTestPrisma.financeAccount.findUniqueOrThrow({
        where: { id: context.accounts.centerFund.id }
      })
    ).currentBalance.toNumber();
    await assetsService.postAssetAcquisition(context.scopes.treasurer, asset.id, {
      financeAccountId: context.accounts.centerFund.id
    });
    await expect(
      assetsService.postAssetAcquisition(context.scopes.treasurer, asset.id, {
        financeAccountId: context.accounts.centerFund.id
      })
    ).rejects.toThrow();
    const acquisition = await financeTestPrisma.journalEntry.findFirstOrThrow({
      where: { sourceType: JournalSourceType.ASSET_ACQUISITION, sourceId: asset.id },
      include: { lines: true }
    });
    expect(acquisition.lines.reduce((sum, line) => sum + line.debit.toNumber(), 0)).toBe(120000);
    expect(acquisition.lines.reduce((sum, line) => sum + line.credit.toNumber(), 0)).toBe(120000);
    const acquisitionVouchers = await financeTestPrisma.financeVoucher.findMany({
      where: {
        organizationId: context.organization.id,
        sourceType: VoucherSourceType.EXPENSE,
        sourceId: asset.id
      },
      include: { movement: true }
    });
    expect(acquisitionVouchers).toHaveLength(1);
    expect(acquisitionVouchers[0].movement).toMatchObject({
      accountId: context.accounts.centerFund.id,
      movementType: FinanceMovementType.VOUCHER_DISBURSEMENT,
      direction: FinanceMovementDirection.OUT
    });
    expect(acquisitionVouchers[0].movement?.amount.toNumber()).toBe(120000);
    expect(acquisitionVouchers[0].movement?.balanceBefore.toNumber()).toBe(balanceBefore);
    expect(acquisitionVouchers[0].movement?.balanceAfter.toNumber()).toBe(balanceBefore - 120000);
    expect(
      (
        await financeTestPrisma.financeAccount.findUniqueOrThrow({
          where: { id: context.accounts.centerFund.id }
        })
      ).currentBalance.toNumber()
    ).toBe(balanceBefore - 120000);

    // بعد assignCustody يجب أن تصبح الحالة IN_CUSTODY
    await assetsService.assignCustody(context.scopes.manager, asset.id, {
      toUserId: context.users.teacher.id,
      notes: "نقل عهدة اختباري"
    });
    const afterCustody = await financeTestPrisma.fixedAsset.findUniqueOrThrow({ where: { id: asset.id } });
    expect(afterCustody.custodianUserId).toBe(context.users.supervisor.id);
    expect(afterCustody.status).toBe("IN_CUSTODY" as any);

    // الإهلاك يقبل IN_CUSTODY
    await assetsService.postAssetDepreciation(context.scopes.manager, asset.id, { periodYear: 2024, periodMonth: 1 });
    await assetsService.postAssetDepreciation(context.scopes.manager, asset.id, { periodYear: 2024, periodMonth: 2 });
    await expect(
      assetsService.postAssetDepreciation(context.scopes.manager, asset.id, { periodYear: 2024, periodMonth: 3 })
    ).rejects.toThrow();
    const depreciation = await financeTestPrisma.assetDepreciationEntry.aggregate({
      where: { assetId: asset.id },
      _sum: { amount: true },
      _count: { _all: true }
    });
    expect(depreciation._count._all).toBe(2);
    expect(depreciation._sum.amount?.toNumber()).toBe(120000);

    const activities = await financeReportsService.reportStatementOfActivities(context.scopes.auditor, {
      from: "2024-01-01",
      to: "2024-12-31"
    });
    const position = await financeReportsService.reportFinancialPosition(context.scopes.auditor, {
      asOf: "2024-12-31"
    });
    expect(activities.expenses.depreciation.reduce((sum, row) => sum + row.balance, 0)).toBe(120000);
    expect(position.assets.fixed.some((row) => row.code === "1230")).toBe(true);
    expect(position.isBalanced).toBe(true);
  });
});
