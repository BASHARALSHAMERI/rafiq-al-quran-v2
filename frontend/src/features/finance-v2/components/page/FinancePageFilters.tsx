import { CalendarDays, Filter, RefreshCcw } from "lucide-react";
import type { Center } from "../../../org/types";

type Props = {
  ar: boolean;
  centers: Center[];
  centerId: number | undefined;
  month: number;
  year: number;
  status: string;
  statusLabels: Record<string, string>;
  onCenterChange: (value: number | undefined) => void;
  onMonthChange: (value: number) => void;
  onYearChange: (value: number) => void;
  onStatusChange: (value: any) => void;
  onReset: () => void;
  activeFiltersCount?: number;
  statusList?: string[];
  cycle?: string;
  onCycleChange?: (value: string) => void;
  quarter?: number;
  onQuarterChange?: (value: number) => void;
};

const cycleLabels: Record<string, string> = {
  "": "الكل / سنوي",
  MONTHLY: "شهري",
  QUARTERLY: "ربع سنوي",
  ANNUAL: "سنوي"
};

const cycleLabelsEn: Record<string, string> = {
  "": "All / Annual",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUAL: "Annual"
};

const arabicQuarters = ["الربع الأول", "الربع الثاني", "الربع الثالث", "الربع الرابع"];
const englishQuarters = ["Q1", "Q2", "Q3", "Q4"];

export function FinancePageFilters({
  ar,
  centers,
  centerId,
  month,
  year,
  status,
  statusLabels,
  onCenterChange,
  onMonthChange,
  onYearChange,
  onStatusChange,
  onReset,
  statusList,
  cycle,
  onCycleChange,
  quarter,
  onQuarterChange
}: Props) {
  const showMonth = !cycle || cycle === "MONTHLY";
  const showQuarter = cycle === "QUARTERLY";

  return (
    <div className="fin-filters-container" dir={ar ? "rtl" : "ltr"}>
      <div className="fin-filters-scroll">
        {/* Center Filter */}
        <div className="fin-filter-item min-w-[180px]">
          <Filter className="fin-filter-icon" />
          <select
            value={centerId ?? ""}
            onChange={(event) => onCenterChange(event.target.value ? Number(event.target.value) : undefined)}
          >
            <option value="">{ar ? "كل المراكز" : "All Centers"}</option>
            {centers.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cycle Filter */}
        {onCycleChange && (
          <div className="fin-filter-item min-w-[140px]">
            <Filter className="fin-filter-icon" />
            <select
              value={cycle ?? ""}
              onChange={(event) => onCycleChange(event.target.value)}
            >
              <option value="">{ar ? "كل الدورات" : "All Cycles"}</option>
              <option value="MONTHLY">{ar ? "شهري" : "Monthly"}</option>
              <option value="QUARTERLY">{ar ? "ربع سنوي" : "Quarterly"}</option>
              <option value="ANNUAL">{ar ? "سنوي" : "Annual"}</option>
            </select>
          </div>
        )}

        {/* Month Filter (visible when cycle = MONTHLY or no cycle filter) */}
        {showMonth && (
          <div className="fin-filter-item min-w-[140px]">
            <CalendarDays className="fin-filter-icon" />
            <select
              value={month}
              onChange={(event) => onMonthChange(Number(event.target.value))}
              className="w-full bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
                const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                return (
                  <option key={i + 1} value={i + 1}>
                    {ar ? arabicMonths[i] : englishMonths[i]}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Quarter Filter (visible when cycle = QUARTERLY) */}
        {showQuarter && onQuarterChange && (
          <div className="fin-filter-item min-w-[140px]">
            <Filter className="fin-filter-icon" />
            <select
              value={quarter ?? 1}
              onChange={(event) => onQuarterChange(Number(event.target.value))}
              className="w-full bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>
                  {ar ? arabicQuarters[q - 1] : englishQuarters[q - 1]}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Year Filter */}
        <div className="fin-filter-item w-28">
          <CalendarDays className="fin-filter-icon" />
          <input
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(event) => onYearChange(Math.min(2100, Math.max(2000, Number(event.target.value))))}
            placeholder={ar ? "السنة" : "Year"}
          />
        </div>

        {/* Status Filter */}
        <div className="fin-filter-item min-w-[150px]">
          <Filter className="fin-filter-icon" />
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
          >
            <option value="">{ar ? "كل الحالات" : "All Statuses"}</option>
            {(statusList || ["PENDING", "PARTIAL", "PAID", "CANCELLED"]).map((state) => (
              <option key={state} value={state}>
                {statusLabels[state]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="button" className="fin-filter-reset" onClick={onReset}>
        <RefreshCcw className="w-4 h-4" />
        <span>{ar ? "إعادة ضبط" : "Reset"}</span>
      </button>
    </div>
  );
}
