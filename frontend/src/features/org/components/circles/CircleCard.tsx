import { motion } from "framer-motion";
import {
  BookOpen,
  Clock3,
  ExternalLink,
  GraduationCap,
  MapPin,
  Pencil,
  Power,
  Shield,
  Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Circle, CircleScheduleDay, CircleScheduleRow, PrayerName } from "../../types";
import { circleGenderLabel, circleTypeLabel } from "./circles.types";
import { useTimeFormat, fmtClockTime } from "../../../../shared/utils/time-format";

interface CircleCardProps {
  circle: Circle;
  ar: boolean;
  view?: "grid" | "list";
  canManage: boolean;
  pending: boolean;
  openEdit: (c: Circle) => void;
  toggleStatus: (c: Circle) => void;
}

const DAY_ORDER: CircleScheduleDay[] = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY"
];

const DAY_INDEX = new Map(DAY_ORDER.map((day, index) => [day, index]));

const dayLabel = (day: CircleScheduleDay, ar: boolean) => {
  const arMap: Record<CircleScheduleDay, string> = {
    SATURDAY: "السبت",
    SUNDAY: "الأحد",
    MONDAY: "الاثنين",
    TUESDAY: "الثلاثاء",
    WEDNESDAY: "الأربعاء",
    THURSDAY: "الخميس",
    FRIDAY: "الجمعة"
  };

  const enMap: Record<CircleScheduleDay, string> = {
    SATURDAY: "Saturday",
    SUNDAY: "Sunday",
    MONDAY: "Monday",
    TUESDAY: "Tuesday",
    WEDNESDAY: "Wednesday",
    THURSDAY: "Thursday",
    FRIDAY: "Friday"
  };

  return (ar ? arMap : enMap)[day];
};

const prayerLabel = (prayer: PrayerName, ar: boolean) => {
  const arMap: Record<PrayerName, string> = {
    FAJR: "الفجر",
    DHUHR: "الظهر",
    ASR: "العصر",
    MAGHRIB: "المغرب",
    ISHA: "العشاء"
  };

  const enMap: Record<PrayerName, string> = {
    FAJR: "Fajr",
    DHUHR: "Dhuhr",
    ASR: "Asr",
    MAGHRIB: "Maghrib",
    ISHA: "Isha"
  };

  return (ar ? arMap : enMap)[prayer];
};

const formatSlotRange = (row: CircleScheduleRow, ar: boolean, hour12 = true) =>
  row.mode === "CLOCK"
    ? `${fmtClockTime(row.fromTime, ar ? "ar-SA-u-nu-latn" : "en-US", hour12)} - ${fmtClockTime(row.toTime, ar ? "ar-SA-u-nu-latn" : "en-US", hour12)}`
    : `${prayerLabel(row.fromPrayer, ar)} - ${prayerLabel(row.toPrayer, ar)}`;

const formatCircleScheduleSummary = (rows: CircleScheduleRow[] | undefined | null, ar: boolean, hour12 = true): string | null => {
  if (!rows?.length) return null;

  const sorted = [...rows].sort(
    (a, b) => (DAY_INDEX.get(a.day) ?? Number.MAX_SAFE_INTEGER) - (DAY_INDEX.get(b.day) ?? Number.MAX_SAFE_INTEGER)
  );

  // Keep one effective slot per day for compact card display.
  const firstPerDay = new Map<CircleScheduleDay, CircleScheduleRow>();
  for (const row of sorted) {
    if (!firstPerDay.has(row.day)) firstPerDay.set(row.day, row);
  }
  const compactRows = Array.from(firstPerDay.values());

  if (!compactRows.length) return null;

  const firstRow = compactRows[0];
  const firstLabel = formatSlotRange(firstRow, ar, hour12);
  const dayLabelStr = dayLabel(firstRow.day, ar);

  const mainPart = `${dayLabelStr} ${firstLabel}`;

  if (compactRows.length > 1) {
    return `${mainPart} +${compactRows.length - 1}`;
  }

  return mainPart;
};

export default function CircleCard({
  circle,
  ar,
  view = "grid",
  canManage,
  pending,
  openEdit,
  toggleStatus
}: CircleCardProps) {
  const navigate = useNavigate();
  const isActive = circle.isActive ?? true;
  const students = Number(circle._count?.enrollments ?? circle._count?.students ?? 0);
  const teacherName = circle.teacher?.fullName?.trim() || (ar ? "غير مضاف" : "Not assigned");
  const hasTeacher = Boolean(circle.teacher?.fullName?.trim());
  const centerName = circle.center?.name?.trim() || (ar ? "بدون مركز" : "No center");
  const locationName = circle.mosqueName?.trim() || (ar ? "بدون موقع" : "No location");
  const { hour12 } = useTimeFormat();
  const scheduleSummary = formatCircleScheduleSummary(circle.weeklySchedule, ar, hour12);
  const hasPrayerSchedule = (circle.weeklySchedule ?? []).some((row: any) => row.mode === "PRAYER");

  return (
    <motion.article
      className={`ctr-center-card${view === "list" ? " ctr-center-card--list" : ""}${isActive ? "" : " is-inactive"}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <div className="ctr-center-card__identity">
        <div className="ctr-center-card__logo" aria-hidden="true">
          <BookOpen size={20} />
        </div>
        <div className="ctr-center-card__title-wrap">
          <h3 className="ctr-center-card__title">{circle.name}</h3>
          <div className="ctr-center-card__subtitle">
            <MapPin size={14} />
            <span>{centerName}</span>
          </div>
        </div>
      </div>

      <div className="ctr-center-card__meta">
        <span className="ctr-center-card__code">{circleTypeLabel(circle.circleType, ar)}</span>
        <div className="ctr-center-card__chips">
          <span
            className={`ctr-center-card__chip ${isActive ? "ctr-center-card__chip--active" : "ctr-center-card__chip--inactive"}`}
          >
            {isActive ? (ar ? "نشطة" : "Active") : ar ? "معطلة" : "Inactive"}
          </span>
          {circle.gender ? (
            <span
              className={`ctr-center-card__chip ${
                circle.gender === "MALE" ? "ctr-center-card__chip--male" : "ctr-center-card__chip--female"
              }`}
            >
              {circleGenderLabel(circle.gender, ar)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="ctr-center-card__stats">
        <div className="ctr-center-card__stat ctr-center-card__stat--users">
          <strong>{students}</strong>
          <span>
            <Users size={14} />
            {ar ? "طلاب" : "Students"}
          </span>
        </div>
        <div className="ctr-center-card__stat ctr-center-card__stat--supervisors">
          <strong>{hasTeacher ? 1 : 0}</strong>
          <span>
            <Shield size={14} />
            {ar ? "معلم" : "Teacher"}
          </span>
        </div>
        <div className="ctr-center-card__stat ctr-center-card__stat--circles">
          <strong>{scheduleSummary ? 1 : 0}</strong>
          <span>
            <Clock3 size={14} />
            {ar ? "جدول" : "Schedule"}
          </span>
        </div>
      </div>

      <div className="ctr-center-card__manager">
        <span className="ctr-center-card__manager-label">{ar ? "المعلم" : "Teacher"}</span>
        <div className="ctr-center-card__manager-value" title={locationName}>
          <GraduationCap size={14} />
          <strong>{teacherName}</strong>
        </div>
        <div className="ctr-center-card__manager-schedule" title={scheduleSummary ?? undefined}>
          <Clock3 size={14} />
          <span>{scheduleSummary ?? (ar ? "بدون مواعيد" : "No schedule")}</span>
          {scheduleSummary && (
            <span style={{ marginRight: ar ? "0" : "6px", marginLeft: ar ? "6px" : "0", fontSize: "11px", padding: "1px 5px", borderRadius: "4px", background: hasPrayerSchedule ? "#ede9fe" : "#ecfdf5", color: hasPrayerSchedule ? "#5b21b6" : "#065f46" }}>
              {hasPrayerSchedule ? (ar ? "🕌 صلوات" : "🕌 Prayer") : (ar ? "🕒 ساعات" : "🕒 Clock")}
            </span>
          )}
        </div>
      </div>

      <div className="ctr-center-card__actions">
        {canManage ? (
          <button
            type="button"
            className="ctr-center-card__icon-btn"
            onClick={() => void toggleStatus(circle)}
            disabled={pending}
            title={isActive ? (ar ? "تعطيل" : "Deactivate") : ar ? "تفعيل" : "Activate"}
          >
            <Power size={16} />
          </button>
        ) : null}
        {canManage ? (
          <button
            type="button"
            className="ctr-center-card__icon-btn"
            onClick={() => openEdit(circle)}
            disabled={pending}
            title={ar ? "تعديل" : "Edit"}
          >
            <Pencil size={16} />
          </button>
        ) : null}
        <button
          type="button"
          className="ctr-center-card__primary-btn"
          onClick={() => navigate(`/org/circles?centerId=${circle.centerId}&circleId=${circle.id}`)}
        >
          <ExternalLink size={16} />
          <span>{ar ? "فتح الحلقة" : "Open Circle"}</span>
        </button>
      </div>
    </motion.article>
  );
}
