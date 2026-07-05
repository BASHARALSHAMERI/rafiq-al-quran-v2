# توحيد تصميم التقارير — خطة التنفيذ

## 1. ReportsSummaryCards.tsx
**الملف:** `frontend/src/features/reports/components/ReportsSummaryCards.tsx`
**التغيير:** استبدال الـ return بالكامل:

```tsx
  return (
    <div className="fin-premium-kpis">
      {cards.map((card) => (
        <div key={card.label} className="fin-kpi-card">
          {card.icon && (
            <div className={`fin-kpi-card__icon fin-kpi-icon--${card.cls ?? "brand"}`}>
              <card.icon size={20} />
            </div>
          )}
          <div className="fin-kpi-card__content">
            <span className="fin-kpi-card__value">{card.value}</span>
            <span className="fin-kpi-card__label">{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
```

## 2. finance-premium.css — إضافة كلاسات جديدة
**الملف:** `frontend/src/styles/pages/finance-premium.css`
**أضف قبل آخر @keyframes:**

```css
/* ─── Missing KPI icon colors ─── */
.fin-kpi-icon--brand { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.fin-kpi-icon--violet { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

/* ─── Unified Pagination Footer ─── */
.fin-pagination-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  margin: var(--space-4) var(--space-6) var(--space-6);
  background: var(--bg-surface);
  border-radius: 12px;
  border: 1px solid var(--border-default);
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
}

.fin-page-size {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 600;
}

.fin-page-size select {
  height: 32px;
  padding: 0 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--border-default);
  background: var(--bg-surface);
  color: var(--text-primary);
  outline: none;
  cursor: pointer;
  font-weight: 700;
}

.fin-page-info {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: 700;
  border: 1px solid var(--border-subtle);
  padding: 0.4rem 1.25rem;
  border-radius: 8px;
  background: var(--bg-subtle);
}

.fin-page-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

[dir="rtl"] .fin-page-controls {
  flex-direction: row-reverse;
}

.fin-page-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--border-default);
  background: var(--bg-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.fin-page-btn:hover:not(:disabled) {
  background: var(--bg-surface-hover);
  color: var(--brand-600);
  border-color: var(--brand-400);
}

.fin-page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fin-page-btn.active {
  background: var(--brand-500) !important;
  color: #fff !important;
  border-color: var(--brand-500) !important;
}
```

## 3. MonthlyStaffReportView.tsx — تحديث Pagination
**الملف:** `frontend/src/features/staff-attendance/components/MonthlyStaffReportView.tsx`
**الأسطر 320-340:**
استبدال:
```tsx
            <div className="ctr-footer">
              <div className="ctr-page-size">
                <span>{ar ? "الصفوف:" : "Rows:"}</span>
                <select value={pagination.pageSize} onChange={(e) => pagination.setPageSize(Number(e.target.value))}>
                  {[25, 50, 100].map((sz) => <option key={sz} value={sz}>{sz}</option>)}
                </select>
              </div>
              <div className="ctr-page-info text-slate-500 font-medium">
                {ar
                  ? `عرض ${Math.min(pagination.totalItems, (pagination.currentPage - 1) * pagination.pageSize + 1)} - ${Math.min(pagination.totalItems, pagination.currentPage * pagination.pageSize)} من ${pagination.totalItems}`
                  : `Showing ${Math.min(pagination.totalItems, (pagination.currentPage - 1) * pagination.pageSize + 1)} - ${Math.min(pagination.totalItems, pagination.currentPage * pagination.pageSize)} of ${pagination.totalItems}`
                }
              </div>
              <div className="ctr-page-controls">
                <button className="ctr-page-btn" disabled={pagination.currentPage === 1} onClick={() => pagination.setCurrentPage(p => p - 1)}><ChevronRight size={16} /></button>
                <button className="ctr-page-btn active">{pagination.currentPage}</button>
                <button className="ctr-page-btn" disabled={pagination.currentPage === pagination.totalPages} onClick={() => pagination.setCurrentPage(p => p + 1)}><ChevronLeft size={16} /></button>
              </div>
            </div>
```
بـ:
```tsx
            <div className="fin-pagination-footer">
              <div className="fin-page-size">
                <span>{ar ? "الصفوف:" : "Rows:"}</span>
                <select value={pagination.pageSize} onChange={(e) => pagination.setPageSize(Number(e.target.value))}>
                  {[25, 50, 100].map((sz) => <option key={sz} value={sz}>{sz}</option>)}
                </select>
              </div>
              <div className="fin-page-info">
                {ar
                  ? `عرض ${Math.min(pagination.totalItems, (pagination.currentPage - 1) * pagination.pageSize + 1)} - ${Math.min(pagination.totalItems, pagination.currentPage * pagination.pageSize)} من ${pagination.totalItems}`
                  : `Showing ${Math.min(pagination.totalItems, (pagination.currentPage - 1) * pagination.pageSize + 1)} - ${Math.min(pagination.totalItems, pagination.currentPage * pagination.pageSize)} of ${pagination.totalItems}`
                }
              </div>
              <div className="fin-page-controls">
                <button className="fin-page-btn" disabled={pagination.currentPage === 1} onClick={() => pagination.setCurrentPage(p => p - 1)}><ChevronRight size={16} /></button>
                <button className="fin-page-btn active">{pagination.currentPage}</button>
                <button className="fin-page-btn" disabled={pagination.currentPage === pagination.totalPages} onClick={() => pagination.setCurrentPage(p => p + 1)}><ChevronLeft size={16} /></button>
              </div>
            </div>
```

## 4. ReportsPage.tsx — تحديث Pagination في Unified View
**الملف:** `frontend/src/pages/ReportsPage.tsx`
**الأسطر 967-987:**
استبدال:
```tsx
                  <div className="ctr-footer">
                    <div className="ctr-page-size">
                      <span>{ar ? "الصفوف:" : "Rows:"}</span>
                      <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                        {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="ctr-page-info">
                      {ar ? `عرض ${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, sortedRows.length)} من ${sortedRows.length}` : `Showing ${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, sortedRows.length)} of ${sortedRows.length}`}
                    </div>
                    <div className="ctr-page-controls">
                      <button type="button" className="ctr-page-btn" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                        {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                      </button>
                      <button type="button" className="ctr-page-btn" disabled={page >= Math.ceil(sortedRows.length / pageSize)} onClick={() => setPage((p) => p + 1)}>
                        {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </div>
```
بـ:
```tsx
                  <div className="fin-pagination-footer">
                    <div className="fin-page-size">
                      <span>{ar ? "الصفوف:" : "Rows:"}</span>
                      <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                        {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="fin-page-info">
                      {ar ? `عرض ${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, sortedRows.length)} من ${sortedRows.length}` : `Showing ${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, sortedRows.length)} of ${sortedRows.length}`}
                    </div>
                    <div className="fin-page-controls">
                      <button type="button" className="fin-page-btn" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                        {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                      </button>
                      <button type="button" className="fin-page-btn" disabled={page >= Math.ceil(sortedRows.length / pageSize)} onClick={() => setPage((p) => p + 1)}>
                        {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </div>
```
