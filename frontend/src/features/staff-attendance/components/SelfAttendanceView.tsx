import { useState, useMemo } from "react";
import {
  AlertCircle,
  CalendarCheck,
  CalendarX,
  CheckCircle,
  Clock,
  FileText,
  Fingerprint,
  Info,
  LogOut,
  MapPin,
  RefreshCcw,
  Send,
  ShieldAlert,
  Umbrella,
} from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { ErrorState } from "../../../components/ui/ErrorState";
import { notifyError, notifySuccess } from "../../../shared/ui/feedback";
import { haversineMeters, requestBrowserLocation } from "../../../shared/geo/browser-location";
import {
  useSelfAttendance,
  useSelfCheckIn,
  useSelfCheckOut,
  useRequestStaffExcuse,
  useSubmitLeave,
  type SelfAttendanceRecord,
  type LeaveType,
} from "../staff-attendance.api";
import { getLocalizedApiErrorMessage } from "../../../shared/api/error";
import { useTimeFormat, fmtTime } from "../../../shared/utils/time-format";
import "../../../styles/pages/self-attendance-v2.css";

// ─── Constants ───────────────────────────────────────
/** أنواع الأعذار الموحّدة */
export const EXCUSE_TYPES = [
  { ar: "مرض", en: "Medical" },
  { ar: "سفر", en: "Travel" },
  { ar: "ظرف عائلي", en: "Family matter" },
  { ar: "مهمة رسمية", en: "Official duty" },
  { ar: "موعد رسمي", en: "Official appointment" },
  { ar: "أخرى", en: "Other" },
] as const;

const LEAVE_TYPES: { value: LeaveType; ar: string; en: string }[] = [
  { value: "MEDICAL",  ar: "إجازة مرضية",     en: "Medical Leave" },
  { value: "OFFICIAL", ar: "إجازة رسمية",     en: "Official Leave" },
  { value: "PERSONAL", ar: "إجازة شخصية",     en: "Personal Leave" },
  { value: "UNPAID",   ar: "إجازة بدون راتب", en: "Unpaid Leave" },
];

// ─── Helpers ─────────────────────────────────────────
function fmtDate(value: string, locale = "ar-SA"): string {
  try {
    const d = new Date(value);
    return d.toLocaleDateString(locale, { weekday: "long", day: "2-digit", month: "long" });
  } catch {
    return value;
  }
}

type StatusTone = "success" | "danger" | "warning" | "info" | "neutral";

function getStatusTone(status: string): StatusTone {
  switch (status?.toUpperCase()) {
    case "PRESENT":
    case "APPROVED":
      return "success";
    case "ABSENT":
    case "REJECTED":
      return "danger";
    case "LATE":
    case "PENDING":
    case "EXCUSED":
      return "warning";
    case "ON_LEAVE":
      return "info";
    default:
      return "neutral";
  }
}

function getStatusLabel(status: string, ar: boolean): string {
  switch (status?.toUpperCase()) {
    case "PRESENT":   return ar ? "حاضر"            : "Present";
    case "ABSENT":    return ar ? "غائب"             : "Absent";
    case "LATE":      return ar ? "متأخر"            : "Late";
    case "EXCUSED":   return ar ? "بعذر"             : "Excused";
    case "ON_LEAVE":  return ar ? "إجازة"            : "On Leave";
    case "APPROVED":  return ar ? "مقبول"            : "Approved";
    case "REJECTED":  return ar ? "مرفوض"            : "Rejected";
    case "PENDING":   return ar ? "بانتظار المراجعة" : "Pending";
    default:          return ar ? "غير محدد"         : "Unknown";
  }
}

// ─── Skeleton ─────────────────────────────────────────
function AttendanceSkeleton() {
  return (
    <div className="sa2-skeleton">
      <div className="sa2-skeleton__hero" />
      <div className="sa2-skeleton__stats">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="sa2-skeleton__stat" />
        ))}
      </div>
      <div className="sa2-skeleton__row" />
      <div className="sa2-skeleton__row" />
      <div className="sa2-skeleton__row" />
    </div>
  );
}

// ─── History row ──────────────────────────────────────
function HistoryRow({ record, locale, ar, hour12 }: { record: SelfAttendanceRecord; locale: string; ar: boolean; hour12: boolean }) {
  const tone = getStatusTone(record.status);
  const label = getStatusLabel(record.status, ar);

  // إصلاح: عرض الوقت بالاتجاه الصحيح دخول → خروج
  const timeRange =
    record.checkInTime && record.checkOutTime
      ? `${fmtTime(record.checkInTime, locale, hour12)} ← ${fmtTime(record.checkOutTime, locale, hour12)}`
      : record.checkInTime
      ? `${ar ? "دخول" : "In"}: ${fmtTime(record.checkInTime, locale, hour12)}`
      : "";

  return (
    <div className="sa2-history-row">
      <span className={`sa2-history-dot sa2-history-dot--${tone}`} />
      <div className="sa2-history-body">
        <span className="sa2-history-date">{fmtDate(record.attendanceDate, locale)}</span>
        {timeRange && <span className="sa2-history-sub">{timeRange}</span>}
        {record.note && <span className="sa2-history-sub">{record.note}</span>}
      </div>
      <span className={`sa2-pill sa2-pill--${tone}`}>{label}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────
export function SelfAttendanceView() {
  const { language } = useI18n();
  const ar = language === "ar";
  const locale = ar ? "ar-SA-u-nu-latn" : "en-US";

  // ── Queries & mutations
  const attendanceQuery = useSelfAttendance();
  const checkInMutation  = useSelfCheckIn();
  const checkOutMutation = useSelfCheckOut();
  const excuseMutation   = useRequestStaffExcuse();
  const leaveMutation    = useSubmitLeave();

  // ── Geo location state
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number | null } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  // ── Modal state
  const [showExcuseModal, setShowExcuseModal] = useState(false);
  const [showLeaveModal,  setShowLeaveModal]  = useState(false);

  // ── Excuse form
  const [excuseType, setExcuseType] = useState("");
  const [excuseNote, setExcuseNote] = useState("");

  // ── Leave form
  const [leaveType,   setLeaveType]   = useState<LeaveType>("MEDICAL");
  const [leaveStart,  setLeaveStart]  = useState("");
  const [leaveEnd,    setLeaveEnd]    = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const data = attendanceQuery.data;
  const { hour12 } = useTimeFormat();

  const today = data?.today;
  const stats = data?.stats;
  const eligibility = data?.eligibility;
  const effectiveShift = data?.effectiveShift;
  const target = data?.target;
  const excuses = data?.excuses;
  
  const todayStatus = today?.status ?? "not_checked_in";
  const todayAtt    = today?.attendance;

  // ── Hero state config
  type HeroState = { heroClass: string; icon: React.ReactNode; title: string; desc: string };
  const heroState = useMemo<HeroState>(() => {
    if (todayStatus === "checked_out")
      return {
        heroClass: "sa2-hero--done",
        icon: <CheckCircle size={28} />,
        title: ar ? "تم تسجيل الحضور والانصراف ✅" : "Attendance Complete ✅",
        desc:  ar ? "أنهيت يومك، أحسنت!"              : "Great job, see you tomorrow!",
      };
    if (todayStatus === "checked_in")
      return {
        heroClass: "sa2-hero--active",
        icon: <CheckCircle size={28} />,
        title: ar ? "أنت مسجّل حضور الآن"   : "You are Checked In",
        desc:  ar ? "يمكنك تسجيل انصرافك عند الانتهاء" : "Check out when done",
      };
    if (todayStatus === "on_leave")
      return {
        heroClass: "sa2-hero--warning",
        icon: <ShieldAlert size={28} />,
        title: ar ? "أنت في إجازة اليوم" : "On Leave Today",
        desc:  ar ? "لا يتطلب تسجيل حضور" : "No attendance required",
      };
    if (todayStatus === "excuse_requested")
      return {
        heroClass: "sa2-hero--warning",
        icon: <FileText size={28} />,
        title: ar ? "طلب عذر قيد المراجعة" : "Excuse Pending Review",
        desc:  ar ? "تم رفع طلب العذر وبانتظار الموافقة" : "Excuse request submitted",
      };
    // not_checked_in
    return {
      heroClass: "sa2-hero--ready",
      icon: <Fingerprint size={28} />,
      title: ar ? "جاهز لتسجيل الحضور" : "Ready to Check In",
      desc:  ar ? "اضغط على الزر لتسجيل حضورك" : "Press the button to check in",
    };
  }, [todayStatus, ar]);



  // ── History: combine attendance + excuses
  const historyRows = useMemo(() => {
    const map = new Map<string, SelfAttendanceRecord & { _excuseReason?: string }>();
    for (const rec of data?.history ?? []) {
      if (rec.attendanceDate) map.set(rec.attendanceDate.slice(0, 10), rec);
    }
    return Array.from(map.values())
      .sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate))
      .slice(0, 15);
  }, [data?.history]);

  const handleVerifyLocation = async () => {
    setLocating(true);
    try {
      const coords = await requestBrowserLocation(ar);
      setLocation(coords);
      setGeoError(null);

      if (target?.latitude != null && target?.longitude != null) {
        const distance = Math.round(haversineMeters({
          fromLat: coords.latitude,
          fromLng: coords.longitude,
          toLat: target.latitude,
          toLng: target.longitude,
        }));
        const radius = target.allowedRadiusMeters ?? 150;

        if (distance <= radius) {
          notifySuccess(ar ? `\u0623\u0646\u062a \u062f\u0627\u062e\u0644 \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0633\u0645\u0648\u062d (\u0627\u0644\u0645\u0633\u0627\u0641\u0629: ${distance}\u0645)` : `Within range (${distance}m)`);
        } else {
          notifyError(ar ? `\u0623\u0646\u062a \u062e\u0627\u0631\u062c \u0627\u0644\u0646\u0637\u0627\u0642 (\u0627\u0644\u0645\u0633\u0627\u0641\u0629: ${distance}\u0645\u060c \u0627\u0644\u0645\u0633\u0645\u0648\u062d: ${radius}\u0645)` : `Outside range (${distance}m, allowed: ${radius}m)`);
        }
      } else {
        notifySuccess(ar ? "\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u0648\u0642\u0639" : "Location updated");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : ar ? "\u0627\u0644\u0645\u0648\u0642\u0639 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d" : "Location unavailable";
      setGeoError(message);
      notifyError(message);
    } finally {
      setLocating(false);
    }
  };

  // ── Handlers
  const isBusy = locating || checkInMutation.isPending || checkOutMutation.isPending ||
                 excuseMutation.isPending || leaveMutation.isPending;

  const buildGeoPayload = () => ({
    centerId:  target?.centerId,
    circleId:  target?.type === "CIRCLE" ? target.id : undefined,
    latitude:  location?.latitude  ?? null,
    longitude: location?.longitude ?? null,
  });

  const handleCheckIn = () => {
    const isGeoStrict = data?.policy?.geoEnforcement === "STRICT";
    if (isGeoStrict && !location) {
      notifyError(ar ? "\u064a\u0631\u062c\u0649 \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639 \u0623\u0648\u0644\u0627 \u0639\u0628\u0631 \u0632\u0631 \u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u062c\u063a\u0631\u0627\u0641\u064a" : "Please get your location first using the location button");
      return;
    }
    checkInMutation.mutate(buildGeoPayload(), {
      onSuccess: () => notifySuccess(ar ? "تم تسجيل الحضور ✅" : "Checked in ✅"),
      onError:   (err) => notifyError(getLocalizedApiErrorMessage(err, { ar, fallback: ar ? "خطأ في تسجيل الحضور" : "Check-in failed" })),
    });
  };

  const handleCheckOut = () => {
    const isGeoStrict = data?.policy?.geoEnforcement === "STRICT";
    if (isGeoStrict && !location) {
      notifyError(ar ? "\u064a\u0631\u062c\u0649 \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639 \u0623\u0648\u0644\u0627 \u0639\u0628\u0631 \u0632\u0631 \u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u062c\u063a\u0631\u0627\u0641\u064a" : "Please get your location first using the location button");
      return;
    }
    checkOutMutation.mutate(buildGeoPayload(), {
      onSuccess: () => notifySuccess(ar ? "تم تسجيل الانصراف ✅" : "Checked out ✅"),
      onError:   (err) => notifyError(getLocalizedApiErrorMessage(err, { ar, fallback: ar ? "خطأ في تسجيل الانصراف" : "Check-out failed" })),
    });
  };

  const handleSubmitExcuse = () => {
    if (!excuseType || !target?.centerId) return;
    const reason = excuseNote.trim() ? `${excuseType} - ${excuseNote.trim()}` : excuseType;
    const dateStr = today?.date ?? new Date().toISOString().slice(0, 10);
    excuseMutation.mutate(
      { centerId: target.centerId, date: dateStr, reason },
      {
        onSuccess: () => {
          notifySuccess(ar ? "تم إرسال طلب العذر" : "Excuse submitted");
          setShowExcuseModal(false);
          setExcuseType("");
          setExcuseNote("");
        },
        onError: (err) => notifyError(getLocalizedApiErrorMessage(err, { ar, fallback: ar ? "تعذر إرسال الطلب" : "Failed to submit" })),
      }
    );
  };

  const handleSubmitLeave = () => {
    if (!target?.centerId || !leaveStart || !leaveEnd) return;
    leaveMutation.mutate(
      { centerId: target.centerId, leaveType, startDate: leaveStart, endDate: leaveEnd, reason: leaveReason.trim() },
      {
        onSuccess: () => {
          notifySuccess(ar ? "تم إرسال طلب الإجازة" : "Leave submitted");
          setShowLeaveModal(false);
          setLeaveStart("");
          setLeaveEnd("");
          setLeaveReason("");
        },
        onError: (err) => notifyError(getLocalizedApiErrorMessage(err, { ar, fallback: ar ? "تعذر إرسال الطلب" : "Failed to submit" })),
      }
    );
  };


  // ── Error state
  if (attendanceQuery.isError) {
    return (
      <ErrorState
        title={ar ? "خطأ في تحميل التحضير" : "Error loading attendance"}
        description={getLocalizedApiErrorMessage(attendanceQuery.error, {
          ar,
          fallback: ar ? "تعذر تحميل بيانات التحضير" : "Unable to load attendance data",
        })}
        onRetry={() => attendanceQuery.refetch()}
      />
    );
  }

  // ── Loading state
  if (attendanceQuery.isLoading || !data) {
    return <AttendanceSkeleton />;
  }

  // ──────────────────────────────────────────────────
  return (
    <div className="sa2" dir={ar ? "rtl" : "ltr"} aria-label={ar ? "تحضيري" : "My Attendance"}>

      {/* ══════════════════════════════════════════════
          TOP ROW: Hero (left) + Stats column (right)
          ══════════════════════════════════════════════ */}
      <div className="sa2-top-row">

        {/* ── Hero Card ── */}
        <div className={`sa2-hero ${heroState.heroClass}`}>
          <div className="sa2-hero__status-row">
            <div className="sa2-hero__icon">{heroState.icon}</div>
            <div className="sa2-hero__text">
              <div className="sa2-hero__eyebrow">
                <Clock size={11} />
                {today?.date ? fmtDate(today.date, locale) : (ar ? "اليوم" : "Today")}
              </div>
              <h2 className="sa2-hero__title">{heroState.title}</h2>
              <p className="sa2-hero__desc">{heroState.desc}</p>
            </div>
          </div>

          {/* Meta chips */}
          <div className="sa2-hero__meta">
            {effectiveShift && (
              <span className="sa2-hero__chip">
                <Clock size={11} />
                {fmtTime(effectiveShift.start, locale, hour12)} – {fmtTime(effectiveShift.end, locale, hour12)}
              </span>
            )}
            {target?.name && (
              <span className="sa2-hero__chip sa2-hero__chip--neutral">
                <MapPin size={11} />
                {target.name}
              </span>
            )}
            {todayAtt?.checkInTime && (
              <span className="sa2-hero__chip">
                ✓ {ar ? "دخول" : "In"}: {fmtTime(todayAtt.checkInTime, locale, hour12)}
              </span>
            )}
            {todayAtt?.checkOutTime && (
              <span className="sa2-hero__chip sa2-hero__chip--neutral">
                ✓ {ar ? "خروج" : "Out"}: {fmtTime(todayAtt.checkOutTime, locale, hour12)}
              </span>
            )}
          </div>

          {/* Eligibility warnings */}
          {eligibility?.warnings && eligibility.warnings.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {eligibility.warnings.map((w, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.375rem", padding:"0.35rem 0.5rem", borderRadius:"0.5rem", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", color:"#92400e", fontSize:"0.75rem", fontWeight:600 }}>
                  <AlertCircle size={12} />
                  {w}
                </div>
              ))}
            </div>
          )}

          {/* ── Action buttons ── */}
          <div className="sa2-hero__actions">
            {/* Shift time warning */}
            {!eligibility?.canCheckIn && todayStatus === "not_checked_in" && (eligibility?.checkInBlockedReasons ?? []).length > 0 && (
              <div className="sa2-shift-warning">
                <Info size={13} />
                {eligibility!.checkInBlockedReasons[0]}
              </div>
            )}

            {/* not_checked_in */}
            {todayStatus === "not_checked_in" && (
              <>
                <Button
                  variant="primary"
                  size="md"
                  disabled={isBusy || !eligibility?.canCheckIn}
                  isLoading={checkInMutation.isPending}
                  onClick={handleCheckIn}
                  fullWidth
                >
                  {locating
                    ? <RefreshCcw size={14} className="animate-spin" style={{ marginInlineEnd: "0.375rem" }} />
                    : <Fingerprint size={14} style={{ marginInlineEnd: "0.375rem" }} />}
                  {locating ? (ar ? "تحديد الموقع..." : "Locating...") : (ar ? "تسجيل الحضور" : "Check In")}
                </Button>
                <div className="sa2-hero__secondary-btns">
                  <Button variant="secondary" size="sm" disabled={isBusy} onClick={() => setShowExcuseModal(true)} fullWidth>
                    <FileText size={13} style={{ marginInlineEnd: "0.25rem" }} />
                    {ar ? "عذر" : "Excuse"}
                  </Button>
                  <Button variant="secondary" size="sm" disabled={isBusy} onClick={() => setShowLeaveModal(true)} fullWidth>
                    <Umbrella size={13} style={{ marginInlineEnd: "0.25rem" }} />
                    {ar ? "إجازة" : "Leave"}
                  </Button>
                </div>
              </>
            )}

            {/* checked_in */}
            {todayStatus === "checked_in" && (
              <Button variant="secondary" size="md" disabled={isBusy || !eligibility?.canCheckOut} isLoading={checkOutMutation.isPending} onClick={handleCheckOut} fullWidth>
                <LogOut size={14} style={{ marginInlineEnd: "0.375rem" }} />
                {ar ? "تسجيل الانصراف" : "Check Out"}
              </Button>
            )}

            {/* checked_out */}
            {todayStatus === "checked_out" && (
              <div className="sa2-done-badge">
                <CheckCircle size={15} />
                {ar ? "اكتمل التحضير اليوم" : "Attendance complete"}
              </div>
            )}

            {/* excuse_requested */}
            {todayStatus === "excuse_requested" && (
              <div className="sa2-excuse-badge">
                <FileText size={15} />
                {ar ? "طلب العذر بانتظار المراجعة" : "Excuse pending review"}
              </div>
            )}

            {/* on_leave */}
            {todayStatus === "on_leave" && (
              <div className="sa2-leave-badge">
                <Umbrella size={15} />
                {ar ? "في إجازة اليوم" : "On leave today"}
              </div>
            )}

            {/* Geo verify button */}
            {data?.policy?.geoEnforcement !== "DISABLED" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "stretch" }}>
                <button
                  onClick={() => void handleVerifyLocation()}
                  disabled={isBusy}
                  className={`sa2-geo ${geoError ? "sa2-geo--warning" : location ? "sa2-geo--ok" : "sa2-geo--muted"}`}
                  style={{ border:"none", background:"none", cursor:"pointer", padding:"0.2rem 0", fontFamily:"inherit", textDecoration:"underline dotted" }}
                >
                  {locating ? <RefreshCcw size={11} className="animate-spin" /> : <MapPin size={11} />}
                  {geoError
                    ? geoError
                    : location
                      ? (ar ? "تحديث موقعي" : "Refresh my location")
                      : (ar ? "تحديد موقعي" : "Use my location")}
                </button>
                {location && (
                  <div style={{ fontSize: "0.72rem", color: "#475569", textAlign: ar ? "right" : "left" }}>
                    <span dir="ltr">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
                    <span>{ar ? "\u0627\u0644\u062f\u0642\u0629" : "Accuracy"}: {location.accuracy == null ? (ar ? "\u063a\u064a\u0631 \u0645\u0639\u0631\u0648\u0641\u0629" : "unknown") : `\u00b1${location.accuracy}m`}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Stats Column ── */}
        <div className="sa2-stats-col">
          <div className="sa2-stat-card sa2-stat-card--present">
            <div className="sa2-stat-icon"><CalendarCheck size={17} /></div>
            <div className="sa2-stat-body">
              <span className="sa2-stat-value">{stats?.presentDays ?? 0}</span>
              <span className="sa2-stat-label">{ar ? "أيام الحضور" : "Present Days"}</span>
            </div>
          </div>
          <div className="sa2-stat-card sa2-stat-card--absent">
            <div className="sa2-stat-icon"><CalendarX size={17} /></div>
            <div className="sa2-stat-body">
              <span className="sa2-stat-value">{stats?.absentDays ?? 0}</span>
              <span className="sa2-stat-label">{ar ? "أيام الغياب" : "Absent Days"}</span>
            </div>
          </div>
          <div className="sa2-stat-card sa2-stat-card--total">
            <div className="sa2-stat-icon"><Clock size={17} /></div>
            <div className="sa2-stat-body">
              <span className="sa2-stat-value">{stats?.totalDays ?? 0}</span>
              <span className="sa2-stat-label">{ar ? "إجمالي الأيام" : "Total Days"}</span>
            </div>
          </div>
          <div className="sa2-stat-card sa2-stat-card--excuse">
            <div className="sa2-stat-icon"><FileText size={17} /></div>
            <div className="sa2-stat-body">
              <span className="sa2-stat-value">{excuses?.filter((e) => e.status === "APPROVED").length ?? 0}</span>
              <span className="sa2-stat-label">{ar ? "أعذار مقبولة" : "Approved Excuses"}</span>
            </div>
          </div>
          <div className="sa2-stat-card sa2-stat-card--leave">
            <div className="sa2-stat-icon"><Umbrella size={17} /></div>
            <div className="sa2-stat-body">
              <span className="sa2-stat-value">{stats?.onLeaveDays ?? 0}</span>
              <span className="sa2-stat-label">{ar ? "أيام الإجازة" : "Leave Days"}</span>
            </div>
          </div>
        </div>
      </div>



      {/* ── History Panel ── */}
      <div className="sa2-section">
        <div className="sa2-section__head">
          <h3 className="sa2-section__title">
            <CalendarCheck size={15} />
            {ar ? "سجل الحضور" : "Attendance History"}
          </h3>
          {historyRows.length > 0 && (
            <span style={{ padding:"0.15rem 0.5rem", borderRadius:"9999px", background:"rgba(4,120,87,0.08)", color:"#047857", fontSize:"0.75rem", fontWeight:700, border:"1px solid rgba(4,120,87,0.15)" }}>
              {historyRows.length}
            </span>
          )}
        </div>
        <div className="sa2-section__body">
          {historyRows.length === 0 ? (
            <div className="sa2-empty">
              <CalendarCheck size={32} />
              <p>{ar ? "لا توجد سجلات لهذا الشهر" : "No records this month"}</p>
            </div>
          ) : (
            <div className="sa2-history-list">
              {historyRows.map((rec) => (
                <HistoryRow key={rec.id} record={rec} locale={locale} ar={ar} hour12={hour12} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Excuses Panel ── */}
      {excuses && excuses.length > 0 && (
        <div className="sa2-section">
          <div className="sa2-section__head">
            <h3 className="sa2-section__title">
              <FileText size={15} />
              {ar ? "طلبات الأعذار" : "Excuse Requests"}
            </h3>
            <span style={{ padding:"0.15rem 0.5rem", borderRadius:"9999px", background:"rgba(180,83,9,0.08)", color:"#92400e", fontSize:"0.75rem", fontWeight:700, border:"1px solid rgba(180,83,9,0.15)" }}>
              {excuses.length}
            </span>
          </div>
          <div className="sa2-section__body">
            <div className="sa2-excuse-list">
              {excuses.map((ex) => {
                const tone = getStatusTone(ex.status);
                return (
                  <div key={ex.id} className="sa2-excuse-card">
                    <div className="sa2-excuse-card__meta">
                      <div className="sa2-excuse-card__date">{fmtDate(ex.absenceDate, locale)}</div>
                      <div className="sa2-excuse-card__reason">{ex.reason}</div>
                    </div>
                    <span className={`sa2-pill sa2-pill--${tone}`}>{getStatusLabel(ex.status, ar)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          EXCUSE MODAL
          ══════════════════════════════════════════ */}
      <Modal
        isOpen={showExcuseModal}
        onClose={() => setShowExcuseModal(false)}
        title={ar ? "طلب عذر غياب" : "Request Excuse"}
        size="sm"
        footer={
          <div style={{ display: "flex", gap: "0.75rem", width: "100%" }}>
            <Button variant="ghost" style={{ flex: 1 }} onClick={() => setShowExcuseModal(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="primary"
              style={{ flex: 2 }}
              disabled={!excuseType || excuseMutation.isPending}
              isLoading={excuseMutation.isPending}
              onClick={handleSubmitExcuse}
            >
              <Send size={13} style={{ marginInlineEnd: "0.375rem" }} />
              {ar ? "إرسال الطلب" : "Submit"}
            </Button>
          </div>
        }
      >
        <div className="sa2-form">
          <div className="sa2-field">
            <label className="sa2-label">{ar ? "نوع العذر" : "Excuse Type"}</label>
            <select className="sa2-select" value={excuseType} onChange={(e) => setExcuseType(e.target.value)}>
              <option value="">{ar ? "اختر نوع العذر..." : "Select type..."}</option>
              {EXCUSE_TYPES.map((t) => (
                <option key={t.ar} value={t.ar}>{ar ? t.ar : t.en}</option>
              ))}
            </select>
          </div>
          <div className="sa2-field">
            <label className="sa2-label">{ar ? "وصف إضافي (اختياري)" : "Note (optional)"}</label>
            <textarea
              className="sa2-textarea"
              value={excuseNote}
              onChange={(e) => setExcuseNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={ar ? "اكتب تفاصيل العذر إن وجدت..." : "Add details if needed..."}
            />
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════
          LEAVE MODAL
          ══════════════════════════════════════════ */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title={ar ? "طلب إجازة" : "Request Leave"}
        size="sm"
        footer={
          <div style={{ display: "flex", gap: "0.75rem", width: "100%" }}>
            <Button variant="ghost" style={{ flex: 1 }} onClick={() => setShowLeaveModal(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="primary"
              style={{ flex: 2 }}
              disabled={!leaveStart || !leaveEnd || leaveMutation.isPending}
              isLoading={leaveMutation.isPending}
              onClick={handleSubmitLeave}
            >
              <Send size={13} style={{ marginInlineEnd: "0.375rem" }} />
              {ar ? "إرسال الطلب" : "Submit"}
            </Button>
          </div>
        }
      >
        <div className="sa2-form">
          <div className="sa2-field">
            <label className="sa2-label">{ar ? "نوع الإجازة" : "Leave Type"}</label>
            <select
              className="sa2-select"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {ar ? t.ar : t.en}
                </option>
              ))}
            </select>
          </div>
          <div className="sa2-form-row">
            <div className="sa2-field">
              <label className="sa2-label">{ar ? "تاريخ البداية" : "Start Date"}</label>
              <input
                type="date"
                className="sa2-input"
                value={leaveStart}
                onChange={(e) => setLeaveStart(e.target.value)}
              />
            </div>
            <div className="sa2-field">
              <label className="sa2-label">{ar ? "تاريخ النهاية" : "End Date"}</label>
              <input
                type="date"
                className="sa2-input"
                value={leaveEnd}
                min={leaveStart}
                onChange={(e) => setLeaveEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="sa2-field sa2-field--full">
            <label className="sa2-label">{ar ? "السبب (اختياري)" : "Reason (optional)"}</label>
            <textarea
              className="sa2-textarea"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              rows={2}
              placeholder={ar ? "اكتب سبب الإجازة..." : "Reason for leave..."}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
