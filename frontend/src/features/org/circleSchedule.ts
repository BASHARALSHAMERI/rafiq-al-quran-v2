import type {
  CircleScheduleDay,
  CircleScheduleMode,
  CircleScheduleRow,
  PrayerName
} from "./types";

export type CircleScheduleDraftRow = {
  day: CircleScheduleDay;
  enabled: boolean;
  mode: CircleScheduleMode;
  fromTime: string;
  toTime: string;
  fromPrayer: PrayerName;
  toPrayer: PrayerName;
};

export const WEEKDAY_ORDER: CircleScheduleDay[] = [
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY"
];

export const PRAYER_ORDER: PrayerName[] = ["FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"];

const weekdayRank = new Map(WEEKDAY_ORDER.map((day, index) => [day, index]));
const prayerRank = new Map(PRAYER_ORDER.map((name, index) => [name, index]));
const hhmmRe = /^([01]\d|2[0-3]):[0-5]\d$/;

export const weekdayLabel = (day: CircleScheduleDay, ar: boolean) => {
  const labelsAr: Record<CircleScheduleDay, string> = {
    FRIDAY: "الجمعة",
    SATURDAY: "السبت",
    SUNDAY: "الأحد",
    MONDAY: "الإثنين",
    TUESDAY: "الثلاثاء",
    WEDNESDAY: "الأربعاء",
    THURSDAY: "الخميس"
  };
  const labelsEn: Record<CircleScheduleDay, string> = {
    FRIDAY: "Friday",
    SATURDAY: "Saturday",
    SUNDAY: "Sunday",
    MONDAY: "Monday",
    TUESDAY: "Tuesday",
    WEDNESDAY: "Wednesday",
    THURSDAY: "Thursday"
  };
  return (ar ? labelsAr : labelsEn)[day];
};

export const prayerLabel = (prayer: PrayerName, ar: boolean) => {
  const labelsAr: Record<PrayerName, string> = {
    FAJR: "الفجر",
    DHUHR: "الظهر",
    ASR: "العصر",
    MAGHRIB: "المغرب",
    ISHA: "العشاء"
  };
  const labelsEn: Record<PrayerName, string> = {
    FAJR: "Fajr",
    DHUHR: "Dhuhr",
    ASR: "Asr",
    MAGHRIB: "Maghrib",
    ISHA: "Isha"
  };
  return (ar ? labelsAr : labelsEn)[prayer];
};

export const createEmptyScheduleDraftRows = (): CircleScheduleDraftRow[] =>
  WEEKDAY_ORDER.map((day) => ({
    day,
    enabled: false,
    mode: "CLOCK",
    fromTime: "",
    toTime: "",
    fromPrayer: "MAGHRIB",
    toPrayer: "ISHA"
  }));

export const hydrateScheduleDraftRows = (
  weeklySchedule?: CircleScheduleRow[] | null
): CircleScheduleDraftRow[] => {
  const rows = createEmptyScheduleDraftRows();
  if (!weeklySchedule?.length) return rows;

  const byDay = new Map(weeklySchedule.map((row) => [row.day, row]));

  return rows.map((row) => {
    const source = byDay.get(row.day);
    if (!source) return row;
    if (source.mode === "CLOCK") {
      return {
        ...row,
        enabled: true,
        mode: "CLOCK",
        fromTime: source.fromTime,
        toTime: source.toTime
      };
    }
    return {
      ...row,
      enabled: true,
      mode: "PRAYER",
      fromPrayer: source.fromPrayer,
      toPrayer: source.toPrayer
    };
  });
};

export const serializeScheduleDraftRows = (rows: CircleScheduleDraftRow[]): CircleScheduleRow[] => {
  return rows
    .filter((row) => row.enabled)
    .map((row) =>
      row.mode === "CLOCK"
        ? ({
            day: row.day,
            mode: "CLOCK",
            fromTime: row.fromTime.trim(),
            toTime: row.toTime.trim()
          } satisfies CircleScheduleRow)
        : ({
            day: row.day,
            mode: "PRAYER",
            fromPrayer: row.fromPrayer,
            toPrayer: row.toPrayer
          } satisfies CircleScheduleRow)
    );
};

const isPrayerRangeOrdered = (fromPrayer: PrayerName, toPrayer: PrayerName) => {
  const fromRank = prayerRank.get(fromPrayer) ?? -1;
  const toRank = prayerRank.get(toPrayer) ?? -1;
  return fromRank >= 0 && toRank >= 0 && fromRank < toRank;
};

export const validateScheduleDraftRows = (rows: CircleScheduleDraftRow[], ar: boolean): string | null => {
  for (const row of rows) {
    if (!row.enabled) continue;

    if (row.mode === "CLOCK") {
      const from = row.fromTime.trim();
      const to = row.toTime.trim();
      if (!from || !to) {
        return ar ? `أكمل وقت ${weekdayLabel(row.day, ar)} (من/إلى)` : `Complete ${weekdayLabel(row.day, ar)} time range`;
      }
      if (!hhmmRe.test(from) || !hhmmRe.test(to)) {
        return ar ? `صيغة الوقت غير صحيحة في ${weekdayLabel(row.day, ar)}` : `Invalid time format in ${weekdayLabel(row.day, ar)}`;
      }
      if (from >= to) {
        return ar ? `وقت ${weekdayLabel(row.day, ar)} يجب أن يكون من < إلى` : `${weekdayLabel(row.day, ar)} time must be from < to`;
      }
      continue;
    }

    if (!isPrayerRangeOrdered(row.fromPrayer, row.toPrayer)) {
      return ar ? `فترة ${weekdayLabel(row.day, ar)} غير صحيحة` : `Invalid prayer range for ${weekdayLabel(row.day, ar)}`;
    }
  }
  return null;
};

const formatRowRange = (row: CircleScheduleRow, ar: boolean) =>
  row.mode === "CLOCK"
    ? `${row.fromTime} - ${row.toTime}`
    : `${prayerLabel(row.fromPrayer, ar)} - ${prayerLabel(row.toPrayer, ar)}`;

export const sortWeeklyScheduleRows = (rows?: CircleScheduleRow[] | null): CircleScheduleRow[] => {
  if (!rows?.length) return [];
  return [...rows].sort((a, b) => (weekdayRank.get(a.day) ?? 999) - (weekdayRank.get(b.day) ?? 999));
};

export const formatScheduleSummary = (
  weeklySchedule: CircleScheduleRow[] | undefined | null,
  ar: boolean,
  maxItems = 2
): string | null => {
  const sorted = sortWeeklyScheduleRows(weeklySchedule);
  if (!sorted.length) return null;

  const head = sorted.slice(0, maxItems).map((row) => `${weekdayLabel(row.day, ar)}: ${formatRowRange(row, ar)}`);
  const remaining = sorted.length - head.length;
  if (remaining > 0) {
    head.push(ar ? `+${remaining} أيام` : `+${remaining} days`);
  }
  return head.join(ar ? " | " : " | ");
};

