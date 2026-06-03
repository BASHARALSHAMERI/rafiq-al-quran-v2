import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  MapPin,
  CheckCircle,
  ShieldAlert,
  AlertCircle,
  Fingerprint,
  RefreshCcw,
  CalendarCheck,
  CalendarX,
  BarChart3
} from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { ErrorState } from "../../../components/ui/ErrorState";
import { notifyError, notifySuccess } from "../../../shared/ui/feedback";
import { fadeUp } from "../../../shared/pageAnimations";
import { useSelfAttendance, useSelfCheckIn, useSelfCheckOut } from "../staff-attendance.api";
import { getLocalizedApiErrorMessage } from "../../../shared/api/error";
import "../../../styles/pages/self-attendance-v1.css";

export function SelfAttendanceView() {
  const { language } = useI18n();
  const ar = language === "ar";

  const attendanceQuery = useSelfAttendance();
  const checkInMutation = useSelfCheckIn();
  const checkOutMutation = useSelfCheckOut();

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setLocating(false);
        },
        (err) => {
          console.warn("Geolocation warning:", err.message);
          setGeoError(ar ? "تعذر تحديد الموقع الجغرافي" : "Unable to determine location");
          setLocating(false);
        }
      );
    }
  }, [ar]);

  if (attendanceQuery.isError) {
    const errMsg = (attendanceQuery.error as any)?.response?.data?.message
      || (attendanceQuery.error as any)?.message
      || "";
    return (
      <ErrorState
        title={ar ? "خطأ في تحميل التحضير" : "Error loading attendance"}
        description={errMsg}
        onRetry={() => attendanceQuery.refetch()}
      />
    );
  }

  if (attendanceQuery.isLoading) {
    return (
      <div className="self-attendance ctr-workspace">
        <div className="self-attendance__hero animate-pulse bg-slate-100 border-none" style={{ minHeight: 168 }}></div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const data = attendanceQuery.data;
  if (!data) return null;

  const { today, stats, eligibility, effectiveShift, target } = data;
  const todayStatus = today?.status ?? "not_checked_in";

  const handleCheckIn = () => {
    checkInMutation.mutate(
      {
        centerId: target?.centerId,
        circleId: target?.type === "CIRCLE" ? target.id : undefined,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
      },
      {
        onSuccess: () => notifySuccess(ar ? "تم تسجيل الحضور بنجاح ✅" : "Checked in successfully ✅"),
        onError: (err) => notifyError(getLocalizedApiErrorMessage(err, { ar, fallback: ar ? "خطأ في تسجيل الحضور" : "Error checking in" })),
      }
    );
  };

  const handleCheckOut = () => {
    checkOutMutation.mutate(
      {
        centerId: target?.centerId,
        circleId: target?.type === "CIRCLE" ? target.id : undefined,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
      },
      {
        onSuccess: () => notifySuccess(ar ? "تم تسجيل الانصراف بنجاح ✅" : "Checked out successfully ✅"),
        onError: (err) => notifyError(getLocalizedApiErrorMessage(err, { ar, fallback: ar ? "خطأ في تسجيل الانصراف" : "Error checking out" })),
      }
    );
  };

  // Determine hero state
  let heroClass = "self-attendance__hero--warning";
  let heroIcon = <Fingerprint size={32} className="text-indigo-600" />;
  let heroTitle = ar ? "بانتظار تسجيل الحضور" : "Waiting for Check-in";
  let heroDesc = ar ? "قم بتسجيل حضورك لبدء اليوم" : "Check in to start your day";

  if (todayStatus === "not_checked_in") {
    heroClass = "self-attendance__hero--ready";
    heroIcon = <Fingerprint size={32} className="text-emerald-600" />;
    heroTitle = ar ? "جاهز لتسجيل الحضور" : "Ready to Check In";
    heroDesc = ar ? "اضغط على الزر لتسجيل حضورك" : "Press the button to check in";
  } else if (todayStatus === "checked_in") {
    heroClass = "self-attendance__hero--active";
    heroIcon = <CheckCircle size={32} className="text-blue-600" />;
    heroTitle = ar ? "أنت مسجل حضور الآن" : "You are Checked In";
    heroDesc = ar ? "يمكنك تسجيل انصرافك عند الانتهاء" : "You can check out when done";
  } else if (todayStatus === "checked_out") {
    heroClass = "self-attendance__hero--done";
    heroIcon = <CheckCircle size={32} className="text-emerald-600" />;
    heroTitle = ar ? "تم تسجيل الحضور والانصراف ✅" : "Attendance Complete ✅";
    heroDesc = ar ? "أنهيت يومك، أحسنت!" : "You finished your day, well done!";
  } else if (todayStatus === "on_leave") {
    heroClass = "self-attendance__hero--warning";
    heroIcon = <ShieldAlert size={32} className="text-amber-500" />;
    heroTitle = ar ? "أنت في إجازة اليوم" : "You are on Leave Today";
    heroDesc = ar ? "لا يتطلب تسجيل حضور" : "No attendance required";
  }

  const canCheckIn = eligibility?.canCheckIn ?? todayStatus === "not_checked_in";
  const canCheckOut = eligibility?.canCheckOut ?? todayStatus === "checked_in";

  const isBtnDisabled = locating || checkInMutation.isPending || checkOutMutation.isPending;

  // Stats cards
  const statCards = [
    {
      label: ar ? "أيام الحضور" : "Present Days",
      value: stats?.presentDays ?? 0,
      icon: <CalendarCheck size={20} />,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: ar ? "أيام الغياب" : "Absent Days",
      value: stats?.absentDays ?? 0,
      icon: <CalendarX size={20} />,
      color: "text-rose-600 bg-rose-50",
    },
    {
      label: ar ? "إجمالي الأيام" : "Total Days",
      value: stats?.totalDays ?? 0,
      icon: <BarChart3 size={20} />,
      color: "text-indigo-600 bg-indigo-50",
    },
  ];

  return (
    <motion.section variants={fadeUp} initial="hidden" animate="visible" className="self-attendance ctr-workspace">
      {/* ── Hero Card ── */}
      <div className={`self-attendance__hero ${heroClass}`}>
        <div className="self-attendance__hero-main">
          <div className="self-attendance__hero-icon">{heroIcon}</div>
          <div className="self-attendance__hero-text">
            <h2 className="self-attendance__hero-title">{heroTitle}</h2>
            <p className="self-attendance__hero-desc">{heroDesc}</p>

            <div className="mt-3 flex items-center gap-4 text-xs font-medium text-slate-500 flex-wrap">
              {effectiveShift && (
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-400" />
                  <span>
                    {ar ? "فترة الدوام:" : "Shift:"} {effectiveShift.start} - {effectiveShift.end}
                  </span>
                </div>
              )}
              {target?.name && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  <span>{target.name}</span>
                </div>
              )}
              {today?.attendance?.checkInTime && (
                <Badge variant="success" size="sm">
                  {ar ? "دخول:" : "In:"} {today.attendance.checkInTime}
                </Badge>
              )}
              {today?.attendance?.checkOutTime && (
                <Badge variant="info" size="sm">
                  {ar ? "خروج:" : "Out:"} {today.attendance.checkOutTime}
                </Badge>
              )}
            </div>

            {/* Geo check info */}
            {today?.geoCheck && today.geoCheck.state !== "unavailable" && (
              <div
                className={`mt-2 flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded w-fit ${
                  today.geoCheck.isWithinRange
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-rose-600 bg-rose-50"
                }`}
              >
                <MapPin size={14} />
                <span>{today.geoCheck.message || (today.geoCheck.isWithinRange ? (ar ? "ضمن النطاق" : "Within range") : (ar ? "خارج النطاق" : "Outside range"))}</span>
                {today.geoCheck.distanceMeters != null && (
                  <span className="text-slate-400 font-normal ms-1">({Math.round(today.geoCheck.distanceMeters)}m)</span>
                )}
              </div>
            )}

            {/* Eligibility warnings */}
            {eligibility?.warnings && eligibility.warnings.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {eligibility.warnings.map((w, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-amber-600 text-xs font-bold bg-amber-50 px-2 py-1 rounded w-fit">
                    <AlertCircle size={14} />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="self-attendance__hero-actions flex flex-col justify-center items-end gap-2 min-w-[200px]">
          {canCheckIn && todayStatus === "not_checked_in" && (
            <Button
              variant="primary"
              size="lg"
              className="px-8 w-full"
              disabled={isBtnDisabled}
              isLoading={checkInMutation.isPending}
              onClick={handleCheckIn}
            >
              {locating ? (
                <RefreshCcw className="animate-spin me-2" size={16} />
              ) : (
                <Fingerprint className="me-2" size={18} />
              )}
              {locating ? (ar ? "تحديد الموقع..." : "Locating...") : ar ? "تسجيل الحضور" : "Check In"}
            </Button>
          )}

          {canCheckOut && todayStatus === "checked_in" && (
            <Button
              variant="secondary"
              size="lg"
              className="px-8 w-full"
              disabled={isBtnDisabled}
              isLoading={checkOutMutation.isPending}
              onClick={handleCheckOut}
            >
              {locating ? (
                <RefreshCcw className="animate-spin me-2" size={16} />
              ) : (
                <Fingerprint className="me-2" size={18} />
              )}
              {locating ? (ar ? "تحديد الموقع..." : "Locating...") : ar ? "تسجيل الانصراف" : "Check Out"}
            </Button>
          )}

          {geoError && <span className="text-xs text-rose-500">{geoError}</span>}
          {location && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <MapPin size={10} /> {ar ? "الموقع متوفر" : "Location available"}
            </span>
          )}
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {statCards.map((card) => (
          <motion.div
            key={card.label}
            variants={fadeUp}
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white shadow-sm"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{card.value}</div>
              <div className="text-xs text-slate-500 font-medium">{card.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── History Table ── */}
      {data.history && data.history.length > 0 && (
        <div className="mt-6 ctr-card-modern !p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-700">{ar ? "سجل الحضور الأخير" : "Recent Attendance History"}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs">
                  <th className="py-2.5 px-4 text-start font-semibold">{ar ? "التاريخ" : "Date"}</th>
                  <th className="py-2.5 px-4 text-start font-semibold">{ar ? "الحالة" : "Status"}</th>
                  <th className="py-2.5 px-4 text-start font-semibold">{ar ? "وقت الدخول" : "Check In"}</th>
                  <th className="py-2.5 px-4 text-start font-semibold">{ar ? "وقت الخروج" : "Check Out"}</th>
                  <th className="py-2.5 px-4 text-start font-semibold">{ar ? "ملاحظات" : "Notes"}</th>
                </tr>
              </thead>
              <tbody>
                {data.history.slice(0, 15).map((record) => (
                  <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-slate-700">{record.attendanceDate}</td>
                    <td className="py-2.5 px-4">
                      <Badge
                        variant={
                          record.status === "PRESENT" ? "success" :
                          record.status === "ABSENT" ? "error" :
                          record.status === "ON_LEAVE" ? "warning" : "secondary"
                        }
                        size="sm"
                      >
                        {record.status === "PRESENT" ? (ar ? "حاضر" : "Present") :
                         record.status === "ABSENT" ? (ar ? "غائب" : "Absent") :
                         record.status === "LATE" ? (ar ? "متأخر" : "Late") :
                         record.status === "ON_LEAVE" ? (ar ? "إجازة" : "On Leave") : record.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{record.checkInTime ?? "—"}</td>
                    <td className="py-2.5 px-4 text-slate-600">{record.checkOutTime ?? "—"}</td>
                    <td className="py-2.5 px-4 text-slate-400 text-xs">{record.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.section>
  );
}
