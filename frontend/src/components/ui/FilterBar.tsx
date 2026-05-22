import { RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import Button from "./Button";

export interface FilterBarProps {
  search?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  onReset?: () => void;
  resetLabel?: string;
  activeFiltersCount?: number;
  className?: string;
}

export function FilterBar({
  search,
  children,
  actions,
  onReset,
  resetLabel = "Reset",
  activeFiltersCount,
  className = ""
}: FilterBarProps) {
  return (
    <section className={`app-filter-bar ${className}`.trim()}>
      {search ? <div className="app-filter-bar__search">{search}</div> : null}
      {children ? <div className="app-filter-bar__filters">{children}</div> : null}

      {(actions || onReset || typeof activeFiltersCount === "number") ? (
        <div className="app-filter-bar__actions">
          {typeof activeFiltersCount === "number" ? (
            <span className="app-filter-bar__count">{activeFiltersCount}</span>
          ) : null}
          {actions}
          {onReset ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={onReset}
            >
              {resetLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default FilterBar;
