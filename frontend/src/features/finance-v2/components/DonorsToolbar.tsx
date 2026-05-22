import { Search, LayoutGrid, List } from "lucide-react";

interface DonorsToolbarProps {
  ar: boolean;
  q: string;
  setQ: (val: string) => void;
  selectedCenterId: number | undefined;
  centerOpts: Array<{ id: number; label: string }>;
  setCenterId: (val: string) => void;
  view: "grid" | "list";
  setView: (val: "grid" | "list") => void;
}

export default function DonorsToolbar({
  ar,
  q,
  setQ,
  selectedCenterId,
  centerOpts,
  setCenterId,
  view,
  setView
}: DonorsToolbarProps) {
  return (
    <div className="ctr-centers-toolbar">
      <div className="ctr-centers-toolbar__left">
        <div className="ctr-centers-view">
          <button
            type="button"
            className={`ctr-centers-view__btn ${view === "grid" ? "is-active" : ""}`}
            onClick={() => setView("grid")}
            title={ar ? "عرض شبكي" : "Grid View"}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            type="button"
            className={`ctr-centers-view__btn ${view === "list" ? "is-active" : ""}`}
            onClick={() => setView("list")}
            title={ar ? "عرض قائمة" : "List View"}
          >
            <List size={18} />
          </button>
        </div>

        <select
          className="ctr-centers-toolbar__select"
          value={selectedCenterId ?? ""}
          onChange={(e) => setCenterId(e.target.value)}
        >
          <option value="">{ar ? "كل المراكز" : "All Centers"}</option>
          {centerOpts.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ctr-centers-toolbar__search">
        <Search className="ctr-centers-toolbar__search-icon" size={18} />
        <input
          type="text"
          className="ctr-centers-toolbar__search-input"
          placeholder={ar ? "بحث عن متبرع..." : "Search donors..."}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
    </div>
  );
}
