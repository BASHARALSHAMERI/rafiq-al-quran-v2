/**
 * FinanceToolbar - shared finance search/filter/action bar.
 *
 * It intentionally mirrors the vouchers page structure:
 * ctr-controls -> ctr-search-wrap -> ctr-filters-group.
 */
import type { ReactNode } from "react";
import { Filter, Search } from "lucide-react";
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
  reset?: {
    visible: boolean;
    onClick: () => void;
    label?: string;
  };
  density?: FinanceDensity;
  onDensityChange?: (next: FinanceDensity) => void;
  className?: string;
}

export function FinanceToolbar({
  search,
  filters,
  actions,
  reset,
  density,
  onDensityChange,
  className = ""
}: FinanceToolbarProps) {
  const { language } = useI18n();
  const ar = language === "ar";

  return (
    <div className={`finance-toolbar ctr-controls ${className}`.trim()} role="toolbar">
      {search ? (
        <label className="finance-toolbar__search ctr-search-wrap">
          <Search className="finance-toolbar__search-icon ctr-search-icon" size={18} aria-hidden />
          <input
            type="search"
            className="ctr-search-input"
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            placeholder={search.placeholder ?? (ar ? "بحث..." : "Search...")}
            aria-label={ar ? "بحث" : "Search"}
          />
        </label>
      ) : null}

      <div className="finance-toolbar__filters ctr-filters-group">
        {filters ? (
          <div className="finance-toolbar__filter-shell">
            <Filter size={16} className="text-slate-400 ms-2" aria-hidden />
            {filters}
          </div>
        ) : null}
        {reset?.visible ? (
          <button type="button" className="finance-toolbar__reset" onClick={reset.onClick}>
            {reset.label ?? (ar ? "تصفير" : "Reset")}
          </button>
        ) : null}
      </div>

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
