import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  FileText,
  HelpCircle,
  LocateFixed,
  LogIn,
  LogOut,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "../../auth/auth.store";
import { useI18n } from "../../../app/i18n";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useCentersQuery } from "../../org/org.hooks";
import {
  useRequestStaffExcuse,
  useSelfAttendance,
  useSelfCheckIn,
  useSelfCheckOut,
  type SelfAttendanceExcuse,
  type SelfAttendanceGeoCheck
} from "../../staff-attendance/staff-attendance.api";
import { getLocalizedApiErrorMessage } from "../../../shared/api/error";

const readDeviceLocation = () =>
  new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  });

const formatTime = (value?: string | null, locale = "ar-SA-u-nu-latn", timeZone?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {})
  });
};

const formatDate = (value?: string | null, locale = "ar-SA-u-nu-latn", timeZone?: string | null) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    ...(timeZone ? { timeZone } : {})
  });
};

const geoTone = (geoCheck?: SelfAttendanceGeoCheck | null) => {
  if (!geoCheck) return "neutral";
  if (geoCheck.state === "outside_range") return "danger";
  if (geoCheck.state === "missing_location" || geoCheck.state === "unavailable") return "warning";
  return "success";
};

const primaryReason = (reasons?: string[]) => reasons?.find(Boolean) ?? "";

const excuseTypes = ["مرض", "ظرف طارئ", "مهمة رسمية", "مراجعة", "أخرى"];

const statusLabel = (status?: string, ar = true) => {
  switch ((status ?? "").toUpperCase()) {
    case "PRESENT":
      return ar ? "حاضر" : "Present";
    case "LATE":
      return ar ? "متأخر" : "Late";
    case "ABSENT":
      return ar ? "غائب" : "Absent";
    case "EXCUSED":
      return ar ? "بعذر" : "Excused";
    case "ON_LEAVE":
      return ar ? "إجازة" : "Leave";
    case "APPROVED":
      return ar ? "معتمد" : "Approved";
    case "REJECTED":
      return ar ? "مرفوض" : "Rejected";
    case "PENDING":
      return ar ? "بانتظار المراجعة" : "Pending";
    default:
      return ar ? "غير محدد" : "Unknown";
  }
};

const statusTone = (status?: string) => {
  switch ((status ?? "").toUpperCase()) {
    case "PRESENT":
    case "APPROVED":
      return "success";
    case "LATE":
    case "PENDING":
    case "EXCUSED":
      return "warning";
    case "ABSENT":
    case "REJECTED":
      return "danger";
    case "ON_LEAVE":
      return "info";
    default:
      return "muted";
  }
};

const asDateKey = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
};

export function SelfAttendanceWidget() {
  const { language } = useI18n();
  const ar = language === "ar";
  const locale = ar ? "ar-SA-u-nu-latn" : "en-US";
  const user = useAuthStore((state) => state.user);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastGeoCheck, setLastGeoCheck] = useState<SelfAttendanceGeoCheck | null>(null);
  const [excuseType, setExcuseType] = useState(excuseTypes[0]);
  const [excuseDate, setExcuseDate] = useState("");
  const [excuseNote, setExcuseNote] = useState("");
  const [excuseError, setExcuseError] = useState<string | null>(null);
  const [isExcuseModalOpen, setIsExcuseModalOpen] = useState(false);
  const [isPolicyTipOpen, setIsPolicyTipOpen] = useState(false);

  const enabled = user?.role === "CENTER_ADMIN";
  const centersQ = useCentersQuery({ enabled });
  const selectedCenter = useMemo(() => {
    const centers = centersQ.data?.items ?? [];
    const managedCenter = centers.find((center) => center.centerAdminUserId === user?.id);
    if (managedCenter) return managedCenter;
    return centers.length === 1 ? centers[0] : null;
  }, [centersQ.data?.items, user?.id]);

  const centerFilter = selectedCenter ? { centerId: selectedCenter.id } : undefined;
  const canLoadAttendance = enabled && (!centersQ.isLoading || centersQ.isError);
  const selfQ = useSelfAttendance(centerFilter, canLoadAttendance);
  const checkInM = useSelfCheckIn();
  const checkOutM = useSelfCheckOut();
  const excuseM = useRequestStaffExcuse();

  const today = selfQ.data?.today;
  const eligibility = selfQ.data?.eligibility;
  const policy = selfQ.data?.policy;
  const target = selfQ.data?.target ?? selfQ.data?.circle ?? null;
  const attendance = today?.attendance;
  const geoCheck = lastGeoCheck ?? today?.geoCheck ?? null;
  const timezone = selectedCenter?.timezone ?? target?.timezone ?? policy?.timezone ?? "Asia/Riyadh";
  const isCheckedIn = Boolean(attendance?.checkInTime && !attendance?.checkOutTime);
  const isCheckedOut = Boolean(attendance?.checkOutTime);
  const busy = checkInM.isPending || checkOutM.isPending;
  const tone = geoTone(geoCheck);
  const effectiveExcuseDate = excuseDate || today?.date || new Date().toISOString().slice(0, 10);

  const runAttendanceAction = async (kind: "in" | "out") => {
    setActionError(null);
    const location = await readDeviceLocation();
    const payload = {
      ...(centerFilter ?? {}),
      ...(location ? { latitude: location.latitude, longitude: location.longitude } : {})
    };

    try {
      const result = kind === "in" ? await checkInM.mutateAsync(payload) : await checkOutM.mutateAsync(payload);
      setLastGeoCheck(result.geoCheck ?? null);
      await selfQ.refetch();
    } catch (error) {
      setActionError(
        getLocalizedApiErrorMessage(error, {
          ar,
          fallback: ar ? "تعذر تحديث التحضير" : "Unable to update attendance"
        })
      );
    }
  };

  const submitExcuse = async () => {
    setExcuseError(null);
    if (!target?.centerId && !selectedCenter?.id) {
      setExcuseError(ar ? "لا يوجد مركز مرتبط بالحساب." : "No center is linked to this account.");
      return;
    }

    const trimmedNote = excuseNote.trim();
    const reason = trimmedNote ? `${excuseType} - ${trimmedNote}` : excuseType;
    if (reason.trim().length < 5) {
      setExcuseError(ar ? "اكتب نوع عذر واضح أو وصفًا مختصرًا." : "Enter a clear excuse reason.");
      return;
    }

    try {
      await excuseM.mutateAsync({
        centerId: target?.centerId ?? selectedCenter!.id,
        date: effectiveExcuseDate,
        reason
      });
      setExcuseNote("");
      setExcuseType(excuseTypes[0]);
      setExcuseDate("");
      setIsExcuseModalOpen(false);
      await selfQ.refetch();
    } catch (error) {
      setExcuseError(
        getLocalizedApiErrorMessage(error, {
          ar,
          fallback: ar ? "تعذر إرسال طلب العذر" : "Unable to submit excuse"
        })
      );
    }
  };

  const showCheckInAction = !isCheckedIn && !isCheckedOut && Boolean(eligibility?.canCheckIn);
  const showCheckOutAction = isCheckedIn && !isCheckedOut && Boolean(eligibility?.canCheckOut);
  const actionLabel = showCheckOutAction
    ? ar ? "تسجيل الانصراف" : "Check out"
    : ar ? "تسجيل الحضور" : "Check in";
  const actionIcon = showCheckOutAction ? <LogOut size={16} /> : <LogIn size={16} />;
  const blockedReasons = isCheckedIn
    ? eligibility?.checkOutBlockedReasons ?? []
    : eligibility?.checkInBlockedReasons ?? [];

  const shiftText =
    eligibility?.shiftStart || eligibility?.shiftEnd
      ? `${formatTime(eligibility.shiftStart, locale, timezone)} - ${formatTime(eligibility.shiftEnd, locale, timezone)}`
      : ar ? "لا يوجد دوام محدد" : "No shift";
  const minimumCheckoutText = eligibility?.minimumCheckOutAt
    ? formatTime(eligibility.minimumCheckOutAt, locale, timezone)
    : "-";
  const geoPolicyText = policy?.geoEnforcement === "REQUIRED"
    ? ar ? "إلزامية" : "Required"
    : ar ? "تحذيرية" : "Warning only";
  const policyTooltip = ar
    ? `دوام اليوم: ${shiftText}\nأقل وقت للانصراف: ${minimumCheckoutText}\nسياسة الموقع: ${geoPolicyText}`
    : `Today's shift: ${shiftText}\nEarliest check-out: ${minimumCheckoutText}\nGeo policy: ${geoPolicyText}`;
  const historyItems = useMemo(() => {
    const map = new Map<string, {
      key: string;
      type: "attendance" | "excuse";
      date: string;
      status: string;
      timeRange?: string;
      reason?: string;
      responseNote?: string | null;
    }>();

    for (const record of selfQ.data?.history ?? []) {
      const key = asDateKey(record.attendanceDate);
      if (!key) continue;
      map.set(key, {
        key,
        type: "attendance",
        date: key,
        status: record.status,
        timeRange:
          record.checkInTime || record.checkOutTime
            ? `${formatTime(record.checkInTime, locale, timezone)} - ${formatTime(record.checkOutTime, locale, timezone)}`
            : "-"
      });
    }

    for (const excuse of selfQ.data?.excuses ?? []) {
      const typedExcuse = excuse as SelfAttendanceExcuse;
      const key = asDateKey(typedExcuse.absenceDate);
      if (!key || map.has(key)) continue;
      map.set(key, {
        key,
        type: "excuse",
        date: key,
        status: typedExcuse.status,
        reason: typedExcuse.reason,
        responseNote: typedExcuse.responseNote
      });
    }

    return Array.from(map.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, [locale, selfQ.data?.excuses, selfQ.data?.history, timezone]);

  if (!enabled) {
    return null;
  }

  return (
    <section className="self-attendance" dir={ar ? "rtl" : "ltr"} aria-label={ar ? "تحضيري" : "My attendance"}>
      <PageHeader
        title={ar ? "تحضيري" : "My Attendance"}
        description={
          ar
            ? "تسجيل حضور وانصراف مدير المركز حسب المركز المسند ونطاقه الجغرافي."
            : "Center manager check-in and check-out for the assigned center and its geographic range."
        }
        icon={<CalendarDays className="w-6 h-6" />}
        actions={
          <div className="self-attendance__header-actions">
            <span
              className="self-attendance__policy-tip-wrap"
              onMouseEnter={() => setIsPolicyTipOpen(true)}
              onMouseLeave={() => setIsPolicyTipOpen(false)}
            >
              <button
                type="button"
                className="self-attendance__policy-tip"
                aria-label={ar ? "تفاصيل وقت الدوام وسياسة الحضور والانصراف" : "Shift and attendance policy details"}
                onFocus={() => setIsPolicyTipOpen(true)}
                onBlur={() => setIsPolicyTipOpen(false)}
              >
                <HelpCircle size={16} />
              </button>
              {isPolicyTipOpen ? (
                <span className="self-attendance__policy-tip-bubble" role="tooltip">
                  {policyTooltip}
                </span>
              ) : null}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void selfQ.refetch()}
              isLoading={selfQ.isFetching}
              leftIcon={<RefreshCw size={16} />}
            >
              {ar ? "تحديث" : "Refresh"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setExcuseError(null);
                setIsExcuseModalOpen(true);
              }}
              leftIcon={<Send size={16} />}
            >
              {ar ? "طلب عذر" : "Request excuse"}
            </Button>
          </div>
        }
      />
      <div className="self-attendance__grid">
        <article className="self-attendance__decision">
          <div className="self-attendance__decision-head">
            <div>
              <p>{ar ? "إجراء اليوم" : "Today's action"}</p>
              <span className="self-attendance__decision-date">{formatDate(today?.date ?? attendance?.attendanceDate, locale, timezone)}</span>
              <strong>{showCheckOutAction ? ar ? "الانصراف متاح" : "Check-out available" : showCheckInAction ? ar ? "الحضور متاح" : "Check-in available" : ar ? "مقيد بالسياسة" : "Policy locked"}</strong>
            </div>
            <span className={`self-attendance__decision-badge ${showCheckInAction || showCheckOutAction ? "is-open" : "is-locked"}`}>
              {showCheckInAction || showCheckOutAction ? <ShieldCheck /> : <AlertCircle />}
            </span>
          </div>

          {showCheckInAction || showCheckOutAction ? (
            <Button
              onClick={() => void runAttendanceAction(showCheckOutAction ? "out" : "in")}
              isLoading={busy}
              leftIcon={actionIcon}
              className="self-attendance__primary-button"
              fullWidth
            >
              {actionLabel}
            </Button>
          ) : (
            <div className="self-attendance__locked-action">
              <AlertCircle />
              <div>
                <strong>{ar ? "لا يوجد إجراء متاح الآن" : "No action available now"}</strong>
                <span>{primaryReason(blockedReasons) || (ar ? "سيظهر الزر عندما تتحقق شروط الدوام والموقع." : "The button appears when time and location rules pass.")}</span>
              </div>
            </div>
          )}

          <div className="self-attendance__timeline">
            <div className={`self-attendance__timeline-item ${attendance?.checkInTime ? "is-done" : ""}`}>
              <span />
              <div>
                <strong>{ar ? "الحضور" : "Check-in"}</strong>
                <p>{formatTime(attendance?.checkInTime, locale, timezone)}</p>
              </div>
            </div>
            <div className={`self-attendance__timeline-item ${attendance?.checkOutTime ? "is-done" : ""} ${showCheckOutAction ? "is-ready" : ""}`}>
              <span />
              <div>
                <strong>{ar ? "الانصراف" : "Check-out"}</strong>
                <p>{attendance?.checkOutTime ? formatTime(attendance.checkOutTime, locale, timezone) : `${ar ? "يفتح بعد" : "Opens at"} ${minimumCheckoutText}`}</p>
              </div>
            </div>
          </div>
        </article>

        <aside className="self-attendance__side">
          <article className={`self-attendance__panel self-attendance__geo--${tone}`}>
            <span className="self-attendance__panel-icon">
              {tone === "danger" ? <AlertCircle /> : tone === "success" ? <ShieldCheck /> : <LocateFixed />}
            </span>
            <div>
              <p>{ar ? "التحقق الجغرافي" : "Location check"}</p>
              <strong>{geoCheck?.message ?? (ar ? "بانتظار إرسال موقع الجهاز" : "Waiting for device location")}</strong>
              {typeof geoCheck?.distanceMeters === "number" ? (
                <span>{geoCheck.distanceMeters}m / {geoCheck.allowedRadiusMeters ?? "-"}m</span>
              ) : null}
            </div>
          </article>
        </aside>
      </div>

      <div className="self-attendance__operations">
        <article className="self-attendance__history">
          <header className="self-attendance__section-head">
            <div>
              <h3>{ar ? "آخر سجلات الحضور والانصراف" : "Recent check-in and check-out records"}</h3>
              <span>{ar ? "آخر السجلات المرتبطة بوحدة حضور الموظفين" : "Recent records from staff attendance"}</span>
            </div>
            <button
              type="button"
              title={ar ? "يعرض آخر السجلات المرتبطة بوحدة حضور الموظفين." : "Shows recent records from staff attendance."}
              aria-label={ar ? "معلومة" : "Info"}
            >
              <HelpCircle />
            </button>
          </header>

          <div className="self-attendance__history-list">
            {historyItems.length > 0 ? historyItems.map((item) => (
              <div key={item.key} className="self-attendance__history-row">
                <span className={`self-attendance__status-dot self-attendance__status-dot--${statusTone(item.status)}`} />
                <div>
                  <strong>{formatDate(item.date, locale, timezone)}</strong>
                  <p>{item.type === "attendance" ? item.timeRange : item.reason}</p>
                </div>
                <em className={`self-attendance__tag self-attendance__tag--${statusTone(item.status)}`}>
                  {statusLabel(item.status, ar)}
                </em>
              </div>
            )) : (
              <div className="self-attendance__empty">
                <FileText />
                <span>{ar ? "لا توجد سجلات سابقة لهذا الشهر." : "No previous records this month."}</span>
              </div>
            )}
          </div>
        </article>
        {(actionError || centersQ.isError || selfQ.isError) ? (
          <article className="self-attendance__alerts">
            {centersQ.isError ? (
              <div className="self-attendance__alert self-attendance__alert--warning">
                <AlertCircle />
                <span>{ar ? "تعذر تحميل بيانات المركز، وسيتم الاعتماد على صلاحيات الحساب الحالية." : "Unable to load center data; current account scope will be used."}</span>
              </div>
            ) : null}
            {selfQ.isError ? (
              <div className="self-attendance__alert self-attendance__alert--danger">
                <AlertCircle />
                <span>
                  {getLocalizedApiErrorMessage(selfQ.error, {
                    ar,
                    fallback: ar ? "تعذر تحميل التحضير الذاتي" : "Unable to load self attendance"
                  })}
                </span>
              </div>
            ) : null}
            {actionError ? (
              <div className="self-attendance__alert self-attendance__alert--danger">
                <AlertCircle />
                <span>{actionError}</span>
              </div>
            ) : null}
          </article>
        ) : null}
      </div>
      <Modal
        isOpen={isExcuseModalOpen}
        onClose={() => setIsExcuseModalOpen(false)}
        title={ar ? "طلب عذر" : "Excuse request"}
        description={ar ? "يرسل الطلب إلى وحدة حضور الموظفين للمراجعة." : "The request is sent to staff attendance for review."}
        titleIcon={<Send size={18} />}
        size="md"
      >
        <div className="self-attendance__excuse-form">
          <label>
            <span>{ar ? "تاريخ الغياب" : "Absence date"}</span>
            <input
              type="date"
              value={effectiveExcuseDate}
              max={today?.date ?? new Date().toISOString().slice(0, 10)}
              onChange={(event) => setExcuseDate(event.target.value)}
            />
          </label>

          <label>
            <span>{ar ? "نوع العذر" : "Excuse type"}</span>
            <select value={excuseType} onChange={(event) => setExcuseType(event.target.value)}>
              {excuseTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="self-attendance__excuse-note">
            <span>{ar ? "الوصف" : "Note"}</span>
            <textarea
              value={excuseNote}
              maxLength={700}
              rows={3}
              placeholder={ar ? "اكتب تفاصيل العذر عند الحاجة..." : "Add details when needed..."}
              onChange={(event) => setExcuseNote(event.target.value)}
            />
          </label>

          {excuseError ? (
            <div className="self-attendance__alert self-attendance__alert--danger">
              <AlertCircle />
              <span>{excuseError}</span>
            </div>
          ) : null}

          <Button
            onClick={() => void submitExcuse()}
            isLoading={excuseM.isPending}
            leftIcon={<Send size={16} />}
            className="self-attendance__secondary-button"
            fullWidth
          >
            {ar ? "إرسال طلب العذر" : "Submit excuse"}
          </Button>
        </div>
      </Modal>
    </section>
  );
}



