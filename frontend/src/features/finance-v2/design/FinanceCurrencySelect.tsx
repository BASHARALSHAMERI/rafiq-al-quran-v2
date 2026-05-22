import { Loader2 } from "lucide-react";
import { useCurrenciesQuery } from "../finance-v2.hooks";
import type { CurrencyV2 } from "../types";

const FALLBACK_CURRENCIES: Pick<CurrencyV2, "id" | "code" | "nameAr" | "nameEn">[] = [
  { id: -1, code: "YER", nameAr: "الريال اليمني", nameEn: "Yemeni Rial" },
  { id: -2, code: "SAR", nameAr: "الريال السعودي", nameEn: "Saudi Riyal" },
  { id: -3, code: "USD", nameAr: "الدولار الأمريكي", nameEn: "US Dollar" }
];

export interface FinanceCurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  ar?: boolean;
}

export function FinanceCurrencySelect({
  value,
  onChange,
  disabled,
  className = "circlemod-select",
  allowEmpty,
  emptyLabel,
  ar = true
}: FinanceCurrencySelectProps) {
  const { data: dbCurrencies, isLoading } = useCurrenciesQuery();

  const currencies: Pick<CurrencyV2, "id" | "code" | "nameAr" | "nameEn">[] =
    dbCurrencies && dbCurrencies.length > 0 ? dbCurrencies : FALLBACK_CURRENCIES;

  if (isLoading) {
    return (
      <div className="flex h-[42px] items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <span className="text-sm text-slate-500">
          {ar ? "جاري تحميل العملات..." : "Loading currencies..."}
        </span>
      </div>
    );
  }

  return (
    <select
      className={className}
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
    >
      {allowEmpty && (
        <option value="">
          {emptyLabel || (ar ? "-- اختر العملة --" : "-- Select Currency --")}
        </option>
      )}
      {currencies.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {ar ? currency.nameAr : currency.nameEn} ({currency.code})
        </option>
      ))}
    </select>
  );
}
