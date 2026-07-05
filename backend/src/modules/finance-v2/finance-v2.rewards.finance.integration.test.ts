import {
  PaymentMethod,
  RewardBatchStatus,
  RewardCycle,
  RewardItemStatus,
  RewardType
} from "@prisma/client";
import { rewardsService } from "./services/rewards.service";
import { financeReportsService } from "./services/finance-reports.service";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";

describe("rewards workflow integration", () => {
  beforeEach(resetFinanceTestDatabase);
  afterAll(() => financeTestPrisma.$disconnect());

  test("recovers a failed reward payment without duplicate vouchers", async () => {
    const context = await createTaizFinanceContext();
    await rewardsService.createRewardProfile(context.scopes.manager, {
      centerId: context.centers[0].id,
      beneficiaryUserId: context.users.student.id,
      beneficiaryRole: "STUDENT",
      cycle: RewardCycle.MONTHLY,
      rewardType: RewardType.PERFORMANCE,
      defaultAmount: 15000,
      effectiveFrom: "2031-01-01",
      notes: "مكافأة حفظ اختبارية"
    });
    await rewardsService.createRewardProfile(context.scopes.manager, {
      centerId: context.centers[0].id,
      beneficiaryUserId: context.users.teacher.id,
      beneficiaryRole: "TEACHER",
      cycle: RewardCycle.MONTHLY,
      rewardType: RewardType.PERFORMANCE,
      defaultAmount: 10000,
      effectiveFrom: "2031-01-01",
      notes: "مكافأة أداء اختبارية"
    });
    const batch = await rewardsService.createRewardBatch(context.scopes.manager, {
      centerId: context.centers[0].id,
      cycle: RewardCycle.MONTHLY,
      rewardType: RewardType.PERFORMANCE,
      periodYear: 2031,
      periodMonth: 1
    });
    const items = await financeTestPrisma.rewardItem.findMany({
      where: { batchId: batch.id },
      orderBy: { id: "asc" }
    });
    expect(items).toHaveLength(2);

    await rewardsService.submitRewardBatch(context.scopes.manager, batch.id, {});
    await rewardsService.approveRewardBatch(context.scopes.manager, batch.id, {});
    await rewardsService.failRewardItem(context.scopes.treasurer, items[0].id, {
      failureReason: "تعذر التسليم الاختباري"
    });
    expect((await financeTestPrisma.rewardItem.findUniqueOrThrow({ where: { id: items[0].id } })).status).toBe(
      RewardItemStatus.FAILED
    );

    await rewardsService.payRewardBatch(context.scopes.treasurer, batch.id, {
      payments: [{ itemId: items[1].id, method: PaymentMethod.CASH }]
    });
    expect((await financeTestPrisma.rewardBatch.findUniqueOrThrow({ where: { id: batch.id } })).status).toBe(
      RewardBatchStatus.PARTIALLY_PAID
    );
    await rewardsService.payRewardBatch(context.scopes.treasurer, batch.id, {
      payments: [{ itemId: items[0].id, method: PaymentMethod.CASH }]
    });
    await expect(
      rewardsService.payRewardBatch(context.scopes.treasurer, batch.id, {
        payments: [{ itemId: items[0].id, method: PaymentMethod.CASH }]
      })
    ).rejects.toMatchObject({ code: "INVALID_STATE_TRANSITION" });

    expect((await financeTestPrisma.rewardBatch.findUniqueOrThrow({ where: { id: batch.id } })).status).toBe(
      RewardBatchStatus.PAID
    );
    expect(await financeTestPrisma.financeVoucher.count({ where: { sourceType: "REWARD_ITEM" } })).toBe(2);
    expect(await financeTestPrisma.financeAccountMovement.count({ where: { movementType: "REWARD_PAYOUT" } })).toBe(2);
    expect(await financeTestPrisma.journalEntry.count({ where: { sourceType: "VOUCHER" } })).toBe(2);

    const report = await financeReportsService.reportRewards(context.scopes.auditor, {});
    expect(report.kpis.approvedRewards).toBe(25000);
    expect(report.kpis.paidRewards).toBe(25000);
    expect(report.kpis.executionRate).toBe(100);
  });
});
