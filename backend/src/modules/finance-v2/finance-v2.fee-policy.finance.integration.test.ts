import { FeeMode, InvoiceType, PaymentMethod, TuitionPlanKind } from "@prisma/client";
import { billingService } from "./services/billing.service";
import { financeSettingsService } from "./services/finance-settings.service";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";
import { TAIZ_FINANCE_FIXTURE } from "../../test/finance/fixtures/taiz-finance.fixture";

describe("free default and optional student fees policy", () => {
  beforeEach(resetFinanceTestDatabase);
  afterAll(() => financeTestPrisma.$disconnect());

  const prepareEnrollment = async (
    context: Awaited<ReturnType<typeof createTaizFinanceContext>>
  ) => {
    const circle = await financeTestPrisma.circle.create({
      data: {
        centerId: context.centers[0].id,
        teacherId: context.users.teacher.id,
        name: "حلقة سياسة الرسوم الاختبارية"
      }
    });
    await financeTestPrisma.studentCircleEnrollment.create({
      data: {
        studentId: context.users.student.id,
        circleId: circle.id
      }
    });
  };

  const invoiceInput = (
    context: Awaited<ReturnType<typeof createTaizFinanceContext>>,
    overrides: Partial<Parameters<typeof billingService.createInvoice>[1]> = {}
  ) => ({
    studentId: context.users.student.id,
    centerId: context.centers[0].id,
    month: 1,
    year: 2031,
    invoiceType: InvoiceType.REGISTRATION_ONE_TIME,
    amount: 5000,
    issuedAt: TAIZ_FINANCE_FIXTURE.dates.openPeriod,
    ...overrides
  });

  const enableOrganizationFees = async (
    context: Awaited<ReturnType<typeof createTaizFinanceContext>>
  ) => {
    await financeSettingsService.patchOrganizationPolicy(context.scopes.manager, {
      feesEnabled: true,
      allowSymbolicOneTimeFee: true
    });
  };

  test("treats a student without a fee profile as free and creates no financial records", async () => {
    const context = await createTaizFinanceContext();
    await prepareEnrollment(context);
    await enableOrganizationFees(context);

    await expect(
      billingService.createInvoice(context.scopes.manager, invoiceInput(context))
    ).rejects.toMatchObject({ code: "STUDENT_FEE_EXEMPT" });

    expect(await financeTestPrisma.invoice.count()).toBe(0);
    expect(await financeTestPrisma.financeVoucher.count()).toBe(0);
    expect(await financeTestPrisma.journalEntry.count()).toBe(0);
  });

  test("rejects invoices for an explicitly free student", async () => {
    const context = await createTaizFinanceContext();
    await prepareEnrollment(context);
    await enableOrganizationFees(context);
    await financeTestPrisma.studentFeeProfile.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        studentId: context.users.student.id,
        feeMode: FeeMode.FREE,
        startDate: new Date("2030-01-01")
      }
    });

    await expect(
      billingService.createInvoice(context.scopes.manager, invoiceInput(context))
    ).rejects.toMatchObject({ code: "STUDENT_FEE_EXEMPT" });
  });

  test("rejects invoices while fees are disabled at organization or center level", async () => {
    const context = await createTaizFinanceContext();
    await prepareEnrollment(context);
    await financeTestPrisma.studentFeeProfile.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        studentId: context.users.student.id,
        feeMode: FeeMode.SYMBOLIC_ONE_TIME,
        symbolicAmount: 5000,
        startDate: new Date("2030-01-01")
      }
    });

    await expect(
      billingService.createInvoice(context.scopes.manager, invoiceInput(context))
    ).rejects.toMatchObject({ code: "FEES_DISABLED" });

    await enableOrganizationFees(context);
    await financeSettingsService.patchCenterPolicy(
      context.scopes.manager,
      context.centers[0].id,
      { feesEnabled: false }
    );
    await expect(
      billingService.createInvoice(context.scopes.manager, invoiceInput(context))
    ).rejects.toMatchObject({ code: "FEES_DISABLED" });
  });

  test("inherits organization enablement when the center has no explicit fee override", async () => {
    const context = await createTaizFinanceContext();
    await prepareEnrollment(context);
    await enableOrganizationFees(context);
    await financeTestPrisma.studentFeeProfile.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        studentId: context.users.student.id,
        feeMode: FeeMode.SYMBOLIC_ONE_TIME,
        symbolicAmount: 5000,
        startDate: new Date("2030-01-01")
      }
    });

    const invoice = await billingService.createInvoice(
      context.scopes.manager,
      invoiceInput(context)
    );
    expect(invoice.amount).toBe(5000);
  });

  test("allows an explicitly enabled symbolic fee and keeps payment accounting balanced", async () => {
    const context = await createTaizFinanceContext();
    await prepareEnrollment(context);
    await enableOrganizationFees(context);
    await financeTestPrisma.studentFeeProfile.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        studentId: context.users.student.id,
        feeMode: FeeMode.SYMBOLIC_ONE_TIME,
        symbolicAmount: 5000,
        startDate: new Date("2030-01-01")
      }
    });

    const invoice = await billingService.createInvoice(
      context.scopes.manager,
      invoiceInput(context)
    );
    const payment = await billingService.createPayment(context.scopes.manager, {
      invoiceId: invoice.id,
      amount: 5000,
      method: PaymentMethod.CASH,
      receivedAt: TAIZ_FINANCE_FIXTURE.dates.openPeriod
    });
    const journal = await financeTestPrisma.journalEntry.findFirstOrThrow({
      where: { sourceType: "PAYMENT", sourceId: payment.payment.id },
      include: { lines: true }
    });

    expect(invoice.amount).toBe(5000);
    expect(journal.lines.reduce((sum, line) => sum + line.debit.toNumber(), 0)).toBe(5000);
    expect(journal.lines.reduce((sum, line) => sum + line.credit.toNumber(), 0)).toBe(5000);
  });

  test("rejects fee creation in a closed fiscal period without financial side effects", async () => {
    const context = await createTaizFinanceContext();
    await prepareEnrollment(context);
    await enableOrganizationFees(context);
    await financeTestPrisma.studentFeeProfile.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        studentId: context.users.student.id,
        feeMode: FeeMode.SYMBOLIC_ONE_TIME,
        symbolicAmount: 5000,
        startDate: new Date("2030-01-01")
      }
    });

    await expect(
      billingService.createInvoice(
        context.scopes.manager,
        invoiceInput(context, {
          month: 1,
          year: 2100,
          issuedAt: TAIZ_FINANCE_FIXTURE.dates.closedPeriod
        })
      )
    ).rejects.toMatchObject({ code: "FISCAL_PERIOD_CLOSED" });

    expect(await financeTestPrisma.invoice.count()).toBe(0);
    expect(await financeTestPrisma.financeVoucher.count()).toBe(0);
    expect(await financeTestPrisma.journalEntry.count()).toBe(0);
  });

  test("prevents duplicate fees for the same student, period, and invoice type", async () => {
    const context = await createTaizFinanceContext();
    await prepareEnrollment(context);
    await enableOrganizationFees(context);
    await financeTestPrisma.studentFeeProfile.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        studentId: context.users.student.id,
        feeMode: FeeMode.SYMBOLIC_ONE_TIME,
        symbolicAmount: 5000,
        startDate: new Date("2030-01-01")
      }
    });

    await billingService.createInvoice(context.scopes.manager, invoiceInput(context));

    await expect(
      billingService.createInvoice(context.scopes.manager, invoiceInput(context))
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(await financeTestPrisma.invoice.count()).toBe(1);
    expect(await financeTestPrisma.financeVoucher.count()).toBe(0);
    expect(await financeTestPrisma.journalEntry.count()).toBe(0);
  });

  test("rejects a symbolic fee when symbolic fees are not explicitly allowed", async () => {
    const context = await createTaizFinanceContext();
    await prepareEnrollment(context);
    await financeSettingsService.patchOrganizationPolicy(context.scopes.manager, {
      feesEnabled: true,
      allowSymbolicOneTimeFee: false
    });
    await financeTestPrisma.studentFeeProfile.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        studentId: context.users.student.id,
        feeMode: FeeMode.SYMBOLIC_ONE_TIME,
        symbolicAmount: 5000,
        startDate: new Date("2030-01-01")
      }
    });

    await expect(
      billingService.createInvoice(context.scopes.manager, invoiceInput(context))
    ).rejects.toMatchObject({ code: "SYMBOLIC_FEES_DISABLED" });
  });

  test("allows an explicitly configured monthly plan and rejects unauthorized amounts", async () => {
    const context = await createTaizFinanceContext();
    await prepareEnrollment(context);
    await enableOrganizationFees(context);
    const plan = await financeTestPrisma.tuitionPlan.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        name: "مساهمة شهرية اختيارية",
        monthlyAmount: 3000,
        planKind: TuitionPlanKind.MONTHLY
      }
    });
    await financeTestPrisma.studentFeeProfile.create({
      data: {
        organizationId: context.organization.id,
        centerId: context.centers[0].id,
        studentId: context.users.student.id,
        feeMode: FeeMode.PLAN_MONTHLY,
        tuitionPlanId: plan.id,
        startDate: new Date("2030-01-01")
      }
    });

    await expect(
      billingService.createInvoice(
        context.scopes.manager,
        invoiceInput(context, {
          invoiceType: InvoiceType.TUITION_MONTHLY,
          amount: 5000
        })
      )
    ).rejects.toMatchObject({ code: "FEE_AMOUNT_MISMATCH" });

    const invoice = await billingService.createInvoice(
      context.scopes.manager,
      invoiceInput(context, {
        invoiceType: InvoiceType.TUITION_MONTHLY,
        amount: 3000
      })
    );
    expect(invoice.amount).toBe(3000);
  });
});
