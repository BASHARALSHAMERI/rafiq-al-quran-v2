import { prisma } from "../../shared/db/prisma";
import { GeoEnforcement, Weekday } from "@prisma/client";
import { ScopeContext } from "../../shared/types/auth.types";
import { AppError } from "../../shared/errors/app-error";

/**
 * Phase 3 — Attendance Policy Service
 *
 * Manages the per-organization attendance policy singleton.
 * Provides helper utilities for computing workdays and checking weekends/holidays.
 */

type PolicyData = {
  gracePeriodMinutes: number;
  autoAbsenceDelayMinutes: number;
  autoAbsenceAfterMinutes: number;
  weekendDays: Weekday[];
  holidays: HolidayPeriod[];
  geoEnforcement: GeoEnforcement;
  geoEnforcementMode: GeoEnforcement;
  defaultShiftDurationMinutes: number;
  earlyDepartureThresholdMinutes: number;
  prayerApiSource: string;
  timezone: string;
  timeFormat: string;
};

type HolidayPeriod = {
  reason: string;
  startDate: string;
  endDate: string;
};

const attendancePolicySelect = {
  id: true,
  organizationId: true,
  gracePeriodMinutes: true,
  autoAbsenceDelayMinutes: true,
  weekendDays: true,
  holidays: true,
  geoEnforcement: true,
  defaultShiftDurationMinutes: true,
  earlyDepartureThresholdMinutes: true,
  prayerApiSource: true,
  timezone: true,
  timeFormat: true
} as const;

const WEEKDAY_JS_MAP: Record<number, Weekday> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY"
};

const DEFAULT_WEEKEND: Weekday[] = ["FRIDAY", "SATURDAY"];
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const parseWeekendDays = (raw: unknown): Weekday[] => {
  if (Array.isArray(raw)) {
    return raw.filter((v): v is Weekday =>
      typeof v === "string" && Object.values(WEEKDAY_JS_MAP).includes(v as Weekday)
    );
  }
  return DEFAULT_WEEKEND;
};

const parseHolidays = (raw: unknown): HolidayPeriod[] => {
  if (Array.isArray(raw)) {
    return raw
      .map((entry) => {
        if (typeof entry === "string" && ISO_DATE_RE.test(entry)) {
          return {
            reason: "Holiday",
            startDate: entry,
            endDate: entry
          };
        }

        if (
          entry &&
          typeof entry === "object" &&
          "reason" in entry &&
          "startDate" in entry &&
          "endDate" in entry &&
          typeof entry.reason === "string" &&
          typeof entry.startDate === "string" &&
          typeof entry.endDate === "string" &&
          ISO_DATE_RE.test(entry.startDate) &&
          ISO_DATE_RE.test(entry.endDate)
        ) {
          const startDate = entry.startDate;
          const endDate = entry.endDate < entry.startDate ? entry.startDate : entry.endDate;

          return {
            reason: entry.reason.trim() || "Holiday",
            startDate,
            endDate
          };
        }

        return null;
      })
      .filter((entry): entry is HolidayPeriod => entry !== null);
  }
  return [];
};

const isDateWithinHolidayPeriods = (dateStr: string, holidays: HolidayPeriod[]) =>
  holidays.some((holiday) => holiday.startDate <= dateStr && dateStr <= holiday.endDate);

const mapGeoEnforcementFromApi = (
  input?: GeoEnforcement | "REQUIRED" | "OPTIONAL" | "STRICT" | "WARN_ONLY" | "DISABLED"
): GeoEnforcement | undefined => {
  if (input === undefined) return undefined;
  const normalized = String(input).toUpperCase();
  if (normalized === "REQUIRED") return "STRICT" as GeoEnforcement;
  if (normalized === "OPTIONAL") return "WARN_ONLY" as GeoEnforcement;
  if (normalized === "STRICT" || normalized === "WARN_ONLY" || normalized === "DISABLED") {
    return normalized as GeoEnforcement;
  }
  return undefined;
};

const toPolicyResponse = (
  policy: {
    id: number;
    organizationId: number;
    gracePeriodMinutes: number;
    autoAbsenceDelayMinutes: number;
    weekendDays: unknown;
    holidays: unknown;
    geoEnforcement: GeoEnforcement;
    defaultShiftDurationMinutes: number;
    earlyDepartureThresholdMinutes: number;
    prayerApiSource: string;
    timezone: string;
    timeFormat: string;
  }
) => ({
  id: policy.id,
  organizationId: policy.organizationId,
  gracePeriodMinutes: policy.gracePeriodMinutes,
  autoAbsenceDelayMinutes: policy.autoAbsenceDelayMinutes,
  autoAbsenceAfterMinutes: policy.autoAbsenceDelayMinutes,
  weekendDays: parseWeekendDays(policy.weekendDays),
  holidays: parseHolidays(policy.holidays),
  geoEnforcement: policy.geoEnforcement,
  geoEnforcementMode: policy.geoEnforcement,
  defaultShiftDurationMinutes: policy.defaultShiftDurationMinutes,
  earlyDepartureThresholdMinutes: policy.earlyDepartureThresholdMinutes,
  prayerApiSource: policy.prayerApiSource,
  timezone: policy.timezone,
  timeFormat: policy.timeFormat
});

export const attendancePolicyService = {
  /**
   * Get the attendance policy for an organization.
   * If none exists, creates a default one.
   */
  async getPolicy(organizationId: number): Promise<PolicyData & { id: number; organizationId: number }> {
    let policy = await prisma.attendancePolicy.findUnique({
      where: { organizationId },
      select: attendancePolicySelect
    });

    if (!policy) {
      policy = await prisma.attendancePolicy.create({
        data: {
          organizationId,
          defaultShiftDurationMinutes: 120
        },
        select: attendancePolicySelect
      });
    }

    return toPolicyResponse(policy);
  },

  /**
   * Update the attendance policy for an organization.
   * Only SUPER_ADMIN should call this.
   */
  async updatePolicy(
    scope: ScopeContext,
    input: Partial<{
      gracePeriodMinutes: number;
      autoAbsenceDelayMinutes: number;
      weekendDays: Weekday[];
      holidays: Array<HolidayPeriod | string>;
      geoEnforcement: GeoEnforcement | "REQUIRED" | "OPTIONAL" | "STRICT" | "WARN_ONLY" | "DISABLED";
      defaultShiftDurationMinutes: number;
      earlyDepartureThresholdMinutes: number;
      prayerApiSource: string;
      timezone: string;
      timeFormat: string;
    }>
  ) {
    if (scope.role !== "SUPER_ADMIN") {
      throw new AppError("فقط مدير النظام يمكنه تحديث سياسة الحضور", 403);
    }

    // Ensure policy exists
    await this.getPolicy(scope.organizationId);

    const data: Record<string, unknown> = {};

    if (input.gracePeriodMinutes !== undefined) data.gracePeriodMinutes = input.gracePeriodMinutes;
    if (input.autoAbsenceDelayMinutes !== undefined) data.autoAbsenceDelayMinutes = input.autoAbsenceDelayMinutes;
    if (input.weekendDays !== undefined) data.weekendDays = input.weekendDays;
    if (input.holidays !== undefined) data.holidays = parseHolidays(input.holidays);
    if (input.geoEnforcement !== undefined) {
      const mappedGeo = mapGeoEnforcementFromApi(input.geoEnforcement);
      if (!mappedGeo) {
        throw new AppError("قيمة التفعيل الجغرافي غير صالحة", 400, undefined, "VALIDATION_FAILED");
      }
      data.geoEnforcement = mappedGeo;
    }
    if (input.defaultShiftDurationMinutes !== undefined) data.defaultShiftDurationMinutes = input.defaultShiftDurationMinutes;
    if (input.earlyDepartureThresholdMinutes !== undefined) data.earlyDepartureThresholdMinutes = input.earlyDepartureThresholdMinutes;
    if (input.prayerApiSource !== undefined) data.prayerApiSource = input.prayerApiSource;
    if (input.timezone !== undefined) data.timezone = input.timezone;

    const updated = await prisma.attendancePolicy.upsert({
      where: { organizationId: scope.organizationId },
      update: data,
      create: {
        organizationId: scope.organizationId,
        ...(data as Record<string, unknown>)
      },
      select: attendancePolicySelect
    });

    return toPolicyResponse(updated);
  },

  /**
   * Compute actual workdays in a given month for an organization.
   * Excludes weekends (from policy) and holidays.
   */
  async getWorkdaysInMonth(organizationId: number, month: number, year: number): Promise<number> {
    const policy = await this.getPolicy(organizationId);
    const daysInMonth = new Date(year, month, 0).getDate();
    let workdays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const jsDay = date.getDay();
      const weekday = WEEKDAY_JS_MAP[jsDay];

      // Skip weekends
      if (policy.weekendDays.includes(weekday)) continue;

      // Skip holidays (YYYY-MM-DD format)
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (isDateWithinHolidayPeriods(dateStr, policy.holidays)) continue;

      workdays++;
    }

    return workdays;
  },

  /**
   * Check if a given date is a working day (not weekend, not holiday).
   */
  async isWorkday(organizationId: number, date: Date): Promise<boolean> {
    const policy = await this.getPolicy(organizationId);
    const jsDay = date.getDay();
    const weekday = WEEKDAY_JS_MAP[jsDay];

    if (policy.weekendDays.includes(weekday)) return false;

    const dateStr = date.toISOString().slice(0, 10);
    if (isDateWithinHolidayPeriods(dateStr, policy.holidays)) return false;

    return true;
  },

  /**
   * Get the weekday name for a JS Date.
   */
  getWeekdayName(date: Date): Weekday {
    return WEEKDAY_JS_MAP[date.getDay()];
  }
};
