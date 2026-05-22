/**
 * FinanceToolbar — horizontal operational bar above a DataTable.
 *
 * Contents (all optional slots):
 * - Search input (debounced upstream; the component does not debounce).
 * - Filters slot for chips / selects placed by the page.
 * - Density toggle ("مريح" / "مضغوط") that reports back to the parent.
 * - Actions slot for primary/secondary CTAs.
 *
 * Design rules:
 * - No explanatory text. Only operational controls.
 * - Search takes flexible width; actions pin to the end of the line.
 */
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { useI18n } from "../../../app/i18n";

export type FinanceDensity = "comfortable" | "dense";

export interface FinanceToolbarProps {
  search?: {
    value: string;
    onChange: (next: string) => void;
    placeholder?: string;
  };
  filters?: ReactNode;
  actions?: ReactNode;
  density?: FinanceDensity;
  onDensityChange?: (next: FinanceDensity) => void;
  className?: string;
}

export function FinanceToolbar({
  search,
  filters,
  actions,
  density,
  onDensityChange,
  className = ""
}: FinanceToolbarProps) {
  const { language } = useI18n();
  const ar = language === "ar";

  return (
    <div className={`finance-toolbar ${className}`.trim()} role="toolbar">
      {search ? (
        <label className="finance-toolbar__search">
          <Search className="h-4 w-4 opacity-60" aria-hidden />
          <input
            type="search"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? (ar ? "بحث..." : "Search...")}
            aria-label={ar ? "بحث" : "Search"}
          />
        </label>
      ) : null}

      {filters ? <div className="finance-toolbar__filters">{filters}</div> : null}

      <div className="finance-toolbar__actions">
        {density && onDensityChange ? (
          <div
            className="finance-toolbar__density"
            role="group"
            aria-label={ar ? "كثافة الجدول" : "Table density"}
          >
            <button
              type="button"
              aria-pressed={density === "comfortable"}
              onClick={() => onDensityChange("comfortable")}
            >
              {ar ? "مريح" : "Comfort"}
            </button>
            <button
              type="button"
              aria-pressed={density === "dense"}
              onClick={() => onDensityChange("dense")}
            >
              {ar ? "مضغوط" : "Dense"}
            </button>
          </div>
        ) : null}
        {actions}
      </div>
    </div>
  );
}

export default FinanceToolbar;
