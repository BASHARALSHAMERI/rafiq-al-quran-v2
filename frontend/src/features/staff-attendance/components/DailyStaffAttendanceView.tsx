import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Users,
  XCircle,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  Calendar,
  User
} from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { Badge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Button } from "../../../components/ui/Button";
import type { StaffAttendanceRecord } from "../staff-attendance.api";
import { useStaffAttendance } from "../staff-attendance.api";
import { useTimeFormat, fmtTime } from "../../../shared/utils/time-format";
import {
  useClientPagination
} from "../../../shared/ui/useClientPagination";
import { fadeUp } from "../../../shared/pageAnimations";

const DEFAULT_DATE = new Date().toISOString().slice(0, 10);

const dayNames = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY"
] as const;

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

const getStatusBadge = (status: string, ar: boolean) => {
  switch (status) {
    case "PRESENT":
      return (
        <Badge variant="success" size="sm">
          {ar ? "حاضر" : "Present"}
        </Badge>
      );
    case "LATE":
      return (
        <Badge variant="warning" size="sm">
          {ar ? "متأخر" : "Late"}
        </Badge>
      );
    case "ABSENT":
      return (
        <Badge variant="error" size="sm">
          {ar ? "غائب" : "Absent"}
        </Badge>
      );
    case "EXCUSED":
      return (
        <Badge variant="info" size="sm">
          {ar ? "بعذر" : "Excused"}
        </Badge>
      );
    case "ON_LEAVE":
      return (
        <Badge variant="info" size="sm">
          {ar ? "إجازة" : "On Leave"}
        </Badge>
      );
    case "WAITING":
      return (
        <Badge variant="secondary" size="sm">
          {ar ? "بانتظار الدوام" : "Waiting for shift"}
        </Badge>
      );
    default:
      return null;
  }
};

const getDerivedStatus = (record: StaffAttendanceRecord, dateStr: string, scheduledTimeStr: string) => {
  if (record.status !== "ABSENT") return record.status;
  if (record.checkInTime) return record.status;

  const now = new Date();
  const targetDate = new Date(dateStr);
  const isToday = now.toISOString().slice(0, 10) === dateStr;
  const isFutureDate = targetDate > now && !isToday;

  if (isFutureDate) return "WAITING";

  if (isToday) {
    if (record.effectiveShiftStart) {
      const shiftStart = new Date(record.effectiveShiftStart);
      if (now < shiftStart) return "WAITING";
    } else if (scheduledTimeStr) {
      const firstSlot = scheduledTimeStr.split(",")[0]?.trim();
      if (firstSlot) {
        const startStr = firstSlot.split("-")[0].trim();
        const [hh, mm] = startStr.split(":").map(Number);
        const shiftStartToday = new Date();
        shiftStartToday.setHours(hh, mm, 0, 0);
        if (now < shiftStartToday) return "WAITING";
      }
    }
  }

  return record.status;
};

const getGeoStateBadge = (state: string | null | undefined, ar: boolean) => {
  switch (state) {
    case "VERIFIED":
    case "INSIDE":
      return <Badge variant="success" size="sm">✓ {ar ? "متحقق" : "Verified"}</Badge>;
    case "OUTSIDE":
    case "OUTSIDE_RANGE":
      return <Badge variant="warning" size="sm">⚠ {ar ? "خارج" : "Outside"}</Badge>;
    case "NOT_SENT":
    case "MISSING_TARGET":
      return <Badge variant="secondary" size="sm">— {ar ? "بلا بيانات" : "No Data"}</Badge>;
    default:
      return <Badge variant="secondary" size="sm">—</Badge>;
  }
};

const getScheduleDetails = (record: StaffAttendanceRecord, date: string, hour12 = true) => {
  if (record.effectiveShiftStart && record.effectiveShiftEnd) {
    const expectedHours =
      (new Date(record.effectiveShiftEnd).getTime() -
        new Date(record.effectiveShiftStart).getTime()) /
      3_600_000;
    const locale = hour12 ? "ar-SA" : "ar-SA-u-nu-latn";
    return {
      scheduledTime: `${fmtTime(record.effectiveShiftStart, locale, hour12)} - ${fmtTime(record.effectiveShiftEnd, locale, hour12)}`,
      expectedHours
    };
  }

  const currentDayName = dayNames[new Date(date).getDay()] ?? "SUNDAY";
  let slots: Array<{fromTime: string | null; toTime: string | null}> = [];

  if (record.user.role === "TEACHER") {
    slots = (record.user.taughtCircles ?? []).flatMap((circle) =>
      (circle.weeklyScheduleSlots ?? []).filter(
        (slot) => slot.dayOfWeek === currentDayName && slot.fromTime && slot.toTime
      )
    );
  } else {
    slots = (record.user.staffSchedules ?? []).flatMap((schedule) =>
      (schedule.slots ?? []).filter(
        (slot) => slot.dayOfWeek === currentDayName && slot.fromTime && slot.toTime
      )
    );
  }

  let expectedHours = 0;

  for (const slot of slots) {
    if (!slot.fromTime || !slot.toTime) continue;
    const [startHour = 0, startMinute = 0] = slot.fromTime.split(":").map(Number);
    const [endHour = 0, endMinute = 0] = slot.toTime.split(":").map(Number);
    expectedHours += endHour + endMinute / 60 - (startHour + startMinute / 60);
  }

  return {
    scheduledTime: slots
      .filter((s) => s.fromTime && s.toTime)
      .map((slot) => `${slot.fromTime} - ${slot.toTime}`)
      .join(", "),
    expectedHours
  };
};

export function DailyStaffAttendanceView() {
  const { language } = useI18n();
  const ar = language === "ar";
  const [date, setDate] = useState(DEFAULT_DATE);
  const [search, setSearch] = useState("");

  const attendanceQuery = useStaffAttendance(date);
  const records = attendanceQuery.data ?? [];
  const { hour12 } = useTimeFormat();

  const filteredRecords = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return records;
    }

    return records.filter((record) => {
      const name = record.user.fullName.toLowerCase();
      const role = record.user.role.toLowerCase();
      return name.includes(normalized) || role.includes(normalized);
    });
  }, [records, search]);

  const pagination = useClientPagination(filteredRecords, { initialPageSize: 15 });

  const stats = useMemo(() => {
    let present = 0, late = 0, absent = 0, excused = 0, waiting = 0;

    filteredRecords.forEach((record) => {
      const { scheduledTime } = getScheduleDetails(record, date, hour12);
      const derived = getDerivedStatus(record, date, scheduledTime);
      if (derived === "PRESENT") present++;
      else if (derived === "LATE") late++;
      else if (derived === "ABSENT") absent++;
      else if (derived === "EXCUSED" || derived === "ON_LEAVE") excused++;
      else if (derived === "WAITING") waiting++;
    });

    return [
      {
        label: ar ? "إجمالي الكادر" : "Total Staff",
        value: filteredRecords.length,
        icon: Users,
        cls: "brand"
      },
      {
        label: ar ? "حاضر" : "Present",
        value: present,
        icon: CheckCircle,
        cls: "emerald"
      },
      {
        label: ar ? "متأخر" : "Late",
        value: late,
        icon: Clock,
        cls: "amber"
      },
      {
        label: ar ? "بانتظار الدوام" : "Waiting",
        value: waiting,
        icon: Clock,
        cls: "slate"
      },
      {
        label: ar ? "غائب" : "Absent",
        value: absent,
        icon: XCircle,
        cls: "violet"
      },
      {
        label: ar ? "بعذر / إجازة" : "Excused / Leave",
        value: excused,
        icon: AlertCircle,
        cls: "brand"
      }
    ];
  }, [ar, filteredRecords]);

  return (
    <section className="staff-ops-view ctr-workspace">
      {/* ── KPIs Strip ── */}
      <div 
        className="ctr-kpis-modern mb-6"
        style={{ 
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          width: '100%' 
        }}
      >
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

      {/* ── Controls Toolbar ── */}
      <div className="satt-toolbar">
        <div className="satt-toolbar__search">
          <Search size={16} />
          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              pagination.setCurrentPage(1);
            }}
            placeholder={ar ? "ابحث بالاسم أو الدور الوظيفي..." : "Search by name or role..."}
          />
        </div>

        <div className="satt-toolbar__filters">
          <div className="satt-toolbar__date-wrap">
            <Calendar className="satt-toolbar__date-icon" size={15} />
            <input
              type="date"
              className="satt-sel satt-sel--date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                pagination.setCurrentPage(1);
              }}
            />
          </div>
          
          <Button
             variant="ghost"
             size="sm"
             className="h-[38px] px-4 text-slate-500 hover:bg-slate-100 font-semibold text-[0.82rem]"
             onClick={() => {
                setDate(DEFAULT_DATE);
                setSearch("");
                pagination.setCurrentPage(1);
             }}
          >
             {ar ? "اليوم" : "Today"}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {attendanceQuery.isError ? (
          <ErrorState
            title={ar ? "تعذر تحميل سجل الحضور" : "Unable to load attendance"}
            description={ar ? "حدث خطأ أثناء جلب سجل الحضور لهذا اليوم." : "An error occurred while loading the attendance register."}
            onRetry={() => void attendanceQuery.refetch()}
          />
        ) : attendanceQuery.isLoading ? (
          <div className="ctr-grid-modern">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="ctr-card-modern animate-pulse !h-[220px] opacity-40" />
            ))}
          </div>
        ) : pagination.pagedRows.length === 0 ? (
          <EmptyState
            title={ar ? "لا توجد سجلات لهذا التاريخ" : "No records for this date"}
          />
        ) : (
          <div className="ctr-grid-modern">
            {pagination.pagedRows.map((record) => {
              const { expectedHours, scheduledTime } = getScheduleDetails(record, date, hour12);
              const derivedStatus = getDerivedStatus(record, date, scheduledTime);
              const lateMinutes = record.lateMinutes ?? 0;
              const actualHours =
                record.checkInTime && record.checkOutTime
                  ? (new Date(record.checkOutTime).getTime() -
                      new Date(record.checkInTime).getTime()) /
                    (1000 * 3600)
                  : 0;

              return (
                <motion.div
                  key={record.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="ctr-card-modern"
                >
                  <div className="ctr-card-header">
                    <div className={`ctr-card-icon-box ${
                      derivedStatus === 'PRESENT' ? 'bg-emerald-50 text-emerald-600' : 
                      derivedStatus === 'ABSENT' ? 'bg-rose-50 text-rose-600' : 
                      derivedStatus === 'WAITING' ? 'bg-slate-50 text-slate-500' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      <UserCheck size={22} />
                    </div>
                    <div className="ctr-card-title-wrap">
                      <h3 className="ctr-card-title text-[15px] font-bold">{record.user.fullName}</h3>
                      <div className="ctr-card-subtitle flex items-center gap-1.5">
                        <User size={12} className="text-slate-400" />
                        <span className="text-slate-500 font-medium text-[11px]">{getRoleLabel(record.user.role, ar)} • #{record.user.id}</span>
                      </div>
                    </div>
                    <div className="ctr-card-status-row">
                      {getStatusBadge(derivedStatus, ar)}
                    </div>
                  </div>

                  <div className="ctr-card-details bg-slate-50/30 p-3 rounded-xl mt-3 space-y-2">
                    <div className="ctr-card-detail-row">
                      <span className="ctr-card-detail-label text-[10px]">{ar ? "وقت الحضور" : "Check-in"}</span>
                      <span className="ctr-card-detail-val text-[11px] font-bold">{fmtTime(record.checkInTime, ar ? "ar-SA-u-nu-latn" : "en-US", hour12)}</span>
                    </div>

                    <div className="ctr-card-detail-row">
                      <span className="ctr-card-detail-label text-[10px]">{ar ? "وقت الانصراف" : "Check-out"}</span>
                      <span className="ctr-card-detail-val text-[11px] font-bold">{fmtTime(record.checkOutTime, ar ? "ar-SA-u-nu-latn" : "en-US", hour12)}</span>
                    </div>

                    <div className="ctr-card-detail-row">
                      <span className="ctr-card-detail-label text-[10px]">{ar ? "الموقع" : "Location"}</span>
                      <div className="scale-75 origin-inline-end">
                        {getGeoStateBadge(record.geoState, ar)}
                      </div>
                    </div>

                    <div className="ctr-card-detail-row">
                      <span className="ctr-card-detail-label text-[10px]">{ar ? "ساعات العمل" : "Work Hours"}</span>
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[11px] font-bold text-brand">{actualHours > 0 ? actualHours.toFixed(1) : "—"}</span>
                          <span className="text-[9px] text-slate-400">/ {expectedHours.toFixed(1)}</span>
                        </div>
                        {scheduledTime && (
                          <span className="text-[9px] text-slate-400">{scheduledTime}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="ctr-card-actions mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider">{ar ? "وقت التأخير" : "Delay Time"}</span>
                      <span className={`text-[11px] font-bold ${lateMinutes > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {lateMinutes > 0 ? (ar ? `${lateMinutes} دقيقة` : `${lateMinutes} min`) : (ar ? "لا يوجد" : "None")}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* ── Footer / Pagination ── */}
      {!attendanceQuery.isLoading && !attendanceQuery.isError && pagination.totalItems > 0 && (
        <div className="satt-pag">
          <span className="satt-pag__info">
            {ar
              ? `عرض ${Math.min(pagination.totalItems, (pagination.currentPage - 1) * pagination.pageSize + 1)}–${Math.min(pagination.totalItems, pagination.currentPage * pagination.pageSize)} من ${pagination.totalItems} سجل`
              : `Showing ${Math.min(pagination.totalItems, (pagination.currentPage - 1) * pagination.pageSize + 1)}–${Math.min(pagination.totalItems, pagination.currentPage * pagination.pageSize)} of ${pagination.totalItems} records`
            }
          </span>
          <div className="satt-pag__right">
            <div className="satt-pag__size-wrap">
              <span>{ar ? "الصفوف:" : "Rows:"}</span>
              <select
                className="satt-pag__size"
                value={pagination.pageSize}
                onChange={(e) => pagination.setPageSize(Number(e.target.value))}
              >
                {[15, 30, 60].map((sz) => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
            </div>
            <div className="satt-pag__nav">
              <button
                className="satt-pag__btn"
                disabled={pagination.currentPage === 1}
                onClick={() => pagination.setCurrentPage(1)}
                title={ar ? "الأولى" : "First"}
              >
                {ar ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                {ar ? <ChevronRight size={14} style={{ marginInlineStart: -8 }} /> : <ChevronLeft size={14} style={{ marginInlineStart: -8 }} />}
              </button>
              <button
                className="satt-pag__btn"
                disabled={pagination.currentPage === 1}
                onClick={() => pagination.setCurrentPage(pagination.currentPage - 1)}
                title={ar ? "السابق" : "Prev"}
              >
                {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              <span className="satt-pag__cur">{pagination.currentPage} / {pagination.totalPages}</span>
              <button
                className="satt-pag__btn"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => pagination.setCurrentPage(pagination.currentPage + 1)}
                title={ar ? "التالي" : "Next"}
              >
                {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
              <button
                className="satt-pag__btn"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => pagination.setCurrentPage(pagination.totalPages)}
                title={ar ? "الأخيرة" : "Last"}
              >
                {ar ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                {ar ? <ChevronLeft size={14} style={{ marginInlineStart: -8 }} /> : <ChevronRight size={14} style={{ marginInlineStart: -8 }} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
