import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZES } from "./centers.types";

interface CentersPaginationProps {
  ar: boolean;
  total: number;
  vFrom: number;
  vTo: number;
  curPage: number;
  totalPages: number;
  pageSize: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  setPageSize: (size: number) => void;
}

export function CentersPagination({
  ar, total, vFrom, vTo, curPage, totalPages, pageSize, setPage, setPageSize
}: CentersPaginationProps) {
  return (
    <div className="ctr-panel__foot glass-panel-foot">
      <span className="ctr-pag-info">{ar ? `إظهار ${vFrom}–${vTo} من إجمالي ${total}` : `Showing ${vFrom}–${vTo} of ${total}`}</span>
      <div className="ctr-pag-right">
        <select className="ctr-pag-size glass-select" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} title={ar ? "حجم الصفحة واختيار الأسطر" : "Page size limit"}>
          {PAGE_SIZES.map(o => <option key={o} value={o}>{o} {ar ? "بالصفحة" : "Rows"}</option>)}
        </select>
        <div className="ctr-pag-nav glass-nav">
          <button className="ctr-pag-btn" disabled={curPage <= 1} onClick={() => setPage(1)} title={ar ? "الأولى" : "First"}>
            <ChevronFirst className="w-4 h-4" />
          </button>
          <button className="ctr-pag-btn" disabled={curPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} title={ar ? "السابق" : "Previous"}>
            {ar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <span className="ctr-pag-cur" title={ar ? "الصفحة الحالية" : "Current Page"}>{curPage} / {totalPages}</span>
          <button className="ctr-pag-btn" disabled={curPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} title={ar ? "التالي" : "Next"}>
            {ar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <button className="ctr-pag-btn" disabled={curPage >= totalPages} onClick={() => setPage(totalPages)} title={ar ? "الأخيرة" : "Last"}>
            <ChevronLast className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
