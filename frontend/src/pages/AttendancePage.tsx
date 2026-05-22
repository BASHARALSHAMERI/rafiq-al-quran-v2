import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  RefreshCw,
  Search,
  XCircle
} from "lucide-react";
import { useI18n } from "../app/i18n";
import {
  DASHBOARD_QUERY_KEYS,
  useAttendanceSummaryQuery
} from "../features/dashboard/dashboard.hooks";
import type { DashboardFilters } from "../features/dashboard/types";
import { ORG_QUERY_KEYS, useCentersQuery, useCirclesQuery } from "../features/org/org.hooks";
import { getLocalizedApiErrorMessage } from "../shared/api/error";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuthStore } from "../features/auth/auth.store";
import "../styles/pages/users-enterprise-v5.css";
import "../styles/pages/admin-management-modern.css";
import { canReadCenters, canReadCircles } from "../features/org/org.permissions";
import { SelfAttendanceWidget } from "../features/attendance/components/SelfAttendanceWidget";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const parseNumber = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

function AttendancePage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const locale = ar ? "ar-SA-u-nu-latn" : "en-US";
  const user = useAuthStore((state) => state.user);
  const canLoadCenters = canReadCenters(user?.role);
  const canLoadCircles = canReadCircles(user?.role);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);

  const selectedCenterId = parseNumber(searchParams.get("centerId"));
  const selectedCircleId = parseNumber(searchParams.get("circleId"));
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const centersQuery = useCentersQuery({ enabled: canLoadCenters });
  const circlesQuery = useCirclesQuery(selectedCenterId, { enabled: canLoadCircles });

  const filters = useMemo<DashboardFilters>(
    () => ({
      centerId: selectedCenterId,
      circleId: selectedCircleId,
      from: from || undefined,
      to: to || undefined
    }),
    [selectedCenterId, selectedCircleId, from, to]
  );

  const attendanceQuery = useAttendanceSummaryQuery(filters, true);
  const centers = canLoadCenters ? centersQuery.data?.items ?? [] : [];
  const circles = canLoadCircles ? circlesQuery.data?.items ?? [] : [];
  const rows = useMemo(() => attendanceQuery.data ?? [], [attendanceQuery.data]);

  const filteredRows = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return rows;

    return rows.filter((row) => {
      const circleName = row.circleName.toLowerCase();
      const centerName = String(row.centerName ?? "").toLowerCase();
      return circleName.includes(normalized) || centerName.includes(normalized);
    });
  }, [rows, searchTerm]);

  const summary = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => {
          acc.present += row.totals.present;
          acc.absent += row.totals.absent;
          acc.late += row.totals.late;
          acc.excused += row.totals.excused;
          acc.total += row.total;
          return acc;
        },
        { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
      ),
    [filteredRows]
  );

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const formatNumber = (value: number) => numberFormatter.format(value);
  const formatRate = (value: number) => `${value.toFixed(1)}%`;

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedRows = filteredRows.slice(start, start + pageSize);

  const handleFilterChange = (key: "centerId" | "circleId" | "from" | "to", value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key === "centerId") next.delete("circleId");
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const handleRefresh = async () => {
    const invalidations = [
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.attendanceSummary(filters) })
    ];

    if (canLoadCenters) {
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: ORG_QUERY_KEYS.centers() })
      );
    }

    if (canLoadCircles) {
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: ORG_QUERY_KEYS.circles(selectedCenterId) })
      );
    }

    await Promise.all(invalidations);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setPage(1);
    setPageSize(10);
    setSearchParams({}, { replace: true });
  };

  const handlePageChange = (val: number) => {
    setPage(val);
  };

  const handlePageSizeChange = (val: number) => {
    setPageSize(val);
    setPage(1);
  };

  return (
    <div className="page users-enterprise-shell admin-modern-page">
      <PageHeader
        title={ar ? "متابعة الحضور" : "Attendance Follow-up"}
        description={ar ? "ملخص حضور الحلقات ومعدلات الالتزام" : "Circle attendance summaries and compliance rates"}
        icon={<CalendarDays className="w-6 h-6" />}
        actions={
          <div className="ue-header-actions">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => void handleRefresh()}
              isLoading={attendanceQuery.isFetching || centersQuery.isFetching || circlesQuery.isFetching}
            >
              {ar ? "تحديث" : "Refresh"}
            </Button>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              {ar ? "إعادة ضبط الفلاتر" : "Reset Filters"}
            </Button>
          </div>
        }
      />

      <SelfAttendanceWidget />

      {/* ── Stats Bar ── */}
      {!attendanceQuery.isLoading && !attendanceQuery.isError && rows.length > 0 ? (
        <div className="ue-stats-bar">
          <div className="ue-stat-card ue-stat-card--active">
            <div className="ue-stat-icon ue-stat-icon--active">
              <CheckCircle2 size={18} />
            </div>
            <div className="ue-stat-body">
              <div className="ue-stat-value">{formatNumber(summary.present)}</div>
              <div className="ue-stat-label">{ar ? "إجمالي الحضور" : "Total Present"}</div>
            </div>
          </div>
          <div className="ue-stat-card ue-stat-card--error">
            <div className="ue-stat-icon ue-stat-icon--error">
              <XCircle size={18} />
            </div>
            <div className="ue-stat-body">
              <div className="ue-stat-value">{formatNumber(summary.absent)}</div>
              <div className="ue-stat-label">{ar ? "إجمالي الغياب" : "Total Absent"}</div>
            </div>
          </div>
          <div className="ue-stat-card ue-stat-card--inactive">
            <div className="ue-stat-icon ue-stat-icon--inactive">
              <Clock3 size={18} />
            </div>
            <div className="ue-stat-body">
              <div className="ue-stat-value">{formatNumber(summary.late)}</div>
              <div className="ue-stat-label">{ar ? "حالات التأخر" : "Late Cases"}</div>
            </div>
          </div>
          <div className="ue-stat-card ue-stat-card--new">
            <div className="ue-stat-icon ue-stat-icon--new">
              <FileText size={18} />
            </div>
            <div className="ue-stat-body">
              <div className="ue-stat-value">{formatNumber(summary.excused)}</div>
              <div className="ue-stat-label">{ar ? "غياب بعذر" : "Excused"}</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Toolbar ── */}
      <div className="ue-toolbar">
        <div className="ue-toolbar-filters">
          <div className="ue-search-box">
            <Search size={14} />
            <input
              className="ue-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder={ar ? "بحث بالحلقة أو المركز..." : "Search circle or center..."}
            />
          </div>
          {canLoadCenters ? (
            <select
              className="ue-filter-select"
              value={selectedCenterId ? String(selectedCenterId) : ""}
              onChange={(e) => handleFilterChange("centerId", e.target.value)}
              title={ar ? "المركز" : "Center"}
            >
              <option value="">{ar ? "جميع المراكز" : "All Centers"}</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : null}
          {canLoadCircles ? (
            <select
              className="ue-filter-select"
              value={selectedCircleId ? String(selectedCircleId) : ""}
              onChange={(e) => handleFilterChange("circleId", e.target.value)}
              title={ar ? "الحلقة" : "Circle"}
            >
              <option value="">{ar ? "جميع الحلقات" : "All Circles"}</option>
              {circles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : null}
          <input
            type="date"
            className="ue-filter-select"
            value={from}
            onChange={(e) => handleFilterChange("from", e.target.value)}
            title={ar ? "من تاريخ" : "From Date"}
          />
          <input
            type="date"
            className="ue-filter-select"
            value={to}
            onChange={(e) => handleFilterChange("to", e.target.value)}
            title={ar ? "إلى تاريخ" : "To Date"}
          />
        </div>
      </div>

      <div className="ue-table-wrapper">
        {attendanceQuery.isError ? (
          <div className="ue-table-empty-wrap">
            <EmptyState
              title={ar ? "تعذر تحميل البيانات" : "Data Load Error"}
              description={getLocalizedApiErrorMessage(attendanceQuery.error, {
                ar,
                fallback: ar ? "تعذر تحميل بيانات الحضور. يرجى المحاولة مرة أخرى." : "Unable to load attendance data. Please try again."
              })}
            />
          </div>
        ) : null}

        {attendanceQuery.isLoading ? (
          <div className="ue-shimmer-rows">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="ue-shimmer-row" />
            ))}
          </div>
        ) : null}

        {!attendanceQuery.isLoading && !attendanceQuery.isError && totalItems === 0 ? (
          <div className="ue-table-empty-wrap">
            <EmptyState
              title={ar ? "لا توجد نتائج" : "No results"}
              description={
                ar
                  ? "لم يتم العثور على بيانات حضور تطابق الفلاتر."
                  : "No attendance data found matching current filters."
              }
            />
          </div>
        ) : null}

        {!attendanceQuery.isLoading && !attendanceQuery.isError && totalItems > 0 ? (
          <table className="ue-table">
            <thead>
              <tr>
                <th>{ar ? "الحلقة" : "Circle"}</th>
                <th>{ar ? "المركز" : "Center"}</th>
                <th className="ue-text-center">{ar ? "حضور" : "Present"}</th>
                <th className="ue-text-center">{ar ? "غياب" : "Absent"}</th>
                <th className="ue-text-center">{ar ? "تأخر" : "Late"}</th>
                <th className="ue-text-center">{ar ? "بعذر" : "Excused"}</th>
                <th className="ue-text-center">{ar ? "الإجمالي" : "Total"}</th>
                <th className="ue-text-center">{ar ? "النسبة" : "Rate"}</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => (
                <tr key={row.circleId}>
                  <td>
                    <div className="ue-name-cell">
                      <div className="ue-avatar ue-bg-brand-soft ue-text-brand">
                        {row.circleName.charAt(0)}
                      </div>
                      <div className="ue-name-text">
                        <span className="ue-name-primary">{row.circleName}</span>
                      </div>
                    </div>
                  </td>
                  <td>{row.centerName || "—"}</td>
                  <td className="ue-text-center ue-text-success ue-text-bold">
                    {formatNumber(row.totals.present)}
                  </td>
                  <td className="ue-text-center ue-text-error ue-text-bold">
                    {formatNumber(row.totals.absent)}
                  </td>
                  <td className="ue-text-center">{formatNumber(row.totals.late)}</td>
                  <td className="ue-text-center">{formatNumber(row.totals.excused)}</td>
                  <td className="ue-text-center">
                    <Badge variant="secondary" size="sm">
                      {formatNumber(row.total)}
                    </Badge>
                  </td>
                  <td className="ue-text-center">
                    <Badge
                      variant={
                        row.attendanceRate >= 80
                          ? "success"
                          : row.attendanceRate >= 60
                          ? "warning"
                          : "error"
                      }
                      size="sm"
                      className="ue-rate-badge"
                    >
                      {formatRate(row.attendanceRate)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {!attendanceQuery.isLoading && !attendanceQuery.isError && totalItems > 0 ? (
        <div className="pagination-enterprise admin-pagination-bar">
          <div className="pagination-info">
            {ar
              ? `عرض ${start + 1}–${Math.min(start + pageSize, totalItems)} من ${totalItems}`
              : `Showing ${start + 1}–${Math.min(start + pageSize, totalItems)} of ${totalItems}`}
          </div>
          <div className="pagination-controls">
            <select
              className="pagination-select"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              title={ar ? "عدد لكل صفحة" : "Page Size"}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / {ar ? "صفحة" : "page"}
                </option>
              ))}
            </select>
            <div className="pagination-buttons">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={currentPage <= 1}
                className="pagination-btn"
                title={ar ? "السابق" : "Previous"}
              >
                {ar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <span className="pagination-current">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={currentPage >= totalPages}
                className="pagination-btn"
                title={ar ? "التالي" : "Next"}
              >
                {ar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AttendancePage;
