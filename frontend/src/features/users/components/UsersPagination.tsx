interface UsersPaginationProps {
  ar: boolean;
  pageSize: number;
  setPageSize: (size: number) => void;
  setPage: (page: number) => void;
  currentPage: number;
  totalPages: number;
  totalFiltered: number;
}

import { ChevronLeft, ChevronRight } from "lucide-react";

export function UsersPagination({
  ar,
  pageSize,
  setPageSize,
  setPage,
  currentPage,
  totalPages,
  totalFiltered
}: UsersPaginationProps) {
  return (
    <div className="up-pagination-footer">
      <div className="up-page-size">
        <span>{ar ? "الصفوف لكل صفحة:" : "Rows per page:"}</span>
        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={20}>20</option>
        </select>
      </div>

      <div className="up-pagination-info">
        {ar ? "عرض" : "Showing"} {Math.min(totalFiltered, (currentPage - 1) * pageSize + 1)} - {Math.min(totalFiltered, currentPage * pageSize)} {ar ? "من" : "of"} {totalFiltered}
      </div>

      <div className="up-pagination-controls">
        <button 
          className="up-page-btn" 
          disabled={currentPage === 1} 
          onClick={() => setPage(currentPage - 1)}
        >
          {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        
        <button className="up-page-btn up-page-btn--active">
           {currentPage}
        </button>

        <button 
          className="up-page-btn" 
          disabled={currentPage === totalPages || totalPages === 0} 
          onClick={() => setPage(currentPage + 1)}
        >
          {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}
