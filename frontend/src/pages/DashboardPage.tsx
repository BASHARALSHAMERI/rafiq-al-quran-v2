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
import type { Role } from "../features/auth/types";
import { useCentersQuery, useCirclesQuery } from "../features/org/org.hooks";
import { canReadCenters, canReadCircles } from "../features/org/org.permissions";
import { roleCanAccessRoute, type AdminRouteId } from "../app/route-meta";

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

type Tone = "primary" | "success" | "warning" | "info" | "neutral" | "danger";

const activityMeta: Record<string, { icon: ElementType; tone: Tone }> = {
  LOGIN: { icon: CheckCircle, tone: "success" },
  LOGOUT: { icon: AlertCircle, tone: "neutral" },
  USER_CREATED: { icon: Users, tone: "info" },
  ATTENDANCE_MARKED: { icon: Calendar, tone: "info" },
  ATTENDANCE_UPDATED: { icon: Clock, tone: "warning" },
  STUDENT_ENROLLED: { icon: GraduationCap, tone: "success" },
};

export default function DashboardPage() {
  const { language } = useI18n();
  const ar = language === "ar";
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const role = user?.role;
  const canLoadCenters = canReadCenters(role);
  const canLoadCircles = canReadCircles(role);
  const isSuperAdmin = role === "SUPER_ADMIN";

  const toNumber = (value: string): number | undefined => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  };

  const now = new Date();
  const defaultTo = now.toISOString().slice(0, 10);
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    .toISOString()
    .slice(0, 10);

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

  const metrics = hasInvalidRange ? undefined : metricsQ.data;
  const activityRows = hasInvalidRange ? [] : activityQ.data ?? [];
  const centers = canLoadCenters ? centersQ.data?.items ?? [] : [];
  const circles = canLoadCircles ? circlesQ.data?.items ?? [] : [];
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
    () => sortedAttendance.filter((c) => c.total > 0).slice(0, 3),
    [sortedAttendance],
  );
  const bottomCircles = useMemo(
    () => [...sortedAttendance].filter((c) => c.total > 0).reverse().slice(0, 3),
    [sortedAttendance],
  );

  const loading = !hasInvalidRange && (metricsQ.isPending || attendQ.isPending);
  const hasError = metricsQ.isError || attendQ.isError;

  const refresh = () => {
    void metricsQ.refetch();
    void activityQ.refetch();
    void attendQ.refetch();
    if (canLoadCenters) void centersQ.refetch();
    if (canLoadCircles) void circlesQ.refetch();
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
      }).format(now) + (ar ? "هـ" : " AH");
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
            <input
              type="number"
              className="dash-fbar__input dash-fbar__input--narrow"
              placeholder={ar ? "الشهر" : "Month"}
              min="1"
              max="12"
              value={from.split("-")[1] ? parseInt(from.split("-")[1], 10) : ""}
              onChange={(e) => {
                const m = e.target.value.padStart(2, "0");
                setFrom(`${from.split("-")[0] || new Date().getFullYear()}-${m}-01`);
                const lastDay = new Date(Number(from.split("-")[0] || new Date().getFullYear()), Number(m), 0).getDate();
                setTo(`${from.split("-")[0] || new Date().getFullYear()}-${m}-${lastDay}`);
              }}
            />
          </label>

          <label className="dash-fbar__pill">
            <CalendarRange size={14} className="dash-fbar__icon" aria-hidden />
            <input
              type="number"
              className="dash-fbar__input dash-fbar__input--narrow"
              placeholder={ar ? "السنة" : "Year"}
              min="2020"
              max="2099"
              value={from.split("-")[0] || ""}
              onChange={(e) => {
                const y = e.target.value;
                if (y.length === 4) setFrom(`${y}-${from.split("-")[1] || "01"}-${from.split("-")[2] || "01"}`);
              }}
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

        {/* ── 3. KPI CARDS ── */}
        <motion.section variants={fadeUp} className="dash-kpis" aria-label={ar ? "المؤشرات" : "KPIs"}>
          {loading ? (
            <KpiSkeleton items={isSuperAdmin ? 5 : 4} />
          ) : (
            <>
              {isSuperAdmin && (
                <KpiCard
                  icon={Building2}
                  tone="primary"
                  value={centers.length}
                  label={ar ? "المراكز" : "Centers"}
                  hasData={canLoadCenters}
                />
              )}
              <KpiCard
                icon={Users}
                tone="info"
                value={metrics?.totals?.totalStudents}
                label={ar ? "الطلاب" : "Students"}
                hasData={metrics !== undefined}
              />
              <KpiCard
                icon={BookOpen}
                tone="success"
                value={metrics?.totals?.totalCircles}
                label={ar ? "الحلقات" : "Circles"}
                hasData={metrics !== undefined}
              />
              <KpiCard
                icon={GraduationCap}
                tone="warning"
                value={metrics?.totals?.totalTeachers}
                label={ar ? "المعلمون" : "Teachers"}
                hasData={metrics !== undefined}
              />
              <KpiCard
                icon={ActivityIcon}
                tone={presentPct >= 85 ? "success" : presentPct >= 65 ? "warning" : "danger"}
                value={attendanceTotal > 0 ? `${presentPct}%` : undefined}
                label={ar ? "الحضور" : "Attendance"}
                hasData={attendanceTotal > 0}
              />
            </>
          )}
        </motion.section>

        {/* ── 4. MAIN GRID — main column + sidebar column ── */}
        <section className="dash-main-grid">
          {/* ─── MAIN COLUMN ─── */}
          <div className="dash-main-col">
            {/* Priorities */}
            <motion.section variants={fadeUp} className="dash-panel">
              <div className="dash-panel__head">
                <h2 className="dash-panel__title">
                  <span className="dash-panel__title-bar" data-tone="warning" />
                  {ar ? "نظرة على الأولويات" : "Priorities overview"}
                </h2>
                <Link to="/reports" className="dash-panel__link">
                  {ar ? "التفاصيل" : "Details"}
                  <ArrowRight size={14} className="rtl:rotate-180" />
                </Link>
              </div>
              <div className="dash-panel__body">
                {loading ? (
                  <Skeleton height={200} />
                ) : (
                  <div className="dash-priorities">
                    <PriorityRow
                      icon={AlertTriangle}
                      tone="danger"
                      title={ar ? "حالات غياب" : "Absent records"}
                      value={attendanceTotals.absent}
                      sub={
                        ar
                          ? `${pct(attendanceTotals.absent)}% من الإجمالي`
                          : `${pct(attendanceTotals.absent)}% of total`
                      }
                      percent={pct(attendanceTotals.absent)}
                    />
                    <PriorityRow
                      icon={Clock}
                      tone="warning"
                      title={ar ? "حالات تأخير" : "Late records"}
                      value={attendanceTotals.late}
                      sub={
                        ar
                          ? `${pct(attendanceTotals.late)}% من الإجمالي`
                          : `${pct(attendanceTotals.late)}% of total`
                      }
                      percent={pct(attendanceTotals.late)}
                    />
                    <PriorityRow
                      icon={ClipboardList}
                      tone="info"
                      title={ar ? "حلقات تحتاج متابعة" : "Circles needing follow-up"}
                      value={bottomCircles.length}
                      sub={
                        bottomCircles.length > 0
                          ? ar
                            ? `أدنى نسبة: ${Math.round(bottomCircles[0].attendanceRate)}%`
                            : `Lowest: ${Math.round(bottomCircles[0].attendanceRate)}%`
                          : ar
                            ? "—"
                            : "—"
                      }
                    />
                    <PriorityRow
                      icon={CheckCircle}
                      tone="success"
                      title={ar ? "حلقات منتظمة" : "Regular circles"}
                      value={topCircles.length}
                      sub={
                        topCircles.length > 0
                          ? ar
                            ? `أعلى نسبة: ${Math.round(topCircles[0].attendanceRate)}%`
                            : `Top: ${Math.round(topCircles[0].attendanceRate)}%`
                          : ar
                            ? "—"
                            : "—"
                      }
                    />
                  </div>
                )}
              </div>
            </motion.section>

            {/* Role-based comparison: SUPER_ADMIN → centers, CENTER_ADMIN → circles */}
            <motion.section variants={fadeUp} className="dash-panel">
              <div className="dash-panel__head">
                <h2 className="dash-panel__title">
                  <span className="dash-panel__title-bar" data-tone="info" />
                  {isSuperAdmin
                    ? ar ? "مقارنة المراكز" : "Centers comparison"
                    : ar ? "مقارنة الحلقات" : "Circles comparison"}
                </h2>
                <Link to="/reports" className="dash-panel__link">
                  {ar ? "التفاصيل" : "Details"}
                  <ArrowRight size={14} className="rtl:rotate-180" />
                </Link>
              </div>
              <div className="dash-panel__body">
                {loading ? (
                  <Skeleton height={200} />
                ) : sortedAttendance.length === 0 ? (
                  <DashEmpty
                    icon={BarChart3}
                    text={
                      isSuperAdmin
                        ? ar ? "لا توجد بيانات كافية لمقارنة المراكز." : "Not enough data to compare centers."
                        : ar ? "لا توجد بيانات كافية لمقارنة الحلقات." : "Not enough data to compare circles."
                    }
                    sub={
                      isSuperAdmin
                        ? ar ? "ستظهر المقارنة بعد تسجيل الحضور والمتابعة." : "Comparison will appear after attendance is recorded."
                        : ar ? "ستظهر المقارنة بعد تسجيل الحضور والمتابعة." : "Comparison will appear after attendance is recorded."
                    }
                  />
                ) : (
                  <div className="dash-compare">
                    <div className="dash-compare__group">
                      <p className="dash-compare__group-title">
                        <Award size={14} aria-hidden /> {ar ? "الأعلى انتظامًا" : "Top regular"}
                      </p>
                      {topCircles.map((c) => (
                        <CircleRow key={`top-${c.circleId}`} item={c} tone="success" ar={ar} showCenter={isSuperAdmin} />
                      ))}
                      {topCircles.length === 0 && (
                        <p className="dash-compare__empty">{ar ? "—" : "—"}</p>
                      )}
                    </div>
                    <div className="dash-compare__group">
                      <p className="dash-compare__group-title">
                        <AlertTriangle size={14} aria-hidden />{" "}
                        {ar ? "تحتاج متابعة" : "Need attention"}
                      </p>
                      {bottomCircles.map((c) => (
                        <CircleRow key={`bot-${c.circleId}`} item={c} tone="danger" ar={ar} showCenter={isSuperAdmin} />
                      ))}
                      {bottomCircles.length === 0 && (
                        <p className="dash-compare__empty">{ar ? "—" : "—"}</p>
                      )}
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

          {/* ─── SIDEBAR COLUMN ─── */}
          <div className="dash-side-col">
            {/* Operational health */}
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
                    <div className="dash-ops__ring">
                      <ProgressRing percent={presentPct} tone={healthState.tone} />
                      <div className="dash-ops__ring-meta">
                        <span className="dash-ops__ring-label">
                          {ar ? "نسبة الحضور" : "Attendance"}
                        </span>
                        <span className="dash-ops__ring-sub">
                          {attendanceTotals.present} / {attendanceTotal}
                        </span>
                      </div>
                    </div>
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
            {role && roleCanAccessRoute(role, "finance_invoices") && (
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
}: {
  icon: ElementType;
  tone: Tone;
  value: number | string | undefined | null;
  label: string;
  hasData: boolean;
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
        </div>
        <div className="dash-kpi-card__icon">
          <Icon size={20} aria-hidden />
        </div>
      </div>
    </article>
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
        {showCenter && item.centerName && (
          <span className="dash-circle-row__sub">{item.circleName}</span>
        )}
        {!showCenter && item.centerName && (
          <span className="dash-circle-row__sub">{item.centerName}</span>
        )}
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
        <p className="dash-activity__msg">{item.message}</p>
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
    .filter((c) => roleCanAccessRoute(role, c.id))
    .map((c) => c.link);
}
