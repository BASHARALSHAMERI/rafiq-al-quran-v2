/**
 * FA-UX-4B: Currency amount resolution helper.
 *
 * Used by donations and finance vouchers to safely derive the YER base
 * amount from a (originalAmount, originalCurrencyCode, exchangeRateToBase)
 * triple. The journal-entry posting layer remains untouched and continues
 * to consume `voucher.amount` as the YER base amount.
 */
import { Prisma } from "@prisma/client";
import { financeV2Domain } from "../finance-v2.domain";

export const BASE_CURRENCY_CODE = "YER";

export interface CurrencyAmountInput {
  amount?: number;
  originalAmount?: number;
  originalCurrencyCode?: string;
  exchangeRateToBase?: number;
}

export interface ResolvedCurrencyAmount {
  /** YER base amount stored in `Donation.amount` / `FinanceVoucher.amount`. */
  amount: Prisma.Decimal;
  originalAmount: Prisma.Decimal;
  originalCurrencyCode: string;
  exchangeRateToBase: Prisma.Decimal;
}

const isPositive = (value: number | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const roundBase = (value: number) => Math.round(value * 100) / 100;

/**
 * Resolve and normalize the currency-aware amount triple for a donation
 * or voucher payload, validating against the organization's Currency table.
 *
 *  - `originalCurrencyCode` defaults to YER.
 *  - For YER: `exchangeRateToBase` is forced to 1, `amount = originalAmount`.
 *  - For foreign currency: `originalAmount` and `exchangeRateToBase` are
 *    required, and `amount = originalAmount * exchangeRateToBase`.
 *  - The currency must exist in the organization's Currency table and
 *    must be active.
 */
export async function resolveCurrencyAmountTx(
  tx: Prisma.TransactionClient,
  organizationId: number,
  input: CurrencyAmountInput
): Promise<ResolvedCurrencyAmount> {
  const code = (input.originalCurrencyCode ?? BASE_CURRENCY_CODE).trim().toUpperCase();

  // Resolve the originalAmount with a sane default to amount when omitted.
  const originalAmountNumber = input.originalAmount ?? input.amount;
  if (!isPositive(originalAmountNumber)) {
    throw financeV2Domain.financeError(
      "originalAmount must be greater than zero",
      400,
      "VALIDATION_ERROR"
    );
  }

  if (code === BASE_CURRENCY_CODE) {
    const baseAmount = roundBase(originalAmountNumber);
    return {
      amount: financeV2Domain.toDecimal(baseAmount),
      originalAmount: financeV2Domain.toDecimal(baseAmount),
      originalCurrencyCode: BASE_CURRENCY_CODE,
      exchangeRateToBase: new Prisma.Decimal(1)
    };
  }

  // Foreign currency: require an active record and an explicit exchange rate.
  const currency = await tx.currency.findUnique({
    where: { organizationId_code: { organizationId, code } }
  });
  if (!currency) {
    throw financeV2Domain.financeError(
      `Currency ${code} is not configured for this organization`,
      400,
      "CURRENCY_NOT_FOUND"
    );
  }
  if (!currency.isActive) {
    throw financeV2Domain.financeError(
      `Currency ${code} is inactive`,
      400,
      "CURRENCY_INACTIVE"
    );
  }

  if (!isPositive(input.exchangeRateToBase)) {
    throw financeV2Domain.financeError(
      "exchangeRateToBase is required for foreign currency",
      400,
      "EXCHANGE_RATE_REQUIRED"
    );
  }

  const rate = input.exchangeRateToBase;
  const baseAmount = roundBase(originalAmountNumber * rate);

  return {
    amount: financeV2Domain.toDecimal(baseAmount),
    originalAmount: financeV2Domain.toDecimal(roundBase(originalAmountNumber)),
    originalCurrencyCode: code,
    exchangeRateToBase: new Prisma.Decimal(rate)
  };
}
