import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  FileText,
  Users,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Download,
  Printer
} from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { DataTable } from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import type { StaffMonthlyReport } from "../staff-attendance.api";
import { useStaffMonthlyReport, useExportMonthlyReport } from "../staff-attendance.api";
import { useClientPagination } from "../../../shared/ui/useClientPagination";
import { printSummaryReport } from "../../accounting/printAccounting";

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
      cls: "blue"
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
            <div className="flex flex-col items-center border-l border-slate-100 pl-2">
              <span className="text-[10px] text-slate-400 uppercase">{ar ? "غاب" : "Abs"}</span>
              <span className="text-rose-600 font-bold text-[13px]">{employee.absentDays}</span>
            </div>
            <div className="flex flex-col items-center border-l border-slate-100 pl-2">
              <span className="text-[10px] text-slate-400 uppercase">{ar ? "بعذر" : "Exc"}</span>
              <span className="text-amber-600 font-bold text-[13px]">{employee.excusedDays ?? 0}</span>
            </div>
            <div className="flex flex-col items-center border-l border-slate-100 pl-2">
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

  const handlePrint = () => {
    printSummaryReport({
      title: ar ? "تقرير حضور الكادر" : "Staff Attendance Report",
      subtitle: ar ? `شهر ${month} - ${year}` : `Month ${month} - ${year}`,
      kpis: [
        { label: ar ? "أيام العمل" : "Work Days", value: workDays },
        { label: ar ? "عدد الكادر" : "Staff Count", value: staff.length },
        { label: ar ? "نسبة الحضور" : "Attendance %", value: `${attendancePct}%` },
        { label: ar ? "إجمالي الزيارات" : "Total Visits", value: totalVisits },
      ],
      rows: staff.map((e) => ({
        [ar ? "الموظف" : "Staff"]: e.fullName,
        [ar ? "حضر" : "Present"]: e.presentDays,
        [ar ? "غاب" : "Absent"]: e.absentDays,
        [ar ? "بعذر" : "Excused"]: e.excusedDays,
        [ar ? "إجازة" : "Leave"]: e.onLeaveDays,
        [ar ? "زيارات" : "Visits"]: e.visitsCount,
      })),
      columns: Object.keys(staff[0] || {}).length
        ? Object.keys({
            [ar ? "الموظف" : "Staff"]: "",
            [ar ? "حضر" : "Present"]: "",
            [ar ? "غاب" : "Absent"]: "",
            [ar ? "بعذر" : "Excused"]: "",
            [ar ? "إجازة" : "Leave"]: "",
            [ar ? "زيارات" : "Visits"]: "",
          }).map((k) => ({
            label: k,
            render: (r: any) => r[k],
            align: "center" as const,
          }))
        : [],
    });
  };

  return (
    <section className="fin-premium-container">
      {/* ── KPIs ── */}
      <div className="fin-premium-kpis mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="fin-kpi-card">
            <div className={`fin-kpi-card__icon fin-kpi-icon--${stat.cls}`}>
              <stat.icon size={20} />
            </div>
            <div className="fin-kpi-card__content">
              <span className="fin-kpi-card__value">{stat.value}</span>
              <span className="fin-kpi-card__label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="fin-filters-container mb-6">
        <div className="fin-filters-scroll">
          <div className="fin-filter-item" style={{ minWidth: 200 }}>
            <CalendarDays className="fin-filter-icon" size={16} />
            <select
              value={month}
              onChange={(e) => {
                setMonthStr(`${year}-${String(e.target.value).padStart(2, "0")}`);
                pagination.setCurrentPage(1);
              }}
            >
              {Array.from({ length: 12 }, (_, i) => {
                const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
                const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                return (
                  <option key={i + 1} value={i + 1}>
                    {ar ? arabicMonths[i] : englishMonths[i]}
                  </option>
                );
              })}
            </select>
            <span className="text-slate-300 mx-1">/</span>
            <input
              type="number"
              value={year}
              onChange={(e) => {
                setMonthStr(`${e.target.value}-${String(month).padStart(2, "0")}`);
                pagination.setCurrentPage(1);
              }}
              style={{ width: 70, fontWeight: 600 }}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMonthStr(DEFAULT_MONTH)}
            disabled={monthStr === DEFAULT_MONTH}
          >
            {ar ? "الشهر الحالي" : "Current Month"}
          </Button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" size="sm" leftIcon={<Printer size={14} />} onClick={handlePrint}>
            {ar ? "طباعة" : "Print"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={() => exportM.mutate({ month, year })}
            disabled={exportM.isPending || staff.length === 0}
          >
            {exportM.isPending ? (ar ? "جارٍ التصدير..." : "Exporting...") : (ar ? "تصدير CSV" : "Export CSV")}
          </Button>
        </div>
      </div>

      {reportQuery.isError ? (
        <ErrorState
          title={ar ? "تعذر تحميل التقرير الشهري" : "Unable to load monthly report"}
          onRetry={() => void reportQuery.refetch()}
        />
      ) : (
        <div className="fin-premium-panel">
          <DataTable
            columns={columns}
            rows={pagination.pagedRows}
            rowKey="userId"
            loading={reportQuery.isLoading}
            emptyState={
              <EmptyState
                title={ar ? "لا توجد بيانات" : "No data found"}
              />
            }
          />

          {!reportQuery.isLoading && pagination.totalItems > 0 && (
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
          )}
        </div>
      )}
    </section>
  );
}

