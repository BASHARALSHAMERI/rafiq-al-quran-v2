import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  FileText,
  Users,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight
} from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { DataTable } from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import type { StaffMonthlyReport } from "../staff-attendance.api";
import { useStaffMonthlyReport, useExportMonthlyReport } from "../staff-attendance.api";
import {
  useClientPagination
} from "../../../shared/ui/useClientPagination";

const DEFAULT_MONTH = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
})();

const getRoleLabel = (role: string, ar: boolean) => {
  switch (role) {
    case "TEACHER":
      return ar ? "معلم" : "Teacher";
    case "SUPERVISOR":
      return ar ? "مشرف" : "Supervisor";
    case "CENTER_ADMIN":
      return ar ? "مدير مركز" : "Center Admin";
    default:
      return role;
  }
};

export function MonthlyStaffReportView() {
  const { language } = useI18n();
  const ar = language === "ar";

  const [monthStr, setMonthStr] = useState(DEFAULT_MONTH);

  const year = Number(monthStr.split("-")[0]);
  const month = Number(monthStr.split("-")[1]);

  const reportQuery = useStaffMonthlyReport(month, year);
  const staff = reportQuery.data?.report ?? [];
  const workDays = reportQuery.data?.workDays ?? 0;
  const pagination = useClientPagination(staff, { initialPageSize: 25 });
  const exportM = useExportMonthlyReport();

  const totalPresent = staff.reduce((sum, employee) => sum + employee.presentDays, 0);
  const totalVisits = staff.reduce((sum, employee) => sum + (employee.visitsCount || 0), 0);
  const theoreticalTotalDays = staff.length * workDays;
  const attendancePct =
    theoreticalTotalDays > 0
      ? ((totalPresent / theoreticalTotalDays) * 100).toFixed(1)
      : "0.0";

  const stats = [
    {
      label: ar ? "أيام العمل" : "Work Days",
      value: workDays,
      icon: Clock,
      cls: "brand"
    },
    {
      label: ar ? "عدد الكادر" : "Staff Count",
      value: staff.length,
      icon: Users,
      cls: "violet"
    },
    {
      label: ar ? "نسبة الحضور" : "Attendance %",
      value: `${attendancePct}%`,
      icon: CheckCircle,
      cls: "emerald"
    },
    {
      label: ar ? "إجمالي الزيارات" : "Total Visits",
      value: totalVisits,
      icon: FileText,
      cls: "amber"
    }
  ];

  const columns = useMemo(
    () => [
      {
        id: "employee",
        header: ar ? "الموظف" : "Staff Member",
        cell: (employee: StaffMonthlyReport) => (
          <div className="staff-ops-person">
            <div className="exams-avatar bg-slate-100 text-slate-700 font-bold text-xs shadow-sm">
              {employee.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="staff-ops-person__meta">
              <span className="staff-ops-person__name font-bold">{employee.fullName}</span>
              <span className="staff-ops-person__sub text-[10px]">
                {ar ? "المعرف" : "ID"} #{employee.userId} • {getRoleLabel(employee.role, ar)}
              </span>
            </div>
          </div>
        )
      },
      {
        id: "attendance",
        header: ar ? "الحضور" : "Attendance",
        align: "center" as const,
        cell: (employee: StaffMonthlyReport) => (
          <div className="flex gap-2 justify-center">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase">{ar ? "حضر" : "Pres"}</span>
              <span className="text-emerald-600 font-bold text-[13px]">{employee.presentDays}</span>
            </div>
            <div className="flex flex-col items-center border-x border-slate-100 px-2">
              <span className="text-[10px] text-slate-400 uppercase">{ar ? "غاب" : "Abs"}</span>
              <span className="text-rose-600 font-bold text-[13px]">{employee.absentDays}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase">{ar ? "إجازة" : "Leave"}</span>
              <span className="text-blue-600 font-bold text-[13px]">{employee.onLeaveDays ?? 0}</span>
            </div>
          </div>
        )
      },
      {
        id: "achievement",
        header: ar ? "الإنجاز" : "Achievement",
        align: "center" as const,
        cell: (employee: StaffMonthlyReport) =>
          employee.role === "SUPERVISOR" ? (
            <Badge variant="info" size="sm" className="font-bold">
              {employee.visitsCount || 0} {ar ? "زيارة" : "Visits"}
            </Badge>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[12px] font-bold text-slate-700">
                {employee.workingHours.toFixed(1)} / {employee.expectedHours.toFixed(1)}
              </span>
              <span className="text-[9px] text-slate-400 uppercase">{ar ? "ساعة عمل" : "Work Hours"}</span>
            </div>
          )
      },
      {
        id: "discipline",
        header: ar ? "الانضباط" : "Discipline",
        cell: (employee: StaffMonthlyReport) => {
          const percentage = Number(
            (workDays > 0 ? (employee.presentDays / workDays) * 100 : 0).toFixed(1)
          );
          const toneClass =
            percentage >= 85
              ? "bg-emerald-500"
              : percentage >= 60
                ? "bg-amber-500"
                : "bg-rose-500";

          return (
            <div className="w-[120px] space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                <span>{percentage}%</span>
                <ArrowUpRight size={12} className={percentage >= 85 ? "text-emerald-500" : "text-slate-300"} />
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  className={`h-full ${toneClass}`}
                />
              </div>
            </div>
          );
        }
      }
    ],
    [ar, workDays]
  );

  return (
    <section className="staff-ops-view ctr-workspace">
      {/* ── KPIs ── */}
      <div className="ctr-kpis-modern mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {stats.map((stat) => (
          <div key={stat.label} className={`ctr-kpi-modern ${stat.cls}`}>
            <div className="ctr-kpi-icon-wrap">
              <stat.icon size={22} />
            </div>
            <div className="ctr-kpi-content">
              <div className="ctr-kpi-val">{stat.value}</div>
              <div className="ctr-kpi-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="ctr-controls mb-6">
        <div className="flex gap-4 items-center flex-1">
          <div className="ctr-search-wrap max-w-[240px]">
            <CalendarDays className="ctr-search-icon" size={16} />
            <input
              type="month"
              className="ctr-search-input !px-10"
              value={monthStr}
              onChange={(e) => {
                setMonthStr(e.target.value);
                pagination.setCurrentPage(1);
              }}
            />
          </div>
          <div className="text-[12px] text-slate-500 italic">
            {ar ? "يتم تحديث البيانات تلقائياً عند تغيير الشهر" : "Data updates automatically on month change"}
          </div>
        </div>

        <div className="ctr-filters-group">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMonthStr(DEFAULT_MONTH)}
            disabled={monthStr === DEFAULT_MONTH}
          >
            {ar ? "الشهر الحالي" : "Current Month"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => exportM.mutate({ month, year })}
            disabled={exportM.isPending || staff.length === 0}
            className="flex items-center gap-1.5"
          >
            <Download size={14} />
            {exportM.isPending ? (ar ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0635\u062f\u064a\u0631..." : "Exporting...") : (ar ? "\u062a\u0635\u062f\u064a\u0631 CSV" : "Export CSV")}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {reportQuery.isError ? (
          <ErrorState
            title={ar ? "تعذر تحميل التقرير الشهري" : "Unable to load monthly report"}
            onRetry={() => void reportQuery.refetch()}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ctr-card-modern !p-0 overflow-hidden shadow-sm border-slate-200"
          >
            <DataTable
              columns={columns}
              rows={pagination.pagedRows}
              rowKey="userId"
              loading={reportQuery.isLoading}
              className="!border-none"
              emptyState={
                <EmptyState
                  title={ar ? "لا توجد بيانات" : "No data found"}
                />
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pagination ── */}
      {!reportQuery.isLoading && pagination.totalItems > 0 && (
        <div className="ctr-footer mt-6">
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
      )}
    </section>
  );
}

