import { LayoutGrid, List, Search } from "lucide-react";
import type { CircleTypeFilter, StatusFilter } from "./circles.types";

interface CirclesToolbarProps {
  ar: boolean;
  q: string;
  setQ: (v: string) => void;
  showCenterFilter: boolean;
  selectedCenterId: number | undefined;
  centerOpts: { id: number; label: string }[];
  setCenterId: (v: string) => void;
  tFilter: CircleTypeFilter;
  setTFilter: (v: CircleTypeFilter) => void;
  sFilter: StatusFilter;
  setSFilter: (v: StatusFilter) => void;
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  setPage: (p: number) => void;
}

export default function CirclesToolbar({
  ar,
  q,
  setQ,
  showCenterFilter,
  selectedCenterId,
  centerOpts,
  setCenterId,
  tFilter,
  setTFilter,
  sFilter,
  setSFilter,
  view,
  setView,
  setPage
}: CirclesToolbarProps) {
  return (
    <div className="ctr-controls">
      <div className="ctr-search-wrap">
        <Search className="ctr-search-icon" size={16} />
        <input
          type="text"
          className="ctr-search-input"
          placeholder={ar ? "البحث بالاسم، المركز، المعلم..." : "Search name, center, teacher..."}
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="ctr-filters-group">
        {showCenterFilter ? (
          <select
            className="ctr-filter-select"
            value={selectedCenterId ? String(selectedCenterId) : ""}
            title={ar ? "فلتر المركز" : "Center filter"}
            onChange={(event) => {
              setCenterId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">{ar ? "كل المراكز" : "All Centers"}</option>
            {centerOpts.map((center) => (
              <option key={center.id} value={center.id}>
                {center.label}
              </option>
            ))}
          </select>
        ) : null}

        <select
          className="ctr-filter-select"
          value={tFilter}
          title={ar ? "نوع الحلقة" : "Type filter"}
          onChange={(event) => {
            setTFilter(event.target.value as CircleTypeFilter);
            setPage(1);
          }}
        >
          <option value="ALL">{ar ? "كل الأنواع" : "All Types"}</option>
          <option value="HIFZ">{ar ? "حفظ" : "Hifz"}</option>
          <option value="REVIEW">{ar ? "مراجعة" : "Review"}</option>
          <option value="HIFZ_REVIEW">{ar ? "حفظ + مراجعة" : "Hifz + Review"}</option>
        </select>

        <select
          className="ctr-filter-select"
          value={sFilter}
          title={ar ? "حالة الحلقة" : "Status filter"}
          onChange={(event) => {
            setSFilter(event.target.value as StatusFilter);
            setPage(1);
          }}
        >
          <option value="ALL">{ar ? "كل الحالات" : "All Status"}</option>
          <option value="ACTIVE">{ar ? "نشطة" : "Active"}</option>
          <option value="INACTIVE">{ar ? "معطلة" : "Inactive"}</option>
        </select>
      </div>

      <div className="ctr-view-toggle" role="tablist" aria-label={ar ? "طرق العرض" : "View modes"}>
        <button
          type="button"
          className={`ctr-view-btn ${view === "grid" ? "active" : ""}`}
          onClick={() => setView("grid")}
          title={ar ? "عرض البطاقات" : "Grid view"}
        >
          <LayoutGrid size={16} />
        </button>
        <button
          type="button"
          className={`ctr-view-btn ${view === "list" ? "active" : ""}`}
          onClick={() => setView("list")}
          title={ar ? "عرض القائمة" : "List view"}
        >
          <List size={16} />
        </button>
      </div>
    </div>
  );
}
