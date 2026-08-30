import { type ElementType, type ReactNode, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity as ActivityIcon,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  CalendarRange,
  CheckCircle,
  ClipboardList,
  Clock,
  FileBarChart2,
  Filter,
  GraduationCap,
  Inbox,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useI18n } from "../app/i18n";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { KpiSkeleton, Skeleton } from "../components/ui/Skeleton";
import { useAuthStore } from "../features/auth/auth.store";
import {
  useActivityFeedQuery,
  useAttendanceSummaryQuery,
  useDashboardMetricsQuery,
} from "../features/dashboard/dashboard.hooks";
import type {
  ActivityFeedItem,
  AttendanceSummaryItem,
  DashboardFilters,
} from "../features/dashboard/types";
import type { FinanceReportDashboardV2 } from "../features/finance-v2/types";
import type { Role } from "../features/auth/types";
import { useCentersQuery, useCirclesQuery } from "../features/org/org.hooks";
import { canReadCenters, canReadCircles } from "../features/org/org.permissions";
import { roleCanAccessRoute, type AdminRouteId } from "../app/route-meta";
import { useQuery } from "@tanstack/react-query";
import { financeV2Api } from "../features/finance-v2/finance-v2.api";

import "../styles/pages/dashboard-v3.css";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

function greeting(ar: boolean): string {
  const h = new Date().getHours();
  if (ar) return h < 12 ? "صباح الخير" : h < 17 ? "طاب مساؤك" : "مساء الخير";
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function formatMoney(n: number | undefined | null): string {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
  } catch { return String(n); }
}

function adenDateInput(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Aden",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function staffRoleLabel(role: string, ar: boolean): string {
  const labels: Record<string, [string, string]> = {
    TEACHER: ["المعلمون", "Teachers"],
    SUPERVISOR: ["المشرفون", "Supervisors"],
    CENTER_ADMIN: ["مديرو المراكز", "Center admins"],
    ACCOUNTANT: ["المحاسبون", "Accountants"],
    FINANCE_MANAGER: ["مديرو المالية", "Finance managers"],
    TREASURER: ["أمناء الصندوق", "Treasurers"],
    AUDITOR: ["المراجعون", "Auditors"],
    OTHER: ["موظفون آخرون", "Other staff"],
  };
  return labels[role]?.[ar ? 0 : 1] ?? role;
}

type Tone = "primary" | "success" | "warning" | "info" | "neutral" | "danger";
const ATTENDANCE_ALERT_THRESHOLD = 65;

type CenterPerformance = {
  centerId: number;
  centerName: string;
  circleCount: number;
  activeStudents: number;
  present: number;
  total: number;
  attendanceRate: number | null;
};

const activityMeta: Record<string, { icon: ElementType; tone: Tone }> = {
  LOGIN: { icon: CheckCircle, tone: "success" },
  LOGOUT: { icon: AlertCircle, tone: "neutral" },
  USER_CREATED: { icon: Users, tone: "info" },
  ATTENDANCE_MARKED: { icon: Calendar, tone: "info" },
  ATTENDANCE_UPDATED: { icon: Clock, tone: "warning" },
  STUDENT_ENROLLED: { icon: GraduationCap, tone: "success" },
};

const activityMessagesAr: Record<string, string> = {
  "Saved follow-up draft": "حُفظت مسودة المتابعة",
  "Recorded final follow-up": "سُجلت متابعة نهائية",
  "Updated follow-up draft": "حُدّثت مسودة المتابعة",
  "Finalized follow-up draft": "اعتُمدت مسودة المتابعة",
  "Created remote recitation slot": "أُنشئت فترة تسميع عن بُعد",
  "Updated remote recitation slot": "حُدّثت فترة التسميع عن بُعد",
  "Archived remote recitation slot": "أُرشفت فترة التسميع عن بُعد",
  "Requested remote recitation booking": "طُلب حجز تسميع عن بُعد",
  "Approved remote recitation booking": "تمت الموافقة على حجز التسميع عن بُعد",
  "Rejected remote recitation booking": "رُفض حجز التسميع عن بُعد",
  "Cancelled remote recitation booking": "أُلغي حجز تسميع عن بُعد",
  "Completed remote recitation booking": "اكتمل حجز تسميع عن بُعد",
  "User logged in": "سجّل المستخدم الدخول",
  "User logged out": "سجّل المستخدم الخروج",
};

function activityMessage(item: ActivityFeedItem, ar: boolean): string {
  if (!ar) return item.message;
  return activityMessagesAr[item.message]
    ?? (item.activityType === "FOLLOW_UP_RECORDED" ? "سُجل نشاط متابعة" : item.message);
}

export default function DashboardPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const role = user?.role;
  const canLoadCenters = canReadCenters(role);
  const canLoadCircles = canReadCircles(role);
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isFinanceRole = role
    ? ["ACCOUNTANT", "FINANCE_MANAGER", "TREASURER", "AUDITOR"].includes(role)
    : false;

  const toNumber = (value: string): number | undefined => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  };

  const now = new Date();
  const defaultTo = adenDateInput(now);
  const defaultFrom = adenDateInput(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));

  const [centerId, setCenterId] = useState<number | undefined>();
  const [circleId, setCircleId] = useState<number | undefined>();
  const [from, setFrom] = useState<string>(defaultFrom);
  const [to, setTo] = useState<string>(defaultTo);

  const hasInvalidRange = from > to;
  const filters = useMemo<DashboardFilters>(
    () => ({ centerId, circleId, from, to }),
    [centerId, circleId, from, to],
  );

  const centersQ = useCentersQuery({ enabled: canLoadCenters });
  const circlesQ = useCirclesQuery(centerId, { enabled: canLoadCircles });
  const metricsQ = useDashboardMetricsQuery(filters, !hasInvalidRange);
  const activityQ = useActivityFeedQuery({ ...filters, limit: 10 }, !hasInvalidRange);
  const attendQ = useAttendanceSummaryQuery(filters, !hasInvalidRange);

  const canQueryFinance = !hasInvalidRange && !circleId && (isFinanceRole || isSuperAdmin);
  const financeDashboardQ = useQuery({
    queryKey: ["finance", "dashboard", "reports", centerId ?? null],
    queryFn: () => financeV2Api.getReportDashboard({ centerId }),
    enabled: canQueryFinance,
    staleTime: 20_000,
  });

  const metrics = hasInvalidRange ? undefined : metricsQ.data;
  const attendanceDelta = metrics?.totals.attendanceDelta;
  const activityRows = hasInvalidRange ? [] : activityQ.data ?? [];
  const centers = canLoadCenters ? centersQ.data?.items ?? [] : [];
  const circles = canLoadCircles ? circlesQ.data?.items ?? [] : [];
  const scopeName = circleId
    ? circles.find((circle) => circle.id === circleId)?.name ?? `${ar ? "الحلقة" : "Circle"} #${circleId}`
    : centerId
      ? centers.find((center) => center.id === centerId)?.name ?? `${ar ? "المركز" : "Center"} #${centerId}`
      : isSuperAdmin
        ? ar ? "الجمعية" : "Organization"
        : ar ? "نطاق صلاحيتك" : "Your access";
  const scopeLabel = ar ? `نطاق العرض: ${scopeName}` : `Scope: ${scopeName}`;
  const attendanceRows = useMemo<AttendanceSummaryItem[]>(
    () => (hasInvalidRange ? [] : attendQ.data ?? []),
    [attendQ.data, hasInvalidRange],
  );

  const attendanceTotals = useMemo(
    () =>
      attendanceRows.reduce(
        (acc, item) => ({
          present: acc.present + (item.totals?.present || 0),
          absent: acc.absent + (item.totals?.absent || 0),
          late: acc.late + (item.totals?.late || 0),
          excused: acc.excused + (item.totals?.excused || 0),
        }),
        { present: 0, absent: 0, late: 0, excused: 0 },
      ),
    [attendanceRows],
  );

  const attendanceTotal =
    attendanceTotals.present +
    attendanceTotals.absent +
    attendanceTotals.late +
    attendanceTotals.excused;
  const pct = (val: number) => (attendanceTotal > 0 ? Math.round((val / attendanceTotal) * 100) : 0);
  const presentPct = pct(attendanceTotals.present);

  const sortedAttendance = useMemo(
    () => [...attendanceRows].sort((a, b) => b.attendanceRate - a.attendanceRate),
    [attendanceRows],
  );
  const topCircles = useMemo(
    () => sortedAttendance.filter((c) => c.total > 0 && c.attendanceRate >= ATTENDANCE_ALERT_THRESHOLD).slice(0, 3),
    [sortedAttendance],
  );
  const attentionCircles = useMemo(
    () => sortedAttendance.filter((c) => c.total > 0 && c.attendanceRate < ATTENDANCE_ALERT_THRESHOLD).reverse().slice(0, 3),
    [sortedAttendance],
  );
  const unreportedCircles = attendanceRows.filter((circle) => circle.total === 0).length;

  const centerPerformance = useMemo<CenterPerformance[]>(() => {
    const grouped = new Map<number, CenterPerformance>();
    for (const center of centers) {
      grouped.set(center.id, {
        centerId: center.id,
        centerName: center.name,
        circleCount: 0,
        activeStudents: 0,
        present: 0,
        total: 0,
        attendanceRate: null,
      });
    }
    for (const circle of attendanceRows) {
      if (!circle.centerId || !circle.centerName) continue;
      const current = grouped.get(circle.centerId) ?? {
        centerId: circle.centerId,
        centerName: circle.centerName,
        circleCount: 0,
        activeStudents: 0,
        present: 0,
        total: 0,
        attendanceRate: null,
      };
      current.circleCount += 1;
      current.activeStudents += circle.activeStudents;
      current.present += circle.totals.present;
      current.total += circle.total;
      current.attendanceRate = current.total > 0 ? Math.round((current.present / current.total) * 100) : null;
      grouped.set(circle.centerId, current);
    }
    return [...grouped.values()].sort((a, b) => (b.attendanceRate ?? -1) - (a.attendanceRate ?? -1));
  }, [attendanceRows, centers]);

  const topCenters = centerPerformance
    .filter((center) => center.attendanceRate !== null && center.attendanceRate >= ATTENDANCE_ALERT_THRESHOLD)
    .slice(0, 3);
  const attentionCenters = [...centerPerformance]
    .filter((center) => center.attendanceRate === null || center.attendanceRate < ATTENDANCE_ALERT_THRESHOLD)
    .sort((a, b) => (a.attendanceRate ?? -1) - (b.attendanceRate ?? -1))
    .slice(0, 3);
  const staffAttendance = metrics?.staffAttendance;
  const staffRecordedTotal = staffAttendance?.recordedTotal ?? 0;
  const decisionCount =
    Number(attendanceTotals.absent > 0) +
    Number(attendanceTotals.late > 0) +
    Number(attentionCircles.length > 0) +
    Number(unreportedCircles > 0) +
    Number((staffAttendance?.totals.absent ?? 0) > 0) +
    Number((staffAttendance?.totals.late ?? 0) > 0);

  const loading = !hasInvalidRange && (
    metricsQ.isPending ||
    attendQ.isPending
  );
  const hasError = metricsQ.isError || attendQ.isError;

  const refresh = () => {
    void metricsQ.refetch();
    void activityQ.refetch();
    void attendQ.refetch();
    if (canLoadCenters) void centersQ.refetch();
    if (canLoadCircles) void circlesQ.refetch();
    if (canQueryFinance) void financeDashboardQ.refetch();
  };

  const resetFilters = () => {
    setCenterId(undefined);
    setCircleId(undefined);
    setFrom(defaultFrom);
    setTo(defaultTo);
  };

  const activeFiltersCount =
    (centerId ? 1 : 0) +
    (circleId ? 1 : 0) +
    (from !== defaultFrom ? 1 : 0) +
    (to !== defaultTo ? 1 : 0);

  const firstName = user?.fullName?.split(" ")[0] || (ar ? "المستخدم" : "User");

  const todayGregorian = now.toLocaleDateString(ar ? "ar-EG" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const todayHijri = (() => {
    try {
      return new Intl.DateTimeFormat(ar ? "ar-SA-u-ca-islamic-umalqura" : "en-US-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now);
    } catch {
      return "";
    }
  })();

  const heroDescription = isSuperAdmin
    ? ar
      ? "ملخص أداء الجمعية والمراكز خلال الفترة المحددة."
      : "Summary of organization and centers performance for the selected period."
    : ar
      ? "ملخص أداء المركز والحلقات خلال الفترة المحددة."
      : "Summary of center and circles performance for the selected period.";

  /* ─── Health classification (data-driven, no fake numbers) ─── */
  const healthState: { tone: Tone; label: string } =
    attendanceTotal === 0
      ? { tone: "neutral", label: ar ? "لا توجد بيانات" : "No data" }
      : presentPct >= 85
        ? { tone: "success", label: ar ? "جيد" : "Good" }
        : presentPct >= 65
          ? { tone: "warning", label: ar ? "يحتاج متابعة" : "Needs attention" }
          : { tone: "danger", label: ar ? "حرج" : "Critical" };

  /* ─── Quick links — only routes the role can access ─── */
  const quickLinks = buildQuickLinks(role, ar);

  return (
    <div className="page dash">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="dash-stack"
      >
        {/* ── 1. HEADER ── */}
        <motion.header variants={fadeUp} className="dash-header">
          <div className="dash-header__start">
            <div className="dash-header__icon-box" aria-hidden>
              <Sparkles size={18} />
            </div>
            <div className="dash-header__text">
              <h1 className="dash-header__greeting">
                {greeting(ar)}، <strong>{firstName}</strong>
              </h1>
              <p className="dash-header__desc">{heroDescription}</p>
              <div className="dash-header__dates">
                {todayHijri && (
                  <span className="dash-header__date-hijri">
                    <Calendar size={14} aria-hidden />
                    {todayHijri}
                  </span>
                )}
                <span className="dash-header__date-greg">
                  <CalendarRange size={14} aria-hidden />
                  {todayGregorian}
                </span>
                <span className="dash-header__date-greg">
                  <RefreshCw size={14} aria-hidden />
                  {metrics?.lastUpdatedAt
                    ? `${ar ? "آخر تحديث" : "Last update"}: ${new Date(metrics.lastUpdatedAt).toLocaleString(ar ? "ar-SA" : "en-US")}`
                    : ar ? "لا توجد بيانات محدثة خلال الفترة" : "No updated data in this period"}
                </span>
              </div>
            </div>
          </div>
          <div className="dash-header__actions">
            <button
              type="button"
              className="dash-icon-btn"
              onClick={refresh}
              title={ar ? "تحديث" : "Refresh"}
            >
              <RefreshCw className={`w-4 h-4 ${metricsQ.isFetching ? "animate-spin" : ""}`} />
            </button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileBarChart2 className="w-4 h-4" />}
              onClick={() => navigate("/reports")}
            >
              {ar ? "التقارير" : "Reports"}
            </Button>
          </div>
        </motion.header>

        {/* ── 2. FILTER BAR ── */}
        <motion.div variants={fadeUp} className="dash-fbar" aria-label={ar ? "الفلاتر" : "Filters"}>
          {canLoadCenters && (
            <label className="dash-fbar__pill">
              <Filter size={14} className="dash-fbar__icon" aria-hidden />
              <select
                className="dash-fbar__select"
                value={centerId ?? ""}
                onChange={(e) => {
                  setCenterId(toNumber(e.target.value));
                  setCircleId(undefined);
                }}
              >
                <option value="">{ar ? "كل المراكز" : "All centers"}</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          )}

          <label className="dash-fbar__pill">
            <CalendarRange size={14} className="dash-fbar__icon" aria-hidden />
            <span className="dash-fbar__label">{ar ? "من" : "From"}</span>
            <input
              type="date"
              className="dash-fbar__input"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>

          <label className="dash-fbar__pill">
            <CalendarRange size={14} className="dash-fbar__icon" aria-hidden />
            <span className="dash-fbar__label">{ar ? "إلى" : "To"}</span>
            <input
              type="date"
              className="dash-fbar__input"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>

          {canLoadCircles && (
            <label className="dash-fbar__pill">
              <Filter size={14} className="dash-fbar__icon" aria-hidden />
              <select
                className="dash-fbar__select"
                value={circleId ?? ""}
                onChange={(e) => setCircleId(toNumber(e.target.value))}
              >
                <option value="">{ar ? "كل الحلقات" : "All circles"}</option>
                {circles.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          )}

          <span className="dash-fbar__scope">{scopeLabel}</span>
          <div className="dash-fbar__spacer" />

          <button
            type="button"
            className="dash-icon-btn"
            onClick={resetFilters}
            disabled={activeFiltersCount === 0}
            title={ar ? "إعادة ضبط الفلاتر" : "Reset filters"}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </motion.div>

        {hasInvalidRange && (
          <ErrorState
            title={ar ? "نطاق تاريخ غير صالح" : "Invalid date range"}
            description={
              ar
                ? "تاريخ البداية يجب أن يكون قبل النهاية."
                : "Start date must be before end date."
            }
          />
        )}
        {hasError && !hasInvalidRange && (
          <ErrorState
            title={ar ? "تعذر تحميل البيانات" : "Failed to load data"}
            onRetry={refresh}
          />
        )}

        {!loading && !hasError && !hasInvalidRange && (unreportedCircles > 0 || staffRecordedTotal > 0) && (
          <motion.aside variants={fadeUp} className="dash-data-note" role="note">
            <AlertCircle size={18} aria-hidden />
            <div>
              <strong>{ar ? "قبل اتخاذ القرار" : "Before deciding"}</strong>
              <span>
                {ar
                  ? `المؤشرات مبنية على السجلات المدخلة فقط؛ ${unreportedCircles} حلقات بلا سجلات، وحضور الموظفين لا يشمل الورديات غير المسجلة.`
                  : `Indicators use entered records only; ${unreportedCircles} circles have no records, and staff attendance excludes unrecorded shifts.`}
              </span>
            </div>
          </motion.aside>
        )}
        {/* ── 3. KPI CARDS ── */}
        <motion.section variants={fadeUp} className="dash-kpis" aria-label={ar ? "المؤشرات" : "KPIs"}>
          {loading ? (
            <KpiSkeleton items={4} />
          ) : (
            <>
              <KpiCard
                icon={Users}
                tone="info"
                value={metrics?.totals.totalStudents}
                label={ar ? "الطلاب النشطون" : "Active students"}
                hasData={metrics !== undefined}
              />
              <KpiCard
                icon={BookOpen}
                tone="primary"
                value={metrics?.totals.totalCircles}
                label={ar ? "الحلقات النشطة" : "Active circles"}
                hasData={metrics !== undefined}
              />
              <KpiCard
                icon={ActivityIcon}
                tone={presentPct >= 85 ? "success" : presentPct >= ATTENDANCE_ALERT_THRESHOLD ? "warning" : "danger"}
                value={attendanceTotal > 0 ? `${presentPct}%` : undefined}
                label={ar ? "حضور الطلاب" : "Student attendance"}
                meta={attendanceTotal > 0 && Number.isFinite(attendanceDelta) ? `${(attendanceDelta ?? 0) > 0 ? "+" : ""}${Math.round(attendanceDelta ?? 0)} ${ar ? "نقطة عن الفترة السابقة" : "pts vs previous period"}` : undefined}
                hasData={attendanceTotal > 0}
              />
              <KpiCard
                icon={ClipboardList}
                tone={(staffAttendance?.totals.absent ?? 0) > 0 ? "danger" : (staffAttendance?.totals.late ?? 0) > 0 ? "warning" : "success"}
                value={staffRecordedTotal > 0 ? staffAttendance?.totals.absent : undefined}
                label={ar ? "سجلات غياب الموظفين" : "Staff absence records"}
                meta={staffRecordedTotal > 0 ? `${staffRecordedTotal} ${ar ? "سجل حضور مدخل" : "entered attendance records"}` : undefined}
                hasData={Boolean(staffAttendance?.applicable && staffRecordedTotal > 0)}
              />
            </>
          )}
        </motion.section>

        {/* ── 4. MAIN GRID — main column + sidebar column ── */}
        <section className="dash-main-grid">
          {!isFinanceRole && (
            <div className="dash-main-col">
              {/* Decisions */}
              <motion.section variants={fadeUp} className="dash-panel dash-decisions">
                <div className="dash-panel__head">
                  <h2 className="dash-panel__title">
                    <span className="dash-panel__title-bar" data-tone="warning" />
                    {ar ? "ما يحتاج قرارك الآن" : "What needs your decision now"}
                  </h2>
                  <span className="dash-panel__sub">
                    {ar ? `${decisionCount} مؤشرات` : `${decisionCount} indicators`}
                  </span>
                </div>
                <div className="dash-panel__body">
                  {loading ? (
                    <Skeleton height={200} />
                  ) : decisionCount === 0 ? (
                    <DashEmpty icon={CheckCircle} text={ar ? "لا توجد حالات تستدعي تدخلًا خلال الفترة." : "No cases require intervention in this period."} />
                  ) : (
                    <div className="dash-priorities">
                      {attendanceTotals.absent > 0 && (
                        <PriorityRow
                          icon={AlertTriangle}
                          tone="danger"
                          title={ar ? "غياب طلاب بدون عذر" : "Unexcused student absence"}
                          value={attendanceTotals.absent}
                          sub={<>{ar ? `أولوية عالية · سجلات فعلية · ${scopeName}` : `High priority · actual records · ${scopeName}`}{role && roleCanAccessRoute(role, "reports") && <Link className="dash-prio__action" to="/reports">{ar ? "فتح التقرير" : "Open report"}</Link>}</>}
                          percent={pct(attendanceTotals.absent)}
                        />
                      )}
                      {attendanceTotals.late > 0 && (
                        <PriorityRow
                          icon={Clock}
                          tone="warning"
                          title={ar ? "تأخر الطلاب" : "Student lateness"}
                          value={attendanceTotals.late}
                          sub={<>{ar ? `أولوية متوسطة · سجلات فعلية · ${scopeName}` : `Medium priority · actual records · ${scopeName}`}{role && roleCanAccessRoute(role, "reports") && <Link className="dash-prio__action" to="/reports">{ar ? "مراجعة" : "Review"}</Link>}</>}
                          percent={pct(attendanceTotals.late)}
                        />
                      )}
                      {attentionCircles.length > 0 && (
                        <PriorityRow
                          icon={ClipboardList}
                          tone="danger"
                          title={ar ? "حلقات منخفضة الحضور" : "Low-attendance circles"}
                          value={attentionCircles.length}
                          sub={<>{ar ? `أولوية عالية · ${attentionCircles[0].circleName} · ${Math.round(attentionCircles[0].attendanceRate)}% · أقل من حد المتابعة ${ATTENDANCE_ALERT_THRESHOLD}%` : `High priority · ${attentionCircles[0].circleName} · ${Math.round(attentionCircles[0].attendanceRate)}% · below ${ATTENDANCE_ALERT_THRESHOLD}% action threshold`}{role && roleCanAccessRoute(role, "circles") && <Link className="dash-prio__action" to="/circles">{ar ? "فتح الحلقات" : "Open circles"}</Link>}</>}
                        />
                      )}
                      {unreportedCircles > 0 && (
                        <PriorityRow
                          icon={AlertCircle}
                          tone="neutral"
                          title={ar ? "حلقات بلا سجلات حضور" : "Circles without attendance records"}
                          value={unreportedCircles}
                          sub={<>{ar ? `اكتمال بيانات · لا يمكن تقييمها · ${scopeName}` : `Data completeness · cannot be evaluated · ${scopeName}`}{role && roleCanAccessRoute(role, "circles") && <Link className="dash-prio__action" to="/circles">{ar ? "مراجعة الحلقات" : "Review circles"}</Link>}</>}
                        />
                      )}
                      {(staffAttendance?.totals.absent ?? 0) > 0 && (
                        <PriorityRow
                          icon={Users}
                          tone="danger"
                          title={ar ? "غياب موظفين مسجل" : "Recorded staff absence"}
                          value={staffAttendance?.totals.absent ?? 0}
                          sub={<>{ar ? `أولوية عالية · غياب رسمي مسجل · ${scopeName}` : `High priority · recorded absence · ${scopeName}`}{role && roleCanAccessRoute(role, "staff_attendance") && <Link className="dash-prio__action" to="/daily/staff-attendance">{ar ? "فتح الحضور" : "Open attendance"}</Link>}</>}
                        />
                      )}
                      {(staffAttendance?.totals.late ?? 0) > 0 && (
                        <PriorityRow
                          icon={Clock}
                          tone="warning"
                          title={ar ? "تأخر موظفين" : "Staff lateness"}
                          value={staffAttendance?.totals.late ?? 0}
                          sub={<>{ar ? `أولوية متوسطة · سجلات فعلية · ${scopeName}` : `Medium priority · actual records · ${scopeName}`}{role && roleCanAccessRoute(role, "staff_attendance") && <Link className="dash-prio__action" to="/daily/staff-attendance">{ar ? "متابعة" : "Follow up"}</Link>}</>}
                        />
                      )}
                    </div>
                  )}
                </div>
              </motion.section>
              {/* Role-based performance */}
              <motion.section variants={fadeUp} className="dash-panel">
                <div className="dash-panel__head">
                  <h2 className="dash-panel__title">
                    <span className="dash-panel__title-bar" data-tone="info" />
                    {isSuperAdmin && !centerId
                      ? ar ? "أداء المراكز" : "Centers performance"
                      : ar ? "أداء الحلقات" : "Circles performance"}
                  </h2>
                  {role && roleCanAccessRoute(role, "reports") && <Link to="/reports" className="dash-panel__link">{ar ? "التفاصيل" : "Details"}<ArrowRight size={14} className="rtl:rotate-180" /></Link>}
                </div>
                <div className="dash-panel__body">
                  {loading ? (
                    <Skeleton height={200} />
                  ) : isSuperAdmin && !centerId ? (
                    centerPerformance.length === 0 ? (
                      <DashEmpty icon={Building2} text={ar ? "لا توجد مراكز ضمن النطاق." : "No centers in scope."} />
                    ) : (
                      <div className="dash-compare">
                        <div className="dash-compare__group">
                          <p className="dash-compare__group-title"><Award size={14} aria-hidden /> {ar ? "الأعلى حضورًا" : "Highest attendance"}</p>
                          {topCenters.length === 0 && <p className="dash-compare__empty">{ar ? "لا توجد مراكز فوق حد المتابعة خلال الفترة." : "No centers are above the action threshold in this period."}</p>}
                          {topCenters.map((center) => <CenterRow key={center.centerId} item={center} tone="success" ar={ar} />)}
                        </div>
                        <div className="dash-compare__group">
                          <p className="dash-compare__group-title"><AlertTriangle size={14} aria-hidden /> {ar ? "تحتاج تدخلًا أو بيانات" : "Need action or data"}</p>
                          {attentionCenters.map((center) => <CenterRow key={center.centerId} item={center} tone={center.attendanceRate === null ? "neutral" : "danger"} ar={ar} />)}
                          {attentionCenters.length === 0 && <p className="dash-compare__empty">{ar ? "لا توجد مراكز تحت حد 65%." : "No centers below 65%."}</p>}
                        </div>
                      </div>
                    )
                  ) : sortedAttendance.length === 0 ? (
                    <DashEmpty icon={BarChart3} text={ar ? "لا توجد حلقات ضمن النطاق." : "No circles in scope."} />
                  ) : (
                    <div className="dash-compare">
                      <div className="dash-compare__group">
                        <p className="dash-compare__group-title"><Award size={14} aria-hidden /> {ar ? "الأعلى حضورًا" : "Highest attendance"}</p>
                        {topCircles.length === 0 && <p className="dash-compare__empty">{ar ? "لا توجد حلقات فوق حد المتابعة خلال الفترة." : "No circles are above the action threshold in this period."}</p>}
                        {topCircles.map((circle) => <CircleRow key={`top-${circle.circleId}`} item={circle} tone="success" ar={ar} />)}
                      </div>
                      <div className="dash-compare__group">
                        <p className="dash-compare__group-title"><AlertTriangle size={14} aria-hidden /> {ar ? "تحتاج تدخلًا" : "Need intervention"}</p>
                        {attentionCircles.map((circle) => <CircleRow key={`attention-${circle.circleId}`} item={circle} tone="danger" ar={ar} />)}
                        {attentionCircles.length === 0 && <p className="dash-compare__empty">{ar ? "لا توجد حلقات تحت حد 65%." : "No circles below 65%."}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
              {/* Activity */}
              <motion.section variants={fadeUp} className="dash-panel">
                <div className="dash-panel__head">
                  <h2 className="dash-panel__title">
                    <span className="dash-panel__title-bar" data-tone="success" />
                    {ar ? "النشاط الأخير" : "Recent activity"}
                  </h2>
                  {activityRows.length > 0 && (
                    <span className="dash-panel__sub">
                      {ar ? `${activityRows.length} حدث` : `${activityRows.length} events`}
                    </span>
                  )}
                </div>
                <div className="dash-panel__body dash-panel__body--flush">
                  {loading ? (
                    <div className="dash-panel__padded">
                      <Skeleton height={120} />
                    </div>
                  ) : activityRows.length === 0 ? (
                    <DashEmpty icon={Inbox} text={ar ? "لا توجد أنشطة حديثة" : "No recent activity"} />
                  ) : (
                    <ul className="dash-activity">
                      {activityRows.slice(0, 6).map((a) => (
                        <ActivityRow key={a.id} item={a} ar={ar} />
                      ))}
                    </ul>
                  )}
                </div>
              </motion.section>
            </div>
          )}

          {/* ─── SIDEBAR COLUMN ─── */}
          <div className="dash-side-col">
            {!isFinanceRole && (
              <motion.section variants={fadeUp} className="dash-panel">
                <div className="dash-panel__head">
                  <h2 className="dash-panel__title">
                    <span className="dash-panel__title-bar" data-tone="primary" />
                    {ar ? "مؤشرات التشغيل" : "Operational health"}
                  </h2>
                  <span className={`dash-pill dash-pill--${healthState.tone}`}>
                    <span className="dash-pill__dot" />
                    {healthState.label}
                  </span>
                </div>
                <div className="dash-panel__body">
                    {loading ? (
                    <Skeleton height={100} />
                  ) : attendanceTotal === 0 ? (
                    <DashEmpty
                      icon={ActivityIcon}
                      text={ar ? "لا توجد بيانات تشغيل كافية لهذه الفترة." : "No operational data for this period."}
                      linkTo="/reports"
                      linkLabel={ar ? "فتح تقرير الحضور" : "Open attendance report"}
                    />
                  ) : (
                    <div className="dash-ops dash-ops--vertical">
                      <StatusDonut
                        segments={[
                          { label: ar ? "حاضر" : "Present", value: attendanceTotals.present, tone: "success" },
                          { label: ar ? "غائب" : "Absent", value: attendanceTotals.absent, tone: "danger" },
                          { label: ar ? "متأخر" : "Late", value: attendanceTotals.late, tone: "warning" },
                          { label: ar ? "بعذر" : "Excused", value: attendanceTotals.excused, tone: "info" },
                        ]}
                        centerLabel={ar ? "سجل" : "records"}
                        ariaLabel={ar ? `توزيع حضور الطلاب من ${attendanceTotal} سجلًا` : `Student attendance distribution from ${attendanceTotal} records`}
                      />
                      <div className="dash-ops__bars dash-ops__bars--stack">
                        <AttBar label={ar ? "حاضر" : "Present"} value={attendanceTotals.present} total={attendanceTotal} tone="success" />
                        <AttBar label={ar ? "غائب" : "Absent"} value={attendanceTotals.absent} total={attendanceTotal} tone="danger" />
                        <AttBar label={ar ? "متأخر" : "Late"} value={attendanceTotals.late} total={attendanceTotal} tone="warning" />
                        <AttBar label={ar ? "بعذر" : "Excused"} value={attendanceTotals.excused} total={attendanceTotal} tone="info" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {!isFinanceRole && (
              <motion.section variants={fadeUp} className="dash-panel">
                <div className="dash-panel__head">
                  <h2 className="dash-panel__title"><span className="dash-panel__title-bar" data-tone="info" />{ar ? "حضور الموظفين" : "Staff attendance"}</h2>
                  {staffAttendance?.applicable && staffRecordedTotal > 0 && <span className={`dash-pill dash-pill--${staffAttendance.attendanceRate >= 85 ? "success" : staffAttendance.attendanceRate >= ATTENDANCE_ALERT_THRESHOLD ? "warning" : "danger"}`}>{Math.round(staffAttendance.attendanceRate)}% {ar ? "ضمن السجلات" : "of records"}</span>}
                </div>
                <div className="dash-panel__body">
                  {!staffAttendance?.applicable ? (
                    <DashEmpty icon={Users} text={ar ? "لا ينطبق حضور الموظفين عند تصفية حلقة محددة." : "Staff attendance does not apply to a single-circle filter."} />
                  ) : staffRecordedTotal === 0 ? (
                    <DashEmpty icon={Users} text={ar ? "لا توجد سجلات حضور موظفين خلال الفترة." : "No staff attendance records in this period."} />
                  ) : (
                    <div className="dash-staff">
                      <StatusDonut
                        segments={[
                          { label: ar ? "حاضر" : "Present", value: staffAttendance.totals.present, tone: "success" },
                          { label: ar ? "غائب" : "Absent", value: staffAttendance.totals.absent, tone: "danger" },
                          { label: ar ? "متأخر" : "Late", value: staffAttendance.totals.late, tone: "warning" },
                          { label: ar ? "بعذر أو إجازة" : "Excused or leave", value: staffAttendance.totals.excused + staffAttendance.totals.onLeave, tone: "info" },
                        ]}
                        centerLabel={ar ? "سجل" : "records"}
                        ariaLabel={ar ? `توزيع حضور الموظفين من ${staffRecordedTotal} سجلًا` : `Staff attendance distribution from ${staffRecordedTotal} records`}
                      />
                      <div className="dash-ops__bars dash-ops__bars--stack">
                        <AttBar label={ar ? "حاضر" : "Present"} value={staffAttendance.totals.present} total={staffRecordedTotal} tone="success" />
                        <AttBar label={ar ? "متأخر" : "Late"} value={staffAttendance.totals.late} total={staffRecordedTotal} tone="warning" />
                        <AttBar label={ar ? "غائب" : "Absent"} value={staffAttendance.totals.absent} total={staffRecordedTotal} tone="danger" />
                        <AttBar label={ar ? "بعذر أو إجازة" : "Excused or leave"} value={staffAttendance.totals.excused + staffAttendance.totals.onLeave} total={staffRecordedTotal} tone="info" />
                      </div>
                      <div className="dash-staff__roles">
                        {staffAttendance.byRole.map((item) => (
                          <div key={item.staffRole} className="dash-staff__role"><span>{staffRoleLabel(item.staffRole, ar)}</span><strong>{item.recordedTotal} <small>{ar ? "سجل" : "records"}</small></strong></div>
                        ))}
                      </div>
                      <div className="dash-staff__roles">
                        <div className="dash-staff__role"><span>{ar ? "وردية مستحقة بلا تسجيل" : "Scheduled without a record"}</span><strong>—</strong></div>
                        <div className="dash-staff__role"><span>{ar ? "لا وردية فعالة" : "No active shift"}</span><strong>—</strong></div>
                      </div>
                      <p className="dash-panel__sub">{ar ? "كفاية البيانات: سجلات فعلية فقط؛ حالتا الوردية بلا تسجيل وعدم وجود وردية غير محسوبتين، ولا تُدمجان مع الغياب." : "Data coverage: recorded attendance only; scheduled-without-record and no-active-shift are not calculated or merged into absence."}</p>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* Quick links */}
            {quickLinks.length > 0 && (
              <motion.section variants={fadeUp} className="dash-panel">
                <div className="dash-panel__head">
                  <h2 className="dash-panel__title">
                    <span className="dash-panel__title-bar" data-tone="primary" />
                    {ar ? "روابط سريعة" : "Quick links"}
                  </h2>
                </div>
                <div className="dash-panel__body">
                  <div className="dash-actions">
                    {quickLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`dash-action-card dash-action-card--${link.tone}`}
                      >
                        <span className="dash-action-card__icon">
                          <link.icon size={18} />
                        </span>
                        <span className="dash-action-card__text">
                          <span className="dash-action-card__title">{link.title}</span>
                          <span className="dash-action-card__sub">{link.sub}</span>
                        </span>
                        <ArrowRight size={14} className="dash-action-card__arrow rtl:rotate-180" />
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}

            {/* Financial glimpse */}
            {role && roleCanAccessRoute(role, "finance_invoices") && !canQueryFinance && (
              <motion.section variants={fadeUp} className="dash-panel">
                <div className="dash-panel__head">
                  <h2 className="dash-panel__title">
                    <span className="dash-panel__title-bar" data-tone="neutral" />
                    {ar ? "لمحة مالية" : "Financial glimpse"}
                  </h2>
                </div>
                <div className="dash-panel__body">
                  <Link to="/finance/invoices" className="dash-insight-link">
                    <Wallet size={16} className="dash-insight-link__icon" />
                    <div className="dash-insight-link__text">
                      <span className="dash-insight-link__title">
                        {ar ? "الملخص المالي" : "Financial summary"}
                      </span>
                      <span className="dash-insight-link__sub">
                        {ar ? "افتح التقارير المالية لمراجعة القوائم والمؤشرات." : "Open financial reports to review statements."}
                      </span>
                    </div>
                    <ArrowRight size={14} className="dash-insight-link__arrow rtl:rotate-180" />
                  </Link>
                </div>
              </motion.section>
            )}

            {/* Golden records glimpse */}
            {role && roleCanAccessRoute(role, "golden_records") && (
              <motion.section variants={fadeUp} className="dash-panel">
                <div className="dash-panel__head">
                  <h2 className="dash-panel__title">
                    <span className="dash-panel__title-bar" data-tone="warning" />
                    {ar ? "السجل الذهبي" : "Golden records"}
                  </h2>
                </div>
                <div className="dash-panel__body">
                  <Link to="/golden-records" className="dash-insight-link">
                    <Award size={16} className="dash-insight-link__icon" />
                    <div className="dash-insight-link__text">
                      <span className="dash-insight-link__title">
                        {ar ? "الخاتمون والحفاظ" : "Completions & memorizers"}
                      </span>
                      <span className="dash-insight-link__sub">
                        {ar ? "متابعة إنجازات الخاتمين والحفاظ." : "Track student achievements."}
                      </span>
                    </div>
                    <ArrowRight size={14} className="dash-insight-link__arrow rtl:rotate-180" />
                  </Link>
                </div>
              </motion.section>
            )}
          </div>
        </section>

        {canQueryFinance && financeDashboardQ.data && (
          <FinancialOverview data={financeDashboardQ.data.kpis} ar={ar} loading={canQueryFinance && financeDashboardQ.isPending} />
        )}
      </motion.div>
    </div>
  );
}

/* ──────────── HELPER COMPONENTS ──────────── */

function KpiCard({
  icon: Icon,
  tone,
  value,
  label,
  hasData,
  meta,
}: {
  icon: ElementType;
  tone: Tone;
  value: number | string | undefined | null;
  label: string;
  hasData: boolean;
  meta?: string;
}) {
  const display =
    hasData && value !== undefined && value !== null && value !== "" ? value : "—";
  return (
    <article className={`dash-kpi-card dash-kpi-card--${tone}`}>
      <span className="dash-kpi-card__blob dash-kpi-card__blob--tl" aria-hidden />
      <span className="dash-kpi-card__blob dash-kpi-card__blob--br" aria-hidden />
      <div className="dash-kpi-card__content">
        <div className="dash-kpi-card__text">
          <span className="dash-kpi-card__label">{label}</span>
          <span className="dash-kpi-card__value">{display}</span>
          {meta && <span className="dash-kpi-card__meta">{meta}</span>}
        </div>
        <div className="dash-kpi-card__icon">
          <Icon size={20} aria-hidden />
        </div>
      </div>
    </article>
  );
}

type DonutSegment = {
  label: string;
  value: number;
  tone: Tone;
};

function StatusDonut({
  segments,
  centerLabel,
  ariaLabel,
}: {
  segments: DonutSegment[];
  centerLabel: string;
  ariaLabel: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="dash-donut" role="img" aria-label={ariaLabel}>
      <div className="dash-donut__visual">
        <svg viewBox="0 0 108 108" aria-hidden>
          <circle cx="54" cy="54" r={radius} className="dash-donut__track" fill="none" strokeWidth="12" />
          {segments.map((segment) => {
            if (!segment.value || !total) return null;
            const length = (segment.value / total) * circumference;
            const dashOffset = offset;
            offset += length;
            return (
              <circle
                key={segment.label}
                cx="54"
                cy="54"
                r={radius}
                className={`dash-donut__segment dash-donut__segment--${segment.tone}`}
                fill="none"
                strokeWidth="12"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-dashOffset}
                transform="rotate(-90 54 54)"
              />
            );
          })}
        </svg>
        <div className="dash-donut__center">
          <strong>{total}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>
      <div className="dash-donut__legend">
        {segments.map((segment) => (
          <div key={segment.label} className="dash-donut__legend-row">
            <span className={`dash-donut__marker dash-donut__marker--${segment.tone}`} />
            <span>{segment.label}</span>
            <strong>{segment.value}<small>{total ? Math.round((segment.value / total) * 100) : 0}%</small></strong>
          </div>
        ))}
      </div>
    </div>
  );
}
function ProgressRing({ percent, tone }: { percent: number; tone: Tone }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 30;
  const circ = 2 * Math.PI * radius;
  return (
    <div className={`dash-ring dash-ring--${tone}`} role="img" aria-label={`${clamped}%`}>
      <svg viewBox="0 0 72 72" width="72" height="72">
        <circle cx="36" cy="36" r={radius} className="dash-ring__track" fill="none" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          className="dash-ring__progress"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * clamped) / 100}
          transform="rotate(-90 36 36)"
        />
      </svg>
      <span className="dash-ring__value">{clamped}%</span>
    </div>
  );
}

function AttBar({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: Tone;
}) {
  const p = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="dash-attbar">
      <div className="dash-attbar__head">
        <span className="dash-attbar__label">{label}</span>
        <span className="dash-attbar__val">
          {value}
          <span className="dash-attbar__pct"> · {p}%</span>
        </span>
      </div>
      <div className="dash-attbar__track">
        <div className={`dash-attbar__fill dash-attbar__fill--${tone}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

function PriorityRow({
  icon: Icon,
  tone,
  title,
  value,
  sub,
  percent,
}: {
  icon: ElementType;
  tone: Tone;
  title: string;
  value: number;
  sub: ReactNode;
  percent?: number;
}) {
  const showBar = typeof percent === "number" && percent >= 0;
  const clamped = showBar ? Math.max(0, Math.min(100, percent)) : 0;
  return (
    <div className="dash-prio">
      <div className={`dash-prio__icon dash-prio__icon--${tone}`}>
        <Icon size={18} aria-hidden />
      </div>
      <div className="dash-prio__text">
        <span className="dash-prio__title">{title}</span>
        <span className="dash-prio__sub">{sub}</span>
        {showBar && (
          <div className="dash-prio__bar" aria-hidden>
            <div
              className={`dash-prio__bar-fill dash-prio__bar-fill--${tone}`}
              style={{ width: `${clamped}%` }}
            />
          </div>
        )}
      </div>
      <span className={`dash-prio__value dash-prio__value--${tone}`}>{value}</span>
    </div>
  );
}

function CircleRow({
  item,
  tone,
  ar,
  showCenter,
}: {
  item: AttendanceSummaryItem;
  tone: Tone;
  ar: boolean;
  showCenter?: boolean;
}) {
  const rate = Math.round(item.attendanceRate);
  return (
    <div className="dash-circle-row">
      <div className="dash-circle-row__text">
        <span className="dash-circle-row__name">
          {showCenter && item.centerName ? item.centerName : item.circleName}
        </span>
        <span className="dash-circle-row__sub">
          {item.teacher?.fullName ?? (ar ? "لا يوجد معلم مرتبط" : "No linked teacher")} · {item.activeStudents} {ar ? "طلاب نشطين" : "active students"}
        </span>
      </div>
      <div className="dash-circle-row__meta">
        <span className={`dash-circle-row__rate dash-circle-row__rate--${tone}`}>
          {rate}%
        </span>
        <span className="dash-circle-row__count">
          {item.total} {ar ? "سجل" : "rec"}
        </span>
      </div>
    </div>
  );
}

function CenterRow({ item, tone, ar }: { item: CenterPerformance; tone: Tone; ar: boolean }) {
  return (
    <div className="dash-circle-row">
      <div className="dash-circle-row__text">
        <span className="dash-circle-row__name">{item.centerName}</span>
        <span className="dash-circle-row__sub">
          {item.attendanceRate === null
            ? ar ? "لا توجد بيانات كافية لتقييم المركز خلال الفترة المحددة" : "Not enough data to evaluate this center"
            : ar ? `${item.circleCount} حلقات · ${item.activeStudents} ارتباطات طلاب نشطة` : `${item.circleCount} circles · ${item.activeStudents} active student enrollments`}
        </span>
      </div>
      <div className="dash-circle-row__meta">
        <span className={`dash-circle-row__rate dash-circle-row__rate--${tone}`}>
          {item.attendanceRate === null ? "—" : `${item.attendanceRate}%`}
        </span>
        <span className="dash-circle-row__count">
          {item.attendanceRate === null ? ar ? "لا بيانات" : "No data" : ar ? "حضور الطلاب" : "Student attendance"}
        </span>
      </div>
    </div>
  );
}

function ActivityRow({ item, ar }: { item: ActivityFeedItem; ar: boolean }) {
  const meta = activityMeta[item.activityType] || activityMeta.LOGOUT;
  const Icon = meta.icon;
  const when = new Date(item.createdAt).toLocaleString(ar ? "ar-SA" : "en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <li className="dash-activity__row">
      <span className={`dash-activity__icon dash-activity__icon--${meta.tone}`}>
        <Icon size={14} aria-hidden />
      </span>
      <div className="dash-activity__body">
        <p className="dash-activity__msg">{activityMessage(item, ar)}</p>
        <p className="dash-activity__meta">
          <span>{when}</span>
          {item.center?.name && (
            <>
              <span className="dash-activity__sep">·</span>
              <span>{item.center.name}</span>
            </>
          )}
          {item.circle?.name && (
            <>
              <span className="dash-activity__sep">·</span>
              <span>{item.circle.name}</span>
            </>
          )}
        </p>
      </div>
    </li>
  );
}

function FinanceBar({
  label,
  value,
  pct,
  tone,
  format,
}: {
  label: string;
  value: number;
  pct: number;
  tone: Tone;
  format: (n: number) => string;
}) {
  return (
    <div className="dash-finance-bar">
      <div className="dash-finance-bar__head">
        <span className="dash-finance-bar__label">{label}</span>
        <span className="dash-finance-bar__val">{format(value)}</span>
      </div>
      <div className="dash-finance-bar__track">
        <div
          className={`dash-finance-bar__fill dash-finance-bar__fill--${tone}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function FinancialOverview({
  data,
  ar,
  loading,
}: {
  data: FinanceReportDashboardV2["kpis"];
  ar: boolean;
  loading: boolean;
}) {
  const rate = data.collectionRate;
  const tone: Tone = rate >= 80 ? "success" : rate >= 60 ? "warning" : "danger";

  return (
    <motion.section variants={fadeUp} className="dash-panel dash-finance">
      <div className="dash-panel__head">
        <h2 className="dash-panel__title">
          <span className="dash-panel__title-bar" data-tone="primary" />
          {ar ? "الوضع المالي الحالي" : "Current financial position"}
        </h2>
        <span className={`dash-pill dash-pill--${tone}`}>
          <span className="dash-pill__dot" />
          {rate >= 80
            ? ar ? "جيد" : "Good"
            : rate >= 60
              ? ar ? "مقبول" : "Fair"
              : ar ? "تحتاج متابعة" : "Needs attention"}
        </span>
      </div>
      <div className="dash-panel__body">
        <p className="dash-finance__scope-note">{ar ? "أرقام تراكمية حالية؛ لا تتأثر بفلتر التاريخ أعلاه." : "Current cumulative figures; the date filter above does not apply."}</p>
        {loading ? (
          <Skeleton height={200} />
        ) : (
          <div className="dash-finance__grid">
            <div className="dash-finance__ring-col">
              <div className="dash-finance__ring">
                <ProgressRing percent={rate} tone={tone} />
                <div className="dash-ops__ring-meta dash-finance__ring-meta">
                  <span className="dash-ops__ring-label">
                    {ar ? "نسبة التحصيل" : "Collection rate"}
                  </span>
                  <span className="dash-ops__ring-sub">
                    {formatMoney(data.totalCollected)} / {formatMoney(data.totalInvoiced)}
                  </span>
                </div>
              </div>
            </div>
            <div className="dash-finance__bars-col">
              <FinanceBar
                label={ar ? "إجمالي الفواتير" : "Total invoiced"}
                value={data.totalInvoiced}
                pct={100}
                tone="primary"
                format={formatMoney}
              />
              <FinanceBar
                label={ar ? "المحصل" : "Collected"}
                value={data.totalCollected}
                pct={data.totalInvoiced > 0 ? Math.round((data.totalCollected / data.totalInvoiced) * 100) : 0}
                tone="success"
                format={formatMoney}
              />
              <FinanceBar
                label={ar ? "المتبقي" : "Outstanding"}
                value={data.outstanding}
                pct={data.totalInvoiced > 0 ? Math.round((data.outstanding / data.totalInvoiced) * 100) : 0}
                tone="warning"
                format={formatMoney}
              />
            </div>
          </div>
        )}
        {!loading && (
          <div className="dash-finance__summary">
            <span className="dash-finance__summary-item">
              <ClipboardList size={14} />
              {data.totalInvoicesCount} {ar ? "فاتورة" : "invoices"}
            </span>
            <span className="dash-finance__summary-item">
              <Wallet size={14} />
              {ar ? "الرصيد النقدي: " : "Cash balance: "}{formatMoney(data.totalCashBalance)}
            </span>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function DashEmpty({
  icon: Icon,
  text,
  sub,
  linkTo,
  linkLabel,
}: {
  icon: ElementType;
  text: string;
  sub?: string;
  linkTo?: string;
  linkLabel?: string;
}) {
  return (
    <div className="dash-empty">
      <div className="dash-empty__icon">
        <Icon size={20} aria-hidden />
      </div>
      <span className="dash-empty__text">{text}</span>
      {sub && <span className="dash-empty__sub">{sub}</span>}
      {linkTo && linkLabel && (
        <Link to={linkTo} className="dash-empty__link">{linkLabel}</Link>
      )}
    </div>
  );
}

/* ──────────── QUICK LINKS BUILDER ──────────── */

type QuickLink = {
  to: string;
  title: string;
  sub: string;
  icon: ElementType;
  tone: Tone;
};

function buildQuickLinks(role: Role | undefined, ar: boolean): QuickLink[] {
  if (!role) return [];
  const candidates: { id: AdminRouteId; link: QuickLink }[] = [
    {
      id: "reports",
      link: {
        to: "/reports",
        title: ar ? "مركز التقارير" : "Reports center",
        sub: ar ? "كل التقارير في مكان واحد" : "All reports in one place",
        icon: BarChart3,
        tone: "primary",
      },
    },
    {
      id: "exams",
      link: {
        to: "/exams",
        title: ar ? "الاختبارات" : "Exams",
        sub: ar ? "إدارة جلسات الاختبار" : "Manage exam sessions",
        icon: ClipboardList,
        tone: "info",
      },
    },
    {
      id: "golden_records",
      link: {
        to: "/golden-records",
        title: ar ? "السجل الذهبي" : "Golden records",
        sub: ar ? "إنجازات الطلاب" : "Student achievements",
        icon: Award,
        tone: "warning",
      },
    },
    {
      id: "staff_attendance",
      link: {
        to: "/daily/staff-attendance",
        title: ar ? "حضور الكادر" : "Staff attendance",
        sub: ar ? "متابعة يومية" : "Daily tracking",
        icon: Calendar,
        tone: "success",
      },
    },
    {
      id: "finance_invoices",
      link: {
        to: "/finance/invoices",
        title: ar ? "المالية" : "Finance",
        sub: ar ? "الفواتير والمدفوعات" : "Invoices & payments",
        icon: Wallet,
        tone: "neutral",
      },
    },
  ];
  return candidates
    .filter((c) => !["golden_records", "finance_invoices"].includes(c.id) && roleCanAccessRoute(role, c.id))
    .map((c) => c.link);
}
