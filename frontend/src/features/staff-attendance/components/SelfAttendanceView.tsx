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
  Description,
  BeachAccess,
  LogIn,
  LogOut,
  Send,
  Info
} from "lucide-react";
import { useI18n } from "../../../app/i18n";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { ErrorState } from "../../../components/ui/ErrorState";
import { notifyError, notifySuccess } from "../../../shared/ui/feedback";
import { fadeUp } from "../../../shared/pageAnimations";
import { useSelfAttendance, useSelfCheckIn, useSelfCheckOut, useRequestStaffExcuse, useSubmitLeave } from "../staff-attendance.api";
import { Modal } from "../../../components/ui/Modal";
import { getLocalizedApiErrorMessage } from "../../../shared/api/error";
import "../../../styles/pages/self-attendance-v1.css";

export function SelfAttendanceView() {
  const { language } = useI18n();
  const ar = language === "ar";

  const attendanceQuery = useSelfAttendance();
  const checkInMutation = useSelfCheckIn();
  const checkOutMutation = useSelfCheckOut();
  const excuseMutation = useRequestStaffExcuse();
  const leaveMutation = useSubmitLeave();

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [showExcuseModal, setShowExcuseModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [excuseType, setExcuseType] = useState("");
  const [excuseNote, setExcuseNote] = useState("");
  const [leaveType, setLeaveType] = useState<"MEDICAL" | "OFFICIAL" | "PERSONAL" | "UNPAID">("MEDICAL");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

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

  const handleSubmitExcuse = () => {
    if (!excuseType || !target?.centerId) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const reason = excuseNote.trim() ? `${excuseType} - ${excuseNote.trim()}` : excuseType;
    excuseMutation.mutate(
      { centerId: target.centerId, date: todayStr, reason },
      {
        onSuccess: () => {
          notifySuccess(ar ? "تم إرسال طلب العذر بنجاح" : "Excuse request sent");
          setShowExcuseModal(false);
          setExcuseType("");
          setExcuseNote("");
        },
        onError: (err) => notifyError(getLocalizedApiErrorMessage(err, { ar, fallback: ar ? "تعذر إرسال الطلب" : "Failed to send request" })),
      }
    );
  };

  const handleSubmitLeave = () => {
    if (!target?.centerId || !leaveStart || !leaveEnd) return;
    leaveMutation.mutate(
      { centerId: target.centerId, leaveType, startDate: leaveStart, endDate: leaveEnd, reason: leaveReason.trim() },
      {
        onSuccess: () => {
          notifySuccess(ar ? "تم إرسال طلب الإجازة بنجاح" : "Leave request sent");
          setShowLeaveModal(false);
          setLeaveStart("");
          setLeaveEnd("");
          setLeaveReason("");
        },
        onError: (err) => notifyError(getLocalizedApiErrorMessage(err, { ar, fallback: ar ? "تعذر إرسال الطلب" : "Failed to send request" })),
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

  const isBtnDisabled = locating || checkInMutation.isPending || checkOutMutation.isPending || excuseMutation.isPending || leaveMutation.isPending;
  const shiftInRange = !effectiveShift ? true : (() => {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const parse = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
    const startMin = parse(effectiveShift.start) - 30;
    const endMin = parse(effectiveShift.end) + 30;
    return nowMin >= startMin && nowMin <= endMin;
  })();

  // Stats cards
  const statCards = [
    {
      label: ar ? "الإجمالي" : "Total",
      value: stats?.totalDays ?? 0,
      icon: <CalendarCheck size={20} />,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: ar ? "أيام الغياب" : "Absent",
      value: stats?.absentDays ?? 0,
      icon: <CalendarX size={20} />,
      color: "text-rose-600 bg-rose-50",
    },
    {
      label: ar ? "أيام الحضور" : "Present",
      value: stats?.presentDays ?? 0,
      icon: <CheckCircle size={20} />,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: ar ? "أعذار مقبولة" : "Excused",
      value: data?.excuses?.filter((e) => e.status === "APPROVED").length ?? 0,
      icon: <Description size={20} />,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: ar ? "أيام الإجازة" : "On Leave",
      value: stats?.onLeaveDays ?? 0,
      icon: <BeachAccess size={20} />,
      color: "text-amber-600 bg-amber-50",
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

        <div className="self-attendance__hero-actions flex flex-col gap-2 min-w-[200px]">
          {!shiftInRange && todayStatus === "not_checked_in" && (
            <div className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg font-bold flex items-center gap-1.5">
              <Info size={14} />
              {ar ? "تسجيل الحضور متاح فقط خلال موعد الوردية (±30 دقيقة)" : "Check-in only during shift (±30 min)"}
            </div>
          )}

          {todayStatus === "not_checked_in" && (
            <>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  className="flex-1"
                  disabled={isBtnDisabled}
                  onClick={() => setShowExcuseModal(true)}
                >
                  <Description className="me-1.5" size={14} />
                  {ar ? "طلب عذر" : "Excuse"}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-[2]"
                  disabled={isBtnDisabled || !shiftInRange}
                  isLoading={checkInMutation.isPending}
                  onClick={handleCheckIn}
                >
                  {locating ? <RefreshCcw className="animate-spin me-1.5" size={14} /> : <Fingerprint className="me-1.5" size={16} />}
                  {locating ? (ar ? "تحديد..." : "Locating...") : ar ? "تسجيل الحضور" : "Check In"}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="md"
                className="w-full"
                disabled={isBtnDisabled}
                onClick={() => setShowLeaveModal(true)}
              >
                <BeachAccess className="me-1.5" size={14} />
                {ar ? "طلب إجازة" : "Request Leave"}
              </Button>
            </>
          )}

          {todayStatus === "checked_in" && (
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              disabled={isBtnDisabled}
              isLoading={checkOutMutation.isPending}
              onClick={handleCheckOut}
            >
              <LogOut className="me-2" size={18} />
              {ar ? "تسجيل المغادرة" : "Check Out"}
            </Button>
          )}

          {todayStatus === "checked_out" && (
            <div className="text-center py-2.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-sm">
              ✓ {ar ? "تم تسجيل الحضور والمغادرة" : "Attendance complete"}
            </div>
          )}

          {todayStatus === "excuse_requested" && (
            <div className="text-center py-2.5 rounded-lg bg-amber-50 text-amber-700 font-bold text-sm">
              {ar ? "تم رفع طلب العذر وبانتظار المراجعة" : "Excuse pending review"}
            </div>
          )}

          {todayStatus === "on_leave" && (
            <div className="text-center py-2.5 rounded-lg bg-amber-50 text-amber-700 font-bold text-sm">
              {ar ? "أنت في إجازة اليوم" : "On leave today"}
            </div>
          )}

          {geoError && <span className="text-xs text-rose-500 font-medium">{geoError}</span>}
          {location && !geoError && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
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

      {/* ── History Timeline ── */}
      {data.history && data.history.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-slate-700 mb-3">{ar ? "سجل الحضور" : "Attendance History"}</h3>
          <div className="flex flex-col gap-3">
            {data.history.slice(0, 15).map((record) => {
              const isExcused = record.status === "EXCUSED";
              const isAbsent = record.status === "ABSENT";
              const isOnLeave = record.status === "ON_LEAVE";
              const showBadge = isExcused || isAbsent || isOnLeave;
              const badgeColor = isAbsent ? "text-rose-700 bg-rose-50" : "text-amber-700 bg-amber-50";
              const badgeLabel = isOnLeave ? (ar ? "إجازة" : "Leave") : isExcused ? (ar ? "عذر" : "Excused") : (ar ? "غياب" : "Absent");
              const inTime = record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";
              const outTime = record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";
              const timeRange = record.checkInTime && record.checkOutTime ? `${outTime} → ${inTime}` : inTime || outTime || "";
              const dateObj = new Date(record.attendanceDate);

              return (
                <motion.div
                  key={record.id}
                  variants={fadeUp}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-100 shadow-sm"
                >
                  <div className={showBadge ? "text-rose-500" : "text-emerald-500"}>
                    {showBadge ? <Info size={20} /> : <LogOut size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800">
                      {dateObj.toLocaleDateString("ar-SA", { weekday: "long" })}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {dateObj.toLocaleDateString("ar-SA")}
                    </div>
                    {record.note && <div className="text-xs text-slate-500 italic mt-1">{record.note}</div>}
                  </div>
                  {showBadge ? (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${badgeColor}`}>{badgeLabel}</span>
                  ) : timeRange ? (
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <MapPin size={12} className="text-emerald-500" />
                      {timeRange}
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Excuse Modal ── */}
      <Modal
        isOpen={showExcuseModal}
        onClose={() => setShowExcuseModal(false)}
        title={ar ? "طلب عذر غياب" : "Request Excuse"}
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="ghost" className="flex-1" onClick={() => setShowExcuseModal(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="primary"
              className="flex-[2]"
              disabled={!excuseType || excuseMutation.isPending}
              isLoading={excuseMutation.isPending}
              onClick={handleSubmitExcuse}
            >
              <Send className="me-2" size={16} />
              {ar ? "إرسال الطلب" : "Submit"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">{ar ? "نوع العذر" : "Excuse Type"}</label>
            <select
              value={excuseType}
              onChange={(e) => setExcuseType(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">{ar ? "اختر نوع العذر" : "Select type..."}</option>
              {["مرض", "سفر", "ظرف عائلي", "موعد رسمي", "أخرى"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">{ar ? "وصف العذر (اختياري)" : "Note (optional)"}</label>
            <textarea
              value={excuseNote}
              onChange={(e) => setExcuseNote(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder={ar ? "اكتب تفاصيل العذر..." : "Describe your excuse..."}
            />
          </div>
        </div>
      </Modal>

      {/* ── Leave Modal ── */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title={ar ? "طلب إجازة" : "Request Leave"}
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="ghost" className="flex-1" onClick={() => setShowLeaveModal(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="primary"
              className="flex-[2]"
              disabled={!leaveStart || !leaveEnd || leaveMutation.isPending}
              isLoading={leaveMutation.isPending}
              onClick={handleSubmitLeave}
            >
              <Send className="me-2" size={16} />
              {ar ? "إرسال الطلب" : "Submit"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">{ar ? "نوع الإجازة" : "Leave Type"}</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as any)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              {[
                { value: "MEDICAL", label: ar ? "إجازة مرضية" : "Medical" },
                { value: "OFFICIAL", label: ar ? "إجازة رسمية" : "Official" },
                { value: "PERSONAL", label: ar ? "إجازة شخصية" : "Personal" },
                { value: "UNPAID", label: ar ? "إجازة بدون راتب" : "Unpaid" },
              ].map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">{ar ? "تاريخ البداية" : "Start Date"}</label>
              <input
                type="date"
                value={leaveStart}
                onChange={(e) => setLeaveStart(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">{ar ? "تاريخ النهاية" : "End Date"}</label>
              <input
                type="date"
                value={leaveEnd}
                onChange={(e) => setLeaveEnd(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">{ar ? "السبب (اختياري)" : "Reason (optional)"}</label>
            <textarea
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder={ar ? "اكتب سبب الإجازة..." : "Reason for leave..."}
            />
          </div>
        </div>
      </Modal>
    </motion.section>
  );
}
