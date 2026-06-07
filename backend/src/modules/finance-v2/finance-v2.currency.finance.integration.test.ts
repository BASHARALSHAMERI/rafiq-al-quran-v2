import { resolveCurrencyAmountTx } from "./services/currency-amount.helper";
import { calculateBaseAmount } from "./services/currencies.service";
import {
  createTaizFinanceContext,
  financeTestPrisma,
  resetFinanceTestDatabase
} from "../../test/finance/finance-test-context";

describe("finance currency integration", () => {
  beforeEach(resetFinanceTestDatabase);
  afterAll(() => financeTestPrisma.$disconnect());

  test("uses YER as base and converts USD at the fixed test rate", async () => {
    const context = await createTaizFinanceContext();
    const base = await financeTestPrisma.$transaction((tx) =>
      resolveCurrencyAmountTx(tx, context.organization.id, { originalAmount: 1000, originalCurrencyCode: "YER" })
    );
    const usd = await financeTestPrisma.$transaction((tx) =>
      resolveCurrencyAmountTx(tx, context.organization.id, {
        originalAmount: 100.125,
        originalCurrencyCode: "USD",
        exchangeRateToBase: 530
      })
    );

    expect(base.amount.toNumber()).toBe(1000);
    expect(base.exchangeRateToBase.toNumber()).toBe(1);
    expect(usd.amount.toNumber()).toBe(53066.25);
    expect(calculateBaseAmount(100.125, 530)).toBe(53066.25);
  });

  test("rejects missing, inactive, and unconfigured foreign currencies", async () => {
    const context = await createTaizFinanceContext();
    await expect(
      financeTestPrisma.$transaction((tx) =>
        resolveCurrencyAmountTx(tx, context.organization.id, {
          originalAmount: 10,
          originalCurrencyCode: "USD"
        })
      )
    ).rejects.toMatchObject({ code: "EXCHANGE_RATE_REQUIRED" });

    await financeTestPrisma.currency.updateMany({
      where: { organizationId: context.organization.id, code: "USD" },
      data: { isActive: false }
    });
    await expect(
      financeTestPrisma.$transaction((tx) =>
        resolveCurrencyAmountTx(tx, context.organization.id, {
          originalAmount: 10,
          originalCurrencyCode: "USD",
          exchangeRateToBase: 530
        })
      )
    ).rejects.toMatchObject({ code: "CURRENCY_INACTIVE" });
  });
});

