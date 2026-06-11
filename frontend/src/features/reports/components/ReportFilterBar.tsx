import { CalendarDays, RotateCcw, Search } from "lucide-react";
import { useI18n } from "../../../app/i18n";
import type { ReportFilterDefinition } from "../types";

export type FilterValue = string | number | undefined;
export type FilterValues = Record<string, FilterValue>;
export type FilterChangeHandler = (filterId: string, value: FilterValue) => void;
export type FilterOptionsMap = Record<string, { value: string | number; label: string }[]>;

export type ReportFilterBarProps = {
  filterDefs: ReportFilterDefinition[];
  values: FilterValues;
  onChange: FilterChangeHandler;
  onReset: () => void;
  activeCount: number;
  isLoading?: boolean;
  optionsMap?: FilterOptionsMap;
};

export function ReportFilterBar({
  filterDefs,
  values,
  onChange,
  onReset,
  activeCount,
  isLoading = false,
  optionsMap = {},
}: ReportFilterBarProps) {
  const { language } = useI18n();
  const ar = language === "ar";

  const renderFilter = (def: ReportFilterDefinition) => {
    const { id, type, placeholder } = def;
    const value = values[id] ?? '';
    const options = optionsMap[id];

    switch (type) {
      case 'search':
        return (
          <div key={id} className="ctr-search-wrap !bg-gray-50 !border-transparent focus-within:!bg-white focus-within:!border-brand-300 !py-2">
            <Search className="ctr-search-icon text-gray-400" size={18} />
            <input
              className="ctr-search-input !text-sm placeholder:text-gray-400 font-medium"
              placeholder={placeholder ?? (ar ? 'بحث...' : 'Search...')}
              value={String(value || '')}
              onChange={(e) => onChange(id, e.target.value || undefined)}
            />
          </div>
        );

      case 'select':
        return (
          <select
            key={id}
            className="ctr-filter-select !bg-gray-50 !border-transparent hover:!bg-gray-100 !py-2"
            value={String(value || '')}
            onChange={(e) => onChange(id, e.target.value || undefined)}
            disabled={isLoading || (!options && id !== 'centerId')}
          >
            <option value="">{ar ? `الكل` : `All`}</option>
            {(options || []).map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <div key={id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 border border-transparent hover:bg-gray-100">
            <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="date"
              className="bg-transparent border-none focus:ring-0 text-sm p-0 w-[130px] text-gray-700 font-medium"
              value={String(value || '')}
              onChange={(e) => onChange(id, e.target.value || undefined)}
            />
          </div>
        );

      case 'month':
        return (
          <div key={id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 border border-transparent hover:bg-gray-100">
            <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="month"
              className="bg-transparent border-none focus:ring-0 text-sm p-0 w-[150px] text-gray-700 font-medium"
              value={String(value || '')}
              onChange={(e) => onChange(id, e.target.value || undefined)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const hasActiveFilters = activeCount > 0;

  return (
    <div className="ctr-centers-shell no-print">
      <div className="ctr-controls !mb-0 border border-gray-100 shadow-sm rounded-2xl bg-white p-3">
        <div className="ctr-filters-group">
          {filterDefs.map(renderFilter)}

          {hasActiveFilters && (
            <button
              className="flex items-center justify-center w-[38px] h-[38px] rounded-lg border border-gray-200 bg-gray-50 text-gray-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
              onClick={onReset}
              title={ar ? "إعادة ضبط" : "Reset"}
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportFilterBar;
