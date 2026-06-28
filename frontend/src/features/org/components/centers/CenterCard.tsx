import { motion } from "framer-motion";
import {
  BadgeCheck,
  BookOpen,
  Building2,
  Clock3,
  ExternalLink,
  MapPin,
  Pencil,
  Power,
  Shield,
  Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Center, CircleScheduleDay, CircleScheduleRow, PrayerName } from "../../../org/types";
import { genderLabel } from "./centers.types";
import { PrayerTimesWidget } from "../../../staff-attendance/components/PrayerTimesWidget";
import { useTimeFormat, fmtClockTime } from "../../../../shared/utils/time-format";

interface CenterCardProps {
  c: Center;
  i: number;
  ar: boolean;
  studentCount: number;
  scheduleRows?: CircleScheduleRow[];
  view?: "grid" | "list";
  canManage: boolean;
  pendingStatus: boolean;
  onEdit: (c: Center) => void;
  onToggleStatus: (c: Center) => void;
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

const isScheduleDay = (value: unknown): value is CircleScheduleDay =>
  typeof value === "string" && DAY_INDEX.has(value as CircleScheduleDay);

const parseScheduleRows = (raw: unknown): CircleScheduleRow[] => {
  if (!Array.isArray(raw)) return [];

  const parsed: CircleScheduleRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;

    const record = item as Record<string, unknown>;
    const day = isScheduleDay(record.day) ? record.day : isScheduleDay(record.dayOfWeek) ? record.dayOfWeek : null;
    if (!day) continue;

    if (record.mode === "CLOCK" && typeof record.fromTime === "string" && typeof record.toTime === "string") {
      parsed.push({ day, mode: "CLOCK", fromTime: record.fromTime, toTime: record.toTime });
      continue;
    }

    if (
      record.mode === "PRAYER" &&
      typeof record.fromPrayer === "string" &&
      typeof record.toPrayer === "string"
    ) {
      parsed.push({
        day,
        mode: "PRAYER",
        fromPrayer: record.fromPrayer as PrayerName,
        toPrayer: record.toPrayer as PrayerName
      });
    }
  }

  return parsed;
};

const getCenterScheduleRows = (center: Center, fallbackRows?: CircleScheduleRow[]): CircleScheduleRow[] => {
  const source =
    (center as { centerAdminSchedule?: unknown }).centerAdminSchedule ??
    (center as { weeklySchedule?: unknown }).weeklySchedule ??
    (center as { weeklyScheduleSlots?: unknown }).weeklyScheduleSlots ??
    fallbackRows;

  const rows = parseScheduleRows(source);
  if (!rows.length) return [];

  const sorted = [...rows].sort(
    (a, b) => (DAY_INDEX.get(a.day) ?? Number.MAX_SAFE_INTEGER) - (DAY_INDEX.get(b.day) ?? Number.MAX_SAFE_INTEGER)
  );

  // Keep first slot per day for compact card display.
  const firstPerDay = new Map<CircleScheduleDay, CircleScheduleRow>();
  for (const row of sorted) {
    if (!firstPerDay.has(row.day)) firstPerDay.set(row.day, row);
  }

  return Array.from(firstPerDay.values());
};

const formatSlotRange = (row: CircleScheduleRow, ar: boolean, hour12 = true) =>
  row.mode === "CLOCK"
    ? `${fmtClockTime(row.fromTime, ar ? "ar-SA-u-nu-latn" : "en-US", hour12)} - ${fmtClockTime(row.toTime, ar ? "ar-SA-u-nu-latn" : "en-US", hour12)}`
    : `${prayerLabel(row.fromPrayer, ar)} - ${prayerLabel(row.toPrayer, ar)}`;

const formatCenterScheduleSummary = (center: Center, ar: boolean, hour12 = true, fallbackRows?: CircleScheduleRow[]): string | null => {
  const rows = getCenterScheduleRows(center, fallbackRows);
  if (!rows.length) return null;

  const firstRow = rows[0];
  const firstLabel = formatSlotRange(firstRow, ar, hour12);
  const dayLabelStr = dayLabel(firstRow.day, ar);

  const mainPart = `${dayLabelStr} ${firstLabel}`;

  if (rows.length > 1) {
    return `${mainPart} +${rows.length - 1}`;
  }

  return mainPart;
};

export function CenterCard({
  c,
  i,
  ar,
  studentCount,
  scheduleRows,
  view = "grid",
  canManage,
  pendingStatus,
  onEdit,
  onToggleStatus
}: CenterCardProps) {
  const navigate = useNavigate();
  const isActive = c.isActive ?? true;
  const supervisorCount = c.centerSupervisors?.length ?? 0;
  const circleCount = Number(c._count?.circles ?? 0);
  const managerName = c.centerAdmin?.fullName?.trim() || (ar ? "غير محدد" : "Unassigned");
  const locationName = c.mosqueName?.trim() || (ar ? "بدون موقع" : "No location");
  const { hour12 } = useTimeFormat();
  const scheduleSummary = formatCenterScheduleSummary(c, ar, hour12, scheduleRows);
  const hasPrayerSchedule = (scheduleRows ?? getCenterScheduleRows(c)).some((row) => row.mode === "PRAYER");

  return (
    <motion.article
      className={`ctr-center-card${view === "list" ? " ctr-center-card--list" : ""}${isActive ? "" : " is-inactive"}`}
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: i * 0.04, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="ctr-center-card__identity">
        <div className="ctr-center-card__logo">
          {c.logoUrl ? (
            <img src={c.logoUrl} alt={c.name} loading="lazy" referrerPolicy="no-referrer" />
          ) : (
            <Building2 size={20} />
          )}
        </div>
        <div className="ctr-center-card__title-wrap">
          <h3 className="ctr-center-card__title">{c.name}</h3>
          <div className="ctr-center-card__subtitle">
            <MapPin size={14} />
            <span>{locationName}</span>
          </div>
        </div>
      </div>

      <div className="ctr-center-card__meta">
        <span className="ctr-center-card__code">{c.code}</span>
        <div className="ctr-center-card__chips">
          <span
            className={`ctr-center-card__chip ${isActive ? "ctr-center-card__chip--active" : "ctr-center-card__chip--inactive"}`}
          >
            {isActive ? (ar ? "نشط" : "Active") : ar ? "معطل" : "Inactive"}
          </span>
          <span
            className={`ctr-center-card__chip ${
              c.gender === "MALE" ? "ctr-center-card__chip--male" : "ctr-center-card__chip--female"
            }`}
          >
            {genderLabel(c.gender, ar)}
          </span>
        </div>
      </div>

      <div className="ctr-center-card__stats">
        <div className="ctr-center-card__stat ctr-center-card__stat--users">
          <strong>{studentCount}</strong>
          <span>
            <Users size={14} />
            {ar ? "طلاب" : "Students"}
          </span>
        </div>
        <div className="ctr-center-card__stat ctr-center-card__stat--supervisors">
          <strong>{supervisorCount}</strong>
          <span>
            <Shield size={14} />
            {ar ? "مشرفون" : "Supervisors"}
          </span>
        </div>
        <div className="ctr-center-card__stat ctr-center-card__stat--circles">
          <strong>{circleCount}</strong>
          <span>
            <BookOpen size={14} />
            {ar ? "حلقات" : "Circles"}
          </span>
        </div>
      </div>

      {c.id && hasPrayerSchedule && (
        <div className="ctr-center-card__prayer-times">
          <PrayerTimesWidget centerId={Number(c.id)} ar={ar} />
        </div>
      )}

      <div className="ctr-center-card__manager">
        <span className="ctr-center-card__manager-label">{ar ? "مدير المركز" : "Center Manager"}</span>
        <div className="ctr-center-card__manager-value">
          <BadgeCheck size={14} />
          <strong>{managerName}</strong>
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
        <button
          type="button"
          className="ctr-center-card__icon-btn"
          onClick={() => onToggleStatus(c)}
          disabled={pendingStatus}
          title={isActive ? (ar ? "تعطيل" : "Deactivate") : ar ? "تفعيل" : "Activate"}
        >
          <Power size={16} />
        </button>
        <button
          type="button"
          className="ctr-center-card__icon-btn"
          onClick={() => onEdit(c)}
          disabled={!canManage}
          title={ar ? "تعديل" : "Edit"}
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          className="ctr-center-card__primary-btn"
          onClick={() => navigate(`/org/circles?centerId=${c.id}`)}
        >
          <ExternalLink size={16} />
          <span>{ar ? "الحلقات" : "Circles"}</span>
        </button>
      </div>
    </motion.article>
  );
}
