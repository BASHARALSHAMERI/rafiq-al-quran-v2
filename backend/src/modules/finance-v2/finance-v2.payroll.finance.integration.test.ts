import {
  DeductionEventStatus,
  DeductionTriggerType,
  PaymentMethod,
  PayrollBatchStatus,
  PayrollItemStatus
} from "@prisma/client";
import { payrollService } from "./services/payroll.service";
import { financeReportsService } from "./services/finance-reports.service";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";

describe("payroll workflow integration", () => {
  beforeEach(resetFinanceTestDatabase);
  afterAll(() => financeTestPrisma.$disconnect());

  test("calculates deductions, pays a batch in stages, and prevents duplicate payout", async () => {
    const context = await createTaizFinanceContext();
    await payrollService.createPayrollProfile(context.scopes.manager, {
      centerId: context.centers[0].id,
      userId: context.users.teacher.id,
      monthlyBaseAmount: 100000,
      salarySource: "OVERRIDE",
      overrideReason: "راتب اختباري",
      effectiveFrom: "2031-01-01"
    });
    await payrollService.createPayrollProfile(context.scopes.manager, {
      centerId: context.centers[0].id,
      userId: context.users.supervisor.id,
      monthlyBaseAmount: 80000,
      salarySource: "OVERRIDE",
      overrideReason: "راتب اختباري",
      effectiveFrom: "2031-01-01"
    });
    const rule = await financeTestPrisma.financeDeductionRule.create({
      data: {
        organizationId: context.organization.id,
        triggerType: DeductionTriggerType.UNEXCUSED_ABSENCE,
        amount: 100,
        description: "غياب اختباري"
      }
    });
    await financeTestPrisma.financeDeductionEvent.create({
      data: {
        organizationId: context.organization.id,
        userId: context.users.teacher.id,
        centerId: context.centers[0].id,
        ruleId: rule.id,
        month: 1,
        year: 2031,
        triggerType: DeductionTriggerType.UNEXCUSED_ABSENCE,
        calculatedAmount: 100,
        status: DeductionEventStatus.DEDUCTION_APPROVED,
        reviewedById: context.users.financeManager.id,
        reviewedAt: new Date()
      }
    });

    const batch = await payrollService.createPayrollBatch(context.scopes.manager, {
      centerId: context.centers[0].id,
      periodYear: 2031,
      periodMonth: 1
    });
    const items = await financeTestPrisma.payrollItem.findMany({
      where: { batchId: batch.id },
      orderBy: { beneficiaryUserId: "asc" }
    });
    expect(items).toHaveLength(2);
    const teacherItem = items.find((item) => item.beneficiaryUserId === context.users.teacher.id)!;
    expect(teacherItem.baseAmount.toNumber()).toBe(100000);
    expect(teacherItem.bonusAmount.toNumber()).toBe(0);
    expect(teacherItem.deductionAmount.toNumber()).toBe(14000);
    expect(teacherItem.netAmount.toNumber()).toBe(86000);

    await payrollService.submitPayrollBatch(context.scopes.manager, batch.id, {});
    await payrollService.approvePayrollBatch(context.scopes.manager, batch.id, {});
    await payrollService.payPayrollBatch(context.scopes.manager, batch.id, {
      payments: [{ itemId: teacherItem.id, method: PaymentMethod.CASH }]
    });
    expect((await financeTestPrisma.payrollBatch.findUniqueOrThrow({ where: { id: batch.id } })).status).toBe(
      PayrollBatchStatus.PARTIALLY_PAID
    );
    await payrollService.payPayrollBatch(context.scopes.manager, batch.id, {
      payments: [{ itemId: teacherItem.id, method: PaymentMethod.CASH }]
    });
    expect(await financeTestPrisma.financeVoucher.count({ where: { sourceType: "PAYROLL_ITEM", sourceId: teacherItem.id } })).toBe(1);

    const otherItem = items.find((item) => item.id !== teacherItem.id)!;
    await payrollService.payPayrollBatch(context.scopes.manager, batch.id, {
      payments: [{ itemId: otherItem.id, method: PaymentMethod.CASH }]
    });
    const stored = await financeTestPrisma.payrollBatch.findUniqueOrThrow({ where: { id: batch.id } });
    expect(stored.status).toBe(PayrollBatchStatus.PAID);
    expect(await financeTestPrisma.payrollItem.count({ where: { batchId: batch.id, status: PayrollItemStatus.PAID } })).toBe(2);
    expect(await financeTestPrisma.journalEntry.count({ where: { sourceType: "VOUCHER" } })).toBe(2);

    const report = await financeReportsService.reportPayroll(context.scopes.auditor, {});
    expect(report.kpis.paidPayroll).toBe(166000);
    expect(report.kpis.executionRate).toBe(100);
  });
});

