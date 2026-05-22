import { Search } from "lucide-react";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import type { Role } from "../../auth/types";

interface UsersToolbarProps {
  role: Role;
  ar: boolean;
  q: string;
  setQ: (val: string) => void;
  canLoadCenters: boolean;
  centerId: number | null;
  centers: Array<{ id: number; name: string }>;
  onCenterChange: (val: string) => void;
  canLoadCircles: boolean;
  circleId: number | null;
  circles: Array<{ id: number; name: string }>;
  onCircleChange: (val: string) => void;
  totalResults: number;
  activeFiltersCount: number;
  onReset: () => void;
}

export function UsersToolbar({
  ar,
  q,
  setQ,
  canLoadCenters,
  centerId,
  centers,
  onCenterChange,
  canLoadCircles,
  circleId,
  circles,
  onCircleChange,
  totalResults,
  activeFiltersCount,
  onReset
}: UsersToolbarProps) {
  const searchPlaceholder = ar ? "ابحث بالاسم أو البريد أو الهاتف" : "Search by name, email, or phone";
  const resultsLabel = ar ? `${totalResults} نتيجة` : `${totalResults} results`;

  return (
    <FilterBar
      className="users-toolbar"
      search={
        <Input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          className="users-toolbar__search"
          placeholder={searchPlaceholder}
          title={ar ? "بحث" : "Search"}
          leftIcon={<Search size={16} />}
          fullWidth={false}
        />
      }
      actions={<span className="users-toolbar__summary">{resultsLabel}</span>}
      onReset={onReset}
      resetLabel={ar ? "إعادة الضبط" : "Reset"}
      activeFiltersCount={activeFiltersCount}
    >
      <div className="users-toolbar__filters">
        {canLoadCenters ? (
          <Select
            className="users-toolbar__select"
            value={centerId ?? ""}
            onChange={(event) => onCenterChange(event.target.value)}
            title={ar ? "المركز" : "Center"}
            fullWidth={false}
            options={[
              { value: "", label: ar ? "كل المراكز" : "All centers" },
              ...centers.map((center) => ({
                value: center.id,
                label: center.name
              }))
            ]}
          />
        ) : null}

        {canLoadCircles ? (
          <Select
            className="users-toolbar__select"
            value={circleId ?? ""}
            onChange={(event) => onCircleChange(event.target.value)}
            title={ar ? "الحلقة" : "Circle"}
            fullWidth={false}
            options={[
              { value: "", label: ar ? "كل الحلقات" : "All circles" },
              ...circles.map((circle) => ({
                value: circle.id,
                label: circle.name
              }))
            ]}
          />
        ) : null}
      </div>
    </FilterBar>
  );
}
