import { InvoiceStatus, InvoiceType, PaymentMethod } from "@prisma/client";
import { billingService } from "./services/billing.service";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";
import { TAIZ_FINANCE_FIXTURE } from "../../test/finance/fixtures/taiz-finance.fixture";

describe("finance idempotency and concurrency integration", () => {
  beforeEach(resetFinanceTestDatabase);
  afterAll(() => financeTestPrisma.$disconnect());

  const createInvoice = async () => {
    const context = await createTaizFinanceContext();
    const invoice = await financeTestPrisma.invoice.create({
      data: {
        studentId: context.users.student.id,
        centerId: context.centers[0].id,
        month: 1,
        year: 2031,
        amount: 100000,
        status: InvoiceStatus.PENDING,
        issuedAt: new Date(TAIZ_FINANCE_FIXTURE.dates.openPeriod),
        invoiceType: InvoiceType.TUITION_MONTHLY
      }
    });
    return { context, invoice };
  };

  test("repeating a payment idempotency key returns one payment and one journal", async () => {
    const { context, invoice } = await createInvoice();
    const input = {
      invoiceId: invoice.id,
      amount: 40000,
      method: PaymentMethod.CASH,
      receivedAt: TAIZ_FINANCE_FIXTURE.dates.openPeriod
    };
    const first = await billingService.createPayment(context.scopes.manager, input, "test-payment-0001");
    const second = await billingService.createPayment(context.scopes.manager, input, "test-payment-0001");

    expect(second.payment.id).toBe(first.payment.id);
    expect(await financeTestPrisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(1);
    expect(
      await financeTestPrisma.journalEntry.count({
        where: { organizationId: context.organization.id, sourceType: "PAYMENT", sourceId: first.payment.id }
      })
    ).toBe(1);
  });

  test("concurrent payments cannot exceed the invoice balance", async () => {
    const { context, invoice } = await createInvoice();
    const result = await Promise.allSettled([
      billingService.createPayment(
        context.scopes.manager,
        { invoiceId: invoice.id, amount: 60000, method: PaymentMethod.CASH },
        "test-concurrent-a"
      ),
      billingService.createPayment(
        context.scopes.manager,
        { invoiceId: invoice.id, amount: 60000, method: PaymentMethod.CASH },
        "test-concurrent-b"
      )
    ]);

    expect(result.filter((item) => item.status === "fulfilled")).toHaveLength(1);
    const aggregate = await financeTestPrisma.payment.aggregate({
      where: { invoiceId: invoice.id },
      _sum: { amount: true }
    });
    expect(aggregate._sum.amount?.toNumber()).toBeLessThanOrEqual(100000);
    expect(await financeTestPrisma.financeVoucher.count({ where: { sourceId: invoice.id, sourceType: "PAYMENT" } })).toBe(1);
  });
});

