/**
 * FinanceMoney — unified money cell for finance tables.
 *
 * Behaviour:
 * - Primary line: YER base amount with locale grouping + tabular numerals.
 * - Secondary line (only if a foreign currency is recorded): the original
 *   amount + ISO code + "× rate" so cashiers can audit FX at a glance.
 *
 * The component never computes conversions; it renders what the service
 * already stored (amount, originalAmount, originalCurrencyCode,
 * exchangeRateToBase).
 */
import { useI18n } from "../../../app/i18n";

export interface FinanceMoneyProps {
  amount: number | string | null | undefined;
  originalAmount?: number | string | null;
  originalCurrencyCode?: string | null;
  exchangeRateToBase?: number | string | null;
  /** Base currency label (defaults to YER). Display-only; no math impact. */
  baseCurrency?: string;
  className?: string;
}

const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

export function FinanceMoney({
  amount,
  originalAmount,
  originalCurrencyCode,
  exchangeRateToBase,
  baseCurrency = "YER",
  className = ""
}: FinanceMoneyProps) {
  const { language } = useI18n();
  const ar = language === "ar";
  const base = toNumber(amount) ?? 0;
  const orig = toNumber(originalAmount);
  const rate = toNumber(exchangeRateToBase);
  const code = (originalCurrencyCode ?? "").toUpperCase();
  const showSecondary =
    orig !== null && rate !== null && code && code !== baseCurrency.toUpperCase();
  const fmt = (n: number) =>
    new Intl.NumberFormat(ar ? "ar-YE-u-nu-latn" : "en-US", { maximumFractionDigits: 2 }).format(n);

  return (
    <span className={`finance-money ${className}`.trim()}>
      <span className="finance-money__primary">
        {fmt(base)} {baseCurrency}
      </span>
      {showSecondary ? (
        <span className="finance-money__secondary">
          {fmt(orig!)} {code} × {fmt(rate!)}
        </span>
      ) : null}
    </span>
  );
}

export default FinanceMoney;
