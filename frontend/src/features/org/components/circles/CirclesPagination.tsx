import { ChevronFirst, ChevronLeft, ChevronRight, ChevronLast } from "lucide-react";
import { PAGE_SIZES } from "./circles.types";

interface CirclesPaginationProps {
  ar: boolean;
  totalItems: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  curPage: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  vFrom: number;
  vTo: number;
}

export default function CirclesPagination({
  ar,
  totalItems,
  pageSize,
  setPageSize,
  curPage,
  totalPages,
  setPage,
  vFrom,
  vTo,
}: CirclesPaginationProps) {
  if (totalItems === 0) return null;

  return (
    <div className="ctr-panel__foot">
      <span className="ctr-pag-info">
        {ar
          ? `عرض ${vFrom}–${vTo} من ${totalItems}`
          : `Showing ${vFrom}–${vTo} of ${totalItems}`}
      </span>
      <div className="ctr-pag-right">
        <select
          className="ctr-pag-size glass-input"
          value={pageSize}
          title={ar ? "عناصر لكل صفحة" : "Items per page"}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} / {ar ? "صفحة" : "page"}
            </option>
          ))}
        </select>
        <div className="ctr-pag-nav">
          <button
            className="ctr-pag-btn"
            disabled={curPage <= 1}
            onClick={() => setPage(1)}
            title={ar ? "الصفحة الأولى" : "First Page"}
          >
            <ChevronFirst className="w-4 h-4" />
          </button>
          <button
            className="ctr-pag-btn"
            disabled={curPage <= 1}
            onClick={() => setPage((p: number) => Math.max(1, p - 1))}
            title={ar ? "الصفحة السابقة" : "Previous Page"}
          >
            {ar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <span className="ctr-pag-cur">
            {curPage} / {totalPages}
          </span>
          <button
            className="ctr-pag-btn"
            disabled={curPage >= totalPages}
            onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
            title={ar ? "الصفحة التالية" : "Next Page"}
          >
            {ar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <button
            className="ctr-pag-btn"
            disabled={curPage >= totalPages}
            onClick={() => setPage(totalPages)}
            title={ar ? "الصفحة الأخيرة" : "Last Page"}
          >
            <ChevronLast className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
