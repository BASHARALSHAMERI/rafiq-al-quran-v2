import { Search, LayoutGrid, List } from "lucide-react";
import type { GenderFilter, StatusFilter } from "./centers.types";

interface CentersToolbarProps {
  ar: boolean;
  q: string;
  setQ: (v: string) => void;
  gFilter: GenderFilter;
  setGFilter: (v: GenderFilter) => void;
  sFilter: StatusFilter;
  setSFilter: (v: StatusFilter) => void;
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  setPage: (p: number) => void;
}

export function CentersToolbar({
  ar, q, setQ, gFilter, setGFilter, sFilter, setSFilter, view, setView, setPage
}: CentersToolbarProps) {
  return (
    <div className="ctr-panel__head">
      <div className="ctr-panel__search">
        <Search className="w-4 h-4" />
        <input 
          value={q} 
          onChange={e => { setQ(e.target.value); setPage(1); }} 
          title={ar ? "بحث" : "Search"} 
          placeholder={ar ? "بحث بالاسم أو الرمز أو المدير..." : "Search name, code, or manager..."} 
        />
      </div>
      <div className="ctr-panel__filters">
        <select 
          className="ctr-select" 
          value={gFilter} 
          onChange={e => { setGFilter(e.target.value as GenderFilter); setPage(1); }} 
          title={ar ? "تصفية حسب الجنس" : "Filter by Gender"}
        >
          <option value="ALL">{ar ? "الكل (الجنس)" : "All (Gender)"}</option>
          <option value="MALE">{ar ? "ذكور" : "Male"}</option>
          <option value="FEMALE">{ar ? "إناث" : "Female"}</option>
        </select>
        <select 
          className="ctr-select" 
          value={sFilter} 
          onChange={e => { setSFilter(e.target.value as StatusFilter); setPage(1); }} 
          title={ar ? "تصفية حسب الحالة" : "Filter by Status"}
        >
          <option value="ALL">{ar ? "الكل (الحالة)" : "All (Status)"}</option>
          <option value="ACTIVE">{ar ? "نشطة" : "Active"}</option>
          <option value="INACTIVE">{ar ? "معطلة" : "Inactive"}</option>
        </select>
      </div>
      <div className="ctr-panel__view-toggle">
        <button className={`ctr-vbtn ${view === "grid" ? "ctr-vbtn--on" : ""}`} onClick={() => setView("grid")} title={ar ? "عرض شبكي" : "Grid View"}>
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button className={`ctr-vbtn ${view === "list" ? "ctr-vbtn--on" : ""}`} onClick={() => setView("list")} title={ar ? "عرض طولي" : "List View"}>
          <List className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
